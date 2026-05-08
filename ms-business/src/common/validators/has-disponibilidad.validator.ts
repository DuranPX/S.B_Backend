// src/common/validators/has-disponibilidad.validator.ts
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Programacion } from '../../programacion/entities/programacion.entity';
import { Bus } from '../../bus/entities/bus.entity';

@Injectable()
@ValidatorConstraint({ name: 'hasDisponibilidad', async: true })
export class HasDisponibilidadConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Programacion)
    private readonly programacionRepository: Repository<Programacion>,
  ) {}

  async validate(programacion_id: string, args: ValidationArguments): Promise<boolean> {
    if (!programacion_id) return false;

    const programacion = await this.programacionRepository.findOne({
      where: { id: programacion_id },
      relations: ['bus'],
    });

    if (!programacion) return false;
    if (!programacion.bus) return false;
    if (programacion.estado !== 'Programado') return false;

    const capacidad = programacion.bus.capacidad_total;
    if (!capacidad) return false;

    return programacion.pasajeros_actuales < capacidad;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'La programación no tiene cupos disponibles o no está en estado Programado';
  }
}

export function HasDisponibilidad(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: HasDisponibilidadConstraint,
    });
  };
}