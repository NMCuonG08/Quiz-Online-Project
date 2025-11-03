"use client";
import React, { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { Button } from "./button";

interface UploadImageProps {
  value?: string | File | null;
  onChange: (file: File | null) => void;
  placeholder?: string;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export const UploadImage: React.FC<UploadImageProps> = ({
  value,
  onChange,
  placeholder = "Click to upload image",
  accept = "image/*",
  maxSize = 5, // 5MB default
  className = "",
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize preview from value
  React.useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      setSelectedFile(value);
      return () => URL.revokeObjectURL(url);
    } else if (typeof value === 'string' && value) {
      setPreview(value);
      setSelectedFile(null);
    } else {
      setPreview(null);
      setSelectedFile(null);
    }
  }, [value]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setSelectedFile(file);
    setUploading(true);

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return the actual File object instead of URL
      onChange(file);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
      setPreview(value instanceof File ? URL.createObjectURL(value) : (typeof value === 'string' ? value : null));
      setSelectedFile(value instanceof File ? value : null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setSelectedFile(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
          alert(`File size must be less than ${maxSize}MB`);
          return;
        }
        
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
        setSelectedFile(file);
        onChange(file);
      }
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <div className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-sm">Uploading...</div>
              </div>
            )}
          </div>
          
          {/* Show current image status */}
          {typeof value === 'string' && value && !selectedFile && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs px-2 py-1">
              Current image
            </div>
          )}
          
          {/* Control buttons */}
          <div className="absolute -top-2 -right-2 flex gap-1">
            {typeof value === 'string' && value && !selectedFile && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-6 h-6 p-0 rounded-full"
                onClick={handleClick}
                disabled={uploading}
                title="Change image"
              >
                <Upload className="w-3 h-3" />
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="w-6 h-6 p-0 rounded-full"
              onClick={handleRemove}
              disabled={uploading}
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 ${
            isDragging ? 'border-blue-400 bg-blue-50' : ''
          }`}
        >
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">{placeholder}</p>
          <p className="text-xs text-gray-400 mt-1">Max {maxSize}MB</p>
        </div>
      )}
    </div>
  );
};