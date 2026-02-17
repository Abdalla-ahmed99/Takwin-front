import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { setUser } from "../store/userSlice";
import { useLanguage } from "../hooks/useLanguage";

// Backend API base URL configuration
const getApiBaseUrl = () => {
  
    return 'https://lastversion-nine.vercel.app';
  


};

const API_BASE_URL = getApiBaseUrl();

export default function Register({ navigation }) {
  const { t, rtl } = useLanguage();
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student"); // 'student' or 'teacher'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    // Reset error
    setError("");

    // Validate inputs
    if (!name.trim()) {
      setError("Please enter your name");
      Alert.alert("Error", "Please enter your name");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address");
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      Alert.alert("Error", "Please enter your password");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const registerUrl = `${API_BASE_URL}/api/auth/register`;
      console.log("Attempting registration to:", registerUrl);
      console.log("Platform:", Platform.OS);

      const response = await fetch(registerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password,
          role: role,
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
        };

        // Save token and user data to AsyncStorage
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(userData));

        // Dispatch user data to Redux
        dispatch(
          setUser({
            user: userData,
            token: data.token,
          })
        );

        Alert.alert("Success", "Registration successful!", [
          {
            text: "OK",
            onPress: () => {
              // Navigate to Home
              navigation.replace("Home");
            },
          },
        ]);
      } else {
        // Handle error response
        setError(data.message || "Registration failed. Please try again.");
        Alert.alert("Registration Failed", data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Network error. Please check your connection.");
      Alert.alert("Error", "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={[styles.header, rtl && { textAlign: 'right' }]}>
            <Text style={{ color: "#111" }}>{t('hey')} </Text>
            <Text style={{ fontWeight: "700" }}>{t('register_now')}</Text>
          </Text>

          <Text style={[styles.small, rtl && { textAlign: 'right' }] }>
            {t('already_have_account')}{" "}
            <Text onPress={() => navigation.replace("Login")} style={styles.link}>
              {t('login')}
            </Text>
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TextInput
            placeholder={t('your_name')}
            style={styles.input}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError("");
            }}
            autoCapitalize="words"
          />

          <TextInput
            placeholder={t('email_address')}
            style={styles.input}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            placeholder={t('password')}
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError("");
            }}
          />

          <TextInput
            placeholder={t('confirm_password')}
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError("");
            }}
          />

          <Text style={[styles.small, { marginTop: 14, textAlign: "center" }]}>{t('role')}</Text>
          <View style={styles.radioContainer}>
            <TouchableOpacity
              onPress={() => setRole("student")}
              style={styles.radioRow}
            >
              <View
                style={[
                  styles.radioOuter,
                  role === "student" && styles.radioOuterActive,
                ]}
              >
                {role === "student" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>{t('student')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRole("teacher")}
              style={styles.radioRow}
            >
              <View
                style={[
                  styles.radioOuter,
                  role === "teacher" && styles.radioOuterActive,
                ]}
              >
                {role === "teacher" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>{t('teacher')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primary, loading && styles.primaryDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryText}>{t('register')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  small: {
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 12,
  },
  link: {
    color: "#1D4ED8",
    fontWeight: "600",
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginVertical: 12,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: "#1D4ED8",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1D4ED8",
  },
  radioLabel: {
    marginLeft: 6,
    color: "#111827",
    fontSize: 16,
  },
  primary: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  primaryDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
