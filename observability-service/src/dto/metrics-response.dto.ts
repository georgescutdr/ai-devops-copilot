import { ApiProperty } from '@nestjs/swagger';

export class MetricsResponseDto {
  @ApiProperty({ description: 'Prometheus raw response or error' })
  data: any;

  @ApiProperty({ description: 'Error message, if any', required: false })
  error?: string;
}