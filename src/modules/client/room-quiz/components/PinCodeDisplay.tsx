"use client";

import React, { useState } from "react";
import { Copy, Eye, EyeOff, Check } from "lucide-react";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import { Button } from "@/common/components/ui/button";

interface PinCodeDisplayProps {
  pinCode: string;
  className?: string;
}

export function PinCodeDisplay({
  pinCode,
  className = "",
}: PinCodeDisplayProps) {
  const [isHidden, setIsHidden] = useState(false);
  const { copied, copyToClipboard } = useCopyToClipboard();

  const handleCopy = async () => {
    await copyToClipboard(pinCode);
  };

  const handleToggleVisibility = () => {
    setIsHidden(!isHidden);
  };

  const displayPinCode = isHidden ? "••• •••" : pinCode;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-left">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">PIN code:</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleVisibility}
            className="flex items-center gap-1 text-xs px-2 py-1"
          >
            {isHidden ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
            {isHidden ? "Show" : "Hide"}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-4xl font-bold text-primary tracking-wider">
            {displayPinCode}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs px-2 py-1"
          >
            {copied ? (
              <Check className="w-3 h-3 text-primary" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>
    </div>
  );
}
