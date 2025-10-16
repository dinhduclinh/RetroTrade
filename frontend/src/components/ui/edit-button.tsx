"use client"

import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"

interface EditButtonProps {
  onClick: () => void;
  className?: string;
}

export function EditButton({ onClick, className }: EditButtonProps) {
  return (
    <Button 
      onClick={onClick}
      className={`backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-white/20 px-6 ${className || ''}`}
    >
      <Edit className="w-4 h-4" />
      Chỉnh sửa
    </Button>
  );
}
