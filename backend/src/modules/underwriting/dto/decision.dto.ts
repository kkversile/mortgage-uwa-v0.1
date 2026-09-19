import { DecisionType } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';
export class DecisionDto { @IsEnum(DecisionType) finalDecision!: DecisionType; @IsString() @MinLength(5) reason!: string; }
