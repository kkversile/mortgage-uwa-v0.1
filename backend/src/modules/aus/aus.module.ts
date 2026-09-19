import { Module } from '@nestjs/common';
import { AusController } from './aus.controller';
import { AusService } from './aus.service';

@Module({ controllers: [AusController], providers: [AusService] })
export class AusModule {}
