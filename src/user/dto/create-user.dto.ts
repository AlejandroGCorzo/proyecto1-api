import { IsEmail, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateUserDto {
    
    @IsString()
    email: string;

    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    lastName: string;
    
    @IsOptional()
    @IsString()
    phone: string;

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'The password must have a Uppercase, lowercase letter and a number'
    })
    password: string;
    
    @IsNumber()
    @Min(100000)
    @Max(999999)
    code: number

    @IsOptional()
    @IsString()
    image:string

    @IsOptional()
    @IsString()
    dni: string;

    @IsOptional()
    @IsString()
    calle:string;

    @IsOptional()
    @IsString()
    numeroDeCalle:string

    @IsOptional()
    @IsString()
    infoAdicional:string;

    @IsOptional()
    @IsString()
    codigoPostal:string;

    @IsOptional()
    @IsString()
    ciudad:string;

    @IsOptional()
    @IsString()
    pais:string;  

    @IsOptional()
    @IsString()
    provincia:string; 
    
    @IsOptional()
    @IsString()
    destinatario:string;
}
