import { apiClient, ApiResponse } from './config';
import { PaginatedResponse } from '../../types/auth';

export interface Job {
  id: string;
  jobType: 'food_recognition' | 'batch_meal_analysis' | 'nutrition_report' | 'data_export' | 'account_deletion';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  parameters: Record<string, any>;
  result?: Record<string, any>;
  errorMessage?: string;
  progress?: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  byType: Record<string, number>;
}

export interface CreateJobRequest {
  jobType: Job['jobType'];
  parameters?: Record<string, any>;
  priority?: number;
}

export interface JobFilters {
  status?: Job['status'];
  jobType?: Job['jobType'];
  page?: number;
  perPage?: number;
}

class JobAPI {
  private baseUrl = '/api/v1/jobs';

  async getJobs(filters: JobFilters = {}): Promise<PaginatedResponse<Job>> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.jobType) params.append('job_type', filters.jobType);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.perPage) params.append('per_page', filters.perPage.toString());

    const response = await apiClient.get<PaginatedResponse<Job>>(
      `${this.baseUrl}?${params.toString()}`
    );
    
    return response.data;
  }

  async getJob(id: string): Promise<ApiResponse<Job>> {
    const response = await apiClient.get<ApiResponse<Job>>(
      `${this.baseUrl}/${id}`
    );
    
    return response.data;
  }

  async createJob(jobData: CreateJobRequest): Promise<ApiResponse<Job>> {
    const response = await apiClient.post<ApiResponse<Job>>(
      this.baseUrl,
      jobData
    );
    
    return response.data;
  }

  async createBatchJobs(jobs: CreateJobRequest[]): Promise<ApiResponse<Job[]>> {
    const response = await apiClient.post<ApiResponse<Job[]>>(
      `${this.baseUrl}/bulk`,
      { jobs }
    );
    
    return response.data;
  }

  async cancelJob(id: string): Promise<ApiResponse<Job>> {
    const response = await apiClient.post<ApiResponse<Job>>(
      `${this.baseUrl}/${id}/cancel`
    );
    
    return response.data;
  }

  async retryJob(id: string): Promise<ApiResponse<Job>> {
    const response = await apiClient.post<ApiResponse<Job>>(
      `${this.baseUrl}/${id}/retry`
    );
    
    return response.data;
  }

  async getJobStats(): Promise<ApiResponse<JobStats>> {
    const response = await apiClient.get<ApiResponse<JobStats>>(
      `${this.baseUrl}/stats`
    );
    
    return response.data;
  }

  // Convenience methods for specific job types
  async createFoodRecognitionJob(imageUrl: string, options: {
    confidence_threshold?: number;
    max_detections?: number;
  } = {}): Promise<ApiResponse<Job>> {
    return this.createJob({
      jobType: 'food_recognition',
      parameters: {
        image_url: imageUrl,
        ...options
      },
      priority: 3
    });
  }

  async createBatchAnalysisJob(mealIds: string[]): Promise<ApiResponse<Job>> {
    return this.createJob({
      jobType: 'batch_meal_analysis',
      parameters: {
        meal_ids: mealIds
      },
      priority: 5
    });
  }

  async createNutritionReportJob(options: {
    startDate: Date;
    endDate: Date;
    format?: 'pdf' | 'csv';
    includeCharts?: boolean;
  }): Promise<ApiResponse<Job>> {
    return this.createJob({
      jobType: 'nutrition_report',
      parameters: {
        start_date: options.startDate.toISOString(),
        end_date: options.endDate.toISOString(),
        format: options.format || 'pdf',
        include_charts: options.includeCharts !== false
      },
      priority: 4
    });
  }

  async createDataExportJob(options: {
    format?: 'json' | 'csv';
    includeImages?: boolean;
  } = {}): Promise<ApiResponse<Job>> {
    return this.createJob({
      jobType: 'data_export',
      parameters: {
        format: options.format || 'json',
        include_images: options.includeImages || false
      },
      priority: 6
    });
  }

  // Polling utilities
  async pollJobUntilComplete(
    jobId: string, 
    onProgress?: (job: Job) => void,
    maxAttempts: number = 60,
    intervalMs: number = 2000
  ): Promise<Job> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const response = await this.getJob(jobId);
      const job = response.data;
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (onProgress) {
        onProgress(job);
      }
      
      if (['completed', 'failed', 'cancelled'].includes(job.status)) {
        return job;
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error('Job polling timed out');
  }

  async waitForJobs(
    jobIds: string[],
    onProgress?: (completedCount: number, totalCount: number) => void
  ): Promise<Job[]> {
    const results: Job[] = [];
    let completed = 0;

    const promises = jobIds.map(async (jobId) => {
      const job = await this.pollJobUntilComplete(jobId);
      results.push(job);
      completed++;
      
      if (onProgress) {
        onProgress(completed, jobIds.length);
      }
      
      return job;
    });

    await Promise.all(promises);
    return results;
  }
}

export const jobAPI = new JobAPI();
export default jobAPI;
