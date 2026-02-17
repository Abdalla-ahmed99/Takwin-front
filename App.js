
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { useAuth } from './src/hooks/useAuth';
import { useLanguageInit } from './src/hooks/useLanguageInit';


import Onboarding from './src/screens/Onboarding';
import Login from './src/screens/Login';
import Register from './src/screens/Register';
import Home from './src/screens/Home';
import AddClassScreen from './src/screens/AddClassScreen'; 
import SettingsScreen from'./src/screens/SettingsScreen'
import ProfileScreen from'./src/screens/ProfileScreen'
import ClassDetailsScreen from './src/screens/ClassDetailsScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import ExamScreen from './src/screens/ExamScreen';
import LanguageScreen from './src/screens/LanguageScreen';
// import ThemeScreen from './src/screens/ThemeScreen';  



const Stack = createStackNavigator();
const linking = {
  prefixes: ['myapp://'],
  config: {
    screens: {
      Home: 'home',
      Payment: 'payment',
      Profile: 'profile',
    },
  },
};
function AppNavigator() {
  // Load user data from AsyncStorage on app start
  useAuth();
  useLanguageInit();

  return (
    <NavigationContainer >
      <Stack.Navigator
        screenOptions={{
          headerShown: false, 
        }}
      >
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="AddClass" component={AddClassScreen} /> 
        <Stack.Screen name="ClassDetails" component={ClassDetailsScreen} />
        <Stack.Screen name="Exam" component={ExamScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} /> 
        <Stack.Screen name="Language" component={LanguageScreen} />
        {/* <Stack.Screen name="ThemeScreen" component={ThemeScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
    


  );
}
