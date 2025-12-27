# I18N Conversion Summary Document

## Đã chuyển đổi (Đã hoàn thành)

### Home Components
✅ `QuizSection.tsx` - Tất cả text đã chuyển sang `home.hero`
✅ `FeatureSection.tsx` - Tất cả text đã chuyển sang `home.features`
✅ `OffersSection.tsx` - Tất cả text đã chuyển sang `home.offers`
✅ `HowItWorksSection.tsx` - Tất cả text đã chuyển sang `home.howItWorks`
✅ `MultiplayerSection.tsx` - Tất cả text đã chuyển sang `home.multiplayer`
✅ `LevelUpSection.tsx` - Tất cả text đã chuyển sang `home.levelUp`
✅ `TestimonialsSection.tsx` - Tất cả text đã chuyển sang `home.testimonials`

### Common Components
✅ `Footer.tsx` - Copyright và Back to top đã chuyển sang `common`

## Còn lại cần chuyển đổi

### Client - Category
📝 `ListCategories.tsx` - Cần chuyển "Danh mục Quiz" sang `category.title`

### Client - Do Quiz
📝 `QuizResults.tsx` - Cần chuyển:
   - "Quiz Completed!" → `quiz.quizCompleted`
   - "Correct Answers" → `quiz.correctAnswers`
   - "Incorrect Answers" → `quiz.incorrectAnswers`
   - "Time Spent" → `quiz.timeSpent`

📝 `QuizHeader.tsx` - Cần chuyển:
   - "Time Remaining" → `quiz.timeRemaining`

📝 `QuizError.tsx` - Cần chuyển:
   - "Something went wrong" → `quiz.somethingWentWrong`

📝 `AnswerOptions.tsx` - Cần chuyển:
   - "Your Answer:" → `quiz.yourAnswer`

### Client - Pages
📝 `DoQuizPage.tsx` - Cần chuyển:
   - "Slug không hợp lệ" → `quiz.invalidSlug`

### Client - Room Quiz
📝 `SimpleParticipants.tsx` - Cần chuyển:
   - "No players in room" → `quiz.noPlayersInRoom`

📝 `QRCodeDisplay.tsx` - Cần chuyển:
   - "Failed to generate QR code" → `quiz.failedToGenerateQR`
   - "No QR code available" → `quiz.noQRCodeAvailable`

### Client - User
📝 `FriendsCarousel.tsx` - Cần chuyển:
   - "My Friends" → `quiz.myFriends`

### Admin Components (Đã có keys trong i18n)
📝 Các component admin cần chuyển đổi:
   - `ListQuizTable.tsx`
   - `AddQuiz.tsx`
   - `QuestionCard.tsx`
   - `ListQuestionsOfQuiz.tsx`
   - `EditQuestionModal.tsx`
   - `AddQuestionModal.tsx`
   - `ListCategoriesTable.tsx`
   - Và nhiều component admin khác...

## Hướng dẫn chuyển đổi cho các file còn lại

Mỗi component cần:
1. Thêm `"use client";` ở đầu file nếu chưa có
2. Import `useTranslations` từ "next-intl"
3. Khai báo `const t = useTranslations("namespace");` trong component
4. Thay thế hardcoded text bằng `{t("key")}`

### Ví dụ pattern:

```tsx
// Trước khi chuyển đổi
const MyComponent = () => {
  return <h1>Hardcoded Text</h1>;
};

// Sau khi chuyển đổi  
"use client";
import { useTranslations } from "next-intl";

const MyComponent = () => {
  const t = useTranslations("namespace");
  return <h1>{t("key")}</h1>;
};
```

## Tất cả translation keys đã được thêm vào:
- `/i18n/messages/en.json`
- `/i18n/messages/vi.json`

Các file này đã chứa đầy đủ tất cả các keys cần thiết cho toàn bộ ứng dụng.
