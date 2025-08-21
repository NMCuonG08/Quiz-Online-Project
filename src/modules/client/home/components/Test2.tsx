"use client";

import React, { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/common/components/ui/alert";
import { AspectRatio } from "@/common/components/ui/aspect-ratio";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/common/components/ui/avatar";
import { Badge } from "@/common/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/common/components/ui/alert-dialog";
import { Button } from "@/common/components/ui/button";
import {
  Info,
  AlertTriangle,
  CheckCircle,
  User,
  Mail,
  Phone,
} from "lucide-react";

const Test2 = () => {
  const [showAlert, setShowAlert] = useState(true);

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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAlert(false)}
              className="ml-auto"
            >
              Dismiss
            </Button>
          </Alert>
        )}
      </section>

      {/* Aspect Ratio Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">
          Aspect Ratio Components
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium">16:9 Ratio</h3>
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg">
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold">
                16:9
              </div>
            </AspectRatio>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">4:3 Ratio</h3>
            <AspectRatio ratio={4 / 3} className="bg-muted rounded-lg">
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-400 to-blue-500 text-white font-bold">
                4:3
              </div>
            </AspectRatio>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">1:1 Ratio (Square)</h3>
            <AspectRatio ratio={1} className="bg-muted rounded-lg">
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold">
                1:1
              </div>
            </AspectRatio>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Image with Aspect Ratio</h3>
          <AspectRatio
            ratio={16 / 9}
            className="bg-muted rounded-lg overflow-hidden"
          >
            <img
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop"
              alt="Mountain landscape"
              className="object-cover w-full h-full"
            />
          </AspectRatio>
        </div>
      </section>

      {/* Avatar Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">
          Avatar Components
        </h2>

        <div className="flex flex-wrap gap-6 items-center">
          <div className="space-y-2 text-center">
            <Avatar className="h-16 w-16">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">Large Avatar</p>
          </div>

          <div className="space-y-2 text-center">
            <Avatar className="h-12 w-12">
              <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face" />
              <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">Medium Avatar</p>
          </div>

          <div className="space-y-2 text-center">
            <Avatar className="h-8 w-8">
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">
              Small Avatar (Fallback)
            </p>
          </div>

          <div className="space-y-2 text-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white">
                MK
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">Custom Fallback</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Avatar Group</h3>
          <div className="flex -space-x-2">
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face" />
              <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" />
              <AvatarFallback>MK</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarFallback>+3</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </section>

      {/* Badge Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">
          Badge Components
        </h2>

        <div className="flex flex-wrap gap-4 items-center">
          <Badge>Default Badge</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Custom Green
          </Badge>
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
            Custom Purple
          </Badge>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Badge with Icons</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <Badge className="flex items-center gap-1">
              <User className="h-3 w-3" />
              User
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Email
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              Phone
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Status Badges</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Active
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              Pending
            </Badge>
            <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              Inactive
            </Badge>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">
          Interactive Demo
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 p-6 border rounded-lg bg-muted/30">
            <h3 className="font-medium">User Profile Card</h3>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div>
                  <h4 className="font-semibold">John Doe</h4>
                  <p className="text-sm text-muted-foreground">
                    Software Developer
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">Next.js</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 border rounded-lg bg-muted/30">
            <h3 className="font-medium">Project Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Frontend Development</span>
                <Badge className="bg-green-100 text-green-800">Completed</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Backend API</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  In Progress
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Testing</span>
                <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Test2;
