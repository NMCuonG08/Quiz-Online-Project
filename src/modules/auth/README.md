# Auth Module

Module xử lý authentication cho ứng dụng, bao gồm login và register với layout 50:50.

## Cấu trúc

```
src/modules/auth/
├── components/
│   ├── BannerForm.tsx      # Component banner với full ảnh
│   ├── LoginForm.tsx       # Form đăng nhập
│   └── RegisterForm.tsx    # Form đăng ký
├── login/
│   └── Login.tsx           # Layout login 50:50
├── register/
│   └── Register.tsx        # Layout register 50:50
└── pages/
    ├── LoginPage.tsx       # Page đăng nhập
    └── RegisterPage.tsx    # Page đăng ký
```

## Routes

- `/login` - Trang đăng nhập
- `/register` - Trang đăng ký

## Features

### Login Form
- Email input với icon
- Password input với toggle visibility
- Forgot password link
- Login button với màu coral
- Social login (Google, Facebook, Apple)
- Link chuyển đến trang đăng ký

### Register Form
- Full name input
- Email input
- Password input với toggle visibility
- Confirm password input
- Sign up button
- Social login
- Link chuyển đến trang đăng nhập

### Banner
- Full screen image banner
- Sử dụng ảnh từ `/public/banners/home.png`

## Layout

Layout 50:50 với:
- Bên trái: Banner (full ảnh)
- Bên phải: Form (centered)

## Styling

- Sử dụng Tailwind CSS
- Màu coral cho buttons: `bg-coral-500`, `hover:bg-coral-600`
- Responsive design
- Clean và modern UI