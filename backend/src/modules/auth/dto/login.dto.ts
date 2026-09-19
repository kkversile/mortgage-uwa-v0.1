import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
export class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
  @IsOptional() @IsIn(['consumer', 'operations', 'admin']) portal?: string;
  @IsOptional() @IsString() tenantSlug?: string;
}
