"use client";

import React from "react";
import { useQuizDetail } from "./hooks/useQuizDetail";
import QuizHeader from "./components/QuizHeader";
import QuizInstructions from "./components/QuizInstructions";
import QuizCreator from "./components/QuizCreator";
import QuizBanner from "./components/QuizBanner";
import QuizBadges from "./components/QuizBadges";
import QuizRatingsDetail from "./components/QuizRatingsDetail";
import QuizComments from "./components/QuizComments";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/common/components/ui/dialog";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Switch } from "@/common/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Div } from "@/common/components/ui/div";
import { Users, DoorOpen, Shield, Hash, LockKeyhole } from "lucide-react";
import type { QuizDetailData } from "./services/quiz.detail.service";
import { useCreateRoom } from "./hooks/useCreateRoom";
import { useListRooms } from "./hooks/useListRooms";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";
import { useJoinRoom } from "./hooks/useJoinRoom";
import { showError } from "@/lib/Notification";
import { BackendUnavailable } from "./components/BackendUnavailable";
import { useTranslations } from "next-intl";

interface QuizDetailProps {
  slug: string;
}

const QuizDetail: React.FC<QuizDetailProps> = ({ slug }) => {
  const { data, loading, error } = useQuizDetail(slug);
  const t = useTranslations("quizDetail");
  const {
    createRoom,
    loading: creatingRoom,
    error: createRoomError,
  } = useCreateRoom();
  const [openJoinRoom, setOpenJoinRoom] = React.useState(false);
  const [openCreateRoom, setOpenCreateRoom] = React.useState(false);
  const [roomCode, setRoomCode] = React.useState("");
  const [isPrivate, setIsPrivate] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [maxParticipants, setMaxParticipants] = React.useState<number>(50);
  const [errors, setErrors] = React.useState<{
    roomCode?: string;
    password?: string;
    maxParticipants?: string;
  }>({});

  const quizId = (data as QuizDetailData | null)?.id ?? slug;

  // Validate quizId before using it
  const isValidQuizId =
    quizId &&
    quizId.trim() !== "" &&
    quizId !== "undefined" &&
    quizId !== "null";

  const {
    items: rooms,
    loading: loadingRooms,
    error: roomsError,
    refetch,
  } = useListRooms(isValidQuizId ? quizId : undefined, "OPEN");
  const [joinPassword, setJoinPassword] = React.useState("");
  const [joiningRoomId, setJoiningRoomId] = React.useState<string | null>(null);
  const { join, loading: joining } = useJoinRoom();
  const { push: pushLocalized, prefixPath } = useLocalizedRouter();

  async function handleJoin(r: { id: string; is_private: boolean }) {
    if (r.is_private) {
      if (!joiningRoomId || joiningRoomId !== r.id || !joinPassword) return;
      const res = await join(r.id, joinPassword);
      if (!res.success) {
        showError(res.message || t("wrongPassword"));
        return;
      }
    }
    pushLocalized(prefixPath(`/quiz/${quizId}/room/${r.id}`));
  }

  function handleRoomCodeChange(v: string) {
    // Do not aggressively filter during typing; just cap length
    setRoomCode(v.slice(0, 6));
  }

  function validateForm() {
    const nextErrors: typeof errors = {};
    if (!/^[A-Za-z0-9]{6}$/.test(roomCode))
      nextErrors.roomCode = t("roomCodeError");
    if (isPrivate && !password) nextErrors.password = t("enterPasswordRequired");
    const maxNum = Number(maxParticipants);
    if (!Number.isFinite(maxNum) || maxNum < 2)
      nextErrors.maxParticipants = t("maxParticipantsError");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    const payload = {
      quiz_id: quizId,
      room_code: roomCode,
      is_private: isPrivate,
      password: isPrivate ? password : undefined,
      max_participants: Number(maxParticipants),
    };
    void (async () => {
      const res = await createRoom(payload);
      if (res.success) {
        setOpenCreateRoom(false);
      }
    })();
  }

  if (loading) return <div>{t("loading")}</div>;
  if (error) return <div>{error}</div>;
  if (!data) return <div>{t("noQuizFound")}</div>;

  return (
    <div>
      <QuizBanner src={data.thumbnail_url} title={data.title} />
      <div className="w-full px-4 py-6">
        {/* Hero Section */}
        <div className="mb-8">
          <QuizHeader
            title={data.title}
            description={data.description}
            tags={data.tags as unknown as string[]}
          />
          <div className="mt-4">
            <QuizBadges
              items={[
                { label: `${data.difficulty_level}` },
                { label: `${data.time_limit}s` },
                { label: t("questionsUnit", { count: data.questions_count }) },
                { label: t("attemptsUnit", { count: data.attempts_count }) },
                ...(data.category_name ? [{ label: data.category_name }] : []),
              ]}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6 w-full">
            {/* CTA Section */}
            <Card className="bg-card">
              <CardContent className="space-y-4">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    {t("readyToChallenge")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t("questionsInfo", { count: data.questions_count })} •{" "}
                    {t("minutesInfo", { count: Math.floor(data.time_limit / 60) })} •{" "}
                    {data.difficulty_level}
                  </p>
                </CardHeader>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1"
                    variant="default"
                    onClick={() =>
                      pushLocalized(prefixPath(`/quiz/${slug}/do-quiz`))
                    }
                  >
                    <DoorOpen className="mr-2 h-4 w-4" />
                    {t("startQuiz")}
                  </Button>
                  {/* Join Room Dialog */}
                  <Dialog
                    open={openJoinRoom}
                    onOpenChange={(o) => {
                      setOpenJoinRoom(o);
                      if (o) void refetch();
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="flex-1" variant="secondary">
                        <Users className="mr-2 h-4 w-4" />
                        {t("joinRoom")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      showCloseButton={false}
                      className="sm:max-w-[100vw] sm:w-[100vw] max-w-[100vw] w-[100vw] h-[100vh] overflow-auto p-6 bg-background"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenJoinRoom(false)}
                        className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                        aria-label={t("closeRoomsList")}
                      >
                        {/* Close icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-6"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                      <DialogHeader className="text-left mb-2">
                        <DialogTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" /> {t("openRoomsList")}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="mt-0">
                        {roomsError && (
                          <BackendUnavailable
                            message={roomsError}
                            onRetry={refetch}
                          />
                        )}
                        {loadingRooms ? (
                          <div>{t("loadingRooms")}</div>
                        ) : rooms.length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            {t("noRooms")}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-start items-stretch">
                            {rooms.map((r) => (
                              <div
                                key={r.id}
                                className="border rounded-lg p-4 bg-card h-full flex flex-col"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-medium">
                                    {t("roomCode")}: {r.room_code}
                                  </div>
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${r.is_private
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                      }`}
                                  >
                                    {r.is_private ? t("private") : t("public")}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground mb-3">
                                  {t("participants", { current: r.current_participants, max: r.max_participants })}
                                </div>
                                {r.is_private ? (
                                  <div className="space-y-2">
                                    <Label htmlFor={`pwd-${r.id}`}>
                                      {t("password")}
                                    </Label>
                                    <Input
                                      id={`pwd-${r.id}`}
                                      type="password"
                                      value={
                                        joiningRoomId === r.id
                                          ? joinPassword
                                          : ""
                                      }
                                      onChange={(e) => {
                                        setJoiningRoomId(r.id);
                                        setJoinPassword(e.target.value);
                                      }}
                                      placeholder={t("enterPassword")}
                                    />
                                    {/* lỗi sẽ hiện qua toast, không đẩy card xuống */}
                                    <Button
                                      onClick={() => void handleJoin(r)}
                                      disabled={
                                        joining ||
                                        !joinPassword ||
                                        joiningRoomId !== r.id
                                      }
                                      className="w-full"
                                    >
                                      {t("join")}
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => void handleJoin(r)}
                                    disabled={joining}
                                    className="w-full"
                                  >
                                    {t("join")}
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog
                    open={openCreateRoom}
                    onOpenChange={setOpenCreateRoom}
                  >
                    <DialogTrigger asChild>
                      <Button className="flex-1" variant="destructive">
                        <Users className="mr-2 h-4 w-4" />
                        {t("createRoom")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" /> {t("createRoomWithFriends")}
                        </DialogTitle>
                      </DialogHeader>
                      <form
                        className="grid gap-4"
                        onSubmit={handleSubmit}
                        noValidate
                      >
                        {/* Ẩn id, chỉ hiển thị tên quiz và không cho sửa */}
                        <input
                          type="hidden"
                          name="quiz_id"
                          value={String(quizId)}
                        />
                        <div className="grid gap-2">
                          <Label htmlFor="quiz-name" className="flex items-center gap-1">
                            <Shield className="size-4" /> {t("quizName")}
                          </Label>
                          <Input id="quiz-name" value={data.title} readOnly className="bg-muted" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="room-code" className="flex items-center gap-1">
                            <Hash className="size-4" /> {t("roomCodeLabel")}
                          </Label>
                          <Input
                            id="room-code"
                            type="text"
                            inputMode="text"
                            maxLength={6}
                            placeholder={t("roomCodePlaceholder")}
                            value={roomCode}
                            onChange={(e) =>
                              handleRoomCodeChange(e.target.value)
                            }
                            aria-invalid={!!errors.roomCode}
                          />
                          {errors.roomCode && (
                            <span className="text-xs text-destructive">
                              {errors.roomCode}
                            </span>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label
                            htmlFor="is-private"
                            className="flex justify-between items-center"
                          >
                            <span className="inline-flex items-center gap-2">
                              <LockKeyhole className="size-4" /> {t("privateRoom")}
                            </span>
                            <Switch
                              id="is-private"
                              checked={isPrivate}
                              onCheckedChange={(v) => setIsPrivate(Boolean(v))}
                              aria-label={t("togglePrivate")}
                            />
                          </Label>
                        </div>
                        {isPrivate && (
                          <div className="grid gap-2">
                            <Label htmlFor="password">{t("password")}</Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder={t("enterPassword")}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              aria-invalid={!!errors.password}
                            />
                            {errors.password && (
                              <span className="text-xs text-destructive">
                                {errors.password}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="grid gap-2">
                          <Label htmlFor="max-participants">
                            {t("maxParticipants")}
                          </Label>
                          <Input
                            id="max-participants"
                            type="number"
                            min={2}
                            max={1000}
                            value={maxParticipants}
                            onChange={(e) =>
                              setMaxParticipants(Number(e.target.value))
                            }
                            aria-invalid={!!errors.maxParticipants}
                          />
                          {errors.maxParticipants && (
                            <span className="text-xs text-destructive">
                              {errors.maxParticipants}
                            </span>
                          )}
                        </div>
                        <DialogFooter>
                          {createRoomError && (
                            <div className="text-sm text-destructive mr-auto">
                              {createRoomError}
                            </div>
                          )}
                          <Button
                            type="submit"
                            disabled={creatingRoom}
                          >
                            <Users className="mr-2 h-4 w-4" /> {t("createRoom")}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <QuizInstructions instructions={data.instructions} />

            {/* Detailed Ratings */}
            <QuizRatingsDetail
              average={data.average_rating}
              total={data.total_ratings}
            />

            {/* Comments */}
            <QuizComments quizId={data.id} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quiz Stats Card */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="font-semibold">
                  {t("detailInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("difficulty")}</span>
                    <span className="font-medium">{data.difficulty_level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("timeLimit")}</span>
                    <span className="font-medium">{data.time_limit}s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("maxAttempts")}</span>
                    <span className="font-medium">{data.max_attempts}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("passingScore")}</span>
                    <span className="font-medium">{data.passing_score}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("quizType")}</span>
                    <span className="font-medium">{data.quiz_type}</span>
                  </div>
                  {data.published_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("createdDate")}</span>
                      <span className="font-medium">
                        {new Date(data.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Creator Info */}
            <QuizCreator creatorName={data.creator_name} />

            {/* Quick Stats */}
            <Div
              variant="elevated"
              size="default"
              rounded="lg"
              className="bg-accent/50"
            >
              <h4 className="font-medium mb-3">{t("statistics")}</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {data.questions_count}
                  </div>
                  <div className="text-xs text-muted-foreground">{t("questions")}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {data.attempts_count}
                  </div>
                  <div className="text-xs text-muted-foreground">{t("attempts")}</div>
                </div>
              </div>
            </Div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizDetail;
