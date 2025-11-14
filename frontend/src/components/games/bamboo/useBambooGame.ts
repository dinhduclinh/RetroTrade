import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '@/store/redux_store';

import { BACKGROUND_MAP, BackgroundType, candidateTreeUrls } from './constants';

export type TreeState = {
  stage: number;
  growth: number;
  lastCareAt: string | null;
  createdAt: string | null;
  lastWaterAt: string | null;
  lastFertilizeAt: string | null;
};

type StateResponse = {
  success: boolean;
  data?: {
    user: { email: string; points: number; background: BackgroundType };
    tree: TreeState;
  };
  message?: string;
};

type ActionResponse = {
  success: boolean;
  data?: TreeState;
  message?: string;
  retryAfterMs?: number;
  reward?: {
    points: number;
    newBalance: number;
    stage: number;
  };
};

type UseBambooGameResult = {
  loading: boolean;
  requiresAuth: boolean;
  error: string | null;
  tree: TreeState | null;
  background: BackgroundType;
  bgUrl: string;
  notice: string | null;
  pending: boolean;
  onWater: () => Promise<void> | void;
  onFertilize: () => Promise<void> | void;
  onReset: () => Promise<void> | void;
  onChangeBackground: (bg: BackgroundType) => Promise<void>;
  refresh: () => Promise<void>;
  treeUrl: string;
  handleImageError: () => void;
  handleImageLoad: () => void;
  displayStage: number;
  isResetDialogOpen: boolean;
  setIsResetDialogOpen: (open: boolean) => void;
  handleConfirmReset: () => Promise<void>;
};

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function useBambooGame(): UseBambooGameResult {
  const { accessToken } = useSelector((s: RootState) => s.auth);

  const apiBase =
    (process.env.PUBLIC_API_URL as string) ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:9999/api/v1';

  const resilientFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const primaryUrl = `${apiBase}${path}`;
      try {
        return await fetch(primaryUrl, init);
      } catch {
        try {
          return await fetch(`/api/v1${path}`, init);
        } catch (secondaryError) {
          if (secondaryError instanceof Error) throw secondaryError;
          throw new Error('Network error');
        }
      }
    },
    [apiBase]
  );

  const [loading, setLoading] = useState(true);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [tree, setTree] = useState<TreeState | null>(null);
  const [background, setBackground] = useState<BackgroundType>('village');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [displayStage, setDisplayStage] = useState(0);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const authHeaders = useCallback(() => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return headers;
  }, [accessToken]);

  const parseJsonSafe = useCallback(async (res: Response) => {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return await res.json();
    }
    const text = await res.text();
    throw new Error(text?.slice(0, 200) || 'Non-JSON response');
  }, []);

  const fetchState = useCallback(async () => {
    if (!accessToken) {
      setRequiresAuth(true);
      setTree(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await resilientFetch(`/tree/state`, {
        method: 'GET',
        headers: authHeaders(),
      });
      const data = (await parseJsonSafe(res)) as StateResponse;
      if (!data.success || !data.data) {
        setError(data.message || 'Không thể tải trạng thái');
        setTree(null);
        return;
      }
      setBackground(data.data.user.background);
      setTree(data.data.tree);
      setRequiresAuth(false);
    } catch (err) {
      setError(toErrorMessage(err, 'Không thể tải dữ liệu'));
      setTree(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, authHeaders, parseJsonSafe, resilientFetch]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    setDisplayStage(Math.max(0, Math.min(5, tree?.stage ?? 0)));
    setCandidateIdx(0);
  }, [tree?.stage]);

  const treeCandidates = useMemo(() => candidateTreeUrls(displayStage), [displayStage]);
  const treeUrl = treeCandidates[candidateIdx] ?? treeCandidates[0];

  const performAction = useCallback(
    async (path: 'water' | 'fertilize') => {
      if (pending || !accessToken) return;

      setPending(true);
      setNotice(null);
      try {
        const res = await resilientFetch(`/tree/${path}`, {
          method: 'POST',
          headers: authHeaders(),
        });
        const data = (await parseJsonSafe(res)) as ActionResponse;
        if (!data.success) {
          if (data.retryAfterMs) {
            const minutes = Math.ceil(data.retryAfterMs / 60000);
            setNotice(`${data.message || 'Thao tác bị hạn chế. Thử lại sau'} (${minutes} phút)`);
          } else {
            setNotice(data.message || 'Thao tác thất bại');
          }
          return;
        }
        if (data.data) setTree(data.data);
        if (data.reward) {
          setNotice(`🎉 Chúc mừng! Bạn đã đạt cấp độ ${data.reward.stage} và nhận được ${data.reward.points} RT Points!`);
        }
      } catch (err) {
        const message = toErrorMessage(err, 'Thao tác thất bại');
        const hint = message.startsWith('<!DOCTYPE') || message.includes('<html')
          ? ' (Gợi ý: Kiểm tra NEXT_PUBLIC_API_URL hoặc cấu hình proxy /api/v1)'
          : '';
        setNotice(message + hint);
      } finally {
        setPending(false);
      }
    },
    [accessToken, authHeaders, parseJsonSafe, pending, resilientFetch]
  );

  const onWater = useCallback(() => performAction('water'), [performAction]);
  const onFertilize = useCallback(() => performAction('fertilize'), [performAction]);

  const onReset = useCallback(() => {
    if (pending || !accessToken) return;
    setIsResetDialogOpen(true);
  }, [pending, accessToken]);

  const handleConfirmReset = useCallback(async () => {
    if (!accessToken) return;

    setPending(true);
    setNotice(null);
    setIsResetDialogOpen(false);
    try {
      const res = await resilientFetch(`/tree/reset`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = (await parseJsonSafe(res)) as { success: boolean; message?: string; data?: TreeState };
      if (!data.success) {
        setNotice(data.message || 'Trồng lại cây mới thất bại');
        return;
      }
      if (data.data) setTree(data.data);
      setNotice(data.message || 'Đã trồng lại cây mới thành công!');
    } catch (err) {
      setNotice(toErrorMessage(err, 'Trồng lại cây mới thất bại'));
    } finally {
      setPending(false);
    }
  }, [accessToken, authHeaders, parseJsonSafe, resilientFetch]);

  const onChangeBackground = useCallback(
    async (bg: BackgroundType) => {
      if (!accessToken) return;

      try {
        setPending(true);
        setNotice(null);
        const res = await resilientFetch(`/tree/background`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ background: bg }),
        });
        const data = await parseJsonSafe(res);
        if (!data?.success) {
          setNotice(data?.message || 'Cập nhật nền thất bại');
          return;
        }
        setBackground(bg);
      } catch (err) {
        setNotice(toErrorMessage(err, 'Cập nhật nền thất bại'));
      } finally {
        setPending(false);
      }
    },
    [accessToken, authHeaders, parseJsonSafe, resilientFetch]
  );

  const handleImageError = useCallback(() => {
    setCandidateIdx((idx) => {
      if (idx + 1 < treeCandidates.length) return idx + 1;
      if (displayStage > 0) {
        setDisplayStage((stage) => Math.max(0, stage - 1));
        return 0;
      }
      return idx;
    });
  }, [displayStage, treeCandidates.length]);

  const handleImageLoad = useCallback(() => {
    setNotice(null);
  }, []);

  const bgUrl = useMemo(() => BACKGROUND_MAP[background], [background]);

  return {
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
    onReset,
    onChangeBackground,
    refresh: fetchState,
    treeUrl,
    handleImageError,
    handleImageLoad,
    displayStage,
    isResetDialogOpen,
    setIsResetDialogOpen,
    handleConfirmReset,
  };
}

export type { BackgroundType };

