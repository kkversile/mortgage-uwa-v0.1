import { ApplicationStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class TransitionApplicationDto { @IsEnum(ApplicationStatus) targetStatus!: ApplicationStatus; }
