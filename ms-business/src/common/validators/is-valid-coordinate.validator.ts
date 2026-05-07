// src/common/validators/is-valid-coordinate.validator.ts
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

// --- Latitud ---
@ValidatorConstraint({ name: 'isValidLatitud', async: false })
export class IsValidLatitudConstraint implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments): boolean {
    return typeof value === 'number' && value >= -90 && value <= 90;
  }

  defaultMessage(args: ValidationArguments): string {
    return `La latitud debe ser un número entre -90 y 90`;
  }
}

export function IsValidLatitud(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidLatitudConstraint,
    });
  };
}

// --- Longitud ---
@ValidatorConstraint({ name: 'isValidLongitud', async: false })
export class IsValidLongitudConstraint implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments): boolean {
    return typeof value === 'number' && value >= -180 && value <= 180;
  }

  defaultMessage(args: ValidationArguments): string {
    return `La longitud debe ser un número entre -180 y 180`;
  }
}

export function IsValidLongitud(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidLongitudConstraint,
    });
  };
}