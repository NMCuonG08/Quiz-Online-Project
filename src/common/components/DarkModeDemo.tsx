"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ThemeToggle, SimpleThemeToggle } from "./ui/theme-toggle";
import { useTheme } from "@/common/contexts/ThemeContext";

const DarkModeDemo = () => {
  const { theme, actualTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Dark Mode Demo</h1>
          <p className="text-muted-foreground text-lg">
            Test chế độ sáng tối của website
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="text-sm">
              Theme: {theme}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Actual: {actualTheme}
            </Badge>
          </div>
        </div>

        {/* Theme Toggle Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Nút chuyển đổi Theme</CardTitle>
            <CardDescription>
              Các nút chuyển đổi chế độ sáng tối chuyên nghiệp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Dropdown Menu:</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Simple Toggle:</span>
              <SimpleThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Color Palette Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Bảng màu Theme</CardTitle>
            <CardDescription>
              Các màu sắc được sử dụng trong theme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-16 bg-background border border-border rounded-lg"></div>
                <p className="text-xs text-muted-foreground">Background</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-foreground rounded-lg"></div>
                <p className="text-xs text-muted-foreground">Foreground</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-primary rounded-lg"></div>
                <p className="text-xs text-muted-foreground">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-secondary rounded-lg"></div>
                <p className="text-xs text-muted-foreground">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-muted rounded-lg"></div>
                <p className="text-xs text-muted-foreground">Muted</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-accent rounded-lg"></div>
                <p className="text-xs text-muted-foreground">Accent</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-card border border-border rounded-lg"></div>
                <p className="text-xs text-muted-foreground">Card</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-destructive rounded-lg"></div>
                <p className="text-xs text-muted-foreground">Destructive</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Component Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Text Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <h2 className="text-3xl font-semibold">Heading 2</h2>
            <h3 className="text-2xl font-medium">Heading 3</h3>
            <p className="text-base">
              This is a paragraph with normal text. It should be readable in
              both light and dark modes.
            </p>
            <p className="text-sm text-muted-foreground">
              This is muted text that should have lower contrast.
            </p>
            <blockquote className="border-l-4 border-primary pl-4 italic">
              &quot;This is a blockquote that should look good in both
              themes.&quot;
            </blockquote>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DarkModeDemo;
