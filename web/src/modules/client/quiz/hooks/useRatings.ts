import { useState, useCallback, useEffect } from "react";
import { RatingService, RatingData } from "../services/rating.service";
import { showError, showSuccess } from "@/lib/Notification";
import { useAuth } from "@/modules/auth/common/hooks/useAuth";

export const useRatings = (quizId: string) => {
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRatings, setTotalRatings] = useState(0);
  const { isLoggedIn } = useAuth();
  
  const fetchRatings = useCallback(async (pageParam = 1) => {
    if (!quizId) return;
    setLoading(true);
    try {
      const res = await RatingService.getRatings(quizId, pageParam, 5); // 5 per page
      if (res.success && res.data) {
        setRatings(res.data.items || []);
        setPage(res.data.pagination?.page || 1);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalRatings(res.data.pagination?.totalItems || 0);
      } else {
        showError(res.message || "Failed to fetch ratings v1.0");
      }
    } catch (err: any) {
      showError(err.message || "Something went wrong fetching ratings.");
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchRatings(1);
  }, [fetchRatings]);

  const changePage = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      fetchRatings(newPage);
    }
  };

  const submitRating = async (ratingVal: number, commentStr: string) => {
    try {
      const res = await RatingService.createOrUpdateRating(quizId, ratingVal, commentStr);
      if (res.success) {
        showSuccess("Cảm ơn bạn đã đánh giá!");
        // Refresh ratings
        fetchRatings(1);
        return true;
      } else {
        showError(res.message || "Failed to submit rating");
        return false;
      }
    } catch (error: any) {
      showError(error.message || "Failed to submit rating.");
      return false;
    }
  };

  return {
    ratings,
    loading,
    page,
    totalPages,
    totalRatings,
    changePage,
    submitRating,
  };
};
