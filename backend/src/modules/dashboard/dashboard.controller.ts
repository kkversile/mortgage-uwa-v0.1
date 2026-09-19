import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { AuthContext } from '../auth/auth-context';
@ApiTags('dashboard') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('dashboard')
export class DashboardController { constructor(private readonly service: DashboardService) {} @Get() get(@Req() req: { user: AuthContext }) { return this.service.get(req.user); } }
