import React from "react"
import { cn } from "@/lib/utils"

interface EmptyProps {
  className?: string
  children: React.ReactNode
}

interface EmptyMediaProps {
  variant?: "icon" | "image"
  className?: string
  children: React.ReactNode
}

interface EmptyHeaderProps {
  children: React.ReactNode
}

interface EmptyTitleProps {
  className?: string
  children: React.ReactNode
}

interface EmptyDescriptionProps {
  className?: string
  children: React.ReactNode
}

interface EmptyContentProps {
  children: React.ReactNode
}

export function Empty({ className, children }: EmptyProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      {children}
    </div>
  )
}

export function EmptyMedia({ variant = "icon", className, children }: EmptyMediaProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full mb-4",
        variant === "icon" ? "w-16 h-16" : "w-24 h-24",
        className
      )}
    >
      {children}
    </div>
  )
}

export function EmptyHeader({ children }: EmptyHeaderProps) {
  return <div className="mb-4">{children}</div>
}

export function EmptyTitle({ className, children }: EmptyTitleProps) {
  return (
    <h3 className={cn("text-lg font-semibold mb-2", className)}>
      {children}
    </h3>
  )
}

export function EmptyDescription({ className, children }: EmptyDescriptionProps) {
  return (
    <p className={cn("text-sm opacity-70 max-w-sm", className)}>
      {children}
    </p>
  )
}

export function EmptyContent({ children }: EmptyContentProps) {
  return <div className="mt-4">{children}</div>
}
