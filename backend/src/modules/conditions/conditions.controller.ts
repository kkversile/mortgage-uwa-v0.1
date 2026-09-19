import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConditionStatus, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthContext } from '../auth/auth-context';
import { ConditionsService } from './conditions.service';

@ApiTags('conditions') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Controller('applications/:id/conditions')
export class ConditionsController {
  constructor(private readonly service: ConditionsService) {}
  @Get() @Roles(Role.ADMIN, Role.LOAN_OFFICER, Role.UNDERWRITER, Role.UNDERWRITING_MANAGER, Role.AUDITOR, Role.READ_ONLY) list(@Param('id') id: string, @Req() req: { user: AuthContext }) { return this.service.list(id, req.user); }
  @Post() @Roles(Role.ADMIN, Role.UNDERWRITER, Role.UNDERWRITING_MANAGER) create(@Param('id') id: string, @Body() body: { code: string; title: string; description: string; required?: boolean }, @Req() req: { user: AuthContext }) { return this.service.create(id, body, req.user); }
  @Patch(':conditionId') @Roles(Role.ADMIN, Role.LOAN_OFFICER, Role.UNDERWRITER, Role.UNDERWRITING_MANAGER, Role.READ_ONLY) transition(@Param('conditionId') id: string, @Body('status') status: ConditionStatus, @Req() req: { user: AuthContext }) { return this.service.transition(id, status, req.user); }
}
