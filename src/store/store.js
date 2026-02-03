import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import languageReducer from './languageSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    language: languageReducer,
  },
});


