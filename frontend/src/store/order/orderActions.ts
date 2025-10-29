import { AppDispatch } from "../redux_store";
import {
  createOrder,
  getOrderDetails,
  listOrders,
  cancelOrder,
} from "@/services/auth/order.api";
import {
  setOrders,
  setOrderDetail,
  setLoading,
  setError,
} from "./orderReducer";
import { removeItemFromCartAction } from "../cart/cartActions";

export const createOrderAction =
  (payload: any) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response = await createOrder(payload);

      if (response.code === 201 || response.code === 200) {
        return { success: true, data: response.data };
      }

      dispatch(setError(response.message ?? "Unknown error"));
      return { success: false, error: response.message ?? "Unknown error" };
    } catch (err: any) {
      dispatch(setError(err.message ?? "Unknown error"));
      return { success: false, error: err.message ?? "Unknown error" };
    }
  };
  
  export const fetchOrderList = () => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response = await listOrders();
      dispatch(setOrders(response.data ?? []));
    } catch (err: any) {
      dispatch(setError(err.message ?? "Unknown error"));
    }
  };

export const fetchOrderDetail =
  (orderId: string) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response = await getOrderDetails(orderId);
      dispatch(setOrderDetail(response.data));
    } catch (err: any) {
      dispatch(setError(err.message));
    }
  };

export const cancelOrderAction =
  (orderId: string, reason?: string) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      await cancelOrder(orderId, reason);
      dispatch(fetchOrderList());
    } catch (err: any) {
      dispatch(setError(err.message));
    }
  };
