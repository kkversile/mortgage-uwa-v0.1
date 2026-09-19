import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthContext } from '../auth/auth-context';
import { TasksService } from './tasks.service';

@ApiTags('tasks') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Controller('operations/tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}
  @Get() @Roles(Role.ADMIN, Role.LOAN_OFFICER, Role.UNDERWRITER, Role.UNDERWRITING_MANAGER, Role.AUDITOR, Role.READ_ONLY) list(@Req() req: { user: AuthContext }) { return this.service.list(req.user); }
  @Post(':applicationId') @Roles(Role.ADMIN, Role.LOAN_OFFICER, Role.UNDERWRITER, Role.UNDERWRITING_MANAGER, Role.READ_ONLY) create(@Param('applicationId') applicationId: string, @Body() body: { type: string; title: string; description: string; priority?: any; assignedToId?: string }, @Req() req: { user: AuthContext }) { return this.service.create(applicationId, body, req.user); }
  @Patch(':id/complete') @Roles(Role.ADMIN, Role.LOAN_OFFICER, Role.UNDERWRITER, Role.UNDERWRITING_MANAGER, Role.READ_ONLY) complete(@Param('id') id: string, @Req() req: { user: AuthContext }) { return this.service.complete(id, req.user); }
}
