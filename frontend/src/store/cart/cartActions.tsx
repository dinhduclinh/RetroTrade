import { AppDispatch } from '../redux_store';
import {
  setCartItems,
  addItemToCart,
  updateCartItemOptimistic,
  setCartCount,
  setLoading,
  setError
} from './cartReducer';
import { 
  getCartItems, 
  addToCart, 
  updateCartItem as updateCartItemAPI, 
  removeFromCart, 
  clearCart as clearCartAPI, 
  getCartItemCount,
  AddToCartRequest,
  UpdateCartItemRequest
} from '@/services/auth/cartItem.api';

// Cart Actions that handle API calls and dispatch to reducer
export const fetchCartItems = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await getCartItems();
    if (response.code === 200 && response.data) {
      dispatch(setCartItems(response.data));
    } else {
      const errorMessage = response.message || 'Failed to fetch cart items';
      dispatch(setError(errorMessage));
      throw new Error(errorMessage);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cart items';
    dispatch(setError(errorMessage));
    throw error;
  }
};

export const addItemToCartAction = (payload: AddToCartRequest) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await addToCart(payload);
    
    // Check for successful response (200 or 201)
    if ((response.code === 200 || response.code === 201) && response.data) {
      dispatch(addItemToCart(response.data));
      return { success: true, data: response.data };
    } else {
      const errorMessage = response.message || 'Failed to add item to cart';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add item to cart';
    dispatch(setError(errorMessage));
    return { success: false, error: errorMessage };
  }
};

export const updateCartItemAction = (cartItemId: string, payload: UpdateCartItemRequest) => async (dispatch: AppDispatch) => {
  try {
    // Optimistic update for better UX
    dispatch(updateCartItemOptimistic({ 
      cartItemId, 
      updates: payload 
    }));
    
    dispatch(setLoading(true));
    const response = await updateCartItemAPI(cartItemId, payload);
    
    if (response.code === 200) {
      // Refresh cart items to ensure data consistency
      await dispatch(fetchCartItems());
    } else {
      // Revert optimistic update on error
      await dispatch(fetchCartItems());
      const errorMessage = response.message || 'Failed to update cart item';
      dispatch(setError(errorMessage));
      throw new Error(errorMessage);
    }
  } catch (error: unknown) {
    // Revert optimistic update on error
    await dispatch(fetchCartItems());
    const errorMessage = error instanceof Error ? error.message : 'Failed to update cart item';
    dispatch(setError(errorMessage));
    throw error;
  }
};

export const removeItemFromCartAction = (cartItemId: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await removeFromCart(cartItemId);
    if (response.code === 200) {
      // Always refresh cart items after removal to ensure data consistency
      await dispatch(fetchCartItems());
    } else {
      const errorMessage = response.message || 'Failed to remove item from cart';
      dispatch(setError(errorMessage));
      throw new Error(errorMessage);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove item from cart';
    dispatch(setError(errorMessage));
    throw error;
  }
};

export const clearCartAction = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await clearCartAPI();
    if (response.code === 200) {
      // Always refresh cart items after clearing to ensure data consistency
      await dispatch(fetchCartItems());
    } else {
      const errorMessage = response.message || 'Failed to clear cart';
      dispatch(setError(errorMessage));
      throw new Error(errorMessage);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to clear cart';
    dispatch(setError(errorMessage));
    throw error;
  }
};

export const fetchCartItemCount = () => async (dispatch: AppDispatch) => {
  try {
    const response = await getCartItemCount();
    if (response.code === 200 && response.data) {
      dispatch(setCartCount(response.data.count));
    } else {
      dispatch(setError(response.message || 'Failed to fetch cart count'));
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cart count';
    dispatch(setError(errorMessage));
  }
};
