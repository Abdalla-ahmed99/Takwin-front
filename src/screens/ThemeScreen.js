// import React, { useState, useEffect } from "react";
// import {
//   SafeAreaView,
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   Alert,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Ionicons } from "@expo/vector-icons";

// export default function ThemeScreen({ navigation }) {
//   const [theme, setTheme] = useState("light");

//   // Load saved theme
//   useEffect(() => {
//     (async () => {
//       const savedTheme = await AsyncStorage.getItem("appTheme");
//       if (savedTheme) setTheme(savedTheme);
//     })();
//   }, []);

//   const themes = [
//     { id: "light", label: "Light Mode" },
//     { id: "dark", label: "Dark Mode" },
//   ];

//   const selectTheme = async (selected) => {
//     try {
//       await AsyncStorage.setItem("appTheme", selected);
//       setTheme(selected);
//       Alert.alert("Success", `Theme changed to ${selected}`);
//     } catch (error) {
//       Alert.alert("Error", "Failed to save theme");
//     }
//   };

//   const colors = theme === "dark"
//     ? {
//         background: "#121212",
//         card: "#1f1f1f",
//         text: "#fff",
//         subText: "#d1d5db",
//         border: "#333",
//         primary: "#2563eb",
//       }
//     : {
//         background: "#f9fafb",
//         card: "#fff",
//         text: "#111827",
//         subText: "#6b7280",
//         border: "#d1d5db",
//         primary: "#2563eb",
//       };

//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
//       <View style={styles.headerRow}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="chevron-back" size={28} color={colors.text} />
//         </TouchableOpacity>
//         <Text style={[styles.headerText, { color: colors.text }]}>Theme</Text>
//       </View>

      
//       <FlatList
//         data={themes}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={{ padding: 20 }}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={[
//               styles.itemContainer,
//               { backgroundColor: colors.card, borderColor: colors.border },
//             ]}
//             onPress={() => selectTheme(item.id)}
//           >
//             <Text style={[styles.itemLabel, { color: colors.text }]}>{item.label}</Text>
//             {theme === item.id && <Ionicons name="checkmark" size={22} color={colors.primary} />}
//           </TouchableOpacity>
//         )}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   headerRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 15,
//   },
//   headerText: { fontSize: 26, fontWeight: "700", marginLeft: 12 },
//   itemContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     borderRadius: 16,
//     borderWidth: 1,
//     marginBottom: 15,
//   },
//   itemLabel: { fontSize: 18, fontWeight: "600" },
// });
