"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { updateUserProfile } from "@/modules/auth/common/slices/authSlice";
import { UserService } from "../services/user.service";
import { UploadImage } from "@/common/components/ui/upload-image";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/common/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/common/components/ui/card";
import { showSuccess, showError, showLoading, closeLoading } from "@/lib/Notification";
import { User, Mail } from "lucide-react";

// Optional fields for updating
const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username too long").optional().or(z.literal("")),
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100, "Full name too long").optional().or(z.literal("")),
  avatar: z.any().optional(), // Can be string URL or File
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      fullName: "",
      avatar: null,
    },
  });

  // Pre-fill form when user data is available
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username || "",
        fullName: user.full_name || "",
        avatar: user.avatarUrl || null,
      });
    }
  }, [user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user?.id) return;

    setIsSubmitting(true);
    showLoading("Đang cập nhật...", "Xin vui lòng đợi");

    try {
      // Create FormData if we have a file, otherwise normal JSON update.
      // Wait, our backend endpoint PATCH /api/user/:id consumes JSON for standard fields 
      // but if we upload avatar file, it usually needs multipart/form-data.
      // Wait! Looking at the user.controller.ts and update-user.dto.ts, it expects `avatar: string` right now.
      // Let's assume if data.avatar is a File, the frontend doesn't have an upload mechanism built into the UserService yet, 
      // or we just send it as a base64 string or the UserService needs an upload mechanism.
      // For now, let's process standard fields. If we integrate real file upload in the future, we'll modify it.

      const payload: Record<string, any> = {};

      if (data.username !== user.username) payload.username = data.username;
      if (data.fullName !== user.full_name) payload.fullName = data.fullName;

      // If we had a pre-signed URL or base64 converter:
      // if (data.avatar instanceof File) { /* logic to upload and get URL */ }

      const result = await UserService.updateProfile(user.id, payload);

      if (result.success) {
        showSuccess("Cập nhật thành công!");
        dispatch(
          updateUserProfile({
            id: user.id,
            data: {
              username: data.username,
              fullName: data.fullName,
              // email, avatar
            },
          })
        );
      } else {
        showError(result.error || "Có lỗi xảy ra");
      }
    } catch (e) {
      console.error(e);
      showError("Lỗi hệ thống");
    } finally {
      closeLoading();
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Đang tải thông tin...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Hồ sơ cá nhân
          </CardTitle>
          <CardDescription>Quản lý thông tin công khai của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Email (Read only) */}
              <div className="space-y-2">
                <FormLabel>Email</FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={user.email}
                    disabled
                    className="pl-9 bg-muted/50 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Email là thông tin đăng nhập và không thể thay đổi.</p>
              </div>

              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên người dùng (Username)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên đăng nhập" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Full Name */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ và tên</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập họ và tên đầy đủ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;

