import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AskResponseDto {
  @ApiProperty({
    description: 'The AI orchestrator response to the question',
    example: 'The worker pod crashed due to insufficient memory.',
  })
  answer: string;

  @ApiPropertyOptional({
    description: 'Error message if the request failed',
    example: 'Failed to process request',
  })
  error?: string;
}