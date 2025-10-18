import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/redux_store';
import { getUserProfile } from '@/services/auth/user.api';
import { toast } from 'sonner';
import type { UserProfile, ProfileApiResponse } from '@iService';

// Import components
import { ProfileHeader } from '@/components/ui/auth/profile/profile-header';
import { AccountStatusCard } from '@/components/ui/auth/account-status-card';
// import { WalletCard } from '@/components/ui/wallet-card';
import { StatisticsCard } from '@/components/ui/auth/profile/statistics-card';
import { DetailedInfoCard, DetailedInfoCardHandle } from '@/components/ui/auth/profile/detailed-info-card';
import { QuickActionsCard } from '@/components/ui/auth/profile/quick-actions-card';
import { EditProfileModal } from '@/components/ui/auth/edit-profile-modal';
import { ChangePasswordModal } from '@/components/ui/auth/change-password-modal';
import { AvatarUploadModal } from '@/components/ui/auth/avatar-upload-modal';

export default function ProfilePage() {
  const router = useRouter();
  const { accessToken } = useSelector((state: RootState) => state.auth);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!accessToken) {
      router.push('/auth/login');
    }
  }, [accessToken, router]);

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const result: ProfileApiResponse = await getUserProfile();

      if (result.code === 200) {
        setUserProfile((result.user as UserProfile) ?? (result.data as UserProfile) ?? null);
      } else if (result.code === 401) {
        // Token expired or invalid - chỉ logout khi token thực sự hết hạn
        toast.error('Phiên đăng nhập đã hết hạn');
        router.push('/auth/login');
      } else if (result.code === 404) {
        // User not found - không logout, chỉ hiển thị lỗi
        setError(result.message || 'Không tìm thấy thông tin người dùng');
        toast.error(result.message || 'Không tìm thấy thông tin người dùng');
      } else {
        setError(result.message || 'Không thể lấy thông tin người dùng');
        toast.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setError('Không thể kết nối đến server');
        toast.error('Không thể kết nối đến server');
      } else {
        setError(`Lỗi: ${error instanceof Error ? error.message : String(error)}`);
        toast.error('Có lỗi xảy ra khi lấy thông tin');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Auto fetch khi component mount
  useEffect(() => {
    if (accessToken) {
      fetchUserProfile();
    }
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const detailRef = React.useRef<DetailedInfoCardHandle | null>(null);
  
  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleChangePasswordClick = () => {
    setShowChangePasswordModal(true);
  };

  const handleAvatarEditClick = () => {
    setShowAvatarModal(true);
  };

  const handleAvatarUpdated = (newAvatarUrl: string) => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        avatarUrl: newAvatarUrl
      });
    }
  };

  const handleRegisterRentalClick = () => {
    toast.info('Tính năng đăng ký cho thuê đang được phát triển');
    // TODO: Implement rental registration functionality
    // router.push('/products/myproducts/create');
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    toast.success('Cập nhật thông tin người dùng thành công');
  };

  // const handleTopUpClick = () => {
  //   toast.info('Tính năng nạp tiền đang được phát triển');
  // };

  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center text-gray-900">
          <h1 className="text-2xl font-bold mb-4">Chưa đăng nhập</h1>
          <p className="text-gray-600 mb-6">Vui lòng đăng nhập để xem thông tin cá nhân</p>
          <button 
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-900">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-lg">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-900 max-w-md mx-auto px-4">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Có lỗi xảy ra</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchUserProfile}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  const normalizedUserProfile: UserProfile = {
    ...userProfile,
    wallet: userProfile.wallet ?? { currency: 'VND', balance: 0 },
  } as UserProfile;

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />

      <div className="relative z-10">
        <ProfileHeader 
          userProfile={normalizedUserProfile} 
          onEditClick={handleEditClick}
          onAvatarEditClick={handleAvatarEditClick}
        />

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - spans 4 columns */}
            <div className="lg:col-span-4 space-y-6">
              <AccountStatusCard userProfile={normalizedUserProfile} />
              {/* <WalletCard userProfile={userProfile} onTopUpClick={handleTopUpClick} /> */}
              <StatisticsCard userProfile={normalizedUserProfile} />
            </div>

            {/* Center Column - spans 5 columns */}
            <div className="lg:col-span-5">
              <DetailedInfoCard ref={detailRef} userProfile={normalizedUserProfile} />
            </div>

            {/* Right Column - spans 3 columns */}
            <div className="lg:col-span-3">
              <QuickActionsCard 
                onEditProfile={handleEditClick} 
                onChangePassword={handleChangePasswordClick}
                onRegisterRental={handleRegisterRentalClick}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Profile Modal */}
      {userProfile && (
        <EditProfileModal 
          userProfile={normalizedUserProfile} 
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal 
        open={showChangePasswordModal}
        onOpenChange={setShowChangePasswordModal}
      />

      {/* Avatar Upload Modal */}
      {userProfile && (
        <AvatarUploadModal
          userProfile={normalizedUserProfile}
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          onAvatarUpdated={handleAvatarUpdated}
        />
      )}
    </div>
  );
}
