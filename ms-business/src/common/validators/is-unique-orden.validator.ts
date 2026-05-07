// src/common/validators/is-unique-orden.validator.ts
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
import { RutaNodo } from '../../ruta_nodo/entities/ruta_nodo.entity';

@Injectable()
@ValidatorConstraint({ name: 'isUniqueOrden', async: true })
export class IsUniqueOrdenConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(RutaNodo)
    private readonly rutaNodoRepository: Repository<RutaNodo>,
  ) {}

  async validate(orden: number, args: ValidationArguments): Promise<boolean> {
    const { ruta_id } = args.object as any;

    if (!ruta_id) return true; // si no hay ruta_id, otro validador lo captura

    const existe = await this.rutaNodoRepository.findOne({
      where: { ruta: { id: ruta_id }, orden },
    });

    return !existe; // válido si NO existe ese orden en esa ruta
  }

  defaultMessage(args: ValidationArguments): string {
    return `Ya existe un nodo con el orden ${args.value} en esta ruta`;
  }
}

export function IsUniqueOrden(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueOrdenConstraint,
    });
  };
}