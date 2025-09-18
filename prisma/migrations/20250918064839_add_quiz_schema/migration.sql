-- CreateEnum
CREATE TYPE "public"."DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "public"."QuizType" AS ENUM ('PRACTICE', 'EXAM', 'TIMED', 'LIVE');

-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'ESSAY', 'MATCHING');

-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "public"."SessionType" AS ENUM ('LIVE', 'SCHEDULED', 'PRACTICE');

-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('WAITING', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "public"."ParticipantStatus" AS ENUM ('JOINED', 'ACTIVE', 'DISCONNECTED', 'FINISHED');

-- CreateEnum
CREATE TYPE "public"."AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'TIMED_OUT');

-- CreateEnum
CREATE TYPE "public"."ConnectionType" AS ENUM ('QUIZ', 'LOBBY', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('QUESTION_CHANGE', 'USER_JOIN', 'USER_LEAVE', 'ANSWER_SUBMIT', 'TIMER_UPDATE', 'QUIZ_START', 'QUIZ_END');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('QUIZ_INVITE', 'QUIZ_START', 'QUIZ_END', 'RESULT_READY', 'REMINDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."DeliveryMethod" AS ENUM ('IN_APP', 'EMAIL', 'PUSH', 'SMS');

-- CreateEnum
CREATE TYPE "public"."DeviceType" AS ENUM ('WEB', 'IOS', 'ANDROID');

-- CreateEnum
CREATE TYPE "public"."LogLevel" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."FeedbackType" AS ENUM ('BUG', 'SUGGESTION', 'COMPLAINT', 'PRAISE');

-- CreateEnum
CREATE TYPE "public"."FeedbackStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED');

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "parent_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quizzes" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "difficulty_level" "public"."DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "time_limit" INTEGER,
    "max_attempts" INTEGER NOT NULL DEFAULT 1,
    "passing_score" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "quiz_type" "public"."QuizType" NOT NULL DEFAULT 'PRACTICE',
    "instructions" TEXT,
    "thumbnail_id" UUID,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."questions" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" "public"."QuestionType" NOT NULL,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "time_limit" INTEGER,
    "explanation" TEXT,
    "media_id" UUID,
    "media_type" "public"."MediaType",
    "difficulty_level" "public"."DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."question_options" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "option_text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "explanation" TEXT,
    "media_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quiz_sessions" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "session_code" TEXT NOT NULL,
    "host_id" UUID NOT NULL,
    "session_type" "public"."SessionType" NOT NULL DEFAULT 'PRACTICE',
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'WAITING',
    "max_participants" INTEGER NOT NULL DEFAULT 100,
    "current_participants" INTEGER NOT NULL DEFAULT 0,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_participants" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "status" "public"."ParticipantStatus" NOT NULL DEFAULT 'JOINED',
    "device_info" JSONB NOT NULL DEFAULT '{}',
    "ip_address" TEXT,

    CONSTRAINT "session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quiz_attempts" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_id" UUID,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "time_taken" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."question_responses" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "text_answer" TEXT,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "points_earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "time_taken" INTEGER,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."active_connections" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "socket_id" TEXT NOT NULL,
    "session_id" UUID,
    "connection_type" "public"."ConnectionType" NOT NULL DEFAULT 'QUIZ',
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_ping" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_info" JSONB NOT NULL DEFAULT '{}',
    "ip_address" TEXT,

    CONSTRAINT "active_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."real_time_events" (
    "id" UUID NOT NULL,
    "event_type" "public"."EventType" NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID,
    "event_data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "real_time_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "delivery_method" "public"."DeliveryMethod"[] DEFAULT ARRAY['IN_APP']::"public"."DeliveryMethod"[],
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "subject_template" TEXT NOT NULL,
    "message_template" TEXT NOT NULL,
    "data_schema" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."push_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh_key" TEXT NOT NULL,
    "auth_key" TEXT NOT NULL,
    "device_type" "public"."DeviceType" NOT NULL DEFAULT 'WEB',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "subscribed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quiz_statistics" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "total_attempts" INTEGER NOT NULL DEFAULT 0,
    "total_participants" INTEGER NOT NULL DEFAULT 0,
    "average_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pass_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficulty_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_statistics" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "total_quizzes_taken" INTEGER NOT NULL DEFAULT 0,
    "total_quizzes_created" INTEGER NOT NULL DEFAULT 0,
    "average_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_time_spent" INTEGER NOT NULL DEFAULT 0,
    "streak_days" INTEGER NOT NULL DEFAULT 0,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."question_analytics" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "total_responses" INTEGER NOT NULL DEFAULT 0,
    "correct_responses" INTEGER NOT NULL DEFAULT 0,
    "incorrect_responses" INTEGER NOT NULL DEFAULT 0,
    "average_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficulty_index" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discrimination_index" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_logs" (
    "id" UUID NOT NULL,
    "level" "public"."LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feedback" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "quiz_id" UUID,
    "type" "public"."FeedbackType" NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "rating" SMALLINT,
    "status" "public"."FeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "admin_response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quiz_cache" (
    "id" UUID NOT NULL,
    "cache_key" TEXT NOT NULL,
    "quiz_id" UUID NOT NULL,
    "data" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leaderboards" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank_position" INTEGER NOT NULL,
    "time_taken" INTEGER NOT NULL,
    "attempt_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "public"."categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_is_active_idx" ON "public"."categories"("is_active");

-- CreateIndex
CREATE INDEX "quizzes_category_id_idx" ON "public"."quizzes"("category_id");

-- CreateIndex
CREATE INDEX "quizzes_creator_id_idx" ON "public"."quizzes"("creator_id");

-- CreateIndex
CREATE INDEX "quizzes_is_active_idx" ON "public"."quizzes"("is_active");

-- CreateIndex
CREATE INDEX "quizzes_quiz_type_idx" ON "public"."quizzes"("quiz_type");

-- CreateIndex
CREATE INDEX "quizzes_published_at_idx" ON "public"."quizzes"("published_at");

-- CreateIndex
CREATE INDEX "questions_quiz_id_idx" ON "public"."questions"("quiz_id");

-- CreateIndex
CREATE INDEX "questions_question_type_idx" ON "public"."questions"("question_type");

-- CreateIndex
CREATE INDEX "questions_sort_order_idx" ON "public"."questions"("sort_order");

-- CreateIndex
CREATE INDEX "question_options_question_id_idx" ON "public"."question_options"("question_id");

-- CreateIndex
CREATE INDEX "question_options_is_correct_idx" ON "public"."question_options"("is_correct");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_sessions_session_code_key" ON "public"."quiz_sessions"("session_code");

-- CreateIndex
CREATE INDEX "quiz_sessions_quiz_id_idx" ON "public"."quiz_sessions"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_sessions_session_code_idx" ON "public"."quiz_sessions"("session_code");

-- CreateIndex
CREATE INDEX "quiz_sessions_status_idx" ON "public"."quiz_sessions"("status");

-- CreateIndex
CREATE INDEX "quiz_sessions_start_time_idx" ON "public"."quiz_sessions"("start_time");

-- CreateIndex
CREATE INDEX "session_participants_session_id_idx" ON "public"."session_participants"("session_id");

-- CreateIndex
CREATE INDEX "session_participants_user_id_idx" ON "public"."session_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_participants_session_id_user_id_key" ON "public"."session_participants"("session_id", "user_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_quiz_id_idx" ON "public"."quiz_attempts"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_idx" ON "public"."quiz_attempts"("user_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_session_id_idx" ON "public"."quiz_attempts"("session_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_status_idx" ON "public"."quiz_attempts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempts_quiz_id_user_id_attempt_number_key" ON "public"."quiz_attempts"("quiz_id", "user_id", "attempt_number");

-- CreateIndex
CREATE INDEX "question_responses_attempt_id_idx" ON "public"."question_responses"("attempt_id");

-- CreateIndex
CREATE INDEX "question_responses_question_id_idx" ON "public"."question_responses"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_responses_attempt_id_question_id_key" ON "public"."question_responses"("attempt_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "active_connections_socket_id_key" ON "public"."active_connections"("socket_id");

-- CreateIndex
CREATE INDEX "active_connections_user_id_idx" ON "public"."active_connections"("user_id");

-- CreateIndex
CREATE INDEX "active_connections_session_id_idx" ON "public"."active_connections"("session_id");

-- CreateIndex
CREATE INDEX "active_connections_socket_id_idx" ON "public"."active_connections"("socket_id");

-- CreateIndex
CREATE INDEX "real_time_events_session_id_idx" ON "public"."real_time_events"("session_id");

-- CreateIndex
CREATE INDEX "real_time_events_event_type_idx" ON "public"."real_time_events"("event_type");

-- CreateIndex
CREATE INDEX "real_time_events_created_at_idx" ON "public"."real_time_events"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "public"."notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "public"."notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_scheduled_at_idx" ON "public"."notifications"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_name_key" ON "public"."notification_templates"("name");

-- CreateIndex
CREATE INDEX "notification_templates_type_idx" ON "public"."notification_templates"("type");

-- CreateIndex
CREATE INDEX "push_subscriptions_user_id_idx" ON "public"."push_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_user_id_endpoint_key" ON "public"."push_subscriptions"("user_id", "endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_statistics_quiz_id_key" ON "public"."quiz_statistics"("quiz_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_statistics_user_id_key" ON "public"."user_statistics"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_analytics_question_id_key" ON "public"."question_analytics"("question_id");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "public"."activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "public"."activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "public"."activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "system_logs_level_idx" ON "public"."system_logs"("level");

-- CreateIndex
CREATE INDEX "system_logs_created_at_idx" ON "public"."system_logs"("created_at");

-- CreateIndex
CREATE INDEX "feedback_user_id_idx" ON "public"."feedback"("user_id");

-- CreateIndex
CREATE INDEX "feedback_type_idx" ON "public"."feedback"("type");

-- CreateIndex
CREATE INDEX "feedback_status_idx" ON "public"."feedback"("status");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_cache_cache_key_key" ON "public"."quiz_cache"("cache_key");

-- CreateIndex
CREATE INDEX "quiz_cache_cache_key_idx" ON "public"."quiz_cache"("cache_key");

-- CreateIndex
CREATE INDEX "quiz_cache_expires_at_idx" ON "public"."quiz_cache"("expires_at");

-- CreateIndex
CREATE INDEX "leaderboards_quiz_id_rank_position_idx" ON "public"."leaderboards"("quiz_id", "rank_position");

-- CreateIndex
CREATE INDEX "leaderboards_category_id_rank_position_idx" ON "public"."leaderboards"("category_id", "rank_position");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboards_quiz_id_user_id_key" ON "public"."leaderboards"("quiz_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quizzes" ADD CONSTRAINT "quizzes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quizzes" ADD CONSTRAINT "quizzes_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quizzes" ADD CONSTRAINT "quizzes_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "public"."images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quiz_sessions" ADD CONSTRAINT "quiz_sessions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quiz_sessions" ADD CONSTRAINT "quiz_sessions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_participants" ADD CONSTRAINT "session_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_participants" ADD CONSTRAINT "session_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."question_responses" ADD CONSTRAINT "question_responses_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."question_responses" ADD CONSTRAINT "question_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."active_connections" ADD CONSTRAINT "active_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."active_connections" ADD CONSTRAINT "active_connections_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."real_time_events" ADD CONSTRAINT "real_time_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quiz_statistics" ADD CONSTRAINT "quiz_statistics_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_statistics" ADD CONSTRAINT "user_statistics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."question_analytics" ADD CONSTRAINT "question_analytics_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quiz_cache" ADD CONSTRAINT "quiz_cache_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leaderboards" ADD CONSTRAINT "leaderboards_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leaderboards" ADD CONSTRAINT "leaderboards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leaderboards" ADD CONSTRAINT "leaderboards_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
