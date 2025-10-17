/**
 * Pagination utilities for handling pagination logic
 */

export interface PaginationConfig {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
}

/**
 * Calculate pagination metadata from config
 */
export function calculatePaginationMeta(config: PaginationConfig): PaginationMeta {
  const { page, limit, totalItems, totalPages } = config;
  
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit - 1, totalItems - 1);
  
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    startIndex,
    endIndex
  };
}

/**
 * Generate pagination state for React components
 */
export function createPaginationState(config: PaginationConfig): PaginationState {
  const meta = calculatePaginationMeta(config);
  
  return {
    currentPage: meta.page,
    totalPages: meta.totalPages,
    totalItems: meta.totalItems,
    itemsPerPage: meta.limit,
    hasNextPage: meta.hasNextPage,
    hasPrevPage: meta.hasPrevPage,
    startIndex: meta.startIndex,
    endIndex: meta.endIndex
  };
}

/**
 * Generate page numbers for pagination UI
 */
export function generatePageNumbers(currentPage: number, totalPages: number, maxVisible: number = 5): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  const end = Math.min(totalPages, start + maxVisible - 1);

  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Calculate offset for API calls
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(page: number, limit: number, maxLimit: number = 100): {
  isValid: boolean;
  errors: string[];
  correctedPage: number;
  correctedLimit: number;
} {
  const errors: string[] = [];
  let correctedPage = page;
  let correctedLimit = limit;

  // Validate page
  if (!Number.isInteger(page) || page < 1) {
    errors.push('Page must be a positive integer');
    correctedPage = 1;
  }

  // Validate limit
  if (!Number.isInteger(limit) || limit < 1) {
    errors.push('Limit must be a positive integer');
    correctedLimit = 10;
  } else if (limit > maxLimit) {
    errors.push(`Limit cannot exceed ${maxLimit}`);
    correctedLimit = maxLimit;
  }

  return {
    isValid: errors.length === 0,
    errors,
    correctedPage,
    correctedLimit
  };
}

/**
 * Format pagination info for display
 */
export function formatPaginationInfo(meta: PaginationMeta): string {
  const { startIndex, endIndex, totalItems, page, totalPages } = meta;
  
  if (totalItems === 0) {
    return 'Không có dữ liệu';
  }
  
  const start = startIndex + 1;
  const end = endIndex + 1;
  
  return `Hiển thị ${start}-${end} trong tổng số ${totalItems.toLocaleString()} mục (Trang ${page}/${totalPages})`;
}

/**
 * Get pagination URL parameters
 */
export function getPaginationParams(page: number, limit: number): URLSearchParams {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', limit.toString());
  return params;
}

/**
 * Parse pagination parameters from URL
 */
export function parsePaginationParams(searchParams: URLSearchParams, defaultPage: number = 1, defaultLimit: number = 10): {
  page: number;
  limit: number;
} {
  const page = parseInt(searchParams.get('page') || defaultPage.toString(), 10);
  const limit = parseInt(searchParams.get('limit') || defaultLimit.toString(), 10);
  
  const validation = validatePaginationParams(page, limit);
  
  return {
    page: validation.correctedPage,
    limit: validation.correctedLimit
  };
}

/**
 * Create pagination config from API response
 */
export function createPaginationConfig(
  page: number,
  limit: number,
  totalItems: number
): PaginationConfig {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  
  return {
    page: Math.min(page, totalPages),
    limit,
    totalItems,
    totalPages
  };
}

/**
 * Hook-like function for pagination state management
 */
export function usePaginationState(initialPage: number = 1, initialLimit: number = 10) {
  let currentPage = initialPage;
  let currentLimit = initialLimit;
  let totalItems = 0;
  let totalPages = 0;

  const setPage = (page: number) => {
    currentPage = Math.max(1, Math.min(page, totalPages));
  };

  const setLimit = (limit: number) => {
    currentLimit = Math.max(1, Math.min(limit, 100));
    // Recalculate total pages when limit changes
    totalPages = Math.max(1, Math.ceil(totalItems / currentLimit));
    // Adjust current page if it exceeds total pages
    currentPage = Math.min(currentPage, totalPages);
  };

  const setTotalItems = (items: number) => {
    totalItems = items;
    totalPages = Math.max(1, Math.ceil(totalItems / currentLimit));
    // Adjust current page if it exceeds total pages
    currentPage = Math.min(currentPage, totalPages);
  };

  const getState = (): PaginationState => {
    const config = createPaginationConfig(currentPage, currentLimit, totalItems);
    return createPaginationState(config);
  };

  const getMeta = (): PaginationMeta => {
    const config = createPaginationConfig(currentPage, currentLimit, totalItems);
    return calculatePaginationMeta(config);
  };

  return {
    getState,
    getMeta,
    setPage,
    setLimit,
    setTotalItems,
    getCurrentPage: () => currentPage,
    getCurrentLimit: () => currentLimit,
    getTotalItems: () => totalItems,
    getTotalPages: () => totalPages
  };
}
