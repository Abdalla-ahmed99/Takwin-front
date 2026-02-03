import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  FlatList,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

// API Base URL configuration (same as Login.js)
const getApiBaseUrl = () => {
  
    return 'https://lastversion-production.up.railway.app';
  


};

const API_BASE_URL = getApiBaseUrl();

// API helper function
const apiCall = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `Request failed (${response.status})`);
  }

  return response.json();
};

export default function AddClassScreen({ navigation, route }) {
  // Create Class state
  const [className, setClassName] = useState("");
  const [classDesc, setClassDesc] = useState("");

  // Available Students state
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedClassForStudents, setSelectedClassForStudents] = useState("");

  // Your Classes state
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Create Subject state
  const [subjectClass, setSubjectClass] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectDesc, setSubjectDesc] = useState("");

  // Assign Grades state
  const [gradeClass, setGradeClass] = useState("");
  const [gradeSubject, setGradeSubject] = useState("");
  const [gradeAssignment, setGradeAssignment] = useState("");
  const [gradeStudents, setGradeStudents] = useState([]);
  const [studentGrades, setStudentGrades] = useState({});

  // Create Student state
  const [studentCreationMode, setStudentCreationMode] = useState("form"); // 'form' or 'excel'
  const [studentForms, setStudentForms] = useState([
    { id: 1, name: "", email: "", password: "" },
  ]);
  const [excelFile, setExcelFile] = useState(null);
  const [selectedClassForNewStudents, setSelectedClassForNewStudents] = useState("");
  const [creatingStudents, setCreatingStudents] = useState(false);

  const [loading, setLoading] = useState(false);

  // Picker modal states
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showGradeClassPicker, setShowGradeClassPicker] = useState(false);
  const [showGradeSubjectPicker, setShowGradeSubjectPicker] = useState(false);
  const [pickerType, setPickerType] = useState(""); // 'classForStudents', 'subject', 'gradeClass', 'gradeSubject'

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Load subjects and students when grade class changes
  useEffect(() => {
    if (gradeClass && classes.length > 0) {
      loadSubjectsForClass(gradeClass);
      loadStudentsForGradeClass(gradeClass);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeClass]);

  const loadData = async () => {
    setLoadingClasses(true);
    try {
      await Promise.all([loadClasses(), loadAvailableStudents()]);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadClasses = async () => {
    try {
      const data = await apiCall("/api/classes");
      setClasses(data);
      // Set default selections
      if (data.length > 0) {
        if (!selectedClassForStudents) setSelectedClassForStudents(String(data[0].id));
        if (!subjectClass) setSubjectClass(String(data[0].id));
        if (!gradeClass) setGradeClass(String(data[0].id));
        if (!selectedClassForNewStudents) setSelectedClassForNewStudents(String(data[0].id));
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const loadAvailableStudents = async () => {
    try {
      const data = await apiCall("/api/classes/available-students");
      setAvailableStudents(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const loadSubjectsForClass = async (classId) => {
    try {
      const data = await apiCall(`/api/subjects/class/${classId}`);
      // Subjects are loaded but we just need to refresh the picker
      // The picker will use the class's subjects from the classes array
    } catch (error) {
      console.error("Error loading subjects:", error);
    }
  };

  const loadStudentsForGradeClass = async (classId) => {
    try {
      // Reload classes to get fresh data with students
      const freshClasses = await apiCall("/api/classes");
      const classData = freshClasses.find((c) => c.id === parseInt(classId));
      if (classData && classData.students) {
        setGradeStudents(classData.students);
        // Initialize grades object
        const grades = {};
        classData.students.forEach((student) => {
          grades[student.id] = "";
        });
        setStudentGrades(grades);
      } else {
        setGradeStudents([]);
        setStudentGrades({});
      }
    } catch (error) {
      console.error("Error loading students:", error);
      setGradeStudents([]);
      setStudentGrades({});
    }
  };

  const handleCreateClass = async () => {
    console.log(FileSystem);
      console.log("hereeeeee");
    if (!className.trim()) {
      Alert.alert("Error", "Class name is required");
      return;
    }

    setLoading(true);
    try {
      await apiCall("/api/classes", {
        method: "POST",
        body: JSON.stringify({
          name: className.trim(),
          description: classDesc.trim() || null,
        }),
      });

      Alert.alert("Success", "Class created successfully");
      setClassName("");
      setClassDesc("");
      await loadData();
      route.params?.onAddClass?.({ name: className.trim(), description: classDesc.trim() });
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSelectedStudents = async () => {
    if (!selectedClassForStudents) {
      Alert.alert("Error", "Select a class");
      return;
    }

    if (selectedStudentIds.length === 0) {
      Alert.alert("Error", "Select at least one student");
      return;
    }

    setLoading(true);
    try {
      await apiCall(`/api/classes/${selectedClassForStudents}/students`, {
        method: "POST",
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });

      Alert.alert("Success", "Students added to class successfully");
      setSelectedStudentIds([]);
      await loadData();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!subjectClass || !subjectName.trim()) {
      Alert.alert("Error", "Select class and enter subject name");
      return;
    }

    setLoading(true);
    try {
      await apiCall("/api/subjects", {
        method: "POST",
        body: JSON.stringify({
          classId: parseInt(subjectClass),
          name: subjectName.trim(),
          description: subjectDesc.trim() || null,
        }),
      });

      Alert.alert("Success", "Subject created successfully");
      setSubjectName("");
      setSubjectDesc("");
      await loadData();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGrades = async () => {
    if (!gradeSubject) {
      Alert.alert("Error", "Select a subject");
      return;
    }

    if (!gradeAssignment.trim()) {
      Alert.alert("Error", "Enter assignment name");
      return;
    }

    const grades = [];
    Object.keys(studentGrades).forEach((studentId) => {
      const gradeValue = studentGrades[studentId];
      if (gradeValue !== "" && gradeValue !== null && gradeValue !== undefined) {
        const numGrade = parseFloat(gradeValue);
        if (numGrade >= 0 && numGrade <= 100) {
          grades.push({
            studentId: parseInt(studentId),
            grade: numGrade,
            assignment: gradeAssignment.trim(),
          });
        }
      }
    });

    if (grades.length === 0) {
      Alert.alert("Error", "Enter at least one grade");
      return;
    }

    setLoading(true);
    try {
      await apiCall("/api/grades", {
        method: "POST",
        body: JSON.stringify({
          subjectId: parseInt(gradeSubject),
          grades,
        }),
      });

      Alert.alert("Success", "Grades submitted successfully");
      setGradeAssignment("");
      setStudentGrades({});
      // Reset grades input
      const newGrades = {};
      gradeStudents.forEach((student) => {
        newGrades[student.id] = "";
      });
      setStudentGrades(newGrades);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const getSubjectsForClass = (classId) => {
    const classData = classes.find((c) => c.id === parseInt(classId));
    return classData?.subjects || classData?.Subjects || [];
  };

  const openPicker = (type) => {
    setPickerType(type);
    if (type === "classForStudents") setShowClassPicker(true);
    else if (type === "subject") setShowSubjectPicker(true);
    else if (type === "gradeClass") setShowGradeClassPicker(true);
    else if (type === "gradeSubject") setShowGradeSubjectPicker(true);
  };

  const selectPickerValue = (value, label) => {
    if (pickerType === "classForStudents") {
      setSelectedClassForStudents(value);
      setShowClassPicker(false);
    } else if (pickerType === "newStudentClass") {
      setSelectedClassForNewStudents(value);
      setShowClassPicker(false);
    } else if (pickerType === "subject") {
      setSubjectClass(value);
      setShowSubjectPicker(false);
    } else if (pickerType === "gradeClass") {
      setGradeClass(value);
      setGradeSubject("");
      setShowGradeClassPicker(false);
    } else if (pickerType === "gradeSubject") {
      setGradeSubject(value);
      setShowGradeSubjectPicker(false);
    }
    setPickerType("");
  };

  const getPickerData = () => {
    if (pickerType === "classForStudents" || pickerType === "subject" || pickerType === "gradeClass" || pickerType === "newStudentClass") {
      return classes.map((c) => ({ value: String(c.id), label: c.name }));
    } else if (pickerType === "gradeSubject") {
      return getSubjectsForClass(gradeClass).map((s) => ({ value: String(s.id), label: s.name }));
    }
    return [];
  };

  const getSelectedLabel = (type, value) => {
    if (type === "classForStudents" || type === "newStudentClass") {
      const c = classes.find((c) => c.id === parseInt(value));
      return c ? c.name : "Select Class";
    } else if (type === "subject") {
      const c = classes.find((c) => c.id === parseInt(value));
      return c ? c.name : "Select Class";
    } else if (type === "gradeClass") {
      const c = classes.find((c) => c.id === parseInt(value));
      return c ? c.name : "Select Class";
    } else if (type === "gradeSubject") {
      const subjects = getSubjectsForClass(gradeClass);
      const s = subjects.find((s) => s.id === parseInt(value));
      return s ? s.name : "Select Subject";
    }
    return "Select";
  };

  // Create Student Functions
  const addStudentForm = () => {
    const newId = Math.max(...studentForms.map((f) => f.id), 0) + 1;
    setStudentForms([...studentForms, { id: newId, name: "", email: "", password: "" }]);
  };

  const removeStudentForm = (id) => {
    if (studentForms.length > 1) {
      setStudentForms(studentForms.filter((f) => f.id !== id));
    } else {
      Alert.alert("Error", "At least one student form is required");
    }
  };

  const updateStudentForm = (id, field, value) => {
    setStudentForms(
      studentForms.map((form) => (form.id === id ? { ...form, [field]: value } : form))
    );
  };

  const handlePickExcelFile = async () => {
    try {
      // Try to use expo-document-picker if available
      let DocumentPicker;
      try {
        DocumentPicker = require("expo-document-picker");
      } catch (e) {
        Alert.alert(
          "Package Required",
          "Please install expo-document-picker:\n\nnpm install expo-document-picker\n\nThen restart your app."
        );
        return;
      }

      // Allow any file type - we'll validate it's Excel after selection
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Accept any file type
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileName = file.name.toLowerCase();
        const validExtensions = [".xlsx", ".xls", ".csv"];
        const isValidExcel = validExtensions.some((ext) => fileName.endsWith(ext));

        if (!isValidExcel) {
          Alert.alert(
            "Invalid File Type",
            "Please select an Excel file (.xlsx, .xls, or .csv)"
          );
          return;
        }

        setExcelFile(file);
        Alert.alert("File Selected", `Selected: ${file.name}`);
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("Error", "Failed to pick file. Please try again.");
    }
  };

  const parseExcelFile = async (fileUri) => {
    try {
      // Try to use xlsx library if available
      let XLSX;
      try {
        XLSX = require("xlsx");
      } catch (e) {
        throw new Error(
          "Excel parsing requires the 'xlsx' package. Please install it:\n\nnpm install xlsx\n\nThen restart your app."
        );
      }

      // Use expo-file-system to read the file as base64
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: "base64",
      });

      // Convert base64 to Uint8Array for React Native
      // Manual base64 decoding that works in React Native
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let lookup = new Uint8Array(256);
      for (let i = 0; i < chars.length; i++) {
        lookup[chars.charCodeAt(i)] = i;
      }
      

      let bufferLength = base64.length * 0.75;
      if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
          bufferLength--;
        }
      }

      const bytes = new Uint8Array(bufferLength);
      let p = 0;
      for (let i = 0; i < base64.length; i += 4) {
        const encoded1 = lookup[base64.charCodeAt(i)];
        const encoded2 = lookup[base64.charCodeAt(i + 1)];
        const encoded3 = lookup[base64.charCodeAt(i + 2)];
        const encoded4 = lookup[base64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
      }

      // Read the Excel file
      const workbook = XLSX.read(bytes, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Map Excel data to student format
      const students = data.map((row) => ({
        name: row.name || row.Name || "",
        email: row.email || row.Email || "",
        password: row.password || row.Password || "Student123",
      }));

      return students.filter((s) => s.name && s.email);
    } catch (error) {
      console.error("Error parsing Excel:", error);
      throw error;
    }
  };

  const createStudentsFromExcel = async () => {
    if (!selectedClassForNewStudents) {
      Alert.alert("Error", "Please select a class for the students");
      return;
    }

    if (!excelFile) {
      Alert.alert("Error", "Please select an Excel file");
      return;
    }

    setCreatingStudents(true);
    try {
      // Parse Excel file
      const students = await parseExcelFile(excelFile.uri);
      
      if (students.length === 0) {
        Alert.alert("Error", "No valid students found in Excel file");
        return;
      }

      // Create students
      await createStudents(students);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setCreatingStudents(false);
    }
  };

  const createStudents = async (studentsData) => {
    if (!selectedClassForNewStudents) {
      Alert.alert("Error", "Please select a class for the students");
      return;
    }

    const results = { success: [], failed: [] };
    const createdStudentIds = [];

    // First, create all students
    for (const student of studentsData) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: student.name.trim(),
            email: student.email.trim(),
            password: student.password || "Student123", // Default password if not provided
            role: "student",
          }),
        });

        const data = await response.json();

        if (response.ok) {
          results.success.push({ email: student.email, id: data.id });
          createdStudentIds.push(data.id);
        } else {
          results.failed.push({ email: student.email, error: data.message });
        }
      } catch (error) {
        results.failed.push({ email: student.email, error: error.message });
      }
    }

    // If any students were created successfully, add them to the selected class
    if (createdStudentIds.length > 0) {
      try {
        await apiCall(`/api/classes/${selectedClassForNewStudents}/students`, {
          method: "POST",
          body: JSON.stringify({ studentIds: createdStudentIds }),
        });
      } catch (error) {
        console.error("Error adding students to class:", error);
        Alert.alert(
          "Warning",
          `Students were created but failed to add to class: ${error.message}`
        );
      }
    }

    // Show results
    const successCount = results.success.length;
    const failedCount = results.failed.length;

    if (successCount > 0 && failedCount === 0) {
      Alert.alert(
        "Success",
        `${successCount} student(s) created successfully and added to class`
      );
      // Reset forms
      setStudentForms([{ id: 1, name: "", email: "", password: "" }]);
      setExcelFile(null);
      await loadAvailableStudents();
      await loadClasses();
    } else if (successCount > 0 && failedCount > 0) {
      Alert.alert(
        "Partial Success",
        `${successCount} student(s) created and added to class, ${failedCount} failed.\n\nFailed:\n${results.failed.map((f) => `${f.email}: ${f.error}`).join("\n")}`
      );
      await loadAvailableStudents();
      await loadClasses();
    } else {
      Alert.alert(
        "Error",
        `Failed to create students:\n${results.failed.map((f) => `${f.email}: ${f.error}`).join("\n")}`
      );
    }
  };

  const handleCreateStudents = async () => {
    // Validate class selection
    if (!selectedClassForNewStudents) {
      Alert.alert("Error", "Please select a class for the students");
      return;
    }

    if (studentCreationMode === "excel") {
      await createStudentsFromExcel();
      return;
    }

    // Validate form data
    const validStudents = studentForms.filter(
      (form) => form.name.trim() && form.email.trim() && form.password.trim()
    );

    if (validStudents.length === 0) {
      Alert.alert("Error", "Please fill in at least one student form");
      return;
    }

    // Validate all forms
    for (const form of studentForms) {
      if (form.name.trim() && form.email.trim() && !form.password.trim()) {
        Alert.alert("Error", `Password is required for ${form.name || form.email}`);
        return;
      }
      if (form.email.trim() && !form.email.includes("@")) {
        Alert.alert("Error", `Invalid email format for ${form.name || form.email}`);
        return;
      }
    }

    setCreatingStudents(true);
    try {
      const studentsData = validStudents.map((form) => ({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
      }));

      await createStudents(studentsData);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setCreatingStudents(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Teacher Dashboard</Text>
      </View>

      {loadingClasses && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {/* Create Class Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create Class</Text>
        <TextInput
          style={styles.input}
          placeholder="Class name (e.g. Mathematics 101)"
          value={className}
          onChangeText={setClassName}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (Optional)"
          value={classDesc}
          onChangeText={setClassDesc}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateClass}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Create Student Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create Student</Text>
        
        {/* Mode Selection Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, studentCreationMode === "form" && styles.tabActive]}
            onPress={() => setStudentCreationMode("form")}
          >
            <Text style={[styles.tabText, studentCreationMode === "form" && styles.tabTextActive]}>
              Form
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, studentCreationMode === "excel" && styles.tabActive]}
            onPress={() => setStudentCreationMode("excel")}
          >
            <Text style={[styles.tabText, studentCreationMode === "excel" && styles.tabTextActive]}>
              Excel Upload
            </Text>
          </TouchableOpacity>
        </View>

        {/* Class Selection for New Students */}
        <Text style={styles.label}>Select Class *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => {
            setPickerType("newStudentClass");
            setShowClassPicker(true);
          }}
        >
          <Text style={styles.pickerButtonText}>
            {getSelectedLabel("newStudentClass", selectedClassForNewStudents) || "Select Class"}
          </Text>
        </TouchableOpacity>

        {studentCreationMode === "form" ? (
          <View>
            <Text style={styles.sectionNote}>
              Fill in student details. Click + to add more students.
            </Text>
            <ScrollView style={styles.studentFormsContainer} nestedScrollEnabled>
              {studentForms.map((form, index) => (
                <View key={form.id} style={styles.studentFormItem}>
                  <View style={styles.studentFormHeader}>
                    <Text style={styles.studentFormNumber}>Student {index + 1}</Text>
                    {studentForms.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeStudentForm(form.id)}
                        style={styles.removeButton}
                      >
                        <Feather name="x" size={18} color="#f44336" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={form.name}
                    onChangeText={(text) => updateStudentForm(form.id, "name", text)}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={form.email}
                    onChangeText={(text) => updateStudentForm(form.id, "email", text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={form.password}
                    onChangeText={(text) => updateStudentForm(form.id, "password", text)}
                    secureTextEntry
                  />
                </View>
              ))}
              <TouchableOpacity
                style={styles.addFormButton}
                onPress={addStudentForm}
              >
                <Feather name="plus" size={20} color="#2563eb" />
                <Text style={styles.addFormButtonText}>Add Another Student</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionNote}>
              Upload an Excel file with columns: name, email, password. You can upload any file - we'll check if it's Excel.
            </Text>
            <TouchableOpacity
              style={styles.excelButton}
              onPress={handlePickExcelFile}
            >
              <Feather name="upload" size={20} color="#2563eb" />
              <Text style={styles.excelButtonText}>
                {excelFile ? excelFile.name : "Select File (Excel/CSV)"}
              </Text>
            </TouchableOpacity>
            {excelFile && (
              <TouchableOpacity
                style={styles.removeFileButton}
                onPress={() => setExcelFile(null)}
              >
                <Feather name="x" size={16} color="#f44336" />
                <Text style={styles.removeFileText}>Remove File</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.excelNote}>
              Note: Excel parsing requires the 'xlsx' package. Install it with: npm install xlsx
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, creatingStudents && styles.buttonDisabled]}
          onPress={handleCreateStudents}
          disabled={creatingStudents}
        >
          {creatingStudents ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Students</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Available Students Section */}
      {/* <View style={styles.card}>
        <Text style={styles.cardTitle}>Available Students</Text>
        <ScrollView style={styles.studentList} nestedScrollEnabled>
          {availableStudents.length === 0 ? (
            <Text style={styles.emptyText}>No available students</Text>
          ) : (
            availableStudents.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={[
                  styles.studentItem,
                  selectedStudentIds.includes(student.id) && styles.studentItemSelected,
                ]}
                onPress={() => toggleStudentSelection(student.id)}
              >
                <Text style={styles.studentText}>
                  {student.name} ({student.email})
                </Text>
                {selectedStudentIds.includes(student.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.pickerButton, styles.flex1]}
            onPress={() => openPicker("classForStudents")}
          >
            <Text style={styles.pickerButtonText}>
              {getSelectedLabel("classForStudents", selectedClassForStudents)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.addButton, loading && styles.buttonDisabled]}
            onPress={handleAddSelectedStudents}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Add to Class</Text>
          </TouchableOpacity>
        </View>
      </View> */}

      {/* Your Classes Section */}
      {/* <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Classes</Text>
        {classes.length === 0 ? (
          <Text style={styles.emptyText}>No classes yet</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Name</Text>
              <Text style={styles.tableHeaderText}>Students</Text>
              <Text style={styles.tableHeaderText}>Subjects</Text>
            </View>
            {classes.map((c) => {
              const students = (c.students || []).map((s) => s.name).join(", ") || "None";
              const subjects = (c.subjects || c.Subjects || [])
                .map((s) => s.name)
                .join(", ") || "None";
              return (
                <View key={c.id} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{c.name}</Text>
                  <Text style={styles.tableCell} numberOfLines={2}>
                    {students}
                  </Text>
                  <Text style={styles.tableCell} numberOfLines={2}>
                    {subjects}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View> */}

      {/* Create Subject Section */}
      {/* <View style={styles.card}>
        <Text style={styles.cardTitle}>Create Subject</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => openPicker("subject")}
        >
          <Text style={styles.pickerButtonText}>
            {getSelectedLabel("subject", subjectClass)}
          </Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Subject name (e.g. Algebra)"
          value={subjectName}
          onChangeText={setSubjectName}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (Optional)"
          value={subjectDesc}
          onChangeText={setSubjectDesc}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateSubject}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Create Subject</Text>
        </TouchableOpacity>
      </View> */}

      {/* Assign Grades Section */}
      {/* <View style={styles.card}>
        <Text style={styles.cardTitle}>Assign Grades</Text>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Class</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => openPicker("gradeClass")}
            >
              <Text style={styles.pickerButtonText}>
                {getSelectedLabel("gradeClass", gradeClass)}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Subject</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => openPicker("gradeSubject")}
              disabled={!gradeClass}
            >
              <Text style={styles.pickerButtonText}>
                {getSelectedLabel("gradeSubject", gradeSubject)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Assignment (e.g. Midterm)"
          value={gradeAssignment}
          onChangeText={setGradeAssignment}
        />
        {gradeStudents.length > 0 && (
          <View style={styles.gradesTable}>
            <View style={styles.gradesTableHeader}>
              <Text style={styles.gradesTableHeaderText}>Student</Text>
              <Text style={styles.gradesTableHeaderText}>Email</Text>
              <Text style={styles.gradesTableHeaderText}>Grade (0-100)</Text>
            </View>
            {gradeStudents.map((student) => (
              <View key={student.id} style={styles.gradesTableRow}>
                <Text style={styles.gradesTableCell}>{student.name}</Text>
                <Text style={styles.gradesTableCell}>{student.email}</Text>
                <TextInput
                  style={styles.gradeInput}
                  placeholder="0-100"
                  keyboardType="numeric"
                  value={String(studentGrades[student.id] || "")}
                  onChangeText={(text) => {
                    setStudentGrades((prev) => ({
                      ...prev,
                      [student.id]: text,
                    }));
                  }}
                />
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmitGrades}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Submit Grades</Text>
        </TouchableOpacity>
      </View> */}

      {/* Picker Modals */}
      <Modal
        visible={showClassPicker || showSubjectPicker || showGradeClassPicker || showGradeSubjectPicker}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowClassPicker(false);
          setShowSubjectPicker(false);
          setShowGradeClassPicker(false);
          setShowGradeSubjectPicker(false);
          setPickerType("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Option</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowClassPicker(false);
                  setShowSubjectPicker(false);
                  setShowGradeClassPicker(false);
                  setShowGradeSubjectPicker(false);
                  setPickerType("");
                }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={getPickerData()}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => selectPickerValue(item.value, item.label)}
                >
                  <Text style={styles.pickerItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 30,
  },
  backButton: {
    marginRight: 12,
   
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    marginLeft:15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  addButton: {
    marginLeft: 8,
  },
  studentList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  studentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
  },
  studentItemSelected: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2563eb",
  },
  studentText: {
    fontSize: 14,
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    color: "#2563eb",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#000",
  },
  flex1: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
    paddingLeft: 4,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#ddd",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 14,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
  },
  gradesTable: {
    marginTop: 12,
    marginBottom: 12,
  },
  gradesTableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#ddd",
    paddingBottom: 8,
    marginBottom: 8,
  },
  gradesTableHeaderText: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 12,
  },
  gradesTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
    alignItems: "center",
  },
  gradesTableCell: {
    flex: 1,
    fontSize: 12,
  },
  gradeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 6,
    fontSize: 12,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalClose: {
    fontSize: 24,
    color: "#666",
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  pickerItemText: {
    fontSize: 16,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
  sectionNote: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
    fontStyle: "italic",
  },
  studentFormsContainer: {
    maxHeight: 400,
    marginBottom: 12,
  },
  studentFormItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  studentFormHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  studentFormNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
  },
  removeButton: {
    padding: 4,
  },
  addFormButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 2,
    borderColor: "#2563eb",
    borderStyle: "dashed",
    borderRadius: 8,
    marginBottom: 12,
  },
  addFormButtonText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  excelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    marginBottom: 8,
  },
  excelButtonText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  removeFileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    marginBottom: 8,
  },
  removeFileText: {
    color: "#f44336",
    fontSize: 12,
    marginLeft: 4,
  },
  excelNote: {
    fontSize: 11,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginTop: 8,
  },
});
