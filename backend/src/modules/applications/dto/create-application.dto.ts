import { IsEmail, IsIn, IsNumber, IsPositive, IsString, Min } from 'class-validator';
export class CreateApplicationDto {
  @IsString() firstName!: string;
  @IsString() lastName!: string;
  @IsEmail() email!: string;
  @IsNumber() @IsPositive() requestedLoanAmount!: number;
  @IsNumber() @IsPositive() propertyValue!: number;
  @IsNumber() @IsPositive() grossMonthlyIncome!: number;
  @IsNumber() @Min(0) monthlyDebt!: number;
  @IsIn(['PURCHASE', 'RATE_TERM_REFINANCE', 'CASH_OUT_REFINANCE']) loanPurpose: string = 'PURCHASE';
  @IsIn(['PRIMARY_RESIDENCE', 'SECOND_HOME', 'INVESTMENT_PROPERTY']) occupancyType: string = 'PRIMARY_RESIDENCE';
}
