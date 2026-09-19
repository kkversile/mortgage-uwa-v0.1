import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthContext } from '../auth/auth-context';
import { AdminService } from './admin.service';

@ApiTags('admin') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}
  @Get('overview') overview(@Req() req: { user: AuthContext }) { return this.service.overview(req.user); }
  @Get('users') users(@Req() req: { user: AuthContext }) { return this.service.users(req.user); }
  @Get('branches') branches(@Req() req: { user: AuthContext }) { return this.service.branches(req.user); }
}
