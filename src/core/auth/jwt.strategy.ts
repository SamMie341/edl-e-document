import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'edl_super_secret_jwt_key_2026_!@#',
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.emaill,
      role: payload.role,
      departmentId: payload.departmentId,
      divisionId: payload.divisionId,
      officeId: payload.officeId,
      unitId: payload.unitId,
    };
  }
}
