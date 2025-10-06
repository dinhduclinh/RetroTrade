import { createSlice, PayloadAction } from '@reduxjs/toolkit';


interface LoginPayload {
    accessToken: string;
    refreshToken: string;
}

const initialState = {
    accessToken: "",
    refreshToken: "",
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login: (state, action: PayloadAction<LoginPayload>) => {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
        },
        logout: (state) => {
            state.accessToken = "";
            state.refreshToken = "";
        },
       
    },
});

export const { login, logout } = authSlice.actions;

export default authSlice.reducer;
