import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth, Authenticated, AuthGuard } from '@/common/guards/auth.guard';
import { Permission } from '@/common/enums';
import { AuthDto } from '@/modules/auth/dto/base-auth.dto';
import {
  CreateKnowledgeSourceDto,
  ImportKnowledgeSourceDto,
  ImportKnowledgeUrlDto,
  ReviewKnowledgeSourceDto,
  SearchKnowledgeDto,
  UpdateKnowledgeSourceDto,
} from '../dtos/knowledge.dto';
import { KnowledgeService } from '../services/knowledge.service';
import { AiIdempotencyInterceptor } from '@/common/interceptors/ai-idempotency.interceptor';

@ApiTags('Knowledge')
@Controller('/api/knowledge')
@UseInterceptors(AiIdempotencyInterceptor)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search published public knowledge chunks' })
  search(@Query() query: SearchKnowledgeDto) {
    return this.knowledgeService.searchPublished(query);
  }

  @Get('sources/:id')
  @ApiOperation({ summary: 'Get a published public knowledge source' })
  getPublished(@Param('id') id: string) {
    return this.knowledgeService.getPublishedSource(id);
  }

  @Get('sources')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizCreate })
  listOwned(@Auth() auth: AuthDto) {
    return this.knowledgeService.listOwned(auth.user.id, auth.user.isAdmin);
  }

  @Post('sources')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizCreate })
  create(@Body() dto: CreateKnowledgeSourceDto, @Auth() auth: AuthDto) {
    return this.knowledgeService.create(dto, auth.user.id);
  }

  @Post('sources/import-file')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizCreate })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 1_000_000 } }))
  importFile(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: ImportKnowledgeSourceDto,
    @Auth() auth: AuthDto,
  ) {
    return this.knowledgeService.importFile(file, dto, auth.user.id);
  }

  @Post('sources/import-url')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizCreate })
  importUrl(@Body() dto: ImportKnowledgeUrlDto, @Auth() auth: AuthDto) {
    return this.knowledgeService.importUrl(dto, auth.user.id);
  }

  @Patch('sources/:id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizCreate })
  update(@Param('id') id: string, @Body() dto: UpdateKnowledgeSourceDto, @Auth() auth: AuthDto) {
    return this.knowledgeService.update(id, dto, auth.user.id, auth.user.isAdmin);
  }

  @Post('sources/:id/submit')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizCreate })
  submit(@Param('id') id: string, @Auth() auth: AuthDto) {
    return this.knowledgeService.submitForReview(id, auth.user.id, auth.user.isAdmin);
  }

  @Post('sources/:id/review')
  @UseGuards(AuthGuard)
  @Authenticated({ admin: true })
  review(@Param('id') id: string, @Body() dto: ReviewKnowledgeSourceDto, @Auth() auth: AuthDto) {
    return this.knowledgeService.review(id, dto, auth.user.id);
  }
}
