import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { combineReducers } from 'redux';
import authReducer from '@/store/auth/authReducer';
import cartReducer from '@/store/cart/cartReducer';

// Import storage with proper error handling
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';

const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: unknown) {
      return Promise.resolve(value);
    },
    removeItem() {
      return Promise.resolve();
    },
  };
};

const storage = typeof window !== 'undefined' ? createWebStorage('local') : createNoopStorage();

// Cấu hình persist cho auth
const authPersistConfig = {
    key: 'auth',
    storage,
    whitelist: ['accessToken', 'refreshToken'], // Chỉ persist token
};

// Cấu hình persist cho root
const persistConfig = {
    key: 'root',
    storage,
};

// Combine reducers nếu có nhiều slice
const rootReducer = combineReducers({
    auth: persistReducer(authPersistConfig, authReducer),
    cart: cartReducer,
    
    // thêm các slice khác ở đây
});

// Tạo reducer có persist
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Tạo store
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    'persist/PERSIST', 
                    'persist/REHYDRATE',
                    'persist/REGISTER',
                    'persist/FLUSH',
                    'persist/PAUSE',
                    'persist/PURGE'
                ],
            },
        }),
});

// Tạo persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
