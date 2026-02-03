import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUser } from '../store/userSlice';

export const useAuth = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userDataString = await AsyncStorage.getItem('user');
        
        if (token && userDataString) {
          const userData = JSON.parse(userDataString);
          dispatch(setUser({
            user: userData,
            token: token,
          }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [dispatch]);
};


