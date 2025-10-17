"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Edit, Sparkles, Camera } from "lucide-react"
import type { UserProfile } from "@iService"

interface ProfileHeaderProps {
  userProfile: UserProfile;
  onEditClick?: () => void;
  onAvatarEditClick?: () => void;
}

export function ProfileHeader({ userProfile, onEditClick, onAvatarEditClick }: ProfileHeaderProps) {
  return (
    <div className="relative backdrop-blur-xl bg-gradient-to-r from-purple-600/80 via-indigo-600/80 to-purple-700/80 text-white border-b border-white/10">
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-2 h-2 bg-white/30 rounded-full top-10 left-[10%] animate-float" />
        <div className="absolute w-3 h-3 bg-white/20 rounded-full top-20 left-[30%] animate-float animation-delay-2000" />
        <div className="absolute w-2 h-2 bg-white/30 rounded-full top-16 right-[20%] animate-float animation-delay-4000" />
      </div>

      <div className="container mx-auto px-4 py-10 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              <Avatar className="w-28 h-28 bg-gradient-to-br from-purple-400/50 to-pink-400/50 border-4 border-white/20 relative z-10 transition-transform duration-300 group-hover:scale-105">
                <AvatarImage
                  src={userProfile.avatarUrl}
                  alt={userProfile.email}
                />
                <AvatarFallback className="text-4xl font-bold text-white bg-transparent">
                  {userProfile.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Edit Avatar Button - thay thế nút Sparkles */}
              <button
                onClick={onAvatarEditClick}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-30"
                title="Chỉnh sửa avatar"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* User Info */}
            <div className="space-y-3 text-center md:text-left">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                {userProfile.displayName || userProfile.fullName}
              </h1>
              <h2 className="text-2xl font-semibold text-white/90">
                {userProfile.fullName}
              </h2>
              <p className="text-purple-100 text-lg">{userProfile.email}</p>
              {userProfile.bio && (
                <p className="text-purple-100 text-base max-w-md">{userProfile.bio}</p>
              )}

              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                <Badge className="backdrop-blur-md bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 px-3 py-1">
                  {userProfile.role.toUpperCase()}
                </Badge>
                <Badge className="backdrop-blur-md bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-white border border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 flex items-center gap-1 px-3 py-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {userProfile.reputationScore}/5
                </Badge>
                <Badge className="backdrop-blur-md bg-gradient-to-r from-blue-400/20 to-cyan-400/20 text-white border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 px-3 py-1">
                  {userProfile.points} điểm
                </Badge>
              </div>
            </div>
          </div>

          <Button 
            onClick={onEditClick}
            className="backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-white/20 px-6"
          >
            <Edit className="w-4 h-4" />
            Chỉnh sửa
          </Button>
        </div>
      </div>
    </div>
  )
}
