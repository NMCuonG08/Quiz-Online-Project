"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ListChecks,
  Loader2,
  RefreshCw,
  ShieldCheck,
  SquareX,
  X,
} from "lucide-react";
import {
  cancelAgentRun,
  decideAgentReview,
  getAgentRunEvents,
  listAgentReviews,
  type AgentReview,
  type AgentRunEvent,
  type BackgroundRun,
} from "../services/agent-control.service";
import type { ChatScope } from "../types";
import { cn } from "@/lib/utils";

type ControlTab = "runs" | "reviews";

const TERMINAL_RUN_STATES = new Set(["completed", "failed", "cancelled", "expired"]);

function statusLabel(status: string) {
  return ({
    queued: "Đang xếp hàng",
    running: "Đang chạy",
    planning: "Đang lập kế hoạch",
    waiting_for_approval: "Chờ xác nhận",
    cancel_requested: "Đang hủy",
    completed: "Hoàn thành",
    failed: "Thất bại",
    cancelled: "Đã hủy",
    expired: "Hết hạn",
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
  } as Record<string, string>)[status] || status;
}

function statusTone(status: string) {
  if (["completed", "approved"].includes(status)) return "text-emerald-600 bg-emerald-500/10";
  if (["failed", "rejected", "expired"].includes(status)) return "text-red-600 bg-red-500/10";
  if (["waiting_for_approval", "pending", "cancel_requested"].includes(status)) return "text-amber-700 bg-amber-500/10";
  return "text-blue-600 bg-blue-500/10";
}

