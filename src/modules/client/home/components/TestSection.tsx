"use client";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Span,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/common/components/ui";
import { Image, Trash2, AlertTriangle, Info } from "lucide-react";
import React, { useState } from "react";

const TestSection = () => {
  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <Button className="bg-yellow-500">Chao</Button>
      </div>

      {/* Alert Dialog Examples */}
      <div className="space-y-6 mb-8">
        <h2 className="text-2xl font-bold">Alert Dialog Examples</h2>

        {/* Basic Alert Dialog */}
        <div className="flex items-center gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Basic Alert</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Basic Alert</AlertDialogTitle>
                <AlertDialogDescription>
                  This is a basic alert dialog with default styling and
                  behavior.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Destructive Alert Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Item
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Info Alert Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary" className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Information
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Important Information</AlertDialogTitle>
                <AlertDialogDescription>
                  This is an informational alert dialog. You can use this to
                  show important information to users without requiring
                  immediate action.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>Got it!</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Custom Styled Alert Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Custom Style
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-2 border-purple-600 shadow-[4px_4px_0px_0px_rgba(147,51,234,1)]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-purple-600">
                  Custom Styled Dialog
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This dialog has custom purple styling to match your design
                  system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-purple-600 text-purple-600 hover:bg-purple-50">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction className="bg-purple-600 hover:bg-purple-700">
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Dropdown Menu */}
      <div className="flex justify-center items-center h-64">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Span className="bg-white w-64 border-2 border-black rounded-md p-3 flex items-center gap-2 hover:bg-gray-50">
              <Image className="w-5 h-5" />
              Open Menu
            </Span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuItem onClick={() => alert("Option 1 selected")}>
              Option 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => alert("Option 2 selected")}>
              Option 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => alert("Option 3 selected")}>
              Option 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TestSection;
