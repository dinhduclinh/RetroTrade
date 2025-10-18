import { createSlice, PayloadAction } from '@reduxjs/toolkit';


interface LoginPayload {
    accessToken: string;
    refreshToken: string;
}

const initialState = {
    accessToken: "",
    refreshToken: "",
    isDarkMode: false,
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
        toggleDarkMode: (state) => {
            state.isDarkMode = !state.isDarkMode;
        },
        setDarkMode: (state, action: PayloadAction<boolean>) => {
            state.isDarkMode = action.payload;
        },
       
    },
});

export const { login, logout, toggleDarkMode, setDarkMode } = authSlice.actions;

export default authSlice.reducer;
