import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/common/card';

import { BambooBackgroundSelector } from './BambooBackgroundSelector';
import { BambooControlPanel } from './BambooControlPanel';
import { BambooTreeDisplay } from './BambooTreeDisplay';
import { useBambooGame } from './useBambooGame';

type BambooGameCardProps = {
  compact?: boolean;
};

export function BambooGameCard({ compact = false }: BambooGameCardProps) {
  const {
    loading,
    requiresAuth,
    error,
    tree,
    background,
    bgUrl,
    notice,
    pending,
    onWater,
    onFertilize,
    onChangeBackground,
    refresh,
    treeUrl,
    handleImageError,
    handleImageLoad,
    displayStage,
  } = useBambooGame();

  if (requiresAuth) {
    return (
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-3 text-slate-600">
            <p>Bạn cần đăng nhập để chăm sóc cây tre và nhận RT Points.</p>
            <Link
              href="/auth/login"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border border-emerald-200 shadow-sm">
        <CardContent className="p-10 text-center text-slate-600">Loading bamboo tree...</CardContent>
      </Card>
    );
  }

  if (error || !tree) {
    return (
      <Card className="border border-red-200 shadow-sm">
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-red-600 font-medium">{error || 'Không tải được dữ liệu cây tre.'}</p>
          <button
            onClick={refresh}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Thử lại
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-emerald-200 shadow-sm bg-white/80">
      <div
        className="relative"
        style={{
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: compact ? 'cover' : 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: compact ? 'center' : 'bottom left',
        }}
      >
        <div className="relative z-10 bg-gradient-to-br from-white/35 via-white/25 to-white/15">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-xl font-semibold text-slate-800">Bamboo Life</CardTitle>
            <BambooBackgroundSelector value={background} onChange={onChangeBackground} disabled={pending} />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              <div className="flex h-full items-end justify-start">
                <BambooTreeDisplay
                  className="-ml-10 sm:-ml-14 md:-ml-16 lg:-ml-20"
                  treeUrl={treeUrl}
                  displayStage={displayStage}
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                />
              </div>
              <BambooControlPanel
                tree={tree}
                notice={notice}
                pending={pending}
                onWater={onWater}
                onFertilize={onFertilize}
              />
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

