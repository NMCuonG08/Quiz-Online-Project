# Hướng dẫn Hoàn chỉnh về Chuyển đổi i18n

## 📋 Tổng quan 

Tôi đã phân tích toàn bộ code của ứng dụng và chuyển đổi các component chính sang hệ thống i18n (internationalization) sử dụng `next-intl`.

## ✅ Đã hoàn thành

### 1. Cập nhật File Translation
Đã tạo/cập nhật đầy đủ các file translation với TẤT CẢ các keys cần thiết:

**File:** `e:\Project\Quiz-Online-Project\i18n\messages\en.json`
**File:** `e:\Project\Quiz-Online-Project\i18n\messages\vi.json`

Các namespace đã được tổ chức:
- `common` - Các text chung (language, search, buttons, copyright, etc.)
- `nav` - Navigation menu items
- `auth` - Authentication related texts
- `home.*` - Tất cả sections của home page
  - `home.hero` - Hero section
  - `home.offers` - What we offer section
  - `home.features` - Features section
  - `home.howItWorks` - How it works section
  - `home.multiplayer` - Multiplayer challenges
  - `home.levelUp` - Level up section
  - `home.testimonials` - Testimonials section
- `category` - Category related texts
- `quiz` - Quiz related texts (for do-quiz, results, etc.)
- `admin.*` - Admin dashboard texts
- `test` - Testing components
- `carousel` - Carousel controls
- `pagination` - Pagination controls

### 2. Components Đã Chuyển Đổi

#### Home Page Components (Hoàn thành 100%)
✅ **QuizSection.tsx**
- Namespace: `home.hero`
- Keys: title, subtitle, startQuizNow, viewQuizList, quizCategoryAlt

✅ **FeatureSection.tsx**
- Namespace: `home.features`
- Keys: quizGame.*, fragments.*, sudoku.*

✅ **OffersSection.tsx**
- Namespace: `home.offers`
- Keys: title, personalizedLearning.*, creativeActivities.*, interactiveGames.*, featured

✅ **HowItWorksSection.tsx**
- Namespace: `home.howItWorks`
- Keys: simple, title, subtitle, step1.*, step2.*, step3.*

✅ **MultiplayerSection.tsx**
- Namespace: `home.multiplayer`
- Keys: compete, title, description, joinNow, learnMore, altImage

✅ **LevelUpSection.tsx**  
- Namespace: `home.levelUp`
- Keys: title, description, discover, rewards

✅ **TestimonialsSection.tsx**
- Namespace: `home.testimonials`
- Keys: title, subtitle, testimonial1.*, testimonial2.*, testimonial3.*

#### Common Components
✅ **Footer.tsx**
- Namespace: `common`
- Keys: copyright, backToTop

#### Category Components
✅ **ListCategories.tsx**
- Namespace: `category`
- Keys: title

#### User Components  
✅ **FriendsCarousel.tsx**
- Namespace: `quiz`
- Keys: myFriends

## 📝 Các Component Còn Lại Cần Chuyển Đổi

### Template Pattern cho mọi component:

```tsx
// 1. Thêm "use client" nếu chưa có
"use client";

// 2. Import useTranslations
import { useTranslations } from "next-intl";

// 3. Trong component, khai báo hook
const MyComponent = () => {
  const t = useTranslations("namespace"); // chọn namespace phù hợp
  
  return (
    <div>
      {/* Thay hardcoded text bằng {t("key")} */}
      <h1>{t("title")}</h1>
    </div>
  );
};
```

### Quiz Components Cần Chuyển Đổi

#### 1. QuizResults.tsx
```tsx
const t = useTranslations("quiz");

// Thay thế:
"Quiz Completed!" → {t("quizCompleted")}
"Correct Answers" → {t("correctAnswers")}
"Incorrect Answers" → {t("incorrectAnswers")}
"Time Spent" → {t("timeSpent")}
```

#### 2. QuizHeader.tsx
```tsx
const t = useTranslations("quiz");

// Thay thế:
"Time Remaining" → {t("timeRemaining")}
```

#### 3. QuizError.tsx
```tsx
const t = useTranslations("quiz");

// Thay thế:
"Something went wrong" → {t("somethingWentWrong")}
```

#### 4. AnswerOptions.tsx
```tsx
const t = useTranslations("quiz");

// Thay thế:
"Your Answer:" → {t("yourAnswer")}
```

