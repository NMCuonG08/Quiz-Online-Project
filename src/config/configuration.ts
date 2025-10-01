export default () => ({
  port: parseInt(process.env.PORT || '5000', 10) || 5000,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || false
        : [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
          ],
  },
  redis: {
    url: process.env.REDIS_URL,
    ttl: parseInt(process.env.REDIS_TTL || '60', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'app:',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'quiz-thumbnails',
    allowedFormats: process.env.CLOUDINARY_ALLOWED_FORMATS?.split(',') || [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
    ],
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      username: process.env.SMTP_USERNAME,
      password: process.env.SMTP_PASSWORD,
      ignoreCert: process.env.SMTP_IGNORE_CERT === 'true',
    },
    from: {
      name: process.env.EMAIL_FROM_NAME || 'Hệ thống',
      address: process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com',
    },
    replyTo: process.env.EMAIL_REPLY_TO,
    baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  environment: process.env.NODE_ENV || 'development',
});
