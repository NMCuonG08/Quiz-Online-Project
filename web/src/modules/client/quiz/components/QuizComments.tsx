"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Textarea } from "@/common/components/ui/textarea";
import { useTranslations } from "next-intl";
import { Star, User } from "lucide-react";
import { useAuth } from "@/modules/auth/common/hooks/useAuth";
import { LocalizedLink } from "@/common/components/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar";
import { useRatings } from "../hooks/useRatings";

interface QuizCommentsProps {
  quizId: string;
}

const QuizComments: React.FC<QuizCommentsProps> = ({ quizId }) => {
  const [value, setValue] = useState("");
  const [ratingInput, setRatingInput] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasLoadedExisting, setHasLoadedExisting] = useState(false);

  const { user, isLoggedIn } = useAuth();
  const t = useTranslations("quizDetail");

  const {
    ratings,
    loading,
    page,
    totalPages,
    totalRatings,
    changePage,
    submitRating,
  } = useRatings(quizId);

  const userExistingRating = isLoggedIn ? ratings.find(r => r.user_id === user?.id) : null;

  useEffect(() => {
    if (userExistingRating && !hasLoadedExisting) {
      setRatingInput(userExistingRating.rating);
      setValue(userExistingRating.comment || "");
      setHasLoadedExisting(true);
    }
  }, [userExistingRating, hasLoadedExisting]);

  const handlePostReview = async () => {
    if (!value.trim() || ratingInput === 0) return;
    await submitRating(ratingInput, value);
    // Values are not cleared so the user can see what they submitted/updated
  };

  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("comments")}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({totalRatings})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Input Section */}
        <div className="space-y-3 bg-muted/40 p-4 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t("selectRating")}:</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 cursor-pointer transition-colors ${star <= (hoverRating || ratingInput)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 dark:text-gray-600"
                    }`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRatingInput(star)}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Textarea
              className="flex-1 min-h-[60px] resize-none"
              placeholder={t("commentPlaceholder")}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!isLoggedIn}
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:self-end">
              {!isLoggedIn && (
                <LocalizedLink href="/auth/login">
                  <Button variant="outline">{t("loginToComment")}</Button>
                </LocalizedLink>
              )}
              <Button
                onClick={handlePostReview}
                disabled={!isLoggedIn || !value.trim() || ratingInput === 0}
              >
                {userExistingRating ? t("updateReview") : t("send")}
              </Button>
            </div>
          </div>
        </div>

        {/* Comment List */}
        <div className="space-y-4">
          {loading && ratings.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              Loading...
            </div>
          ) : (
            <>
              {ratings.map((c) => (
                <div key={c.id} className="flex gap-4 p-4 rounded-lg bg-background border border-border/30">
                  <Avatar className="mt-1 size-10 border border-border">
                    <AvatarImage src={c.user_avatar || ""} alt={c.user_name} className="object-cover" />
                    <AvatarFallback className="bg-muted text-muted-foreground"><User className="size-5" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{c.user_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= c.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                            }`}
                        />
                      ))}
                    </div>
                    {c.comment && (
                      <div className="text-sm text-foreground/90 leading-relaxed">{c.comment}</div>
                    )}
                  </div>
                </div>
              ))}

              {ratings.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6">
                  {t("noComments")}
                </div>
              )}

              {/* Server Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changePage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    ←
                  </Button>
                  <div className="text-sm text-muted-foreground mx-2">
                    {page} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changePage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    →
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizComments;
