// src/common/validators/is-not-past-date.validator.ts
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'isNotPastDate', async: false })
export class IsNotPastDateConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    if (!value) return false;
    const fecha = new Date(value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // comparamos solo fecha, sin hora
    return fecha >= hoy;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'La fecha no puede ser en el pasado';
  }
}

export function IsNotPastDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotPastDateConstraint,
    });
  };
}