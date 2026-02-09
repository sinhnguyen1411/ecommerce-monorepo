"use client";

import * as React from "react";

import { DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function AdminDialogContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn("top-6 translate-y-0 max-h-[calc(100vh-3rem)]", className)}
      {...props}
    />
  );
}
