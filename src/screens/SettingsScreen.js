import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Image,
  ScrollView,
} from "react-native";
import {
  Ionicons,
  Feather,
  MaterialIcons,
  FontAwesome5,
  Entypo,
} from "@expo/vector-icons";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector, useDispatch } from "react-redux";
import { t } from "../i18n/translations";
import { clearUser } from "../store/userSlice";



export default function SettingsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const lang = useSelector((state) => state.language.language);
  const [hijri, setHijri] = useState(false);

///
const handleLogout = () => {
  Alert.alert(
    "Logout",
    "Are you sure you want to logout?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          // Clear Redux state
          dispatch(clearUser());
          // Clear AsyncStorage
          await AsyncStorage.clear();
          navigation.replace("Login");
        },
      },
    ]
  );
};
///




  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ---------- Header ---------- */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerText}>{t(lang, 'settings')}</Text>
        </View>

        {/* ---------- Profile Card ---------- */}
        <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('Profile')}>
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/847/847969.png" }}
            style={styles.profileImg}
          />
          <View>
            <Text style={styles.profileName}>{user?.name || "User"}</Text>
            <Text style={styles.profileSub}>
              {user?.isPrime ? t(lang, 'premium_subscription') : t(lang, 'free_subscription')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#777" style={{ marginLeft: "auto" }} />
        </TouchableOpacity>

        {/* ---------- Settings List ---------- */}
        <Item
          icon={<Ionicons name="globe-outline" size={24} color="#1A73E8" />}
          label={t(lang, 'language')}
          onPress={() => navigation.navigate("Language")}
        />
        <Item 
          icon={<Feather name="crown" size={24} color="#1A73E8" />} 
          label={t(lang, 'subscription')} 
          onPress={() => navigation.navigate('Payment')}
        />
        <Item
  icon={<Ionicons name="grid-outline" size={24} color="#1A73E8" />}
  label={t(lang, 'theme')}
  onPress={() => navigation.navigate("ThemeScreen")}
/>

        {/* Hijri Toggle */}
        <View style={styles.itemContainer}>
          <View style={styles.leftRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={24} color="#1A73E8" />
            </View>
            <Text style={styles.label}>{t(lang, 'hijri_calendar')}</Text>
          </View>
          <Switch value={hijri} onValueChange={() => setHijri(!hijri)} trackColor={{ false: "#ddd", true: "#4C9BFA" }} thumbColor="white" />
        </View>

        <Item icon={<Feather name="sliders" size={22} color="#1A73E8" />} label={t(lang, 'edit_tools')} />
        <Item icon={<MaterialIcons name="receipt-long" size={22} color="#1A73E8" />} label={t(lang, 'customize_degrees_form')} />
        <Item icon={<FontAwesome5 name="pencil-alt" size={20} color="#1A73E8" />} label={t(lang, 'subjects')} />
        <Item icon={<Ionicons name="school-outline" size={24} color="#1A73E8" />} label={t(lang, 'students')} />
        <Item icon={<Entypo name="controller" size={24} color="#1A73E8" />} label={t(lang, 'my_experiences')} />
        <Item icon={<Feather name="archive" size={24} color="#1A73E8" />} label={t(lang, 'archived_semesters')} />

        {/* ---------- NEW ITEMS FROM THE IMAGE ---------- */}
        <Item icon={<Feather name="users" size={24} color="#1A73E8" />} label={t(lang, 'referral_program')} />
        <Item icon={<Feather name="download" size={24} color="#1A73E8" />} label={t(lang, 'backup')} />
        <Item icon={<Feather name="info" size={24} color="#1A73E8" />} label={t(lang, 'instructions')} />
        <Item icon={<Ionicons name="chatbubble-ellipses-outline" size={24} color="#1A73E8" />} label={t(lang, 'chat_with_us')} />
        <Item icon={<Ionicons name="information-circle-outline" size={24} color="#1A73E8" />} label={t(lang, 'privacy_policy')} />
        <Item icon={<Ionicons name="document-text-outline" size={24} color="#1A73E8" />} label={t(lang, 'terms_conditions')} />

        {/* Clear Data & Logout */}
        <Item icon={<MaterialIcons name="cleaning-services" size={24} color="red" />} label={t(lang, 'clear_data')} />
        <Item icon={<Ionicons name="power-outline" size={24} color="red" />} onPress={handleLogout} label={t(lang, 'logout')} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const Item = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <View style={styles.leftRow}>
      <View style={styles.iconCircle}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={22} color="#777" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 26,
    fontWeight: "700",
    marginLeft: 10,
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F4F4D3",
    padding: 15,
    borderRadius: 30,
    marginBottom: 20,
     width: '95%',
    alignSelf: 'center',
  },
  profileImg: {
    width: 55,
    height: 55,
    borderRadius: 100,
    marginRight: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
  },
  profileSub: {
    fontSize: 14,
    color: "#888",
  },

  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F4F4D3",
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 30,
    marginBottom: 12,
    justifyContent: "space-between",
    width: '95%',
    alignSelf: 'center',
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#f4f8ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
}); 
