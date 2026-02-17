import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import * as DocumentPicker from "expo-document-picker";

const getApiBaseUrl = () => {
   
    return 'https://lastversion-nine.vercel.app';
  


};
const API_BASE_URL = getApiBaseUrl();

const apiCall = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `Request failed (${response.status})`);
  }
  return response.json();
};

export default function ExamScreen({ navigation }) {
  const { user } = useSelector((state) => state.user);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [examPdfFile, setExamPdfFile] = useState(null);
  const [uploadingExam, setUploadingExam] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  useEffect(() => {
    if (user?.role === "teacher") loadClasses();
  }, [user]);

  useEffect(() => {
    if (selectedClassId) loadSubjects(selectedClassId);
    else {
      setSubjects([]);
      setSelectedSubjectId("");
    }
  }, [selectedClassId]);

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const data = await apiCall("/api/classes");
      setClasses(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadSubjects = async (classId) => {
    setLoadingSubjects(true);
    try {
      const data = await apiCall(`/api/subjects/class/${classId}`);
      setSubjects(data);
    } catch (error) {
      Alert.alert("Error", error.message);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handlePickExamPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setExamPdfFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick file. Please try again.");
    }
  };

  const handleUploadExam = async () => {
    if (!selectedClassId || !selectedSubjectId || !examTitle.trim() || !examPdfFile) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }
    setUploadingExam(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();
      formData.append("subjectId", selectedSubjectId);
      formData.append("title", examTitle.trim());
      formData.append("description", examDescription.trim() || "");
      formData.append("examPdf", {
        uri: examPdfFile.uri,
        type: "application/pdf",
        name: examPdfFile.name || "exam.pdf",
      });

      const response = await fetch(`${API_BASE_URL}/api/exams`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `Request failed (${response.status})`);
      }

      Alert.alert("Success", "Exam uploaded successfully", [
        { text: "OK", onPress: () => {
          setSelectedClassId("");
          setSelectedSubjectId("");
          setExamTitle("");
          setExamDescription("");
          setExamPdfFile(null);
        }},
      ]);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setUploadingExam(false);
    }
  };

  const getSelectedClassName = () => {
    const selectedClass = classes.find((c) => c.id === parseInt(selectedClassId));
    return selectedClass ? selectedClass.name : "Select Class";
  };
  const getSelectedSubjectName = () => {
    const selectedSubject = subjects.find((s) => s.id === parseInt(selectedSubjectId));
    return selectedSubject ? selectedSubject.name : "Select Subject";
  };

  if (user?.role !== "teacher") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={26} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload Exam</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Access denied. Teacher role required.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Exam</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upload New Exam</Text>

          {/* Class Picker */}
          <Text style={styles.label}>Class *</Text>
          <TouchableOpacity
            style={[styles.pickerButton, loadingClasses && styles.pickerButtonDisabled]}
            onPress={() => setShowClassPicker(true)}
            disabled={loadingClasses}
          >
            <Text style={[styles.pickerButtonText, loadingClasses && { color: "#999" }]}>
              {loadingClasses ? "Loading..." : getSelectedClassName()}
            </Text>
            <Feather name="chevron-down" size={24} color={loadingClasses ? "#ccc" : "#666"} />
          </TouchableOpacity>

          {/* Subject Picker */}
          <Text style={styles.label}>Subject *</Text>
          <TouchableOpacity
            style={[styles.pickerButton, !selectedClassId && styles.pickerButtonDisabled]}
            onPress={() => selectedClassId && setShowSubjectPicker(true)}
            disabled={!selectedClassId || loadingSubjects}
          >
            <Text style={[styles.pickerButtonText, (!selectedClassId || loadingSubjects) && { color: "#999" }]}>
              {loadingSubjects ? "Loading..." : (!selectedClassId ? "Select class first" : getSelectedSubjectName())}
            </Text>
            <Feather
              name="chevron-down"
              size={24}
              color={!selectedClassId || loadingSubjects ? "#ccc" : "#666"}
            />
          </TouchableOpacity>

          {/* Exam Title */}
          <Text style={styles.label}>Exam Title *</Text>
          <TextInput
            style={styles.input}
            value={examTitle}
            onChangeText={setExamTitle}
            placeholder="e.g. Midterm Exam"
            placeholderTextColor="#9ca3af"
          />

          {/* Exam Description */}
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={examDescription}
            onChangeText={setExamDescription}
            placeholder="Exam description"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* PDF Picker */}
          <Text style={styles.label}>Exam PDF *</Text>
          <TouchableOpacity style={styles.fileButton} onPress={handlePickExamPdf}>
            <Feather name="upload" size={22} color="#2563eb" />
            <Text style={styles.fileButtonText}>{examPdfFile ? examPdfFile.name : "Select PDF File"}</Text>
          </TouchableOpacity>
          {examPdfFile && (
            <TouchableOpacity style={styles.removeFileButton} onPress={() => setExamPdfFile(null)}>
              <Feather name="x" size={18} color="#ef4444" />
              <Text style={styles.removeFileText}>Remove File</Text>
            </TouchableOpacity>
          )}

          {/* Upload Button */}
          <TouchableOpacity
            style={[styles.uploadButton, uploadingExam && styles.uploadButtonDisabled]}
            onPress={handleUploadExam}
            disabled={uploadingExam}
          >
            {uploadingExam ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Feather name="upload" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload Exam</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Class & Subject Modals */}
      <Modal visible={showClassPicker} transparent animationType="slide" onRequestClose={() => setShowClassPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Class</Text>
              <TouchableOpacity onPress={() => setShowClassPicker(false)}>
                <Feather name="x" size={26} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={classes}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, selectedClassId === String(item.id) && styles.pickerItemSelected]}
                  onPress={() => {
                    setSelectedClassId(String(item.id));
                    setShowClassPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, selectedClassId === String(item.id) && styles.pickerItemTextSelected]}>
                    {item.name}
                  </Text>
                  {selectedClassId === String(item.id) && <Feather name="check" size={20} color="#2563eb" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showSubjectPicker} transparent animationType="slide" onRequestClose={() => setShowSubjectPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subject</Text>
              <TouchableOpacity onPress={() => setShowSubjectPicker(false)}>
                <Feather name="x" size={26} color="#000" />
              </TouchableOpacity>
            </View>
            {subjects.length === 0 ? (
              <View style={styles.emptyModalContent}>
                <Text style={styles.emptyText}>No subjects available for this class</Text>
              </View>
            ) : (
              <FlatList
                data={subjects}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.pickerItem, selectedSubjectId === String(item.id) && styles.pickerItemSelected]}
                    onPress={() => {
                      setSelectedSubjectId(String(item.id));
                      setShowSubjectPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, selectedSubjectId === String(item.id) && styles.pickerItemTextSelected]}>
                      {item.name}
                    </Text>
                    {selectedSubjectId === String(item.id) && <Feather name="check" size={20} color="#2563eb" />}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 35, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#fff" },
  backButton: { padding: 8 ,margintop:4},
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111827" ,margintop:4},
  placeholder: { width: 40 },
  content: { flex: 1 },
  contentContainer: { padding: 18 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 22, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 5 },
  cardTitle: { fontSize: 20, fontWeight: "700", marginBottom: 26, color: "#111827" },
  label: { fontSize: 15, fontWeight: "600", color: "#374151", marginBottom: 10, marginTop: 14 },
  pickerButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, padding: 16, backgroundColor: "#f9fafb", marginBottom: 14 },
  pickerButtonDisabled: { backgroundColor: "#e5e7eb", borderColor: "#d1d5db" },
  pickerButtonText: { fontSize: 16, color: "#111827" },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: "#f9fafb", marginBottom: 14 },
  textArea: { height: 100, textAlignVertical: "top" },
  fileButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderWidth: 1, borderColor: "#2563eb", borderRadius: 12, backgroundColor: "#eff6ff", marginBottom: 10 },
  fileButtonText: { color: "#2563eb", fontSize: 15, fontWeight: "600", marginLeft: 10 },
  removeFileButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, marginBottom: 14 },
  removeFileText: { color: "#ef4444", fontSize: 14, marginLeft: 6 },
  uploadButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#2563eb", padding: 18, borderRadius: 12, marginTop: 14, gap: 12 },
  uploadButtonDisabled: { opacity: 0.65 },
  uploadButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fefefe", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "72%", paddingBottom: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#111827" ,},
  pickerItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  pickerItemSelected: { backgroundColor: "#dbeafe" },
  pickerItemText: { fontSize: 16, color: "#111827" },
  pickerItemTextSelected: { color: "#2563eb", fontWeight: "700" },
  emptyModalContent: { padding: 22, alignItems: "center" },
  emptyText: { fontSize: 15, color: "#6b7280", textAlign: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "#6b7280" },
});
