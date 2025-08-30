-- CreateTable
CREATE TABLE "public"."images" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL DEFAULT 'https://res.cloudinary.com/dj9r2qksh/image/upload/v1748052303/coffee-6467644_1280_hhpgwj.jpg',
    "publicId" TEXT NOT NULL,
    "alt_text" VARCHAR(255),
    "caption" VARCHAR(500),
    "size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);
