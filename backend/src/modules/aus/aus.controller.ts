import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthContext } from '../auth/auth-context';
import { AusService } from './aus.service';

@ApiTags('aus') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Controller('applications/:id/aus')
export class AusController { constructor(private readonly service: AusService) {} @Post('run') @Roles(Role.ADMIN, Role.UNDERWRITER, Role.UNDERWRITING_MANAGER) run(@Param('id') id: string, @Req() req: { user: AuthContext }) { return this.service.run(id, req.user); } @Get() @Roles(Role.ADMIN, Role.UNDERWRITER, Role.UNDERWRITING_MANAGER, Role.AUDITOR, Role.READ_ONLY) list(@Param('id') id: string, @Req() req: { user: AuthContext }) { return this.service.list(id, req.user); } }
