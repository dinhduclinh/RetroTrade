import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PresenceState {
  onlineByUserId: Record<string, boolean>;
}

const initialState: PresenceState = {
  onlineByUserId: {},
};

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    setOnline(state, action: PayloadAction<{ userId: string }>) {
      state.onlineByUserId[action.payload.userId] = true;
    },
    setOffline(state, action: PayloadAction<{ userId: string }>) {
      state.onlineByUserId[action.payload.userId] = false;
    },
    setOnlineUsers(state, action: PayloadAction<string[]>) {
      // Reset and mark provided users online
      const next: Record<string, boolean> = {};
      for (const id of action.payload) next[id] = true;
      state.onlineByUserId = next;
    },
  },
});

export const { setOnline, setOffline, setOnlineUsers } = presenceSlice.actions;
export default presenceSlice.reducer;


