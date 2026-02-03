// import React, { useContext } from "react";
// import { SafeAreaView, View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { ThemeContext } from "../ThemeContext";

// export default function ThemeScreen({ navigation }) {
//   const { theme, toggleTheme, colors } = useContext(ThemeContext);

//   const themes = [
//     { id: "light", label: "Light Mode" },
//     { id: "dark", label: "Dark Mode" },
//   ];

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
//             onPress={() => toggleTheme(item.id)}
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
//   headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
//   headerText: { fontSize: 26, fontWeight: "700", marginLeft: 12 },
//   itemContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16, borderWidth: 1, marginBottom: 15 },
//   itemLabel: { fontSize: 18, fontWeight: "600" },
// });
