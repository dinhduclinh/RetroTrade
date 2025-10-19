import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Cart Item Types (copied from API to avoid circular dependency)
export interface CartItem {
  _id: string;
  itemId: string;
  title: string;
  shortDescription: string;
  basePrice: number;
  depositAmount: number;
  currency: string;
  availableQuantity: number;
  category: {
    _id: string | null;
    CategoryName: string;
  };
  owner: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  condition: string;
  priceUnit: string;
  primaryImage?: string;
  rentalStartDate?: string;
  rentalEndDate?: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

// Cart State Interface
interface CartState {
  items: CartItem[];
  count: number;
  loading: boolean;
  error: string | null;
}

// Initial State
const initialState: CartState = {
  items: [],
  count: 0,
  loading: false,
  error: null,
};

// Cart Slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.count = action.payload.length;
      state.loading = false;
      state.error = null;
    },
    addItemToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItemIndex = state.items.findIndex(item => item.itemId === action.payload.itemId);
      if (existingItemIndex !== -1) {
        // Update existing item
        state.items[existingItemIndex] = action.payload;
      } else {
        // Add new item
        state.items.push(action.payload);
      }
      state.count = state.items.length;
      state.loading = false;
      state.error = null;
    },
    updateCartItem: (state, action: PayloadAction<CartItem>) => {
      const index = state.items.findIndex(item => item._id === action.payload._id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      state.loading = false;
      state.error = null;
    },
    updateCartItemOptimistic: (state, action: PayloadAction<{cartItemId: string, updates: Partial<CartItem>}>) => {
      const index = state.items.findIndex(item => item._id === action.payload.cartItemId);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload.updates };
      }
    },
    removeItemFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item._id !== action.payload);
      state.count = state.items.length;
      state.loading = false;
      state.error = null;
    },
    clearCart: (state) => {
      state.items = [];
      state.count = 0;
      state.loading = false;
      state.error = null;
    },
    setCartCount: (state, action: PayloadAction<number>) => {
      state.count = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { 
  setCartItems, 
  addItemToCart, 
  updateCartItem, 
  updateCartItemOptimistic,
  removeItemFromCart, 
  clearCart, 
  setCartCount, 
  setLoading, 
  setError 
} = cartSlice.actions;
export default cartSlice.reducer;
