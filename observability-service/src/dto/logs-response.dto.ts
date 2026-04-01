import { ApiProperty } from '@nestjs/swagger';

export class LogsResponseDto {
  @ApiProperty({ description: 'Container or deployment name' })
  container: string;

  @ApiProperty({ description: 'Logs content', default: '' })
  logs: string;

  @ApiProperty({ description: 'Error message, if any', required: false })
  error?: string;
}