export default function AgentControlCenter({
  open,
  run,
  runStatus,
  scope,
}: {
  open: boolean;
  run: BackgroundRun | null;
  runStatus: string | null;
  scope: ChatScope;
}) {
  const [tab, setTab] = useState<ControlTab>("runs");
  const [events, setEvents] = useState<AgentRunEvent[]>([]);
  const [reviews, setReviews] = useState<AgentReview[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedReview = useMemo(
    () => reviews.find((review) => review.review_id === selectedReviewId) || null,
    [reviews, selectedReviewId],
  );

  const loadEvents = async () => {
    if (!run?.run_id) return;
    try {
      const response = await getAgentRunEvents(run.run_id);
      setEvents(response.events || []);
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : "Không tải được timeline của run.");
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const response = await listAgentReviews("all");
      setReviews(response.reviews || []);
      setSelectedReviewId((current) => current || response.reviews?.[0]?.review_id || null);
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : "Không tải được hàng đợi human-review.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (tab === "reviews") {
      void loadReviews();
      return;
    }
    void loadEvents();
    if (!run?.run_id || TERMINAL_RUN_STATES.has(runStatus || "")) return;
    const timer = window.setInterval(() => void loadEvents(), 2500);
    return () => window.clearInterval(timer);
  }, [open, tab, run?.run_id, runStatus]);

  const handleCancel = async () => {
    if (!run?.run_id) return;
    setLoading(true);
    try {
      await cancelAgentRun(run.run_id);
      setNotice("Đã gửi yêu cầu hủy run.");
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : "Không thể hủy run.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decision: "approved" | "rejected") => {
    if (!selectedReview || selectedReview.status !== "pending") return;
    setDecisionBusy(true);
    setNotice(null);
    try {
      const response = await decideAgentReview(selectedReview.review_id, decision, notes);
      setReviews((current) => current.map((review) =>
        review.review_id === selectedReview.review_id ? response.review : review,
      ));
      setNotes("");
      setNotice(decision === "approved" ? "Đã duyệt nội dung." : "Đã từ chối nội dung.");
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : "Không thể cập nhật review.");
    } finally {
      setDecisionBusy(false);
    }
  };

  if (!open) return null;

  return (
    <section className="border-b border-border/70 bg-background" aria-label="Agent control center">
      <div className="flex items-center gap-1 border-b border-border/70 px-3 pt-2">
        <button type="button" onClick={() => setTab("runs")} className={cn("flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-[10px] font-bold", tab === "runs" ? "border-b-2 border-amber-400 text-foreground" : "text-muted-foreground hover:text-foreground")}>
          <ListChecks className="size-3.5" /> Tác vụ nền
          {run && <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px]">1</span>}
        </button>
        <button type="button" onClick={() => setTab("reviews")} className={cn("flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-[10px] font-bold", tab === "reviews" ? "border-b-2 border-amber-400 text-foreground" : "text-muted-foreground hover:text-foreground")}>
          <ShieldCheck className="size-3.5" /> Human review
          {!!reviews.filter((review) => review.status === "pending").length && <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] text-slate-950">{reviews.filter((review) => review.status === "pending").length}</span>}
        </button>
        <button type="button" onClick={() => tab === "runs" ? void loadEvents() : void loadReviews()} className="ml-auto grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Làm mới control center">
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {notice && <div className="mx-3 mt-2 rounded-lg bg-amber-500/10 px-2.5 py-2 text-[10px] text-amber-700 dark:text-amber-300">{notice}</div>}

      {tab === "runs" ? (
        <div className="max-h-72 overflow-y-auto p-3">
          {!run ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center">
              <Clock3 className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-2 text-[11px] font-semibold">Chưa có tác vụ nền</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Nhấn biểu tượng đồng hồ cạnh nút gửi để chạy một yêu cầu dài.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="flex items-start gap-2">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-600"><Clock3 className="size-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><p className="truncate text-[11px] font-bold">Background run</p><span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", statusTone(runStatus || run.status))}>{statusLabel(runStatus || run.status)}</span></div>
                  <p className="mt-1 truncate font-mono text-[9px] text-muted-foreground">{run.run_id}</p>
                </div>
                {runStatus && !TERMINAL_RUN_STATES.has(runStatus) && <button type="button" onClick={() => void handleCancel()} className="grid size-7 place-items-center rounded-lg text-red-600 hover:bg-red-500/10" aria-label="Hủy background run"><SquareX className="size-4" /></button>}
              </div>
              <div className="mt-3 space-y-1.5">
                {events.length ? events.slice(-8).map((event, index) => (
                  <div key={`${event.event_id || event.sequence || index}`} className="flex items-center gap-2 text-[9px]">
                    <span className="grid size-4 shrink-0 place-items-center rounded-full bg-background text-muted-foreground">{event.type === "done" ? <Check className="size-2.5" /> : <span>{index + 1}</span>}</span>
                    <span className="min-w-0 flex-1 truncate">{event.label || event.type}{event.tool ? ` · ${event.tool}` : ""}</span>
                    {event.timestamp && <span className="shrink-0 text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString()}</span>}
                  </div>
                )) : <p className="text-[10px] text-muted-foreground">Đang chờ event đầu tiên từ worker…</p>}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid max-h-80 grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] overflow-y-auto">
          <div className="border-r border-border/70 p-2">
            <div className="mb-1 flex items-center justify-between px-1"><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Hàng đợi</p><span className="text-[9px] text-muted-foreground">{reviews.length}</span></div>
            {reviews.length ? reviews.map((review) => <button type="button" key={review.review_id} onClick={() => { setSelectedReviewId(review.review_id); setNotes(review.decision_notes || ""); }} className={cn("mb-1 w-full rounded-lg px-2 py-2 text-left", selectedReviewId === review.review_id ? "bg-amber-400/15 ring-1 ring-amber-400/40" : "hover:bg-muted")}><div className="flex items-center gap-1.5"><FileCheck2 className="size-3.5 text-violet-600" /><span className="min-w-0 flex-1 truncate text-[10px] font-bold">{review.resource_type || "Nội dung AI"}</span></div><span className={cn("mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold", statusTone(review.status))}>{statusLabel(review.status)}</span></button>) : <div className="px-2 py-5 text-center text-[10px] text-muted-foreground">Không có review.</div>}
          </div>
          <div className="p-3">
            {!selectedReview ? <div className="flex h-full min-h-32 flex-col items-center justify-center text-center"><ShieldCheck className="size-6 text-muted-foreground" /><p className="mt-2 text-[11px] font-semibold">Chọn một nội dung để review</p></div> : <><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="text-[11px] font-bold">{selectedReview.resource_type || "Nội dung cần review"}</p><p className="mt-1 font-mono text-[8px] text-muted-foreground">{selectedReview.review_id}</p></div><span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", statusTone(selectedReview.status))}>{statusLabel(selectedReview.status)}</span></div><pre className="mt-3 max-h-28 overflow-auto rounded-lg bg-muted/60 p-2 text-[8px] leading-4 text-muted-foreground">{JSON.stringify(selectedReview.resource_payload || {}, null, 2)}</pre>{selectedReview.status === "pending" && <>{scope === "creator" || scope === "admin" ? <><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ghi chú cho quyết định…" className="mt-2 min-h-14 w-full resize-y rounded-lg border border-border bg-background px-2 py-1.5 text-[10px] outline-none focus:border-amber-400" /><div className="mt-2 flex gap-2"><button type="button" disabled={decisionBusy} onClick={() => void handleDecision("rejected")} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-500/30 px-2 py-2 text-[10px] font-bold text-red-600 hover:bg-red-500/10 disabled:opacity-50"><X className="size-3.5" /> Từ chối</button><button type="button" disabled={decisionBusy} onClick={() => void handleDecision("approved")} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500 px-2 py-2 text-[10px] font-bold text-white hover:bg-emerald-600 disabled:opacity-50">{decisionBusy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />} Duyệt</button></div></> : <p className="mt-3 rounded-lg bg-amber-500/10 px-2.5 py-2 text-[9px] text-amber-700">Tài khoản hiện tại chỉ được xem; creator/admin mới được quyết định review.</p>}</>}</>}
          </div>
        </div>
      )}
    </section>
  );
}
