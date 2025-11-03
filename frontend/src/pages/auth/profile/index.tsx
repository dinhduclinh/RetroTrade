import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/redux_store';
import { getUserProfile, changePassword } from '@/services/auth/user.api';
import { validatePassword } from '@/lib/validation-password';
import { toast } from 'sonner';
import type { UserProfile, ProfileApiResponse } from '@iService';


// import { AccountStatusCard } from '@/components/ui/auth/account-status-card';
// import { WalletCard } from '@/components/ui/wallet-card';
// import { StatisticsCard } from '@/components/ui/auth/profile/statistics-card';
// import { DetailedInfoCard, DetailedInfoCardHandle } from '@/components/ui/auth/profile/detailed-info-card';
// import { QuickActionsCard } from '@/components/ui/auth/profile/quick-actions-card';
import { ProfileSidebar } from '@/components/ui/auth/profile/profile-sidebar';
import { ProfileHeader as UserProfileHeader } from '@/components/ui/auth/profile/user-profile';
import { ChangePasswordModal } from '@/components/ui/auth/profile/change-password-modal';
import { AvatarUploadModal } from '@/components/ui/auth/profile/avatar-upload-modal';
import { AddressSelector } from '@/components/ui/auth/address/address-selector';
import { AccountVerification } from '@/components/ui/auth/profile/account-verification';
import { SignatureManagement } from '@/components/ui/auth/signature/signature-management';
import { ownerRequestApi } from '@/services/auth/ownerRequest.api';
import dynamic from 'next/dynamic';

// Render trang Ví & giao dịch inline
const WalletPage = dynamic(() => import('@/pages/wallet'), { ssr: false });
// Render trang Đơn hàng inline
const OrdersPage = dynamic(() => import('@/components/ui/auth/order'), { ssr: false });
const OrderDetailInline = dynamic(() => import('@/components/ui/auth/order/[id]'), { ssr: false });
// Render Mã giảm giá inline
const DiscountsPage = dynamic(() => import('@/components/ui/auth/discounts'), { ssr: false });

