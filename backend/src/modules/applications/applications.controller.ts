import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { TransitionApplicationDto } from './dto/transition-application.dto';
import { ApplicationWorkflowService } from './application-workflow.service';
import { AuthContext } from '../auth/auth-context';

@ApiTags('applications') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService, private readonly workflow: ApplicationWorkflowService) {}
  @Get() list(@Req() req: { user: AuthContext }) { return this.service.list(req.user); }
  @Get(':id') get(@Param('id') id: string, @Req() req: { user: AuthContext }) { return this.service.get(id, req.user); }
  @Post() @Roles(Role.ADMIN, Role.LOAN_OFFICER, Role.UNDERWRITER, Role.UNDERWRITING_MANAGER) create(@Body() dto: CreateApplicationDto, @Req() req: { user: AuthContext }) { return this.service.create(dto, req.user); }
  @Post(':id/transition') transition(@Param('id') id: string, @Body() dto: TransitionApplicationDto, @Req() req: { user: AuthContext }) { return this.workflow.transition(id, dto.targetStatus, req.user); }
}
