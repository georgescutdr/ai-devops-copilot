import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AskDto {
  @ApiProperty({
    description: 'The question to send to the AI orchestrator',
    example: 'Why is my worker pod crashing?',
  })
  @IsString()
  @IsNotEmpty({ message: 'Question must not be empty' })
  question: string;
}