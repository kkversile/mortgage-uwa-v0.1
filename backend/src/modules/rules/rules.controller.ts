import { Controller, ForbiddenException, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthContext } from '../auth/auth-context';
@ApiTags('rules') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('rules')
export class RulesController { constructor(private readonly prisma: PrismaService) {} @Get() list(@Req() req: { user: AuthContext }) { if (req.user.accountType === 'CONSUMER') throw new ForbiddenException('Policy rules are not available in the consumer portal'); return this.prisma.underwritingRule.findMany({ where: req.user.accountType === 'PLATFORM_ADMIN' ? {} : { tenantId: req.user.tenantId }, orderBy: [{ code: 'asc' }, { version: 'desc' }] }); } }
