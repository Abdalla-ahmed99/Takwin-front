import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLanguage } from '../store/languageSlice';

export const useLanguageInit = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const lang = await AsyncStorage.getItem('language');
        if (lang) dispatch(setLanguage(lang));
      } catch {}
    };
    loadLanguage();
  }, [dispatch]);
};
