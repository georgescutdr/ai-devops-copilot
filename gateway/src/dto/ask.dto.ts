import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Nested DTO for metrics
export class MetricsDto {
  @ApiProperty({ description: 'CPU usage percentage', example: 95 })
  @IsNumber()
  cpu: number;

  @ApiProperty({ description: 'Memory usage percentage', example: 90 })
  @IsNumber()
  memory: number;
}

// Main DTO
export class AskDto {
  @ApiProperty({ description: 'The question to ask the AI', example: 'Why is my worker pod crashing?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({ description: 'Logs related to the issue', example: 'CrashLoopBackOff error, container exited with code 1' })
  @IsString()
  @IsOptional()
  logs?: string;

  @ApiPropertyOptional({ description: 'Metrics related to the issue', type: MetricsDto })
  @IsOptional()
  metrics?: MetricsDto;
}