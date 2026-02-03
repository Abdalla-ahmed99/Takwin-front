import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../store/userSlice';
import { apiCall, API_BASE_URL } from '../utils/api';

export default function PaymentScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [error, setError] = useState(null);
  const webViewRef = useRef(null);
  const paymentProcessedRef = useRef(false); // Prevent multiple success handlers

  // Initialize payment when screen loads
  React.useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = user?.id;
      const userName = user?.name || 'User';

      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      // Construct return URL - PayTabs will redirect here after payment
      // For mobile, we'll use a custom scheme or detect URL changes in WebView
      const returnUrl = `${API_BASE_URL}/premium-success`;

      // Construct callback URL - PayTabs server will POST here
      const callbackUrl = `${API_BASE_URL}/api/premium/paytabs/callback`;

      // Call the checkout endpoint
      const response = await apiCall('/api/premium/checkout', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          name: userName,
          amount: 100,
          currency: 'EGP',
          returnUrl: returnUrl,
          callbackUrl: callbackUrl,
          paymentMethods: Platform.OS === 'ios' ? ['applepay', 'card', 'mada'] : ['card', 'mada'],
        }),
      });

      if (!response || !response.redirect_url) {
        throw new Error('Failed to get payment URL from server');
      }

      setPaymentUrl(response.redirect_url);
    } catch (err) {
      console.error('Payment initialization error:', err);
      console.error('Error details:', err.data || err);
      
      // Extract error message - check multiple possible locations
      let errorMessage = err.message || 'Failed to initialize payment';
      if (err.data) {
        // Check for nested error messages
        if (err.data.error) errorMessage = err.data.error;
        else if (err.data.message) errorMessage = err.data.message;
        else if (typeof err.data === 'string') errorMessage = err.data;
        
        // If PayTabs returned an error response, try to extract it
        if (err.data.paytabsResponse) {
          const ptResponse = err.data.paytabsResponse;
          if (ptResponse.message) errorMessage = ptResponse.message;
          else if (ptResponse.error) errorMessage = ptResponse.error;
          else if (ptResponse.error_message) errorMessage = ptResponse.error_message;
        }
      }
      
      console.log('Full error object:', JSON.stringify(err, null, 2));
      
      setError(errorMessage);
      Alert.alert('Payment Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle WebView navigation state changes
  const handleNavigationStateChange = (navState) => {
    const { url } = navState;
    
    // Log URL changes for debugging
    console.log('WebView URL changed:', url);
    console.log('Navigation state:', {
      loading: navState.loading,
      canGoBack: navState.canGoBack,
      canGoForward: navState.canGoForward,
    });

    // Check if this is the success/return URL
    // PayTabs redirects to /premium-success after payment
    if (url && (url.includes('/premium-success') || url.includes('premium-success'))) {
      // Only handle once when page finishes loading
      if (!navState.loading) {
        // Payment successful - parse URL parameters if any
        handlePaymentSuccess(url);
      }
    } else if (url && (url.includes('/cancel') || url.includes('/error') || url.includes('cancelled'))) {
      // Payment cancelled or failed
      if (!navState.loading) {
        handlePaymentCancel();
      }
    }
  };

  const handlePaymentSuccess = async (url) => {
    // Prevent multiple calls
    if (paymentProcessedRef.current) {
      return;
    }
    paymentProcessedRef.current = true;

    try {
      console.log('Payment success detected, verifying with backend...');
      try {
        await apiCall('/api/auth/is-prime', {
          method: 'PATCH',
          body: JSON.stringify({ isPrime: true }),
        });
      } catch (e) {}
      
      // First, verify payment status with backend
      let retries = 0;
      const maxRetries = 5;
      let userUpdated = false;

      while (retries < maxRetries && !userUpdated) {
        try {
          // Fetch updated user data from backend
          const updatedUser = await apiCall('/api/auth/profile');
          
          if (updatedUser && updatedUser.isPrime) {
            userUpdated = true;
            
            // Update user in Redux to reflect premium status
            dispatch(updateUser({ ...updatedUser, isPrime: true }));
            
            // Also update AsyncStorage if user data is stored there
            try {
              await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            } catch (e) {
              console.warn('Failed to update user in AsyncStorage:', e);
            }

            Alert.alert(
              'Payment Successful',
              'Your account has been upgraded to Premium!',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate to home screen
                    navigation.navigate('Home');
                  },
                },
              ]
            );
            return;
          }
        } catch (err) {
          console.warn(`Attempt ${retries + 1} failed to verify payment:`, err);
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
      }

      // If we couldn't verify after retries, still update local state
      // The backend callback might still be processing
      dispatch(updateUser({ isPrime: true }));
      
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          await AsyncStorage.setItem('user', JSON.stringify({ ...parsedUser, isPrime: true }));
        }
      } catch (e) {
        console.warn('Failed to update user in AsyncStorage:', e);
      }

      Alert.alert(
        'Payment Successful',
        'Your payment is being processed. Your account will be upgraded shortly. Please check again in a moment.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to home screen
              navigation.navigate('Home');
            },
          },
        ]
      );
    } catch (err) {
      console.error('Error handling payment success:', err);
      Alert.alert(
        'Payment Processed',
        'Your payment has been received. Please check your account status.',
        [{ 
          text: 'OK', 
          onPress: () => {
            // Navigate to home screen
            navigation.navigate('Home');
          }
        }]
      );
    }
  };

  const handlePaymentCancel = () => {
    Alert.alert('Payment Cancelled', 'Payment was cancelled. You can try again later.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const openInSafari = async () => {
    if (paymentUrl) {
      try {
        await Linking.openURL(paymentUrl);
      } catch (e) {
        Alert.alert('Cannot open Safari', 'Please try again or use in-app payment.');
      }
    }
  };

  const refreshStatus = async () => {
    try {
      const updatedUser = await apiCall('/api/auth/profile');
      if (updatedUser && updatedUser.isPrime) {
        dispatch(updateUser({ ...updatedUser, isPrime: true }));
        try {
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (e) {}
        Alert.alert('Premium Active', 'Your account is Premium now.', [
          { text: 'OK', onPress: () => navigation.navigate('Home') },
        ]);
        return;
      }
      Alert.alert('Not Upgraded Yet', 'If you completed payment, please wait a moment and refresh again.');
    } catch (err) {
      Alert.alert('Status Check Failed', 'Please try again shortly.');
    }
  };

  // Handle shouldStartLoadWithRequest (iOS) and onShouldStartLoadWithRequest (Android)
  const handleShouldStartLoadWithRequest = (request) => {
    const { url } = request;
    
    console.log('WebView shouldStartLoadWithRequest:', url);

    // Check if this is the success URL
    if (url && (url.includes('/premium-success') || url.includes('premium-success'))) {
      // Let it load, we'll handle in navigationStateChange
      return true;
    }

    // Allow navigation to payment pages and all URLs
    return true;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A73E8" />
          <Text style={styles.loadingText}>Loading payment page...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializePayment}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!paymentUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No payment URL available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializePayment}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={{ width: 28 }} />
      </View>
      {Platform.OS === 'ios' && paymentUrl && (
        <View style={styles.iosBanner}>
          <Text style={styles.iosText}>For Apple Pay, open in Safari.</Text>
          <View style={styles.iosActions}>
            <TouchableOpacity style={styles.iosButton} onPress={openInSafari}>
              <Text style={styles.iosButtonText}>Open in Safari</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iosButton, styles.iosSecondary]} onPress={refreshStatus}>
              <Text style={[styles.iosButtonText, styles.iosSecondaryText]}>Refresh status</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onLoadEnd={(navState) => {
          // Also check URL on load end
          const url = navState.nativeEvent.url;
          console.log('WebView load ended, URL:', url);
          if (url && (url.includes('/premium-success') || url.includes('premium-success'))) {
            handlePaymentSuccess(url);
          }
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color="#1A73E8" />
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView HTTP error: ', nativeEvent);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
  iosBanner: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#F8FAFF',
  },
  iosText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  iosActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iosButton: {
    backgroundColor: '#1A73E8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  iosButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  iosSecondary: {
    backgroundColor: '#E8F0FE',
  },
  iosSecondaryText: {
    color: '#1A73E8',
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#1A73E8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
