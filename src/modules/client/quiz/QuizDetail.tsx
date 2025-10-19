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
import { Users, DoorOpen, Shield, Hash, LockKeyhole } from "lucide-react";
import type { QuizDetailData } from "./services/quiz.detail.service";
import { useCreateRoom } from "./hooks/useCreateRoom";
import { useListRooms } from "./hooks/useListRooms";
import { useRouter } from "next/navigation";
import { useJoinRoom } from "./hooks/useJoinRoom";
import { showError } from "@/lib/Notification";

interface QuizDetailProps {
  slug: string;
}

const QuizDetail: React.FC<QuizDetailProps> = ({ slug }) => {
  const { data, loading, error } = useQuizDetail(slug);
  const router = useRouter();
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
  const {
    items: rooms,
    loading: loadingRooms,
    error: roomsError,
    refetch,
  } = useListRooms(quizId, "OPEN");
  const [joinPassword, setJoinPassword] = React.useState("");
  const [joiningRoomId, setJoiningRoomId] = React.useState<string | null>(null);
  const { join, loading: joining } = useJoinRoom();

  async function handleJoin(r: { id: string; is_private: boolean }) {
    if (r.is_private) {
      if (!joiningRoomId || joiningRoomId !== r.id || !joinPassword) return;
      const res = await join(r.id, joinPassword);
      if (!res.success) {
        showError(res.message || "Sai mật khẩu");
        return;
      }
    }
    router.push(`/quiz/${quizId}/room/${r.id}`);
  }

  function handleRoomCodeChange(v: string) {
    // Do not aggressively filter during typing; just cap length
    setRoomCode(v.slice(0, 6));
  }

  function validateForm() {
    const nextErrors: typeof errors = {};
    if (!/^[A-Za-z0-9]{6}$/.test(roomCode))
      nextErrors.roomCode = "Mã phòng phải gồm 6 ký tự chữ hoặc số";
    if (isPrivate && !password) nextErrors.password = "Vui lòng nhập mật khẩu";
    const maxNum = Number(maxParticipants);
    if (!Number.isFinite(maxNum) || maxNum < 2)
      nextErrors.maxParticipants = "Số người tối đa tối thiểu là 2";
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!data) return <div>No quiz found.</div>;

  return (
    <div>
      <QuizBanner src={data.thumbnail_url} title={data.title} />
      <div className="max-w-7xl mx-auto px-4 py-6">
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
                { label: `${data.questions_count} câu` },
                { label: `${data.attempts_count} lượt làm` },
                ...(data.category_name ? [{ label: data.category_name }] : []),
              ]}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* CTA Section */}
            <div className="bg-red-light dark:bg-gray-dark rounded-lg p-6 border">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Sẵn sàng thử thách?
                  </h3>
                  <p className="text-sm text-gray-600">
                    {data.questions_count} câu hỏi •{" "}
                    {Math.floor(data.time_limit / 60)} phút •{" "}
                    {data.difficulty_level}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button className="bg-blue-600 dark:bg-gray-dark text-white">
                    <DoorOpen />
                    Bắt đầu làm bài
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
                      <Button className="bg-green-600 dark:bg-gray-dark text-white">
                        <Users />
                        Tham gia phòng
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      showCloseButton={false}
                      className="sm:max-w-[100vw] sm:w-[100vw] max-w-[100vw] w-[100vw] h-[100vh] overflow-auto p-6"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenJoinRoom(false)}
                        className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100"
                        aria-label="Đóng danh sách phòng"
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
                          className="size-10"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                      <DialogHeader className="text-left mb-2">
                        <DialogTitle className="flex items-center gap-2">
                          <Users /> Danh sách phòng đang mở
                        </DialogTitle>
                      </DialogHeader>
                      <div className="mt-0">
                        {roomsError && (
                          <div className="text-sm text-red-500">
                            {roomsError}
                          </div>
                        )}
                        {loadingRooms ? (
                          <div>Đang tải...</div>
                        ) : rooms.length === 0 ? (
                          <div className="text-sm text-gray-600">
                            Chưa có phòng nào
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-start items-stretch">
                            {rooms.map((r) => (
                              <div
                                key={r.id}
                                className="border rounded-lg p-4 bg-white dark:bg-gray-dark h-full flex flex-col"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-medium">
                                    Mã phòng: {r.room_code}
                                  </div>
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      r.is_private
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {r.is_private ? "Private" : "Public"}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 mb-3">
                                  {r.current_participants}/{r.max_participants}{" "}
                                  người
                                </div>
                                {r.is_private ? (
                                  <div className="space-y-2">
                                    <Label htmlFor={`pwd-${r.id}`}>
                                      Mật khẩu
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
                                      placeholder="Nhập mật khẩu"
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
                                      Tham gia
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => void handleJoin(r)}
                                    disabled={joining}
                                    className="w-full"
                                  >
                                    Tham gia
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
                      <Button className="bg-red-600 dark:bg-gray-dark text-white">
                        <Users />
                        Tạo phòng
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-violet-light dark:bg-gray-dark sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Users /> Tạo phòng với bạn bè
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
                          <Label htmlFor="quiz-name" className="gap-1">
                            <Shield className="size-4" /> Tên quiz
                          </Label>
                          <Input id="quiz-name" value={data.title} readOnly />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="room-code" className="gap-1">
                            <Hash className="size-4" /> room_code (6 ký tự
                            chữ/số)
                          </Label>
                          <Input
                            id="room-code"
                            type="text"
                            inputMode="text"
                            maxLength={6}
                            placeholder="Ví dụ: A1B2C3"
                            value={roomCode}
                            onChange={(e) =>
                              handleRoomCodeChange(e.target.value)
                            }
                            aria-invalid={!!errors.roomCode}
                          />
                          {errors.roomCode && (
                            <span className="text-xs text-red-500">
                              {errors.roomCode}
                            </span>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label
                            htmlFor="is-private"
                            className="justify-between"
                          >
                            <span className="inline-flex items-center gap-2">
                              <LockKeyhole className="size-4" /> Phòng riêng tư
                            </span>
                            <Switch
                              id="is-private"
                              checked={isPrivate}
                              onCheckedChange={(v) => setIsPrivate(Boolean(v))}
                              aria-label="Chuyển chế độ riêng tư"
                            />
                          </Label>
                        </div>
                        {isPrivate && (
                          <div className="grid gap-2">
                            <Label htmlFor="password">Mật khẩu</Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Nhập mật khẩu"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              aria-invalid={!!errors.password}
                            />
                            {errors.password && (
                              <span className="text-xs text-red-500">
                                {errors.password}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="grid gap-2">
                          <Label htmlFor="max-participants">
                            Số người tham gia tối đa
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
                            <span className="text-xs text-red-500">
                              {errors.maxParticipants}
                            </span>
                          )}
                        </div>
                        <DialogFooter>
                          {createRoomError && (
                            <div className="text-sm text-red-500 mr-auto">
                              {createRoomError}
                            </div>
                          )}
                          <Button
                            type="submit"
                            disabled={creatingRoom}
                            className="bg-blue dark:bg-gray-dark text-dark"
                          >
                            <Users /> Tạo phòng
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <QuizInstructions instructions={data.instructions} />

            {/* Detailed Ratings */}
            <QuizRatingsDetail
              average={data.average_rating}
              total={data.total_ratings}
            />

            {/* Comments */}
            <QuizComments />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quiz Stats Card */}
            <div className="bg-violet dark:bg-gray-dark rounded-lg border p-6">
              <h3 className="font-semibold mb-4">Thông tin chi tiết</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Độ khó</span>
                  <span className="font-medium">{data.difficulty_level}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Thời gian</span>
                  <span className="font-medium">{data.time_limit}s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lượt làm tối đa</span>
                  <span className="font-medium">{data.max_attempts}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Điểm qua môn</span>
                  <span className="font-medium">{data.passing_score}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Loại quiz</span>
                  <span className="font-medium">{data.quiz_type}</span>
                </div>
                {data.published_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ngày tạo</span>
                    <span className="font-medium">
                      {new Date(data.published_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Creator Info */}
            <QuizCreator creatorName={data.creator_name} />

            {/* Quick Stats */}
            <div className="bg-gray-50 dark:bg-gray-dark rounded-lg p-4">
              <h4 className="font-medium mb-3">Thống kê</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {data.questions_count}
                  </div>
                  <div className="text-xs text-gray-600">Câu hỏi</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {data.attempts_count}
                  </div>
                  <div className="text-xs text-gray-600">Lượt làm</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizDetail;
