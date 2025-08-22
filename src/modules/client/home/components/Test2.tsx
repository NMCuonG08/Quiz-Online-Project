"use client";

import React, { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/common/components/ui/alert";

import { Button } from "@/common/components/ui/button";
import { Div } from "@/common/components/ui/div";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/common/components/ui/breadcrumb";
import { Calendar } from "@/common/components/ui/calendar";
import {
  Info,
  AlertTriangle,
  CheckCircle,
  User,
  ChevronRight,
  Home,
  FolderOpen,
  FileText,
  Star,
  Heart,
  ShoppingCart,
} from "lucide-react";

const Test2 = () => {
  const [showAlert, setShowAlert] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        UI Components Demo
      </h1>

      {/* Alert Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">
          Alert Components
        </h2>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Default Alert</AlertTitle>
          <AlertDescription>
            This is a default alert message with an info icon.
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Alert</AlertTitle>
          <AlertDescription>
            This is a destructive alert for error messages.
          </AlertDescription>
        </Alert>

        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success Alert</AlertTitle>
          <AlertDescription>
            This is a custom success alert with green styling.
          </AlertDescription>
        </Alert>

        {showAlert && (
          <Alert className="border-blue-200 bg-blue-50 text-blue-800">
            <Info className="h-4 w-4" />
            <AlertTitle>Dismissible Alert</AlertTitle>
            <AlertDescription>
              This alert can be dismissed. Click the button below to hide it.
            </AlertDescription>
            <div className="col-start-2 justify-self-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAlert(false)}
                className="bg-blue-400 hover:bg-blue-500 text-white"
              >
                Dismiss
              </Button>
            </div>
          </Alert>
        )}
      </section>

      {/* Breadcrumb Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">
          Breadcrumb Components
        </h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">Default Breadcrumb</h3>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/products">Products</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Electronics</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Breadcrumb with Icons</h3>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/documents"
                    className="flex items-center gap-2"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Documents
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Report.pdf
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </section>

      {/* Product Card Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">
          Product Card (Horizontal)
        </h2>

        <Card className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Product Image */}
            <div className="md:w-48 md:h-48 w-full h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center relative">
              <span className="text-white font-bold text-lg">
                Product Image
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30"
              >
                <Heart className="h-4 w-4 text-white" />
              </Button>
            </div>

            {/* Product Info */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <CardTitle className="text-xl mb-1">
                    Premium Wireless Headphones
                  </CardTitle>
                  <CardDescription className="text-base">
                    High-quality wireless headphones with noise cancellation
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">
                    (128 reviews)
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <p className="text-sm text-muted-foreground">
                  Experience crystal clear sound with our premium wireless
                  headphones. Features include active noise cancellation,
                  30-hour battery life, and premium comfort design.
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Color:
                    </span>
                    <span className="font-medium">Black</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Brand:
                    </span>
                    <span className="font-medium">AudioTech</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-green-600">
                    $199.99
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    $249.99
                  </span>
                  <span className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded-full font-medium">
                    Save 20%
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="lg">
                    <Heart className="h-4 w-4 mr-2" />
                    Wishlist
                  </Button>
                  <Button size="lg">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Custom Div Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">
          Custom Div Components
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Div */}

          {/* XL Shadow Div */}
          <Div variant="default" size="xl" rounded="xl">
            <h3 className="font-semibold mb-2">XL Shadow</h3>
            <p className="text-sm text-muted-foreground">
              Extra large shadow with maximum padding and rounded corners.
            </p>
          </Div>
        </div>
      </section>
    </div>
  );
};

export default Test2;
