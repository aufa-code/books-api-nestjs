import { IsInt, Min } from 'class-validator';

export class TransferStockDto {
  @IsInt() fromId: number;
  @IsInt() toId: number;
  @IsInt() @Min(1) qty: number;
}