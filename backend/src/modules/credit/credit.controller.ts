import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthContext } from '../auth/auth-context';
import { CreditService } from './credit.service';

@ApiTags('credit') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Controller('applications/:id/credit')
export class CreditController {
  constructor(private readonly service: CreditService) {}
  @Post('run') @Roles(Role.ADMIN, Role.UNDERWRITER, Role.UNDERWRITING_MANAGER) run(@Param('id') id: string, @Req() req: { user: AuthContext }) { return this.service.run(id, req.user); }
}
