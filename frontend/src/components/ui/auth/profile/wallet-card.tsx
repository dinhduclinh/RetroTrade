"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Wallet, TrendingUp, Plus } from "lucide-react"

interface UserProfile {
  _id: string;
  userGuid: string;
  email: string;
  fullName: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  isEmailConfirmed: boolean;
  isPhoneConfirmed: boolean;
  isIdVerified: boolean;
  reputationScore: number;
  points: number;
  role: string;
  wallet: {
    currency: string;
    balance: number;
  };
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface WalletCardProps {
  userProfile: UserProfile;
  onTopUpClick?: () => void;
}

export function WalletCard({ userProfile, onTopUpClick }: WalletCardProps) {
  return (
    <Card className="bg-white border border-emerald-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-xl group overflow-hidden relative">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-green-500/5 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/30 to-teal-500/30">
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          Ví điện tử
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        <div className="text-center py-6 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <p className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
              {userProfile.wallet.balance.toLocaleString('vi-VN')}
            </p>
          </div>
          <p className="text-gray-600 text-sm">{userProfile.wallet.currency}</p>
        </div>

        <Button 
          onClick={onTopUpClick}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 font-semibold"
        >
          <Plus className="w-4 h-4" />
          Nạp tiền
        </Button>
      </CardContent>
    </Card>
  )
}
