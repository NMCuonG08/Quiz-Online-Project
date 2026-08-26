import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'exactlyOneQuizIdentifier', async: false })
class ExactlyOneQuizIdentifier implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const dto = args.object as CreateQuizSessionDto;
    return Number(Boolean(dto.quiz_id)) + Number(Boolean(dto.quiz_slug)) === 1;
  }

  defaultMessage() {
    return 'Provide exactly one of quiz_id or quiz_slug';
  }
}

export class CreateQuizSessionDto {
  @Validate(ExactlyOneQuizIdentifier)
  private readonly identifierContract?: never;

  @ApiProperty({ description: 'Quiz ID', required: false })
  @IsOptional()
  @IsUUID()
  quiz_id?: string;

  @ApiProperty({ description: 'Quiz slug', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  quiz_slug?: string;
}
