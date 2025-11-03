import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'ngcuong1182004@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
