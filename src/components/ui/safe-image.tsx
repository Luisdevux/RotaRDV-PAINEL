// src/components/ui/safe-image.tsx

"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { ImageOff, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackType?: "building" | "generic";
  fallbackIcon?: React.ReactNode;
}

export function SafeImage({
  src,
  alt,
  className,
  fallbackType = "generic",
  fallbackIcon,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    if (fallbackIcon) {
      return <>{fallbackIcon}</>;
    }

    return (
      <div className={cn("flex h-full w-full items-center justify-center bg-muted/60 text-muted-foreground", className)}>
        {fallbackType === "building" ? (
          <Building2 className="h-1/2 w-1/2 text-primary/70" />
        ) : (
          <ImageOff className="h-1/2 w-1/2 opacity-40" />
        )}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      unoptimized
      {...props}
    />
  );
}
