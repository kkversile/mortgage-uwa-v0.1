import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DecisionDto } from './dto/decision.dto';
import { UnderwritingService } from './underwriting.service';
import { AuthContext } from '../auth/auth-context';

@ApiTags('underwriting') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Controller('applications/:id')
export class UnderwritingController {
  constructor(private readonly service: UnderwritingService) {}
  @Post('underwrite') @Roles(Role.ADMIN, Role.UNDERWRITER, Role.UNDERWRITING_MANAGER) underwrite(@Param('id') id: string, @Req() req: { user: AuthContext }) { return this.service.underwrite(id, req.user); }
  @Post('decision') @Roles(Role.ADMIN, Role.UNDERWRITER, Role.UNDERWRITING_MANAGER) decide(@Param('id') id: string, @Body() dto: DecisionDto, @Req() req: { user: AuthContext }) { return this.service.decide(id, dto, req.user); }
}
