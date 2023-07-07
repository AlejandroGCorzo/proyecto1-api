import { IsNumber, IsPositive, IsString, MaxLength, MinLength } from "class-validator";

export class ValidarCuponDto {
    @IsString()
    @MinLength(4)
    @MaxLength(32)
    nombre: string;
  
    @IsString()
    userId: string;
}