export default function ProfilePage() {
  const router = useRouter();
  const { accessToken } = useSelector((state: RootState) => state.auth);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [showEditModal, setShowEditModal] = useState(false);
  // Legacy modal flag kept for compatibility (unused in inline flow)
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

  // const detailRef = React.useRef<DetailedInfoCardHandle | null>(null);
  
  const handleEditClick = () => { };

  // Change password modal is opened via sidebar selection

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

  // Owner request (inline)
  const [showOwnerForm, setShowOwnerForm] = useState(true);
  const [ownerReason, setOwnerReason] = useState('Muốn đăng đồ cho thuê trên hệ thống');
  const [ownerInfo, setOwnerInfo] = useState('');
  const [ownerSubmitting, setOwnerSubmitting] = useState(false);

  const submitOwnerRequest = async () => {
    if (!ownerReason.trim()) {
      toast.error('Vui lòng nhập lý do');
      return;
    }
    setOwnerSubmitting(true);
    try {
      await ownerRequestApi.createOwnerRequest({ reason: ownerReason.trim(), additionalInfo: ownerInfo.trim() || undefined });
      toast.success('Gửi yêu cầu thành công');
      setShowOwnerForm(false);
      setOwnerInfo('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể gửi yêu cầu');
    } finally {
      setOwnerSubmitting(false);
    }
  };

  // const handleProfileUpdate = (updatedProfile: UserProfile) => {
  //   setUserProfile(updatedProfile);
  //   toast.success('Cập nhật thông tin người dùng thành công');
  // };

  // const handleTopUpClick = () => {
  //   toast.info('Tính năng nạp tiền đang được phát triển');
  // };

  // Sidebar layout (Shopee-like) - MUST be before any returns to respect hook rules
  type MenuKey = 'orders' | 'wallet' | 'discounts' | 'messages' | 'settings' | 'security' | 'addresses' | 'ownership' | 'changePassword' | 'signature';
  const [activeMenu, setActiveMenu] = useState<MenuKey>('settings');
  // Verification renders inline; no toggle button

  // Inline change password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({});
  const [showPw, setShowPw] = useState<{ current: boolean; new: boolean; confirm: boolean }>({ current: false, new: false, confirm: false });

  const submitInlineChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof pwErrors = {};
    if (!pwForm.currentPassword.trim()) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    const v = validatePassword(pwForm.newPassword);
    if (!v.isValid) errors.newPassword = v.message;
    if (!pwForm.confirmPassword.trim()) errors.confirmPassword = 'Vui lòng nhập lại mật khẩu mới';
    else if (pwForm.newPassword !== pwForm.confirmPassword) errors.confirmPassword = 'Mật khẩu mới không khớp';
    setPwErrors(errors);
    if (Object.keys(errors).length) return;
    setIsChangingPassword(true);
    try {
      const res = await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      if (res.code === 200) {
        toast.success(res.message || 'Đổi mật khẩu thành công');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPwErrors({});
      } else {
        toast.error(res.message || 'Đổi mật khẩu thất bại');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi đổi mật khẩu');
    } finally {
      setIsChangingPassword(false);
    }
  };

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
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar */}
            <aside className="lg:col-span-3">
              <ProfileSidebar
                active={activeMenu}
                onChange={(k) => setActiveMenu(k)}
                user={{ fullName: normalizedUserProfile.fullName, email: normalizedUserProfile.email, avatarUrl: normalizedUserProfile.avatarUrl }}
              />
            </aside>

            {/* Content */}
            <section className="lg:col-span-9">
              {/* Overview removed as per request */}

              {activeMenu === 'orders' && (
                <div className="rounded-xl overflow-hidden">
                  {router.query.orderId ? (
                    <OrderDetailInline id={String(router.query.orderId)} />
                  ) : (
                    <OrdersPage
                      onOpenDetail={(id: string) => {
                        const { pathname, query } = router;
                        router.replace({ pathname, query: { ...query, orderId: id } }, undefined, { shallow: true });
                      }}
                    />
                  )}
                </div>
              )}

              {activeMenu === 'wallet' && (
                <div className="rounded-xl overflow-hidden">
                  <WalletPage />
                </div>
              )}

              {activeMenu === 'discounts' && (
                <div className="rounded-xl overflow-hidden">
                  <DiscountsPage />
                </div>
              )}

              {activeMenu === 'messages' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Tin nhắn</h2>
                  <p className="text-gray-600 mb-4">Trao đổi với người dùng khác.</p>
                  <button onClick={() => router.push('/auth/messages')}
                    className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm">Mở hộp thoại</button>
                </div>
              )}

              {activeMenu === 'settings' && (
                <div className="rounded-xl overflow-hidden">
                  <UserProfileHeader
          userProfile={normalizedUserProfile} 
          onEditClick={handleEditClick}
          onAvatarEditClick={handleAvatarEditClick}
        />
                </div>
              )}

              {activeMenu === 'security' && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 pt-6 scroll-mt-24">
                    <div className="mb-4 flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">Xác minh tài khoản</h3>
                    </div>
                    <AccountVerification />
                  </div>
              )}

              {activeMenu === 'changePassword' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">Đổi mật khẩu</h2>
                  <form onSubmit={submitInlineChangePassword} className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                      <div className="relative">
                        <input
                          type={showPw.current ? 'text' : 'password'}
                          value={pwForm.currentPassword}
                          onChange={(e) => { setPwForm({ ...pwForm, currentPassword: e.target.value }); if (pwErrors.currentPassword) setPwErrors({ ...pwErrors, currentPassword: undefined }); }}
                          className={`w-full px-3 py-2 border rounded-md ${pwErrors.currentPassword ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="Nhập mật khẩu hiện tại"
                        />
                        <button type="button" onClick={() => setShowPw({ ...showPw, current: !showPw.current })} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{showPw.current ? 'Ẩn' : 'Hiện'}</button>
                      </div>
                      {pwErrors.currentPassword && <p className="text-sm text-red-600 mt-1">{pwErrors.currentPassword}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                      <div className="relative">
                        <input
                          type={showPw.new ? 'text' : 'password'}
                          value={pwForm.newPassword}
                          onChange={(e) => { setPwForm({ ...pwForm, newPassword: e.target.value }); if (pwErrors.newPassword) setPwErrors({ ...pwErrors, newPassword: undefined }); }}
                          className={`w-full px-3 py-2 border rounded-md ${pwErrors.newPassword ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="Nhập mật khẩu mới"
                        />
                        <button type="button" onClick={() => setShowPw({ ...showPw, new: !showPw.new })} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{showPw.new ? 'Ẩn' : 'Hiện'}</button>
                      </div>
                      {pwErrors.newPassword && <p className="text-sm text-red-600 mt-1">{pwErrors.newPassword}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nhập lại mật khẩu mới</label>
                      <div className="relative">
                        <input
                          type={showPw.confirm ? 'text' : 'password'}
                          value={pwForm.confirmPassword}
                          onChange={(e) => { setPwForm({ ...pwForm, confirmPassword: e.target.value }); if (pwErrors.confirmPassword) setPwErrors({ ...pwErrors, confirmPassword: undefined }); }}
                          className={`w-full px-3 py-2 border rounded-md ${pwErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="Nhập lại mật khẩu mới"
                        />
                        <button type="button" onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{showPw.confirm ? 'Ẩn' : 'Hiện'}</button>
                      </div>
                      {pwErrors.confirmPassword && <p className="text-sm text-red-600 mt-1">{pwErrors.confirmPassword}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={isChangingPassword} className="px-4 py-2 rounded-md bg-gray-900 hover:bg-black text-white text-sm disabled:opacity-60">{isChangingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>
                      <button type="button" onClick={() => setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })} className="px-4 py-2 rounded-md border text-sm">Làm mới</button>
                    </div>
                  </form>
                </div>
              )}

              {activeMenu === 'addresses' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Địa chỉ nhận hàng/nhận đồ</h2>
                  <p className="text-gray-600 mb-4">Quản lý địa chỉ nhận hàng/nhận đồ.</p>
                  <AddressSelector />
            </div>
              )}

              {activeMenu === 'ownership' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">Yêu cầu quyền Owner</h2>
                  {userProfile?.role === 'owner' ? (
                    <p className="text-green-700">Bạn đã là Owner. Bạn có thể đăng đồ cho thuê.</p>
                  ) : (
                    <>
                      {showOwnerForm && (
                        <div className="space-y-3 max-w-xl">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do <span className="text-red-500">*</span></label>
                            <input
                              value={ownerReason}
                              onChange={(e) => setOwnerReason(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Vì sao bạn muốn trở thành Owner?"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Thông tin bổ sung</label>
                            <textarea
                              value={ownerInfo}
                              onChange={(e) => setOwnerInfo(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Ví dụ: Kinh nghiệm, mô tả cửa hàng, khu vực..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={submitOwnerRequest}
                              disabled={ownerSubmitting}
                              className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-60"
                            >
                              {ownerSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeMenu === 'signature' && (
                <SignatureManagement
                  isOpen={true}
                  onClose={() => {}}
                  onSuccess={() => toast.success('Cập nhật chữ ký thành công')}
                  inline
                />
              )}
            </section>
          </div>
        </div>
      </div>
      
      {/* Edit Profile Modal removed - inline editing in settings */}

      {/* Change Password Modal */}
      {/* Modal không dùng khi đổi inline; vẫn giữ để tái sử dụng nơi khác */}
      <ChangePasswordModal open={false} onOpenChange={() => {}} />

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
