import { Controller, Get, Post, Body, UseGuards, Query, Delete, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FeedbackService } from '../services/feedback.service';
import { CreateRatingDto } from '../dtos/create-rating.dto';
import { RatingPaginationQueryDto } from '../dtos/rating-pagination.dto';
import { PaginatedResponseDto } from '@/common/dtos/responses/base.response';
import { AuthGuard, Authenticated, Auth } from '@/common/guards/auth.guard';
import { AuthDto } from '@/modules/auth/dto/base-auth.dto';
import { RatingResponseDto } from '../dtos/rating-response.dto';
import { Permission } from '@/common/enums';

@ApiTags('Feedback')
@Controller('api/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get('ratings')
  @ApiOperation({ summary: 'Get quiz ratings with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved paginated ratings',
  })
  async getRatings(
    @Query() query: RatingPaginationQueryDto,
  ): Promise<PaginatedResponseDto<RatingResponseDto>> {
    return this.feedbackService.getRatings(query);
  }

  @Post('ratings')
  @UseGuards(AuthGuard)
  @Authenticated({permission: Permission.ActivityRead})
  @ApiOperation({ summary: 'Create or update a quiz rating' })
  @ApiResponse({
    status: 201,
    description: 'Successfully created or updated rating',
  })
  async createOrUpdateRating(
    @Body() dto: CreateRatingDto,
    @Auth() auth: AuthDto,
  ): Promise<RatingResponseDto> {
    const userId = auth.user.id;
    return this.feedbackService.createOrUpdateRating(userId, dto);
  }

  @Delete('ratings/:quizId')
  @UseGuards(AuthGuard)
  @Authenticated({permission: Permission.ActivityRead})
  @ApiOperation({ summary: 'Delete a quiz rating by current user' })
  @ApiResponse({
    status: 200,
    description: 'Successfully deleted rating',
  })
  async deleteRating(
    @Param('quizId') quizId: string,
    @Auth() auth: AuthDto,
  ) {
    const userId = auth.user.id;
    return this.feedbackService.deleteRating(userId, quizId);
  }
}