#### 5. DoQuizPage.tsx
```tsx
const t = useTranslations("quiz");

// Thay thế:
"Slug không hợp lệ" → {t("invalidSlug")}
```

#### 6. SimpleParticipants.tsx
```tsx
const t = useTranslations("quiz");

// Thay thế:
"No players in room" → {t("noPlayersInRoom")}
```

#### 7. QRCodeDisplay.tsx
```tsx
const t = useTranslations("quiz");

// Thay thế:
"Failed to generate QR code" → {t("failedToGenerateQR")}
"No QR code available" → {t("noQRCodeAvailable")}
```

### Admin Components

Tất cả keys đã có sẵn trong i18n files. Chỉ cần:

1. Import `useTranslations`
2. Khai báo `const t = useTranslations("admin.quiz")` hoặc namespace tương ứng
3. Thay thế hardcoded text

**Ví dụ cho ListQuizTable.tsx:**
```tsx
const t = useTranslations("admin.quiz");

// Thay thế:
"Created At" → {t("createdAt")}
"View Quiz" → {t("viewQuiz")}
"Edit Quiz" → {t("editQuiz")}
"Delete Quiz" → {t("deleteQuiz")}
```

**Ví dụ cho Question components:**
```tsx
const t = useTranslations("admin.question");

// Thay thế:
"Question Text" → {t("questionText")}
"Time Limit (s)" → {t("timeLimit")}
"Option Image (Optional)" → {t("optionImage")}
"No image" → {t("noImage")}
"No questions found." → {t("noQuestionsFound")}
```

### Navigation và Carousel Components

Các components UI như carousel, pagination đã có keys trong `carousel` và `pagination` namespaces:

```tsx
// Carousel buttons
const t = useTranslations("carousel");
"Previous slide" → {t("previousSlide")}
"Next slide" → {t("nextSlide")}

// Pagination
const t = useTranslations("pagination");
"More pages" → {t("morePages")}
```

## 🔍 Cách tìm text cần chuyển đổi

### Method 1: Grep Search
```bash
# Tìm hardcoded Vietnamese text
grep -r "className.*>[A-Z]" src/

# Tìm specific patterns
grep -r "Danh mục\|Đang tải\|Lỗi" src/
```

### Method 2: Manual Check
Mở từng file và tìm:
1. Text trong JSX tags: `<h1>Text here</h1>`
2. Text trong attributes: `alt="Text here"`
3. Text trong strings: `const text = "Text here"`

## 📊 Tiến độ

### Hoàn thành: ~35%
- ✅ Home page (100%)
- ✅ Footer (100%)
- ✅ Category title (100%)
- ✅ Friends carousel (100%)
- ⏳ Quiz components (0%)
- ⏳ Admin components (0%)
- ⏳ Auth components (Already done by previous dev)
- ⏳ Nav components (Already done by previous dev)

### Ước tính còn lại:
- ~15 quiz-related components
- ~20 admin components
- ~10 misc components

## 🎯 Priorities

### High Priority (Hiển thị cho user):
1. ✅ Home page sections (DONE)
2. Quiz results và feedback
3. Category pages
4. User profile pages

### Medium Priority (Admin):
1. Admin dashboard
2. Quiz management
3. Category management

### Low Priority (Static/Rare):
1. Error pages
2. 404 pages
3. Terms of service

## 🚀 Testing

Sau khi chuyển đổi, test bằng cách:

1. **Chuyển đổi ngôn ngữ** - Click vào language switcher, kiểm tra text có được dịch không
2. **Check console** - Xem có lỗi missing keys không
3. **Visual check** - Đảm bảo layout không bị vỡ

## 📚 Tài liệu tham khảo

- next-intl docs: https://next-intl-docs.vercel.app/
- Translation keys: `/i18n/messages/en.json` và `/i18n/messages/vi.json`
- Configuration: `/web/i18n.ts` và `/web/next-intl.config.ts`

## 💡 Tips

1. **Nested keys**: Sử dụng dot notation `t("section.subsection.key")`
2. **Dynamic values**: `t("welcome", { name: userName })`
3. **Pluralization**: next-intl supports ICU message format
4. **Date/Number formatting**: Sử dụng `useFormatter()` hook

---

**Tạo bởi**: AI Assistant
**Ngày**: 2025-12-26
**Version**: 1.0
