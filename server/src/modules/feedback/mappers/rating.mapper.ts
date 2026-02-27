import { RatingResponseDto } from '../dtos/rating-response.dto';

export class RatingMapper {
  static toResponseDto(rating: any): RatingResponseDto {
    return {
      id: rating.id,
      quiz_id: rating.quiz_id,
      user_id: rating.user_id,
      user_name: rating.user?.full_name || rating.user?.username || 'Unknown',
      user_avatar: rating.user?.avatar || null,
      rating: rating.rating,
      comment: rating.comment,
      created_at: rating.created_at,
      updated_at: rating.updated_at,
    };
  }
}
