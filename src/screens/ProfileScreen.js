import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../store/userSlice";
import { useLanguage } from "../hooks/useLanguage";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen({ navigation }) {
  const { t, rtl } = useLanguage();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [schoolName, setSchoolName] = useState(user?.school_name || "");
  const [headTeacherName, setHeadTeacherName] = useState(user?.head_teacher_name || "");
  const [gender, setGender] = useState(user?.gender || "male");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setSchoolName(user.school_name || "");
      setHeadTeacherName(user.head_teacher_name || "");
      setGender(user.gender || "male");
    }
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* -------- Header -------- */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={26} color="black" />
            <Text style={styles.headerText}>{t('profile')}</Text>
          </TouchableOpacity>
        </View>

        {/* -------- Avatar -------- */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
              }}
              style={styles.avatarImg}
            />
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={18} color="#1A73E8" />
            </View>
          </View>
        </View>

        {/* -------- Inputs -------- */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>{t('your_name')}</Text>
          <TextInput 
            style={styles.input} 
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>{t('email_label')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={false}
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>{t('school_name')}</Text>
          <TextInput 
            style={styles.input} 
            value={schoolName}
            onChangeText={setSchoolName}
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>{t('head_teacher_name')}</Text>
          <TextInput 
            style={styles.input} 
            value={headTeacherName}
            onChangeText={setHeadTeacherName}
            placeholder="Head Teacher Name"
          />
        </View>

        {/* -------- Gender -------- */}
        <Text style={styles.genderLabel}>{t('gender')}</Text>

        <View style={styles.genderRow}>
          <TouchableOpacity
            style={styles.genderOption}
            onPress={() => setGender("male")}
          >
            <Ionicons
              name={gender === "male" ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={gender === "male" ? "#1A73E8" : "#999"}
            />
            <Text style={styles.genderText}>{t('male')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.genderOption}
            onPress={() => setGender("female")}
          >
            <Ionicons
              name={gender === "female" ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={gender === "female" ? "#1A73E8" : "#999"}
            />
            <Text style={styles.genderText}>{t('female')}</Text>
          </TouchableOpacity>
        </View>

        {/* -------- Delete account -------- */}
        <TouchableOpacity style={styles.deleteBtn}>
          <Text style={styles.deleteText}>{t('delete_account')}</Text>
        </TouchableOpacity>

        {/* -------- Save -------- */}
        <TouchableOpacity 
          style={styles.saveBtn}
          onPress={async () => {
            const updatedUserData = {
              ...user,
              name,
              school_name: schoolName,
              head_teacher_name: headTeacherName,
              gender,
            };
            
            // Update Redux store
            dispatch(updateUser({
              name,
              school_name: schoolName,
              head_teacher_name: headTeacherName,
              gender,
            }));
            
            // Update AsyncStorage
            await AsyncStorage.setItem("user", JSON.stringify(updatedUserData));
            
            navigation.goBack();
          }}
        >
          <Text style={styles.saveText}>{t('save')}</Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  /* ---------- Header ---------- */
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "600",
    marginLeft: 6,
  },

  /* ---------- Avatar ---------- */
  avatarWrapper: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 25,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 100,
    backgroundColor: "#e8f1ff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: 85,
    height: 85,
    tintColor: "#1A73E8",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "white",
    padding: 5,
    borderRadius: 12,
    elevation: 3,
  },

  /* ---------- Inputs ---------- */
  inputBox: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    color: "#777",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f6f6f6",
    padding: 14,
    borderRadius: 14,
    fontSize: 16,
  },

  /* ---------- Gender ---------- */
  genderLabel: {
    fontSize: 16,
    color: "#555",
    marginLeft: 20,
    marginBottom: 8,
    marginTop: 5,
  },
  genderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  genderOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 25,
  },
  genderText: {
    fontSize: 16,
    marginLeft: 6,
  },

  /* ---------- Buttons ---------- */
  deleteBtn: {
    backgroundColor: "#ffd6d6",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  deleteText: {
    color: "#d9534f",
    fontSize: 17,
    fontWeight: "600",
  },

  saveBtn: {
    backgroundColor: "#1A73E8",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginHorizontal: 20,
  },
  saveText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
