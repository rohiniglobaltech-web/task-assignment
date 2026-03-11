import { IsEmail, IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class CreateStudentDto {
  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsInt()
  @Min(1)
  @Max(120)
  age!: number;
}

