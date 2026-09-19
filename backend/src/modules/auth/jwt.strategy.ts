import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import { permissionsFor } from './permissions';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly prisma: PrismaService) { super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: config.get('JWT_SECRET')! }); }
  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.active) throw new UnauthorizedException('User is inactive');
    const membership = payload.membershipId ? await this.prisma.tenantMembership.findFirst({ where: { id: payload.membershipId, userId: user.id, active: true }, include: { tenant: true, branch: true } }) : null;
    if (payload.membershipId && (!membership || membership.tenant.status !== 'ACTIVE')) throw new UnauthorizedException('Lender membership is inactive');
    const roles = membership ? [membership.role] : [user.role];
    return { id: user.id, userId: user.id, email: user.email, role: user.role, displayName: user.displayName, accountType: user.accountType, portal: payload.portal, tenantId: membership?.tenantId, membershipId: membership?.id, branchId: membership?.branchId, roles, permissions: permissionsFor(roles) };
  }
}
