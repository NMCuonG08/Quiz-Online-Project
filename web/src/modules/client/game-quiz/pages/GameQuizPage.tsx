import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { Question, UserAnswer, QuizResult } from "../../do-quiz/types/quiz.types";
import { useGameQuiz } from "../hooks/useGameQuiz";
import { GameHeader } from "../components/GameHeader";
import { QuestionDisplay } from "../components/QuestionDisplay";
import { GameLoading } from "../components/GameLoading";
import { QuizResults } from "../../do-quiz/components";
import { GameQuizAnswer } from "../types/game-quiz.types";
import { Leaderboard } from "../components/Leaderboard";
import { useWebSocketState } from "@/common/hooks/useWebSocket";
import { wsManager } from "@/lib/websocket";
import { Home } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import type { RoomGameStatePayload, QuestionResultPayload } from "@/common/types/websocket-event.type";

interface GameQuizPageProps {
  questions: Question[];
  roomCode?: string;
  onExit?: () => void;
}

interface LeaderboardScore {
  userId: string;
  username: string;
  score: number;
  correctAnswers: number;
  totalTimeMs?: number;
  timestamp?: string;
}

const GameQuizPage: React.FC<GameQuizPageProps> = ({
  questions,
  roomCode,
  onExit,
}) => {
  const [mounted, setMounted] = useState(false);
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;
  const quizId = (params?.quizId as string) || "";

  const [leaderboard, setLeaderboard] = useState<Map<string, LeaderboardScore>>(new Map());
  const [gameVersion, setGameVersion] = useState(0);
  const [gamePhase, setGamePhase] = useState<RoomGameStatePayload["status"]>("WAITING");
  const [questionResults, setQuestionResults] = useState<QuestionResultPayload[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [rosterCount, setRosterCount] = useState(0);
  const [revealTimeRemaining, setRevealTimeRemaining] = useState(0);
  const gameVersionRef = useRef(0);
  const { isConnected } = useWebSocketState();
  const user = useSelector((state: RootState) => state.auth.user);
  const roomData = useSelector((state: RootState) => state.roomQuiz.data);
  const currentUserId = user?.id;

  const {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    selectedAnswer,
    isAnswered,
    isGameStarted,
    isGameEnded,
    score,
    correctAnswersCount,
    totalScore,
    timeRemaining,
    hasSelectedAnswer,
    isLastQuestion,
    selectedAnswers,
    selectAnswer,
    submitAnswer,
    applyAnswerResult,
    syncGameState,
    syncScore,
  } = useGameQuiz({
    roomId: roomId || "",
    quizId,
    questions,
    onAnswerSubmit: (answer: GameQuizAnswer) => {
      if (roomId) {
        wsManager.send("submit_answer", {
          roomId,
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          selectedOptionIds: answer.selectedOptionIds,
          timeSpent: answer.timeSpent,
          commandId: typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${answer.questionId}-${answer.answeredAt.getTime()}`,
        });
      }
    },
    onGameEnd: (finalScore: number) => {
      console.log("Game ended with score:", finalScore);
      if (roomId) {
        wsManager.send("get_leaderboard", { roomId });
      }
    },
  });

  // Listen for score updates
  useEffect(() => {
    if (!isConnected) return;

    const handleScoreUpdate = (data: LeaderboardScore) => {
      setLeaderboard((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data);
        return next;
      });
      if (data.userId === currentUserId) {
        syncScore(data.score, data.correctAnswers);
      }
    };

    const handleLeaderboardUpdate = (list: LeaderboardScore[]) => {
      console.log("🏆 Leaderboard update received:", list);
      setLeaderboard((prev) => {
        const next = new Map(prev);
        list.forEach((entry) => next.set(entry.userId, entry));
        return next;
      });
      const me = list.find((entry) => entry.userId === currentUserId);
      if (me) syncScore(me.score, me.correctAnswers);
    };

    const handleAnswerResult = (result: {
      questionId: string; isCorrect?: boolean; points?: number; duplicate?: boolean;
    }) => {
      if (!result.duplicate) {
        applyAnswerResult(
          result.questionId,
          Boolean(result.isCorrect),
          Number(result.points || 0),
        );
      }
    };

    wsManager.on("score_updated", handleScoreUpdate);
    wsManager.on("leaderboard_update", handleLeaderboardUpdate);
    wsManager.on("answer_result", handleAnswerResult);

    // Always restore authoritative scores after mount/reconnect.
    if (roomId) {
      wsManager.send("get_leaderboard", { roomId });
    }

    return () => {
      wsManager.off("score_updated", handleScoreUpdate);
      wsManager.off("leaderboard_update", handleLeaderboardUpdate);
      wsManager.off("answer_result", handleAnswerResult);
    };
  }, [applyAnswerResult, currentUserId, isConnected, roomId, syncScore]);

  useEffect(() => {
    if (!isConnected || !roomId) return;
    const handleGameState = (snapshot: RoomGameStatePayload) => {
      if (
        snapshot.roomId !== roomId
        || snapshot.version < gameVersionRef.current
      ) return;
      gameVersionRef.current = snapshot.version;
      setGameVersion(snapshot.version);
      setGamePhase(snapshot.status);
      setQuestionResults(snapshot.questionResults || []);
      setAnsweredCount(Number(snapshot.answeredCount || 0));
      setRosterCount(Number(snapshot.rosterCount || 0));
      if (snapshot.status === "REVEAL" && snapshot.revealEndsAt) {
        setRevealTimeRemaining(Math.max(0, Math.ceil((snapshot.revealEndsAt - Date.now()) / 1000)));
      }
      syncGameState(snapshot);
    };
    wsManager.on("game_state", handleGameState);
    wsManager.joinRoom(roomId);
    wsManager.send("get_game_state", { roomId });
    return () => wsManager.off("game_state", handleGameState);
  }, [isConnected, roomId, syncGameState]);

  useEffect(() => {
    if (gamePhase !== "REVEAL") return;
    const timer = window.setInterval(() => setRevealTimeRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [gamePhase]);

  useEffect(() => {
    if (!isConnected) return;
    const handleProgress = (payload: { roomId: string; questionId: string; answeredCount: number; rosterCount: number }) => {
      if (payload.roomId !== roomId) return;
      setAnsweredCount(payload.answeredCount);
      setRosterCount(payload.rosterCount);
    };
    const handleReveal = (payload: { roomId: string; questionResults: QuestionResultPayload[]; revealEndsAt: number }) => {
      if (payload.roomId !== roomId) return;
      setGamePhase("REVEAL");
      setQuestionResults(payload.questionResults || []);
      setRevealTimeRemaining(Math.max(0, Math.ceil((payload.revealEndsAt - Date.now()) / 1000)));
    };
    wsManager.on("answer_progress", handleProgress);
    wsManager.on("question_reveal", handleReveal);
    return () => {
      wsManager.off("answer_progress", handleProgress);
      wsManager.off("question_reveal", handleReveal);
    };
  }, [isConnected, roomId]);

  // Calculate results for QuizResults component
  const quizResultData = useMemo((): QuizResult | null => {
    if (!isGameEnded) return null;
    return {
      session_id: roomId || "game-session",
      total_questions: totalQuestions,
      correct_answers: correctAnswersCount,
      total_score: score,
      percentage: totalQuestions > 0 ? Math.round((correctAnswersCount / totalQuestions) * 100) : 0,
      time_spent: Math.round((leaderboard.get(currentUserId || "")?.totalTimeMs || 0) / 1000),
      passed: true,
    };
  }, [isGameEnded, roomId, totalQuestions, correctAnswersCount, score, leaderboard, currentUserId]);

  // Leaderboard entries
  const leaderboardEntries = useMemo(() => {
    const entries = Array.from(leaderboard.values()).map(e => ({
      userId: e.userId,
      username: e.username,
      score: e.score,
      correctAnswers: e.correctAnswers,
      totalTimeMs: e.totalTimeMs,
      isMe: e.userId === currentUserId
    }));

    // If I'm not in the leaderboard yet, add myself
    if (isGameEnded && !entries.find(e => e.userId === currentUserId)) {
      entries.push({
        userId: currentUserId || "me",
        username: "You",
        score: score,
        correctAnswers: correctAnswersCount,
        totalTimeMs: 0,
        isMe: true
      });
    }

    return entries.sort((a, b) => b.score - a.score);
  }, [leaderboard, currentUserId, score, correctAnswersCount, isGameEnded]);

  // Map selectedAnswers Map to UserAnswer[] array
  const mappedUserAnswers = useMemo((): UserAnswer[] => {
    return questions.map(q => {
      const answer = selectedAnswers.get(q.id);
      const isCorrect = q.options.find(o => o.id === (typeof answer === "string" ? answer : (Array.isArray(answer) ? answer[0] : "")))?.is_correct || false;
      
      return {
        question_id: q.id,
        selected_option_id: typeof answer === "string" ? answer : undefined,
        selected_option_ids: Array.isArray(answer) ? answer : typeof answer === "string" ? [answer] : [],
        text_answer: typeof answer === "string" ? answer : undefined,
        is_correct: isCorrect,
        points_earned: isCorrect ? q.points : 0,
        time_spent: 0,
        answered_at: new Date().toISOString(),
      };
    });
  }, [questions, selectedAnswers]);

  // Auto start game when component mounts and hide header/footer
  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    // Lock scroll
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Add class to body to hide layout elements
    document.body.classList.add("game-active");

    // Hide all potential header/footer elements
    const selectors = [
      "header",
      "nav",
      "footer",
      "[role='navigation']",
      "[role='contentinfo']",
      "main",
    ];

    const hiddenElements: Array<{ element: HTMLElement; display: string }> = [];

    selectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style.display !== "none") {
          hiddenElements.push({
            element: htmlEl,
            display: htmlEl.style.display || "",
          });
          htmlEl.style.display = "none";
        }
      });
    });

    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.classList.remove("game-active");

      // Restore all hidden elements
      hiddenElements.forEach(({ element, display }) => {
        element.style.display = display;
      });
    };
  }, []);

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      router.back();
    }
  };

  if (!mounted || (!isGameStarted && !isGameEnded)) {
    return <GameLoading />;
  }

  const content = (
    <div
      className="fixed inset-0 z-2147483647 bg-background text-foreground overflow-hidden flex flex-col selection:bg-primary/20"
      style={{ isolation: "isolate" }}
    >
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-primary/10 rounded-full blur-[80px] -mr-56 -mt-56" />
        <div className="absolute bottom-0 left-0 w-[480px] h-[480px] bg-violet-500/10 rounded-full blur-[80px] -ml-56 -mb-56" />
      </div>

      {isGameEnded && quizResultData ? (
        <div className="flex-1 overflow-y-auto pt-4 sm:pt-10 pb-40 px-4 scroll-smooth">
          <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row gap-8 items-start justify-center">
            
            {/* Left Spacer to perfectly center the results on Desktop */}
            <div className="hidden xl:block w-[400px] pointer-events-none" />

            {/* Center Content: Quiz Results */}
            <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-[3rem] p-4 sm:p-10 shadow-xl overflow-hidden relative">
                {/* Minimal Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-10 w-2 bg-primary rounded-full" />
                  <h2 className="text-4xl font-black tracking-tighter uppercase italic">
                    Quiz Completed!
                  </h2>
                </div>
                
                <QuizResults
                  result={quizResultData}
                  questions={questions}
                  userAnswers={mappedUserAnswers}
                  onRetakeQuiz={() => window.location.reload()}
                  onViewAnswers={() => {}} 
                />
              </div>
            </div>

            {/* Sidebar: Leaderboard */}
            <div className="w-full lg:w-[400px] animate-in fade-in slide-in-from-right-10 duration-1000 delay-300 lg:sticky lg:top-10">
               <Leaderboard entries={leaderboardEntries} />
            </div>
          </div>

          {/* Floating Action Button */}
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[1000] animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <button
              onClick={handleExit}
              className="group flex items-center gap-4 px-12 py-6 bg-primary text-primary-foreground rounded-full font-black text-2xl shadow-[0_30px_60px_-15px_rgba(var(--primary),0.5)] hover:scale-105 active:scale-95 transition-all border-4 border-white/20"
            >
              <Home className="w-8 h-8" />
              <span>RETURN TO ROOM</span>
            </button>
          </div>
        </div>
      ) : gamePhase === "REVEAL" ? (
        <div className="flex-1 overflow-y-auto p-6 sm:p-10">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="rounded-3xl border border-primary/30 bg-card/70 p-8 text-center shadow-xl">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">Kết quả câu {currentQuestionIndex + 1}</p>
              <h2 className="mt-2 text-4xl font-black">Bảng xếp hạng tốc độ</h2>
              <p className="mt-3 text-muted-foreground">{answeredCount}/{rosterCount || "?"} người đã trả lời · Câu tiếp theo sau {revealTimeRemaining}s</p>
            </div>
            <div className="overflow-hidden rounded-3xl border border-border bg-card/80 shadow-xl">
              {questionResults.map((entry, index) => (
                <div key={entry.userId} className="flex items-center gap-4 border-b border-border/60 px-6 py-4 last:border-b-0">
                  <span className="w-8 text-xl font-black text-primary">#{index + 1}</span>
                  <div className="flex-1"><p className="font-bold">{entry.username}</p><p className="text-xs text-muted-foreground">{entry.responseTimeMs == null ? "Không trả lời" : `${(entry.responseTimeMs / 1000).toFixed(2)}s`}</p></div>
                  <span className={entry.isCorrect ? "font-bold text-emerald-600" : "font-bold text-destructive"}>{entry.isCorrect ? `+${entry.points}` : "Sai"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header (fullscreen override) */}
          <GameHeader
            roomCode={roomCode}
            currentQuestion={currentQuestionIndex + 1}
            totalQuestions={totalQuestions}
            score={score}
            totalScore={totalScore}
            onExit={handleExit}
            onSubmitAnswer={submitAnswer}
            onNextQuestion={undefined}
            isAnswered={isAnswered}
            hasSelectedAnswer={hasSelectedAnswer}
            isLastQuestion={isLastQuestion}
          />

          {/* Main Content with top padding to clear header */}
          <div className="flex-1 overflow-y-auto">
            <div className="pt-6 sm:pt-8 md:pt-10 pb-8 px-4 sm:px-6 md:px-8 min-h-full">
              {currentQuestion && (
                <QuestionDisplay
                  question={currentQuestion}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={totalQuestions}
                  selectedAnswer={selectedAnswer}
                  onAnswerSelect={selectAnswer}
                  isAnswered={isAnswered}
                  timeRemaining={timeRemaining}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(content, document.body)
    : content;
};

export default GameQuizPage;

