import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { MetodoPagoCiudadano } from './entities/metodo-pago-ciudadano.entity';
import { CreateMetodoPagoCiudadanoDto } from './dto/create-metodo-pago-ciudadano.dto';
import { UpdateMetodoPagoCiudadanoDto } from './dto/update-metodo-pago-ciudadano.dto';
import { CiudadanoService } from '../ciudadano/ciudadano.service';
import { MetodoPagoService } from '../metodo-pago/metodo-pago.service';
import { Historial, TipoHistorial } from '../historial/entities/historial.entity';

@Injectable()
export class MetodoPagoCiudadanoService {
    constructor(
        @InjectRepository(MetodoPagoCiudadano)
        private readonly metodoPagoCiudadanoRepository: Repository<MetodoPagoCiudadano>,
        @InjectRepository(Historial)
        private readonly historialRepository: Repository<Historial>,
        private readonly ciudadanoService: CiudadanoService,
        private readonly metodoPagoService: MetodoPagoService,
    ) { }

    async create(createMetodoPagoCiudadanoDto: CreateMetodoPagoCiudadanoDto): Promise<MetodoPagoCiudadano> {
        const ciudadano = await this.ciudadanoService.findOne(createMetodoPagoCiudadanoDto.ciudadanoId);
        const metodoPago = await this.metodoPagoService.findOne(createMetodoPagoCiudadanoDto.metodoPagoId);

        // Verificar que no exista ya esa combinación
        const existing = await this.metodoPagoCiudadanoRepository.findOne({
            where: {
                ciudadano: { id: createMetodoPagoCiudadanoDto.ciudadanoId },
                metodoPago: { id: createMetodoPagoCiudadanoDto.metodoPagoId }
            }
        });
        if (existing) {
            throw new ConflictException('El ciudadano ya tiene ese método de pago registrado');
        }

        const registro = this.metodoPagoCiudadanoRepository.create();
        registro.ciudadano = ciudadano;
        registro.metodoPago = metodoPago;
        return await this.metodoPagoCiudadanoRepository.save(registro);
    }

    async findAll(): Promise<MetodoPagoCiudadano[]> {
        return await this.metodoPagoCiudadanoRepository.find({
            relations: ['ciudadano', 'metodoPago', 'boletos']
        });
    }

    async findByCiudadano(ciudadanoId: string): Promise<MetodoPagoCiudadano[]> {
        return await this.metodoPagoCiudadanoRepository.find({
            where: { ciudadano: { id: ciudadanoId } },
            relations: ['ciudadano', 'metodoPago', 'boletos']
        });
    }

    async findOne(id: string): Promise<MetodoPagoCiudadano> {
        const registro = await this.metodoPagoCiudadanoRepository.findOne({
            where: { id },
            relations: ['ciudadano', 'ciudadano.persona', 'metodoPago', 'boletos']
        });
        if (!registro) {
            throw new NotFoundException(`MetodoPagoCiudadano #${id} no encontrado`);
        }
        return registro;
    }

    async recargar(id: string, monto: number): Promise<MetodoPagoCiudadano> {
        if (!monto || monto <= 0) {
            throw new BadRequestException('El monto de recarga debe ser mayor a 0');
        }

        const registro = await this.findOne(id);
        const nuevoSaldo = Number(registro.saldo || 0) + Number(monto);
        registro.saldo = nuevoSaldo;

        await this.metodoPagoCiudadanoRepository.save(registro);

        const historial = this.historialRepository.create({
            tipo: TipoHistorial.RECARGA,
            monto: monto,
            referencia_externa: `Recarga de saldo billetera #${id}`
        });
        await this.historialRepository.save(historial);

        return registro;
    }

