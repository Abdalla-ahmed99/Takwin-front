import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { setLanguage } from '../store/languageSlice';
import { t } from '../i18n/translations';

export default function LanguageScreen({ navigation }) {
  const dispatch = useDispatch();
  const lang = useSelector((state) => state.language.language);

  const selectLang = async (value) => {
    dispatch(setLanguage(value));
    try {
      await AsyncStorage.setItem('language', value);
    } catch {}
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {t(lang, 'select_language')}
        </Text>
      </View>

      {/* Languages – Horizontal Split */}
      <View style={styles.languagesWrapper}>
        {/* Arabic */}
        <TouchableOpacity
          style={[
            styles.languageBox,
            lang === 'ar' && styles.selectedBox,
          ]}
          onPress={() => selectLang('ar')}
          activeOpacity={0.85}
        >
          <Text style={styles.languageText}>
            {t(lang, 'arabic')}
          </Text>
          <Text style={styles.languageSubText}>
            العربية
          </Text>

          {lang === 'ar' && (
            <Ionicons
              name="checkmark-circle"
              size={30}
              color="#2563EB"
              style={styles.checkIcon}
            />
          )}
        </TouchableOpacity>

        {/* English */}
        <TouchableOpacity
          style={[
            styles.languageBox,
            lang === 'en' && styles.selectedBox,
          ]}
          onPress={() => selectLang('en')}
          activeOpacity={0.85}
        >
          <Text style={styles.languageText}>
            {t(lang, 'english')}
          </Text>
          <Text style={styles.languageSubText}>
            English
          </Text>

          {lang === 'en' && (
            <Ionicons
              name="checkmark-circle"
              size={30}
              color="#2563EB"
              style={styles.checkIcon}
            />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 8 : 0,
    marginBottom: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },

  languagesWrapper: {
    flex: 1,
    gap: 14,
  },

  languageBox: {
    // flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
     width: '90%',          // 👈 أصغر من عرض الشاشة
    alignSelf: 'center',   // 👈 في المنتصف
    height: '40%', 
    margin:20,

    alignItems: 'center',
    justifyContent: 'center',

    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },

    // Android shadow
    elevation: 4,
  },

  selectedBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#2563EB',
  },

  languageText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },

  languageSubText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 6,
  },

  checkIcon: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});
