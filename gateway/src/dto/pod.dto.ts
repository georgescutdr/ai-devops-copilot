// gateway/src/dto/pod.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PodContainerDto {
  @ApiProperty({
    description: 'Name of the container',
    example: 'worker-container',
  })
  name: string;
}

export class PodDto {
  @ApiProperty({
    description: 'Pod name',
    example: 'worker-abc123',
  })
  name: string;

  @ApiProperty({
    description: 'Pod status (phase)',
    example: 'Running',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Node where the pod is scheduled',
    example: 'node-1',
  })
  node?: string;

  @ApiPropertyOptional({
    description: 'Containers running inside the pod',
    type: [PodContainerDto],
  })
  containers?: PodContainerDto[];
}

export class PodRestartResponseDto {
  @ApiPropertyOptional({
    description: 'Success message if pod restart succeeded',
    example: 'Pod worker-abc123 deleted; new pod will be scheduled automatically.',
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'Error message if pod restart failed',
    example: 'Failed to restart pod: pod not found',
  })
  error?: string;
}