    async verificarEpayco(refPayco: string, authId?: string): Promise<any> {
        if (!refPayco) {
            throw new BadRequestException('La referencia de ePayco es obligatoria');
        }

        try {
            // Llamar a la API oficial de ePayco para validar la referencia
            const response = await axios.get(`https://secure.epayco.co/validation/v1/reference/${refPayco}`);
            const data = response.data?.data;

            if (!data) {
                throw new BadRequestException('No se encontró información de la transacción en ePayco');
            }

            const codResponse = Number(data.x_cod_response || data.x_cod_transaction_state);

            // codResponse === 1 significa transacción Aprobada / Aceptada
            if (codResponse === 1) {
                const billeteraId = data.x_extra1;
                const monto = Number(data.x_amount);

                if (!billeteraId) {
                    throw new BadRequestException('La transacción no contiene el identificador de la billetera (extra1)');
                }

                const registro = await this.findOne(billeteraId);

                // --- VALIDACIÓN ESTRICTA DE OWNERSHIP ---
                if (authId) {
                    const billeteraAuthId = registro.ciudadano?.persona?.authId;
                    if (!billeteraAuthId || billeteraAuthId !== authId) {
                        throw new BadRequestException('Acceso denegado: La billetera asociada a esta transacción no pertenece al usuario autenticado');
                    }
                }

                // Verificar si esta transacción ya fue procesada previamente (para evitar doble recarga con el mismo ref_payco)
                const historialExistente = await this.historialRepository.findOne({
                    where: { referencia_externa: `ePayco-${data.x_ref_payco}` }
                });

                if (historialExistente) {
                    return {
                        success: true,
                        status: 'approved',
                        message: 'La recarga ya había sido procesada exitosamente',
                        monto: monto,
                        billeteraId: billeteraId,
                        refPayco: data.x_ref_payco
                    };
                }

                // Realizar la recarga
                const nuevoSaldo = Number(registro.saldo || 0) + monto;
                registro.saldo = nuevoSaldo;
                await this.metodoPagoCiudadanoRepository.save(registro);

                // Registrar en el historial con la referencia única de ePayco
                const historial = this.historialRepository.create({
                    tipo: TipoHistorial.RECARGA,
                    monto: monto,
                    referencia_externa: `ePayco-${data.x_ref_payco}`
                });
                await this.historialRepository.save(historial);

                return {
                    success: true,
                    status: 'approved',
                    message: 'Recarga aplicada exitosamente',
                    monto: monto,
                    billeteraId: billeteraId,
                    refPayco: data.x_ref_payco
                };
            } else if (codResponse === 3) {
                // Transacción Pendiente (PSE / Efectivo en espera de pago)
                return {
                    success: true,
                    status: 'pending',
                    message: 'La transacción se encuentra en estado Pendiente. El saldo se acreditará automáticamente en cuanto ePayco confirme el pago.',
                    estado: data.x_response || 'Pendiente',
                    refPayco: data.x_ref_payco
                };
            } else {
                // Rechazada / Fallida / Cancelada
                return {
                    success: false,
                    status: 'rejected',
                    message: `Transacción no aprobada. Estado: ${data.x_response || 'Rechazada'}`,
                    estado: data.x_response || 'Rechazada',
                    refPayco: data.x_ref_payco
                };
            }
        } catch (error) {
            throw new BadRequestException('Error al validar la transacción con ePayco: ' + error.message);
        }
    }

    async epaycoWebhook(payload: any): Promise<any> {
        const refPayco = payload.x_ref_payco;
        if (!refPayco) {
            throw new BadRequestException('Referencia no válida');
        }

        // En el webhook S2S no hay usuario logueado en la petición HTTP, por lo que authId queda undefined y se salta el ownership check.
        return await this.verificarEpayco(refPayco);
    }

    async update(id: string, updateMetodoPagoCiudadanoDto: UpdateMetodoPagoCiudadanoDto): Promise<MetodoPagoCiudadano> {
        const registro = await this.findOne(id);

        if (updateMetodoPagoCiudadanoDto.ciudadanoId) {
            registro.ciudadano = await this.ciudadanoService.findOne(updateMetodoPagoCiudadanoDto.ciudadanoId);
        }
        if (updateMetodoPagoCiudadanoDto.metodoPagoId) {
            registro.metodoPago = await this.metodoPagoService.findOne(updateMetodoPagoCiudadanoDto.metodoPagoId);
        }

        return await this.metodoPagoCiudadanoRepository.save(registro);
    }

    async remove(id: string): Promise<{ message: string }> {
        const registro = await this.findOne(id);
        await this.metodoPagoCiudadanoRepository.remove(registro);
        return { message: `MetodoPagoCiudadano #${id} eliminado correctamente` };
    }
}
