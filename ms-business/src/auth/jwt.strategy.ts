import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'super-secret',
    });
  }

  async validate(payload: any) {
    // El payload de ms-security (Spring Boot) tiene:
    // sub   → email del usuario
    // user_id → ID interno del usuario en MongoDB (auth_id)
    // roles → array de strings con los roles
    return {
      authId: payload.user_id || payload.sub || payload.id,
      email: payload.sub,  // sub = email en el token de Spring
      roles: payload.roles || [],
      name: payload.name || payload.firstName,
    };
  }
}
