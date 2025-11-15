// This file helps TypeScript understand the module structure
declare module '@/store/hooks' {
  import { TypedUseSelectorHook } from 'react-redux';
  import { RootState, AppDispatch } from './redux_store';
  
  export const useAppDispatch: () => AppDispatch;
  export const useAppSelector: TypedUseSelectorHook<RootState>;
}

declare module '@/store/redux_store' {
  import { Store } from 'redux';
  import { Persistor } from 'redux-persist';
  
  export const store: Store;
  export const persistor: Persistor;
  export type RootState = ReturnType<typeof store.getState>;
  export type AppDispatch = typeof store.dispatch;
}
