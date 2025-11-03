import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";
import { type QuestionsResponse, type QuestionsQueryParams } from "../types";
import type {
  CreateQuestionInput,
  UpdateQuestionInput,
} from "../schema/question";

export class AdminQuestionService {
  static async getQuestionsById(
    id: string,
    params?: QuestionsQueryParams
  ): Promise<QuestionsResponse> {
    try {
      const response = await apiClient.get(apiRoutes.QUESTIONS.GET_BY_ID(id), {
        params: { page: params?.page || 1, limit: params?.limit || 10 },
      });
      return response.data as QuestionsResponse;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        (err.response?.data as QuestionsResponse) || {
          success: false,
          statusCode: 500,
          message: "Failed to fetch questions",
          data: {
            items: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              totalItems: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          },
        }
      );
    }
  }

  static async createQuestion(payload: CreateQuestionInput) {
    try {
      // Debug: Log the payload to see what we're working with
      console.log("CreateQuestion payload:", payload);
      console.log("payload.media_url:", payload.media_url, "Type:", typeof payload.media_url);
      console.log("payload.options:", payload.options);
      
      // Check if payload contains any file fields (media_url in question or options)
      const hasQuestionFile = payload.media_url && (payload.media_url instanceof File);
      const hasOptionFiles = payload.options?.some(option => 
        option.media_url && (option.media_url instanceof File)
      );

      console.log("hasQuestionFile:", hasQuestionFile);
      console.log("hasOptionFiles:", hasOptionFiles);

      let body: FormData | CreateQuestionInput;
      
      if (hasQuestionFile || hasOptionFiles) {
        console.log("Creating FormData with file uploads");
        const form = new FormData();
        
        // Add non-file fields
        Object.entries(payload).forEach(([key, value]) => {
          if (key === 'media_url' && value && (value instanceof File)) {
            // Handle question media file
            console.log("Adding question media file:", value);
            form.append('media', value as File);
            return;
          }
          
          if (key === 'options' && Array.isArray(value)) {
            // Handle options with potential files
            const processedOptions = value.map((option, index) => {
              const processedOption = { ...option };
              
              // If option has a file, add it to FormData and remove from option object
              if (option.media_url && (option.media_url instanceof File)) {
                console.log(`Adding option ${index} media file:`, option.media_url);
                form.append(`option_${index}_media`, option.media_url as File);
                delete processedOption.media_url;
              }
              
              return processedOption;
            });
            
            form.append(key, JSON.stringify(processedOptions));
            return;
          }
          
          // Regular field
          if (value !== null && value !== undefined) {
            const v = Array.isArray(value) ? JSON.stringify(value) : String(value);
            form.append(key, v);
          }
        });
        
        body = form;
        
        // Debug: Log FormData contents
        console.log("FormData contents:");
        for (const [key, value] of form.entries()) {
          console.log(`${key}:`, value);
        }
      } else {
        console.log("Creating JSON body without files");
        body = payload;
      }

      const response = await apiClient.post(apiRoutes.QUESTIONS.CREATE, body);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        (err.response?.data as QuestionsResponse) || {
          success: false,
          message: "Failed to create question",
        }
      );
    }
  }

  static async updateQuestion(id: string, payload: UpdateQuestionInput) {
    try {
      // Debug: Log the payload to see what we're working with
      console.log("UpdateQuestion payload:", payload);
      console.log("payload.media_url:", payload.media_url, "Type:", typeof payload.media_url);
      console.log("payload.options:", payload.options);
      
      // Check if payload contains any file fields (media_url in question or options)
      const hasQuestionFile = payload.media_url && (payload.media_url instanceof File);
      const hasOptionFiles = payload.options?.some(option => 
        option.media_url && (option.media_url instanceof File)
      );

      console.log("hasQuestionFile:", hasQuestionFile);
      console.log("hasOptionFiles:", hasOptionFiles);

      let body: FormData | UpdateQuestionInput;
      
      if (hasQuestionFile || hasOptionFiles) {
        console.log("Creating FormData with file uploads");
        const form = new FormData();
        
        // Add non-file fields
        Object.entries(payload).forEach(([key, value]) => {
          if (key === 'media_url' && value && (value instanceof File)) {
            // Handle question media file
            console.log("Adding question media file:", value);
            form.append('media', value as File);
            return;
          }
          
          if (key === 'options' && Array.isArray(value)) {
            // Handle options with potential files
            const processedOptions = value.map((option, index) => {
              const processedOption = { ...option };
              
              // If option has a file, add it to FormData and remove from option object
              if (option.media_url && (option.media_url instanceof File)) {
                console.log(`Adding option ${index} media file:`, option.media_url);
                form.append(`option_${index}_media`, option.media_url as File);
                delete processedOption.media_url;
              }
              
              return processedOption;
            });
            
            form.append(key, JSON.stringify(processedOptions));
            return;
          }
          
          // Regular field
          if (value !== null && value !== undefined) {
            const v = Array.isArray(value) ? JSON.stringify(value) : String(value);
            form.append(key, v);
          }
        });
        
        body = form;
        
        // Debug: Log FormData contents
        console.log("FormData contents:");
        for (const [key, value] of form.entries()) {
          console.log(`${key}:`, value);
        }
      } else {
        console.log("Creating JSON body without files");
        body = payload;
      }

      const response = await apiClient.put(
        apiRoutes.QUESTIONS.UPDATE_BY_ID(id),
        body
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        err.response?.data || {
          success: false,
          message: "Failed to update question",
        }
      );
    }
  }

  static async deleteQuestion(id: string) {
    try {
      const response = await apiClient.delete(
        apiRoutes.QUESTIONS.DELETE_BY_ID(id)
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        err.response?.data || {
          success: false,
          message: "Failed to delete question",
        }
      );
    }
  }
}
