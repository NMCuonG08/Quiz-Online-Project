"use client";

import { useClientQuiz } from "@/modules/client/category/hooks/useClientQuiz";
import { Button } from "@/common/components/ui/button";

export function QuizApiTest() {
  const {
    recentlyPublished,
    bestRated,
    popular,
    easy,
    hard,
    getRecentlyPublishedQuizzes,
    getBestRatedQuizzes,
    getPopularQuizzes,
    getEasyQuizzes,
    getHardQuizzes,
    getQuizzesByDifficulty,
  } = useClientQuiz();

  const testEndpoints = async () => {
    console.log("🧪 Testing all quiz endpoints...");

    const results = await Promise.allSettled([
      getRecentlyPublishedQuizzes({ limit: 5 }),
      getBestRatedQuizzes({ limit: 5 }),
      getPopularQuizzes({ limit: 5 }),
      getEasyQuizzes({ limit: 5 }),
      getHardQuizzes({ limit: 5 }),
      getQuizzesByDifficulty("MEDIUM", { limit: 5 }),
    ]);

    results.forEach((result, index) => {
      const endpointNames = [
        "Recently Published",
        "Best Rated",
        "Popular",
        "Easy",
        "Hard",
        "Medium Difficulty",
      ];

      if (result.status === "fulfilled") {
        console.log(`✅ ${endpointNames[index]}:`, result.value);
      } else {
        console.error(`❌ ${endpointNames[index]}:`, result.reason);
      }
    });
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Quiz API Test</h2>

      <Button onClick={testEndpoints} className="mb-4">
        Test All Endpoints
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Recently Published</h3>
          <p>Loading: {recentlyPublished.loading ? "Yes" : "No"}</p>
          <p>Error: {recentlyPublished.error || "None"}</p>
          <p>Count: {recentlyPublished.quizzes.length}</p>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold">Best Rated</h3>
          <p>Loading: {bestRated.loading ? "Yes" : "No"}</p>
          <p>Error: {bestRated.error || "None"}</p>
          <p>Count: {bestRated.quizzes.length}</p>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold">Popular</h3>
          <p>Loading: {popular.loading ? "Yes" : "No"}</p>
          <p>Error: {popular.error || "None"}</p>
          <p>Count: {popular.quizzes.length}</p>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold">Easy</h3>
          <p>Loading: {easy.loading ? "Yes" : "No"}</p>
          <p>Error: {easy.error || "None"}</p>
          <p>Count: {easy.quizzes.length}</p>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold">Hard</h3>
          <p>Loading: {hard.loading ? "Yes" : "No"}</p>
          <p>Error: {hard.error || "None"}</p>
          <p>Count: {hard.quizzes.length}</p>
        </div>
      </div>
    </div>
  );
}
