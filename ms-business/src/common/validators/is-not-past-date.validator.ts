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

    const [timeProperty] = args.constraints as [string | undefined];
    let fecha: Date;

    if (timeProperty) {
      const timeValue = (args.object as Record<string, any>)[timeProperty];
      if (typeof timeValue === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeValue)) {
        const [year, month, day] = value.split('-').map((segment) => Number(segment));
        const [hour, minute] = timeValue.split(':').map((segment) => Number(segment));
        if ([year, month, day, hour, minute].every((n) => !Number.isNaN(n))) {
          fecha = new Date(year, month - 1, day, hour, minute, 0);
        } else {
          fecha = new Date(value);
        }
      } else {
        fecha = new Date(value);
      }
    } else {
      fecha = new Date(value);
    }

    if (Number.isNaN(fecha.getTime())) return false;

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);

    return fecha >= hoy;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'La fecha no puede ser en el pasado';
  }
}

export function IsNotPastDate(timePropertyOrValidationOptions?: string | ValidationOptions, validationOptions?: ValidationOptions) {
  const timeProperty = typeof timePropertyOrValidationOptions === 'string' ? timePropertyOrValidationOptions : undefined;
  const options = typeof timePropertyOrValidationOptions === 'string' ? validationOptions : timePropertyOrValidationOptions;

  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [timeProperty],
      validator: IsNotPastDateConstraint,
    });
  };
}