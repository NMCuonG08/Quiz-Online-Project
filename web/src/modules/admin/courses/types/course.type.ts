export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category_id: string;
  creator_id: string;
  difficulty_level: "EASY" | "MEDIUM" | "HARD";
  price: number;
  thumbnail_url?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  
  category?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    username: string;
    full_name: string;
  };
}

export interface CourseCreateData {
  title: string;
  description?: string;
  category_id: string;
  difficulty_level?: "EASY" | "MEDIUM" | "HARD";
  price?: number;
  thumbnail_url?: string;
  is_published?: boolean;
}

export interface CourseUpdateData extends Partial<CourseCreateData> {}
