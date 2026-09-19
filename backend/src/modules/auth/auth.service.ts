import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { permissionsFor } from './permissions';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email }, include: { memberships: { where: { active: true }, include: { tenant: true, branch: true } } } });
    if (!user || !user.active || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid email or password');
    const eligible = dto.tenantSlug ? user.memberships.filter(m => m.tenant.slug === dto.tenantSlug) : user.memberships;
    const membership = user.accountType === 'PLATFORM_ADMIN' && !dto.tenantSlug ? undefined : eligible[0];
    if (dto.tenantSlug && !membership) throw new UnauthorizedException('You do not have access to that lender workspace');
    if (membership && membership.tenant.status !== 'ACTIVE') throw new UnauthorizedException('This lender workspace is not active');
    const roles = membership ? [membership.role] : [user.role];
    const portal = dto.portal ?? (user.accountType === 'CONSUMER' ? 'consumer' : user.accountType === 'PLATFORM_ADMIN' ? 'admin' : 'operations');
    if (portal === 'consumer' && user.accountType !== 'CONSUMER') throw new UnauthorizedException('This account is not enabled for the consumer portal');
    if (portal === 'admin' && user.accountType !== 'PLATFORM_ADMIN' && !roles.includes('TENANT_ADMIN' as any)) throw new UnauthorizedException('This account is not enabled for the admin portal');
    if (portal === 'operations' && user.accountType === 'CONSUMER') throw new UnauthorizedException('This account is not enabled for the operations portal');
    const context = { userId: user.id, email: user.email, displayName: user.displayName, accountType: user.accountType, portal, tenantId: membership?.tenantId, membershipId: membership?.id, branchId: membership?.branchId, roles, permissions: permissionsFor(roles.length ? roles : [user.role]) };
    const token = await this.jwt.signAsync({ sub: user.id, ...context });
    return { accessToken: token, user: { id: user.id, ...context, role: user.role } };
  }
}
