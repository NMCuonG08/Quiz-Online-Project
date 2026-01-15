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

      let body: FormData | Record<string, unknown>;
      
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
              
              // Remove metadata fields that backend doesn't expect
              delete (processedOption as Record<string, unknown>).id;
              delete (processedOption as Record<string, unknown>).question_id;
              delete (processedOption as Record<string, unknown>).created_at;
              delete (processedOption as Record<string, unknown>).updated_at;
              delete (processedOption as Record<string, unknown>).question_text;
              delete (processedOption as Record<string, unknown>).question_type;
              
              // If option has a file, add it to FormData and remove from option object
              if (option.media_url && (option.media_url instanceof File)) {
                console.log(`Adding option ${index} media file:`, option.media_url);
                form.append(`option_${index}_media`, option.media_url as File);
                delete processedOption.media_url;
              } else {
                // Remove null/empty media_url
                delete processedOption.media_url;
              }
              
              // Remove null/undefined explanation
              if (processedOption.explanation === null || processedOption.explanation === undefined || processedOption.explanation === '') {
                delete processedOption.explanation;
              }
              
              return processedOption;
            });
            
            form.append(key, JSON.stringify(processedOptions));
            return;
          }
          
          // Regular field - skip null/undefined/empty values
          if (value !== null && value !== undefined && value !== '') {
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
        
        // Clean the payload - remove null/undefined values and metadata fields
        const cleanPayload: Record<string, unknown> = {};
        
        Object.entries(payload).forEach(([key, value]) => {
          // Skip null, undefined, empty string values
          if (value === null || value === undefined || value === '') {
            return;
          }
          
          // Skip media_url if it's not a File (we don't have files in this branch)
          if (key === 'media_url') {
            return;
          }
          
          // Clean options array
          if (key === 'options' && Array.isArray(value)) {
            cleanPayload[key] = value.map(option => {
              const cleanOption: Record<string, unknown> = {};
              
              // Only include expected fields
              if (option.option_text !== undefined && option.option_text !== null) {
                cleanOption.option_text = option.option_text;
              }
              if (option.is_correct !== undefined) {
                cleanOption.is_correct = option.is_correct;
              }
              if (option.sort_order !== undefined) {
                cleanOption.sort_order = option.sort_order;
              }
              if (option.explanation && option.explanation.trim() !== '') {
                cleanOption.explanation = option.explanation;
              }
              
              return cleanOption;
            });
            return;
          }
          
          cleanPayload[key] = value;
        });
        
        console.log("Clean payload:", cleanPayload);
        body = cleanPayload;
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
      // Fields that should NOT be sent to the backend
      const forbiddenFields = ['id', 'quiz_id', 'created_at', 'updated_at', 'options_count'];
      
      // Clean the payload
      const cleanPayload = { ...payload };
      forbiddenFields.forEach(field => {
        delete (cleanPayload as Record<string, unknown>)[field];
      });
      
      // Check if we have files to upload
      const hasQuestionFile = cleanPayload.media_url instanceof File;
      const hasOptionFiles = cleanPayload.options?.some(opt => opt.media_url instanceof File);
      
      // Need FormData if we have any files
      const needsFormData = hasQuestionFile || hasOptionFiles;
      
      console.log("UpdateQuestion - hasQuestionFile:", hasQuestionFile, "hasOptionFiles:", hasOptionFiles);

      let body: FormData | Record<string, unknown>;
      
      if (needsFormData) {
        const form = new FormData();
        
        // Add question media file if present
        if (hasQuestionFile) {
          form.append('media', cleanPayload.media_url as File);
          delete cleanPayload.media_url;
        }
        
        // Process options - extract files and clean data
        if (cleanPayload.options) {
          const processedOptions = cleanPayload.options.map((option, index) => {
            const cleanOption = { ...option };
            delete (cleanOption as Record<string, unknown>).id;
            delete (cleanOption as Record<string, unknown>).question_id;
            delete (cleanOption as Record<string, unknown>).created_at;
            delete (cleanOption as Record<string, unknown>).updated_at;
            
            // Handle option media
            if (option.media_url instanceof File) {
              form.append(`option_${index}_media`, option.media_url);
              delete cleanOption.media_url;
            } else if (typeof option.media_url === 'string') {
              // Keep the existing media URL
              cleanOption.media_url = option.media_url;
            } else {
              // Ensure it's null or undefined if not provided
              cleanOption.media_url = null;
            }
            
            return cleanOption;
          });
          
          form.append('options', JSON.stringify(processedOptions));
          delete cleanPayload.options;
        }
        
        // Add remaining fields
        Object.entries(cleanPayload).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (Array.isArray(value) || typeof value === 'object') {
              form.append(key, JSON.stringify(value));
            } else {
              form.append(key, String(value));
            }
          } else if (key === 'media_url' && value === null) {
            // Signal to backend that media should be removed
            form.append('media_id', 'null');
          }
        });
        
        body = form;
      } else {
        // No files - clean options and send as JSON
        if (cleanPayload.options) {
          cleanPayload.options = cleanPayload.options.map(option => {
            const cleanOption = { ...option };
            delete (cleanOption as Record<string, unknown>).id;
            delete (cleanOption as Record<string, unknown>).question_id;
            delete (cleanOption as Record<string, unknown>).created_at;
            delete (cleanOption as Record<string, unknown>).updated_at;
            
            if (typeof option.media_url === 'string') {
              cleanOption.media_url = option.media_url;
            } else {
              cleanOption.media_url = null;
            }
            return cleanOption;
          });
        }

        // If media_url is null, it means the user removed the image
        if (cleanPayload.media_url === null) {
          (cleanPayload as any).media_id = null;
        }

        delete cleanPayload.media_url;
        body = cleanPayload;
      }

      const response = await apiClient.patch(
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
