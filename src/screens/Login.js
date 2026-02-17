  
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { setUser } from "../store/userSlice";
import { useLanguage } from "../hooks/useLanguage";

// Backend API base URL configuration
// Backend runs on:
// - HTTP port 3000 (for local development - React Native, etc.)
// - HTTPS port 3001 (for secure connections)
//
// Platform-specific URLs (automatically detected):
// - Android Emulator: 'http://10.0.2.2:3000' (maps to host's localhost)
// - iOS Simulator: 'http://localhost:3000'
// - Physical Device: Use your computer's IP, e.g., 'http://192.168.1.100:3000'
//
// To find your computer's IP for physical device testing:
// Windows: ipconfig (look for IPv4 Address)
// Mac/Linux: ifconfig or ip addr
const getApiBaseUrl = () => {
  
    return 'https://lastversion-nine.vercel.app';
  


};

const API_BASE_URL = getApiBaseUrl();

export default function Login({ navigation }) {
  const { t, rtl } = useLanguage();
  const dispatch = useDispatch();
  const [tab, setTab] = useState("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    // Reset error
    setError("");
    await AsyncStorage.clear();
    // Validate inputs
    if (tab === "email") {
      if (!email.trim()) {
        setError("Please enter your email address");
        return;
      }
      if (!password) {
        setError("Please enter your password");
        return;
      }
    } else {
      if (!phone.trim()) {
        setError("Please enter your phone number");
        return;
      }
      if (!password) {
        setError("Please enter your password");
        return;
      }
    }

    setLoading(true);

    try {
      // For phone login, we'll need to check if backend supports it
      // For now, we'll use email for both tabs (you may need to modify backend)
      const loginEmail = tab === "email" ? email : phone; // Assuming phone can be used as email

      const loginUrl = `${API_BASE_URL}/api/auth/login`;
      console.log("Attempting login to:", loginUrl);
      console.log("Platform:", Platform.OS);

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Prepare user data
        const userData = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          isPrime:data.isPrime,
          ...(data.school_name && { school_name: data.school_name }),
          ...(data.head_teacher_name && { head_teacher_name: data.head_teacher_name }),
          ...(data.gender && { gender: data.gender }),
        };

        // Save token and user data to AsyncStorage
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        console.log(userData);
        
        // Dispatch user data to Redux
        dispatch(setUser({
          user: userData,
          token: data.token,
        }));

        // Navigate to Home
        navigation.replace("Home");
      } else {
        // Handle error response
        setError(data.message || "Login failed. Please try again.");
        Alert.alert("Login Failed", data.message || "Invalid credentials");
      }
      //////////////////////////////// اللي بتحفظ اللي راجع 
      const savedToken = await AsyncStorage.getItem("token");
      const savedUser = await AsyncStorage.getItem("user");
      console.log("Saved Token:", savedToken);
      console.log("Saved User:", JSON.parse(savedUser));
      /////////////////////////////

    } catch (err) {
      console.error("Login error:", err);
      console.error("Error details:", err.message);
      console.error("API URL used:", API_BASE_URL);
      
      let errorMessage = "Network error. Please check your connection and try again.";
      
      // Provide more specific error messages
      if (err.message && (err.message.includes("Network request failed") || err.message.includes("Failed to connect"))) {
        const platformHint = Platform.OS === "android" 
          ? "\n\nFor Android Emulator: Using http://10.0.2.2:3000\nFor Physical Device: Use your computer's IP (e.g., http://192.168.1.100:3000)"
          : Platform.OS === "ios"
          ? "\n\nFor iOS Simulator: Using http://localhost:3000\nFor Physical Device: Use your computer's IP (e.g., http://192.168.1.100:3000)"
          : "";
        
        errorMessage = `Cannot connect to server at ${API_BASE_URL}\n\nPlease check:\n✓ Backend server is running on port 3000\n✓ Backend supports HTTP (not just HTTPS)\n✓ Firewall allows connections${platformHint}\n\nNote: Your backend currently uses HTTPS. For local development, consider adding HTTP support to your backend server.`;
      } else if (err.message && err.message.includes("certificate")) {
        errorMessage = "SSL certificate error. For local development, consider using HTTP instead of HTTPS in your backend.";
      }
      
      setError(errorMessage);
      Alert.alert(
        "Connection Error",
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo / App Title */}
      <Text style={styles.logo}>TAKWEEN</Text>
      <Text style={[styles.header, rtl && { textAlign: 'right' }]}>{t('welcome')}</Text>
      <Text style={[styles.subHeader, rtl && { textAlign: 'right' }]}>{t('sign_in_continue')}</Text>

      {/* Card */}
      <View style={styles.card}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setTab("email")}
            style={[styles.tab, tab === "email" && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, tab === "email" && styles.tabTextActive]}
            >
              {t('email')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab("phone")}
            style={[styles.tab, tab === "phone" && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, tab === "phone" && styles.tabTextActive]}
            >
              {t('phone')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Inputs */}
        {tab === "email" ? (
          <>
            <TextInput
              placeholder={t('email_address')}
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            <TextInput
              placeholder={t('password')}
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </>
        ) : (
          <>
            <TextInput
              placeholder={t('phone_number')}
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              editable={!loading}
            />
            <TextInput
              placeholder={t('password')}
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </>
        )}

        {/* Forgot */}
        <Text style={[styles.forgot, rtl && { textAlign: 'right' }]}>
          {t('forgot_password')} <Text style={styles.link}>{t('reset')}</Text>
        </Text>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.primary, loading && styles.primaryDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>{t('login')}</Text>
          )}
        </TouchableOpacity>

        {/* Register */}
        <Text style={[styles.register, rtl && { textAlign: 'right' }]}>
          {t('new_here')} {" "}
          <Text
            onPress={() => navigation.replace("Register")}
            style={styles.linkAlt}
          >
            {t('create_account')}
          </Text>
        </Text>

        {/* Social Login */}
        <View style={{ marginTop: 28 }}>
          <Text style={[styles.socialTitle, rtl && { textAlign: 'right' }]}>{t('or_continue_with')}</Text>
          <View style={styles.socials}>
            <TouchableOpacity style={styles.socialBtn}>
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/281/281764.png",
                }}
                style={styles.socialIcon}
              />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/0/747.png",
                }}
                style={styles.socialIcon}
              />
              <Text style={styles.socialText}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F8FF",
    padding: 24,
    alignItems: "center",
  },
  logo: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1E3A8A",
    marginTop: 30,
  },
  header: {
    fontSize: 22,
    color: "#1F2937",
    fontWeight: "700",
    marginTop: 6,
  },
  subHeader: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    marginTop: 10,
    borderRadius: 18,
    padding: 22,
    width: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 6,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#fff", elevation: 2 },
  tabText: { color: "#6B7280", fontSize: 14 },
  tabTextActive: { color: "#111827", fontWeight: "600" },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 14,
    color: "#111827",
  },
  forgot: {
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center", // <<< هنا جبناه في النص
    fontSize: 13,
  },
  link: {
    color: "#2563EB",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  primary: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    backgroundColor: "#2563EB",
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  register: {
    marginTop: 16,
    textAlign: "center",
    color: "#374151",
    fontSize: 14,
  },
  linkAlt: {
    color: "#2563EB",
    fontWeight: "700",
  },
  socialTitle: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  socials: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  socialIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  socialText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
  },
  primaryDisabled: {
    opacity: 0.6,
  },
});
