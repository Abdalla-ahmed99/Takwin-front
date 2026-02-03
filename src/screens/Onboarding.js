
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const slidesEn = [
  {
    id: '1',
    titleKey: 'onboarding_title_1',
    subtitleKey: 'onboarding_sub_1',
    image: 'https://png.pngtree.com/png-clipart/20250125/original/pngtree-colorful-stack-of-books-in-hand-drawn-illustration-style-png-image_20025016.png',
  },
  {
    id: '2',
    titleKey: 'onboarding_title_2',
    subtitleKey: 'onboarding_sub_2',
    image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  },
  {
    id: '3',
    titleKey: 'onboarding_title_3',
    subtitleKey: 'onboarding_sub_3',
    image: 'https://cdn-icons-png.flaticon.com/512/906/906175.png',
  },
];

export default function Onboarding({ navigation }) {
  const { t, rtl } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const slides = slidesEn;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('Login'); // Go to login after last slide
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" />
      <Text style={[styles.title, rtl && { textAlign: 'right' }]}>{t(item.titleKey)}</Text>
      <Text style={[styles.subtitle, rtl && { textAlign: 'right' }]}>{t(item.subtitleKey)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        ref={flatListRef}
      />

      {/* Dots Indicators */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>

      {/* Button */}
      <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
        <Text style={styles.primaryText}>
          {currentIndex === slides.length - 1 ? t('get_started') : t('next')}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // خلفية فاتحة مريحة
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  image: {
    width: 220,
    height: 220,
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 10,
    width: 10,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 6,
    borderRadius: 5,
  },
  activeDot: {
    backgroundColor: '#1D4ED8',
    width: 20,
  },
  primaryBtn: {
    backgroundColor: '#1D4ED8',
    height: 52,
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
import { useLanguage } from '../hooks/useLanguage';
