export interface HealthStatus {
  status: 'ok';
  database: 'connected';
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const response = await fetch('/api/health');

  if (!response.ok) {
    throw new Error('The backend health check failed.');
  }

  const result = (await response.json()) as ApiResponse<HealthStatus>;

  if (!result.success) {
    throw new Error('The backend health check failed.');
  }

  return result.data;
}
