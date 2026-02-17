import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  FlatList,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// API Base URL configuration
const getApiBaseUrl = () => {
  
    return 'https://lastversion-nine.vercel.app';
  


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

export default function ClassDetailsScreen({ navigation, route }) {
  const { classData: initialClassData } = route.params || {};
  const [classData, setClassData] = useState(initialClassData);
  const [loading, setLoading] = useState(!initialClassData);
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectGrades, setSubjectGrades] = useState({}); // { subjectId: [grades] }
  const [loadingGrades, setLoadingGrades] = useState({}); // { subjectId: boolean }
  const [expandedSubjects, setExpandedSubjects] = useState({}); // { subjectId: boolean }
  const [editingGrade, setEditingGrade] = useState(null); // { grade, subjectId }
  const [editGradeValue, setEditGradeValue] = useState("");
  const [editAssignmentValue, setEditAssignmentValue] = useState("");
  const [editCommentsValue, setEditCommentsValue] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);
  const { user } = useSelector((state) => state.user);

  // Add Student Modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loadingAvailableStudents, setLoadingAvailableStudents] = useState(false);

  // Add Subject Modal
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDesc, setNewSubjectDesc] = useState("");
  const [savingSubject, setSavingSubject] = useState(false);

  // Add Assignment/Grade Modal
  const [showAddGradeModal, setShowAddGradeModal] = useState(false);
  const [selectedSubjectForGrade, setSelectedSubjectForGrade] = useState("");
  const [assignmentName, setAssignmentName] = useState("");
  const [studentGradesInput, setStudentGradesInput] = useState({}); // { studentId: grade }
  const [savingGrades, setSavingGrades] = useState(false);

  // Add Single Grade Modal (for students with no grades)
  const [showAddSingleGradeModal, setShowAddSingleGradeModal] = useState(false);
  const [selectedStudentForGrade, setSelectedStudentForGrade] = useState(null);
  const [selectedSubjectForSingleGrade, setSelectedSubjectForSingleGrade] = useState("");
  const [singleAssignmentName, setSingleAssignmentName] = useState("");
  const [singleGradeValue, setSingleGradeValue] = useState("");
  const [singleGradeComments, setSingleGradeComments] = useState("");
  const [savingSingleGrade, setSavingSingleGrade] = useState(false);

  // Exam state
  const [subjectExams, setSubjectExams] = useState({}); // { subjectId: [exams] }
  const [loadingExams, setLoadingExams] = useState({}); // { subjectId: boolean }
  const [expandedExams, setExpandedExams] = useState({}); // { examId: boolean }
  const [showUploadExamModal, setShowUploadExamModal] = useState(false);
  const [selectedSubjectForExam, setSelectedSubjectForExam] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [examPdfFile, setExamPdfFile] = useState(null);
  const [uploadingExam, setUploadingExam] = useState(false);
  const [showExamAnswersModal, setShowExamAnswersModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examAnswers, setExamAnswers] = useState([]);
  const [gradingAnswer, setGradingAnswer] = useState(null);
  const [answerGradeValue, setAnswerGradeValue] = useState("");
  const [answerCommentsValue, setAnswerCommentsValue] = useState("");

  useEffect(() => {
    if (initialClassData) {
      loadClassDetails(initialClassData.id);
    }
  }, [initialClassData?.id]);

  const loadClassDetails = async (classId) => {
    setLoading(true);
    try {
      const data = await apiCall(`/api/classes/${classId}`);
      setClassData(data);
      if (data.subjects || data.Subjects) {
        const subjectsData = data.subjects || data.Subjects || [];
        setSubjects(subjectsData);
        // Load grades for all subjects (only for teachers)
        if (user?.role === "teacher") {
          subjectsData.forEach((subject) => {
            loadGradesForSubject(subject.id);
          });
        }
      } else {
        loadSubjects(classId);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async (classId) => {
    setLoadingSubjects(true);
    try {
      const data = await apiCall(`/api/subjects/class/${classId}`);
      setSubjects(data);
      // Load grades for all subjects (only for teachers)
      if (user?.role === "teacher") {
        data.forEach((subject) => {
          loadGradesForSubject(subject.id);
        });
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const loadGradesForSubject = async (subjectId) => {
    // Only load grades for teachers
    if (user?.role !== "teacher") {
      return;
    }
    
    setLoadingGrades((prev) => ({ ...prev, [subjectId]: true }));
    try {
      const grades = await apiCall(`/api/grades/subject/${subjectId}`);
      setSubjectGrades((prev) => ({ ...prev, [subjectId]: grades || [] }));
    } catch (error) {
      console.error(`Error loading grades for subject ${subjectId}:`, error);
      // If it's a 403 error, user might not be a teacher, so just set empty array
      // For other errors, also set empty array to prevent UI issues
      setSubjectGrades((prev) => ({ ...prev, [subjectId]: [] }));
    } finally {
      setLoadingGrades((prev) => ({ ...prev, [subjectId]: false }));
    }
  };

  const toggleSubjectExpansion = (subjectId) => {
    // Check if we're expanding (before state update)
    const isCurrentlyExpanded = expandedSubjects[subjectId];
    const willBeExpanded = !isCurrentlyExpanded;
    
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId],
    }));
    
    // Load data when expanding (use setTimeout to avoid state updates during render)
    if (willBeExpanded) {
      setTimeout(() => {
        // Load grades when expanding if not already loaded (only for teachers)
        if (user?.role === "teacher" && !subjectGrades[subjectId]) {
          loadGradesForSubject(subjectId);
        }
        // Load exams when expanding if not already loaded
        if (!subjectExams[subjectId] && !loadingExams[subjectId]) {
          loadExamsForSubject(subjectId);
        }
      }, 0);
    }
  };

  const getStudentGrade = (subjectId, studentId) => {
    const grades = subjectGrades[subjectId] || [];
    // Find grades for this student - check both studentId and student.id
    return grades.filter((g) => {
      const gradeStudentId = g.studentId || g.student?.id;
      return gradeStudentId === studentId || gradeStudentId === parseInt(studentId);
    });
  };

  const openEditGradeModal = (grade) => {
    setEditingGrade(grade);
    setEditGradeValue(String(grade.grade || ""));
    setEditAssignmentValue(grade.assignment || "");
    setEditCommentsValue(grade.comments || "");
  };

  const closeEditGradeModal = () => {
    setEditingGrade(null);
    setEditGradeValue("");
    setEditAssignmentValue("");
    setEditCommentsValue("");
  };

  const handleSaveGrade = async () => {
    if (!editingGrade) return;

    const gradeNum = parseFloat(editGradeValue);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      Alert.alert("Error", "Grade must be a number between 0 and 100");
      return;
    }

    setSavingGrade(true);
    try {
      await apiCall(`/api/grades/${editingGrade.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          grade: gradeNum,
          assignment: editAssignmentValue.trim() || null,
          comments: editCommentsValue.trim() || null,
        }),
      });

      Alert.alert("Success", "Grade updated successfully");
      
      // Reload grades for the subject
      const subjectId = editingGrade.subjectId;
      if (subjectId) {
        await loadGradesForSubject(subjectId);
      }
      
      closeEditGradeModal();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSavingGrade(false);
    }
  };

  // Add Student Functions
  const openAddStudentModal = async () => {
    setShowAddStudentModal(true);
    setLoadingAvailableStudents(true);
    try {
      const students = await apiCall("/api/classes/available-students");
      setAvailableStudents(students);
    } catch (error) {
      Alert.alert("Error", error.message);
      setShowAddStudentModal(false);
    } finally {
      setLoadingAvailableStudents(false);
    }
  };

  const closeAddStudentModal = () => {
    setShowAddStudentModal(false);
    setSelectedStudentIds([]);
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

  const handleAddStudents = async () => {
    if (selectedStudentIds.length === 0) {
      Alert.alert("Error", "Select at least one student");
      return;
    }

    setSavingGrade(true);
    try {
      await apiCall(`/api/classes/${classData.id}/students`, {
        method: "POST",
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });

      Alert.alert("Success", "Students added successfully");
      await loadClassDetails(classData.id);
      closeAddStudentModal();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSavingGrade(false);
    }
  };

  // Add Subject Functions
  const openAddSubjectModal = () => {
    setShowAddSubjectModal(true);
    setNewSubjectName("");
    setNewSubjectDesc("");
  };

  const closeAddSubjectModal = () => {
    setShowAddSubjectModal(false);
    setNewSubjectName("");
    setNewSubjectDesc("");
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      Alert.alert("Error", "Subject name is required");
      return;
    }

    setSavingSubject(true);
    try {
      await apiCall("/api/subjects", {
        method: "POST",
        body: JSON.stringify({
          classId: classData.id,
          name: newSubjectName.trim(),
          description: newSubjectDesc.trim() || null,
        }),
      });

      Alert.alert("Success", "Subject created successfully");
      await loadClassDetails(classData.id);
      closeAddSubjectModal();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSavingSubject(false);
    }
  };

  // Add Assignment/Grade Functions
  const openAddGradeModal = () => {
    if (classSubjects.length === 0) {
      Alert.alert("Error", "No subjects available. Please create a subject first.");
      return;
    }
    setShowAddGradeModal(true);
    setSelectedSubjectForGrade(classSubjects[0]?.id ? String(classSubjects[0].id) : "");
    setAssignmentName("");
    const grades = {};
    students.forEach((student) => {
      grades[student.id] = "";
    });
    setStudentGradesInput(grades);
  };

  const closeAddGradeModal = () => {
    setShowAddGradeModal(false);
    setSelectedSubjectForGrade("");
    setAssignmentName("");
    setStudentGradesInput({});
  };

  const handleAddGrades = async () => {
    if (!selectedSubjectForGrade) {
      Alert.alert("Error", "Select a subject");
      return;
    }

    if (!assignmentName.trim()) {
      Alert.alert("Error", "Assignment name is required");
      return;
    }

    const grades = [];
    Object.keys(studentGradesInput).forEach((studentId) => {
      const gradeValue = studentGradesInput[studentId];
      if (gradeValue !== "" && gradeValue !== null && gradeValue !== undefined) {
        const numGrade = parseFloat(gradeValue);
        if (!isNaN(numGrade) && numGrade >= 0 && numGrade <= 100) {
          grades.push({
            studentId: parseInt(studentId),
            grade: numGrade,
            assignment: assignmentName.trim(),
          });
        }
      }
    });

    if (grades.length === 0) {
      Alert.alert("Error", "Enter at least one grade");
      return;
    }

    setSavingGrades(true);
    try {
      await apiCall("/api/grades", {
        method: "POST",
        body: JSON.stringify({
          subjectId: parseInt(selectedSubjectForGrade),
          grades,
        }),
      });

      Alert.alert("Success", "Grades assigned successfully");
      await loadClassDetails(classData.id);
      closeAddGradeModal();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSavingGrades(false);
    }
  };

  // Delete Functions
  const handleDeleteStudent = async (studentId, studentName) => {
    Alert.alert(
      "Remove Student",
      `Are you sure you want to remove "${studentName}" from this class?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await apiCall(`/api/classes/${classData.id}/students/${studentId}`, {
                method: "DELETE",
              });
              Alert.alert("Success", "Student removed successfully");
              await loadClassDetails(classData.id);
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteSubject = async (subjectId, subjectName) => {
    Alert.alert(
      "Delete Subject",
      `Are you sure you want to delete "${subjectName}"? This will also delete all grades for this subject.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiCall(`/api/subjects/${subjectId}`, {
                method: "DELETE",
              });
              Alert.alert("Success", "Subject deleted successfully");
              await loadClassDetails(classData.id);
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteGrade = async (gradeId, subjectId) => {
    Alert.alert(
      "Delete Grade",
      "Are you sure you want to delete this grade?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiCall(`/api/grades/${gradeId}`, {
                method: "DELETE",
              });
              Alert.alert("Success", "Grade deleted successfully");
              await loadGradesForSubject(subjectId);
              await loadClassDetails(classData.id);
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  // Add Single Grade Functions
  const openAddSingleGradeModal = (student, subjectId) => {
    setSelectedStudentForGrade(student);
    setSelectedSubjectForSingleGrade(String(subjectId));
    setSingleAssignmentName("");
    setSingleGradeValue("");
    setSingleGradeComments("");
    setShowAddSingleGradeModal(true);
  };

  const closeAddSingleGradeModal = () => {
    setShowAddSingleGradeModal(false);
    setSelectedStudentForGrade(null);
    setSelectedSubjectForSingleGrade("");
    setSingleAssignmentName("");
    setSingleGradeValue("");
    setSingleGradeComments("");
  };

  const handleAddSingleGrade = async () => {
    if (!selectedStudentForGrade || !selectedSubjectForSingleGrade) {
      Alert.alert("Error", "Missing student or subject information");
      return;
    }

    if (!singleAssignmentName.trim()) {
      Alert.alert("Error", "Assignment name is required");
      return;
    }

    const gradeNum = parseFloat(singleGradeValue);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      Alert.alert("Error", "Grade must be a number between 0 and 100");
      return;
    }

    setSavingSingleGrade(true);
    try {
      await apiCall("/api/grades", {
        method: "POST",
        body: JSON.stringify({
          subjectId: parseInt(selectedSubjectForSingleGrade),
          grades: [
            {
              studentId: selectedStudentForGrade.id,
              grade: gradeNum,
              assignment: singleAssignmentName.trim(),
              comments: singleGradeComments.trim() || null,
            },
          ],
        }),
      });

      Alert.alert("Success", "Grade added successfully");
      await loadGradesForSubject(parseInt(selectedSubjectForSingleGrade));
      await loadClassDetails(classData.id);
      closeAddSingleGradeModal();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSavingSingleGrade(false);
    }
  };

  // Exam Functions
  const loadExamsForSubject = async (subjectId) => {
    setLoadingExams((prev) => ({ ...prev, [subjectId]: true }));
    try {
      const exams = await apiCall(`/api/exams/subject/${subjectId}`);
      setSubjectExams((prev) => ({ ...prev, [subjectId]: exams || [] }));
    } catch (error) {
      console.error(`Error loading exams for subject ${subjectId}:`, error);
      setSubjectExams((prev) => ({ ...prev, [subjectId]: [] }));
    } finally {
      setLoadingExams((prev) => ({ ...prev, [subjectId]: false }));
    }
  };

  const openUploadExamModal = () => {
    if (classSubjects.length === 0) {
      Alert.alert("Error", "No subjects available. Please create a subject first.");
      return;
    }
    setShowUploadExamModal(true);
    setSelectedSubjectForExam(classSubjects[0]?.id ? String(classSubjects[0].id) : "");
    setExamTitle("");
    setExamDescription("");
    setExamPdfFile(null);
  };

  const closeUploadExamModal = () => {
    setShowUploadExamModal(false);
    setSelectedSubjectForExam("");
    setExamTitle("");
    setExamDescription("");
    setExamPdfFile(null);
  };

  const handlePickExamPdf = async () => {
    try {
      let DocumentPicker;
      try {
        DocumentPicker = require("expo-document-picker");
      } catch (e) {
        Alert.alert(
          "Package Required",
          "Please install expo-document-picker:\n\nnpm install expo-document-picker"
        );
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setExamPdfFile(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("Error", "Failed to pick file. Please try again.");
    }
  };

  const handleUploadExam = async () => {
    if (!selectedSubjectForExam) {
      Alert.alert("Error", "Select a subject");
      return;
    }

    if (!examTitle.trim()) {
      Alert.alert("Error", "Exam title is required");
      return;
    }

    if (!examPdfFile) {
      Alert.alert("Error", "Please select an exam PDF file");
      return;
    }

    setUploadingExam(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();
      formData.append("subjectId", selectedSubjectForExam);
      formData.append("title", examTitle.trim());
      formData.append("description", examDescription.trim() || "");
      formData.append("examPdf", {
        uri: examPdfFile.uri,
        type: "application/pdf",
        name: examPdfFile.name || "exam.pdf",
      });

      const response = await fetch(`${API_BASE_URL}/api/exams`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `Request failed (${response.status})`);
      }

      const data = await response.json();
      Alert.alert("Success", "Exam uploaded successfully");
      await loadExamsForSubject(parseInt(selectedSubjectForExam));
      await loadClassDetails(classData.id);
      closeUploadExamModal();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setUploadingExam(false);
    }
  };

  const toggleExamExpansion = (examId) => {
    setExpandedExams((prev) => ({
      ...prev,
      [examId]: !prev[examId],
    }));
  };

  const openExamAnswersModal = async (exam) => {
    setSelectedExam(exam);
    setShowExamAnswersModal(true);
    try {
      const answers = await apiCall(`/api/exams/${exam.id}/answers`);
      setExamAnswers(answers || []);
    } catch (error) {
      Alert.alert("Error", error.message);
      setExamAnswers([]);
    }
  };

  const closeExamAnswersModal = () => {
    setShowExamAnswersModal(false);
    setSelectedExam(null);
    setExamAnswers([]);
    setGradingAnswer(null);
    setAnswerGradeValue("");
    setAnswerCommentsValue("");
  };

  const openGradeAnswerModal = (answer) => {
    setGradingAnswer(answer);
    setAnswerGradeValue(answer.grade ? String(answer.grade) : "");
    setAnswerCommentsValue(answer.comments || "");
  };

  const closeGradeAnswerModal = () => {
    setGradingAnswer(null);
    setAnswerGradeValue("");
    setAnswerCommentsValue("");
  };

  const handleSaveAnswerGrade = async () => {
    if (!gradingAnswer) return;

    const gradeNum = parseFloat(answerGradeValue);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      Alert.alert("Error", "Grade must be a number between 0 and 100");
      return;
    }

    setSavingGrade(true);
    try {
      await apiCall(`/api/exams/${gradingAnswer.examId}/answers/${gradingAnswer.id}/grade`, {
        method: "PATCH",
        body: JSON.stringify({
          grade: gradeNum,
          comments: answerCommentsValue.trim() || null,
        }),
      });

      Alert.alert("Success", "Grade saved successfully");
      // Reload answers
      const answers = await apiCall(`/api/exams/${gradingAnswer.examId}/answers`);
      setExamAnswers(answers || []);
      closeGradeAnswerModal();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSavingGrade(false);
    }
  };

  const downloadExamPdf = async (exam) => {
    try {
      const token = await AsyncStorage.getItem("token");
      
      // Create a file URI in the cache directory
      const fileName = `${exam.title || "exam"}_${exam.id}.pdf`.replace(/[^a-z0-9._-]/gi, "_");
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      // Download the file directly using FileSystem
      const downloadUrl = `${API_BASE_URL}/api/exams/${exam.id}/exam-pdf`;
      
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (downloadResult.status !== 200) {
        throw new Error("Failed to download exam PDF");
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share/save the file - this opens the native share dialog
        // On Android, this allows choosing where to save (Downloads, Drive, etc.)
        // On iOS, this allows saving to Files app or sharing via other apps
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Save Exam PDF",
          UTI: "com.adobe.pdf", // iOS UTI for PDF
        });
      } else {
        // Fallback: show file location
        Alert.alert(
          "Download Complete",
          `File saved to: ${downloadResult.uri}\n\nSharing is not available on this device.`
        );
      }
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", error.message || "Failed to download exam PDF");
    }
  };

  const downloadAnswerPdf = async (answer) => {
    try {
      const token = await AsyncStorage.getItem("token");
      
      // Create a file URI in the cache directory
      const fileName = `answer_${answer.id}.pdf`.replace(/[^a-z0-9._-]/gi, "_");
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      // Download the file directly using FileSystem
      const downloadUrl = `${API_BASE_URL}/api/exams/${answer.examId}/answers/${answer.id}/answer-pdf`;
      
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (downloadResult.status !== 200) {
        throw new Error("Failed to download answer PDF");
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share/save the file - this opens the native share dialog
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Save Answer PDF",
          UTI: "com.adobe.pdf", // iOS UTI for PDF
        });
      } else {
        // Fallback: show file location
        Alert.alert(
          "Download Complete",
          `File saved to: ${downloadResult.uri}\n\nSharing is not available on this device.`
        );
      }
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", error.message || "Failed to download answer PDF");
    }
  };

  const students = classData?.students || [];
  const classSubjects = subjects.length > 0 ? subjects : (classData?.subjects || classData?.Subjects || []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!classData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Class Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Class not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Details</Text>
        {user?.role === "teacher" && (
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={openAddStudentModal}
            >
              <Feather name="user-plus" size={18} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={openAddSubjectModal}
            >
              <Feather name="book" size={18} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={openAddGradeModal}
            >
              <Feather name="edit" size={18} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}
        {user?.role !== "teacher" && <View style={styles.placeholder} />}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Class Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="book-open" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>Class Information</Text>
          </View>
          <Text style={styles.className}>{classData.name}</Text>
          {classData.description && (
            <Text style={styles.classDescription}>{classData.description}</Text>
          )}
          <View style={styles.metaInfo}>
            {user?.role === "teacher" && (
              <View style={styles.metaItem}>
                <Feather name="users" size={16} color="#666" />
                <Text style={styles.metaText}>{students.length} Students</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Feather name="book" size={16} color="#666" />
              <Text style={styles.metaText}>{classSubjects.length} Subjects</Text>
            </View>
          </View>
        </View>

        {/* Students Section - Only for Teachers */}
        {user?.role === "teacher" && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="users" size={24} color="#007AFF" />
              <Text style={styles.cardTitle}>Students ({students.length})</Text>
            </View>
            {students.length === 0 ? (
              <Text style={styles.emptyText}>No students enrolled in this class</Text>
            ) : (
              <FlatList
                data={students}
                keyExtractor={(item) => String(item.id)}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.listItem}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemName}>{item.name}</Text>
                      <Text style={styles.listItemEmail}>{item.email}</Text>
                    </View>
                    {user?.role === "teacher" && (
                      <TouchableOpacity
                        onPress={() => handleDeleteStudent(item.id, item.name)}
                        style={styles.deleteIconButton}
                      >
                        <Feather name="trash-2" size={18} color="#f44336" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
            )}
          </View>
        )}

        {/* Subjects Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="book" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>
              {user?.role === "teacher" ? `Subjects & Grades (${classSubjects.length})` : `Subjects (${classSubjects.length})`}
            </Text>
          </View>
          {loadingSubjects ? (
            <ActivityIndicator size="small" color="#007AFF" style={styles.loadingIndicator} />
          ) : classSubjects.length === 0 ? (
            <Text style={styles.emptyText}>No subjects created for this class</Text>
          ) : (
            <FlatList
              data={classSubjects}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item: subject }) => {
                const isExpanded = expandedSubjects[subject.id];
                const grades = subjectGrades[subject.id] || [];
                const isLoading = loadingGrades[subject.id];
                const exams = subjectExams[subject.id] || [];
                const isLoadingExams = loadingExams[subject.id];

                return (
                  <View style={styles.subjectContainer}>
                    <TouchableOpacity
                      style={styles.subjectHeader}
                      onPress={() => toggleSubjectExpansion(subject.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.subjectHeaderContent}>
                        <View style={styles.subjectIcon}>
                          <Feather name="bookmark" size={20} color="#007AFF" />
                        </View>
                        <View style={styles.listItemContent}>
                          <Text style={styles.listItemName}>{subject.name}</Text>
                          {subject.description && (
                            <Text style={styles.listItemDescription}>{subject.description}</Text>
                          )}
                          {isExpanded && user?.role === "teacher" && (
                            <Text style={styles.gradesCount}>
                              {grades.length} grade{grades.length !== 1 ? "s" : ""} recorded
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.subjectHeaderActions}>
                        {user?.role === "teacher" && (
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeleteSubject(subject.id, subject.name);
                            }}
                            style={styles.deleteIconButton}
                          >
                            <Feather name="trash-2" size={18} color="#f44336" />
                          </TouchableOpacity>
                        )}
                        <Feather
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={20}
                          color="#666"
                        />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.gradesContainer}>
                        {user?.role === "student" ? (
                          // Student view - just show subject info
                          <View style={styles.subjectInfoContainer}>
                            <Text style={styles.subjectInfoText}>
                              {subject.description || "No description available"}
                            </Text>
                          </View>
                        ) : isLoading ? (
                          <ActivityIndicator
                            size="small"
                            color="#007AFF"
                            style={styles.loadingIndicator}
                          />
                        ) : students.length === 0 ? (
                          <Text style={styles.emptyText}>No students in this class</Text>
                        ) : (
                          <View style={styles.gradesTable}>
                            <View style={styles.gradesTableHeader}>
                              <Text style={styles.gradesTableHeaderText}>Student</Text>
                              <Text style={styles.gradesTableHeaderText}>Assignment</Text>
                              <Text style={styles.gradesTableHeaderText}>Grade</Text>
                              {user?.role === "teacher" && (
                                <Text style={styles.gradesTableHeaderText}>Actions</Text>
                              )}
                            </View>
                            {students.map((student) => {
                              const studentGradesList = getStudentGrade(subject.id, student.id);
                              if (studentGradesList.length === 0) {
                                return (
                                  <View key={student.id} style={styles.gradesTableRow}>
                                    <View style={styles.gradesTableCell}>
                                      <View style={styles.studentNameRow}>
                                        <View style={styles.smallAvatar}>
                                          <Text style={styles.smallAvatarText}>
                                            {student.name.charAt(0).toUpperCase()}
                                          </Text>
                                        </View>
                                        <Text style={styles.studentNameText}>{student.name}</Text>
                                      </View>
                                    </View>
                                    <Text style={[styles.gradesTableCell, styles.noGradeText]}>
                                      -
                                    </Text>
                                    <Text style={[styles.gradesTableCell, styles.noGradeText]}>
                                      No grades
                                    </Text>
                                    {user?.role === "teacher" && (
                                      <View style={[styles.gradesTableCell, styles.gradeActions]}>
                                        <TouchableOpacity
                                          onPress={() => openAddSingleGradeModal(student, subject.id)}
                                          style={styles.addGradeButton}
                                        >
                                          <Feather name="plus" size={16} color="#4caf50" />
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                  </View>
                                );
                              }
                              return studentGradesList.map((grade, index) => (
                                <View
                                  key={`${student.id}-${grade.id || index}`}
                                  style={styles.gradesTableRow}
                                >
                                  {index === 0 && (
                                    <View style={styles.gradesTableCell}>
                                      <View style={styles.studentNameRow}>
                                        {/* <View style={styles.smallAvatar}>
                                          <Text style={styles.smallAvatarText}>
                                            {student.name.charAt(0).toUpperCase()}
                                          </Text>
                                        </View> */}
                                        <Text style={styles.studentNameText}>{student.name}</Text>
                                      </View>
                                    </View>
                                  )}
                                  {index > 0 && <View style={styles.gradesTableCell} />}
                                  <Text style={styles.gradesTableCell}>
                                    {grade.assignment || "Null"}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.gradesTableCell,
                                      styles.gradeValue,
                                      (typeof grade.grade === "number" ? grade.grade : parseFloat(grade.grade) || 0) >= 90
                                        ? styles.gradeExcellent
                                        : (typeof grade.grade === "number" ? grade.grade : parseFloat(grade.grade) || 0) >= 70
                                        ? styles.gradeGood
                                        : (typeof grade.grade === "number" ? grade.grade : parseFloat(grade.grade) || 0) >= 60
                                        ? styles.gradeAverage
                                        : styles.gradePoor,
                                    ]}
                                  >
                                    {typeof grade.grade === "number"
                                      ? grade.grade.toFixed(1)
                                      : parseFloat(grade.grade || 0).toFixed(1)}
                                    
                                  </Text>
                                  {user?.role === "teacher" && (
                                    <View style={[styles.gradesTableCell, styles.gradeActions]}>
                                      <TouchableOpacity
                                        onPress={() => openEditGradeModal({ ...grade, subjectId: subject.id })}
                                        style={styles.editButton}
                                      >
                                        <Feather name="edit-2" size={16} color="#007AFF" />
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        onPress={() => handleDeleteGrade(grade.id, subject.id)}
                                        style={styles.deleteIconButton}
                                      >
                                        <Feather name="trash-2" size={16} color="#f44336" />
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </View>
                              ));
                            })}
                          </View>
                        )}

                        {/* Exams Section - Only for Teachers */}
                        {user?.role === "teacher" && (
                          <View style={styles.examsSection}>
                            <View style={styles.examsSectionHeader}>
                              <Text style={styles.examsSectionTitle}>Exams</Text>
                              <TouchableOpacity
                                style={styles.smallButton}
                                onPress={() => {
                                  setSelectedSubjectForExam(String(subject.id));
                                  setExamTitle("");
                                  setExamDescription("");
                                  setExamPdfFile(null);
                                  setShowUploadExamModal(true);
                                }}
                              >
                                <Feather name="plus" size={14} color="#007AFF" />
                                <Text style={styles.smallButtonText}>Upload</Text>
                              </TouchableOpacity>
                            </View>
                          {isLoadingExams ? (
                            <ActivityIndicator size="small" color="#007AFF" style={styles.loadingIndicator} />
                          ) : exams.length === 0 ? (
                            <Text style={styles.emptyText}>No exams uploaded</Text>
                          ) : (
                            exams.map((exam) => {
                              const isExamExpanded = expandedExams[exam.id];
                              const answerCount = exam.answers?.length || 0;
                              return (
                                <View key={exam.id} style={styles.examItem}>
                                  <TouchableOpacity
                                    style={styles.examHeader}
                                    onPress={() => toggleExamExpansion(exam.id)}
                                  >
                                    <View style={styles.examHeaderContent}>
                                      <Feather name="file-text" size={16} color="#007AFF" />
                                      <View style={styles.examInfo}>
                                        <Text style={styles.examTitle}>{exam.title}</Text>
                                        {exam.description && (
                                          <Text style={styles.examDescription}>{exam.description}</Text>
                                        )}
                                        {isExamExpanded && (
                                          <Text style={styles.examMeta}>
                                            {answerCount} answer{answerCount !== 1 ? "s" : ""} submitted
                                          </Text>
                                        )}
                                      </View>
                                    </View>
                                    <View style={styles.examHeaderActions}>
                                      {user?.role === "teacher" && answerCount > 0 && (
                                        <TouchableOpacity
                                          onPress={(e) => {
                                            e.stopPropagation();
                                            openExamAnswersModal(exam);
                                          }}
                                          style={styles.viewAnswersButton}
                                        >
                                          <Feather name="eye" size={14} color="#4caf50" />
                                          <Text style={styles.viewAnswersText}>View Answers</Text>
                                        </TouchableOpacity>
                                      )}
                                      <TouchableOpacity
                                        onPress={(e) => {
                                          e.stopPropagation();
                                          downloadExamPdf(exam);
                                        }}
                                        style={styles.downloadButton}
                                      >
                                        <Feather name="download" size={14} color="#007AFF" />
                                      </TouchableOpacity>
                                      <Feather
                                        name={isExamExpanded ? "chevron-up" : "chevron-down"}
                                        size={16}
                                        color="#666"
                                      />
                                    </View>
                                  </TouchableOpacity>
                                  {isExamExpanded && user?.role === "teacher" && (
                                    <View style={styles.examAnswersPreview}>
                                      {answerCount === 0 ? (
                                        <Text style={styles.emptyText}>No answers submitted yet</Text>
                                      ) : (
                                        <Text style={styles.examAnswersText}>
                                          {answerCount} student{answerCount !== 1 ? "s" : ""} submitted answers. Click "View Answers" to grade them.
                                        </Text>
                                      )}
                                    </View>
                                  )}
                                </View>
                              );
                            })
                          )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              }}
            />
          )}
        </View>
      </ScrollView>

      {/* Edit Grade Modal */}
      <Modal
        visible={editingGrade !== null}
        transparent
        animationType="slide"
        onRequestClose={closeEditGradeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit Grade</Text>
              <TouchableOpacity onPress={closeEditGradeModal}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.editModalBody}>
              <Text style={styles.editLabel}>Grade (0-100)</Text>
              <TextInput
                style={styles.editInput}
                value={editGradeValue}
                onChangeText={setEditGradeValue}
                keyboardType="numeric"
                placeholder="Enter grade"
                placeholderTextColor="#999"
              />

              <Text style={styles.editLabel}>Assignment</Text>
              <TextInput
                style={styles.editInput}
                value={editAssignmentValue}
                onChangeText={setEditAssignmentValue}
                placeholder="Assignment name"
                placeholderTextColor="#999"
              />

              <Text style={styles.editLabel}>Comments (Optional)</Text>
              <TextInput
                style={[styles.editInput, styles.editTextArea]}
                value={editCommentsValue}
                onChangeText={setEditCommentsValue}
                placeholder="Comments"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.editModalButtons}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelEditButton]}
                  onPress={closeEditGradeModal}
                  disabled={savingGrade}
                >
                  <Text style={styles.cancelEditButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveEditButton, savingGrade && styles.buttonDisabled]}
                  onPress={handleSaveGrade}
                  disabled={savingGrade}
                >
                  {savingGrade ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveEditButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Student Modal */}
      <Modal
        visible={showAddStudentModal}
        transparent
        animationType="slide"
        onRequestClose={closeAddStudentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Add Students</Text>
              <TouchableOpacity onPress={closeAddStudentModal}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.editModalBody}>
              {loadingAvailableStudents ? (
                <ActivityIndicator size="small" color="#007AFF" style={styles.loadingIndicator} />
              ) : availableStudents.length === 0 ? (
                <Text style={styles.emptyText}>No available students</Text>
              ) : (
                <ScrollView style={styles.studentList}>
                  {availableStudents.map((student) => (
                    <TouchableOpacity
                      key={student.id}
                      style={[
                        styles.studentSelectItem,
                        selectedStudentIds.includes(student.id) && styles.studentSelectItemSelected,
                      ]}
                      onPress={() => toggleStudentSelection(student.id)}
                    >
                      <Text style={styles.studentSelectText}>
                        {student.name} ({student.email})
                      </Text>
                      {selectedStudentIds.includes(student.id) && (
                        <Feather name="check" size={20} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <View style={styles.editModalButtons}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelEditButton]}
                  onPress={closeAddStudentModal}
                  disabled={savingGrade}
                >
                  <Text style={styles.cancelEditButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveEditButton, savingGrade && styles.buttonDisabled]}
                  onPress={handleAddStudents}
                  disabled={savingGrade || availableStudents.length === 0}
                >
                  {savingGrade ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveEditButtonText}>Add Students</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Subject Modal */}
      <Modal
        visible={showAddSubjectModal}
        transparent
        animationType="slide"
        onRequestClose={closeAddSubjectModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Add Subject</Text>
              <TouchableOpacity onPress={closeAddSubjectModal}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.editModalBody}>
              <Text style={styles.editLabel}>Subject Name</Text>
              <TextInput
                style={styles.editInput}
                value={newSubjectName}
                onChangeText={setNewSubjectName}
                placeholder="e.g. Algebra"
                placeholderTextColor="#999"
              />

              <Text style={styles.editLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.editInput, styles.editTextArea]}
                value={newSubjectDesc}
                onChangeText={setNewSubjectDesc}
                placeholder="Subject description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.editModalButtons}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelEditButton]}
                  onPress={closeAddSubjectModal}
                  disabled={savingSubject}
                >
                  <Text style={styles.cancelEditButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveEditButton, savingSubject && styles.buttonDisabled]}
                  onPress={handleAddSubject}
                  disabled={savingSubject}
                >
                  {savingSubject ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveEditButtonText}>Create Subject</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Assignment/Grade Modal */}
      <Modal
        visible={showAddGradeModal}
        transparent
        animationType="slide"
        onRequestClose={closeAddGradeModal}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.editModalContent}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Add Assignment & Grades</Text>
                <TouchableOpacity onPress={closeAddGradeModal}>
                  <Feather name="x" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.editModalBody}>
                <Text style={styles.editLabel}>Subject</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView style={styles.pickerScroll}>
                    {classSubjects.map((subject) => (
                      <TouchableOpacity
                        key={subject.id}
                        style={[
                          styles.pickerOption,
                          selectedSubjectForGrade === String(subject.id) && styles.pickerOptionSelected,
                        ]}
                        onPress={() => setSelectedSubjectForGrade(String(subject.id))}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            selectedSubjectForGrade === String(subject.id) && styles.pickerOptionTextSelected,
                          ]}
                        >
                          {subject.name}
                        </Text>
                        {selectedSubjectForGrade === String(subject.id) && (
                          <Feather name="check" size={18} color="#007AFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <Text style={styles.editLabel}>Assignment Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={assignmentName}
                  onChangeText={setAssignmentName}
                  placeholder="e.g. Midterm Exam"
                  placeholderTextColor="#999"
                />

                <Text style={styles.editLabel}>Student Grades (0-100)</Text>
                <ScrollView style={styles.gradesInputList}>
                  {students.map((student) => (
                    <View key={student.id} style={styles.gradeInputRow}>
                      <View style={styles.gradeInputStudentInfo}>
                        <View style={styles.smallAvatar}>
                          <Text style={styles.smallAvatarText}>
                            {student.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.gradeInputStudentName}>{student.name}</Text>
                      </View>
                      <TextInput
                        style={styles.gradeInputField}
                        value={String(studentGradesInput[student.id] || "")}
                        onChangeText={(text) => {
                          setStudentGradesInput((prev) => ({
                            ...prev,
                            [student.id]: text,
                          }));
                        }}
                        keyboardType="numeric"
                        placeholder="Grade"
                        placeholderTextColor="#999"
                      />
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.editModalButtons}>
                  <TouchableOpacity
                    style={[styles.editButton, styles.cancelEditButton]}
                    onPress={closeAddGradeModal}
                    disabled={savingGrades}
                  >
                    <Text style={styles.cancelEditButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editButton, styles.saveEditButton, savingGrades && styles.buttonDisabled]}
                    onPress={handleAddGrades}
                    disabled={savingGrades}
                  >
                    {savingGrades ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveEditButtonText}>Save Grades</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Add Single Grade Modal (for students with no grades) */}
      <Modal
        visible={showAddSingleGradeModal}
        transparent
        animationType="slide"
        onRequestClose={closeAddSingleGradeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Add Grade</Text>
              <TouchableOpacity onPress={closeAddSingleGradeModal}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.editModalBody}>
              {selectedStudentForGrade && (
                <View style={styles.studentInfoBox}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {selectedStudentForGrade.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.studentInfoName}>{selectedStudentForGrade.name}</Text>
                    <Text style={styles.studentInfoEmail}>{selectedStudentForGrade.email}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.editLabel}>Subject</Text>
              <View style={styles.pickerContainer}>
                <ScrollView style={styles.pickerScroll}>
                  {classSubjects.map((subj) => (
                    <TouchableOpacity
                      key={subj.id}
                      style={[
                        styles.pickerOption,
                        selectedSubjectForSingleGrade === String(subj.id) && styles.pickerOptionSelected,
                      ]}
                      onPress={() => setSelectedSubjectForSingleGrade(String(subj.id))}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          selectedSubjectForSingleGrade === String(subj.id) && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {subj.name}
                      </Text>
                      {selectedSubjectForSingleGrade === String(subj.id) && (
                        <Feather name="check" size={18} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.editLabel}>Assignment Name</Text>
              <TextInput
                style={styles.editInput}
                value={singleAssignmentName}
                onChangeText={setSingleAssignmentName}
                placeholder="e.g. Midterm Exam"
                placeholderTextColor="#999"
              />

              <Text style={styles.editLabel}>Grade (0-100)</Text>
              <TextInput
                style={styles.editInput}
                value={singleGradeValue}
                onChangeText={setSingleGradeValue}
                keyboardType="numeric"
                placeholder="Enter grade"
                placeholderTextColor="#999"
              />

              <Text style={styles.editLabel}>Comments (Optional)</Text>
              <TextInput
                style={[styles.editInput, styles.editTextArea]}
                value={singleGradeComments}
                onChangeText={setSingleGradeComments}
                placeholder="Comments"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.editModalButtons}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelEditButton]}
                  onPress={closeAddSingleGradeModal}
                  disabled={savingSingleGrade}
                >
                  <Text style={styles.cancelEditButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveEditButton, savingSingleGrade && styles.buttonDisabled]}
                  onPress={handleAddSingleGrade}
                  disabled={savingSingleGrade}
                >
                  {savingSingleGrade ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveEditButtonText}>Add Grade</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Upload Exam Modal */}
      <Modal
        visible={showUploadExamModal}
        transparent
        animationType="slide"
        onRequestClose={closeUploadExamModal}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.editModalContent}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Upload Exam</Text>
                <TouchableOpacity onPress={closeUploadExamModal}>
                  <Feather name="x" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <View style={styles.editModalBody}>
                <Text style={styles.editLabel}>Subject</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView style={styles.pickerScroll}>
                    {classSubjects.map((subj) => (
                      <TouchableOpacity
                        key={subj.id}
                        style={[
                          styles.pickerOption,
                          selectedSubjectForExam === String(subj.id) && styles.pickerOptionSelected,
                        ]}
                        onPress={() => setSelectedSubjectForExam(String(subj.id))}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            selectedSubjectForExam === String(subj.id) && styles.pickerOptionTextSelected,
                          ]}
                        >
                          {subj.name}
                        </Text>
                        {selectedSubjectForExam === String(subj.id) && (
                          <Feather name="check" size={18} color="#007AFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <Text style={styles.editLabel}>Exam Title *</Text>
                <TextInput
                  style={styles.editInput}
                  value={examTitle}
                  onChangeText={setExamTitle}
                  placeholder="e.g. Midterm Exam"
                  placeholderTextColor="#999"
                />

                <Text style={styles.editLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.editInput, styles.editTextArea]}
                  value={examDescription}
                  onChangeText={setExamDescription}
                  placeholder="Exam description"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <Text style={styles.editLabel}>Exam PDF *</Text>
                <TouchableOpacity
                  style={styles.excelButton}
                  onPress={handlePickExamPdf}
                >
                  <Feather name="upload" size={20} color="#2563eb" />
                  <Text style={styles.excelButtonText}>
                    {examPdfFile ? examPdfFile.name : "Select PDF File"}
                  </Text>
                </TouchableOpacity>
                {examPdfFile && (
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => setExamPdfFile(null)}
                  >
                    <Feather name="x" size={16} color="#f44336" />
                    <Text style={styles.removeFileText}>Remove File</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.editModalButtons}>
                  <TouchableOpacity
                    style={[styles.editButton, styles.cancelEditButton]}
                    onPress={closeUploadExamModal}
                    disabled={uploadingExam}
                  >
                    <Text style={styles.cancelEditButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editButton, styles.saveEditButton, uploadingExam && styles.buttonDisabled]}
                    onPress={handleUploadExam}
                    disabled={uploadingExam}
                  >
                    {uploadingExam ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveEditButtonText}>Upload Exam</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Exam Answers Modal */}
      <Modal
        visible={showExamAnswersModal}
        transparent
        animationType="slide"
        onRequestClose={closeExamAnswersModal}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.editModalContent}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>
                  {selectedExam?.title} - Answers
                </Text>
                <TouchableOpacity onPress={closeExamAnswersModal}>
                  <Feather name="x" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <View style={styles.editModalBody}>
                {examAnswers.length === 0 ? (
                  <Text style={styles.emptyText}>No answers submitted yet</Text>
                ) : (
                  examAnswers.map((answer) => (
                    <View key={answer.id} style={styles.answerItem}>
                      <View style={styles.answerHeader}>
                        <View style={styles.answerStudentInfo}>
                          <View style={styles.smallAvatar}>
                            <Text style={styles.smallAvatarText}>
                              {answer.student?.name?.charAt(0).toUpperCase() || "S"}
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.answerStudentName}>
                              {answer.student?.name || "Unknown"}
                            </Text>
                            <Text style={styles.answerStudentEmail}>
                              {answer.student?.email || ""}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.downloadButton}
                          onPress={() => downloadAnswerPdf(answer)}
                        >
                          <Feather name="download" size={16} color="#007AFF" />
                        </TouchableOpacity>
                      </View>
                      {answer.grade !== null && answer.grade !== undefined ? (
                        <View style={styles.answerGradeInfo}>
                          <Text style={styles.answerGradeLabel}>Grade:</Text>
                          <Text style={styles.answerGradeValue}>
                            {parseFloat(answer.grade).toFixed(1)}/100
                          </Text>
                          {answer.comments && (
                            <Text style={styles.answerComments}>{answer.comments}</Text>
                          )}
                        </View>
                      ) : (
                        <Text style={styles.answerNotGraded}>Not graded yet</Text>
                      )}
                      <TouchableOpacity
                        style={styles.gradeButton}
                        onPress={() => openGradeAnswerModal(answer)}
                      >
                        <Feather name="edit-2" size={14} color="#007AFF" />
                        <Text style={styles.gradeButtonText}>
                          {answer.grade !== null && answer.grade !== undefined ? "Edit Grade" : "Grade Answer"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Grade Answer Modal */}
      <Modal
        visible={gradingAnswer !== null}
        transparent
        animationType="slide"
        onRequestClose={closeGradeAnswerModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>
                Grade Answer - {gradingAnswer?.student?.name}
              </Text>
              <TouchableOpacity onPress={closeGradeAnswerModal}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.editModalBody}>
              <Text style={styles.editLabel}>Grade (0-100) *</Text>
              <TextInput
                style={styles.editInput}
                value={answerGradeValue}
                onChangeText={setAnswerGradeValue}
                keyboardType="numeric"
                placeholder="Enter grade"
                placeholderTextColor="#999"
              />

              <Text style={styles.editLabel}>Comments (Optional)</Text>
              <TextInput
                style={[styles.editInput, styles.editTextArea]}
                value={answerCommentsValue}
                onChangeText={setAnswerCommentsValue}
                placeholder="Comments"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.editModalButtons}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelEditButton]}
                  onPress={closeGradeAnswerModal}
                  disabled={savingGrade}
                >
                  <Text style={styles.cancelEditButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveEditButton, savingGrade && styles.buttonDisabled]}
                  onPress={handleSaveAnswerGrade}
                  disabled={savingGrade}
                >
                  {savingGrade ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveEditButtonText}>Save Grade</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    // marginTop: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    marginTop: 30,
  
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  className: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000",
  },
  classDescription: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
    lineHeight: 22,
  },
  metaInfo: {
    flexDirection: "row",
    marginTop: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  metaText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  listItemEmail: {
    fontSize: 14,
    color: "#666",
  },
  listItemDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    paddingVertical: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#888",
  },
  loadingIndicator: {
    paddingVertical: 20,
  },
  subjectContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  subjectHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  gradesContainer: {
    width: "110%",
    marginLeft: -43,
    paddingTop: 8,
    paddingBottom: 12,
    paddingLeft: 52, // Align with subject content
  },
  gradesCount: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  gradesTable: {
    marginTop: 8,
  },
  gradesTableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#ddd",
    marginBottom: 8,
  },
  gradesTableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
  },
  gradesTableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  gradesTableCell: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  studentNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  smallAvatarText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  studentNameText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  gradeValue: {
    fontWeight: "bold",
    textAlign: "left",
  },
  gradeExcellent: {
    color: "#4caf50",
  },
  gradeGood: {
    color: "#8bc34a",
  },
  gradeAverage: {
    color: "#ff9800",
  },
  gradePoor: {
    color: "#f44336",
  },
  noGradeText: {
    color: "#999",
    fontStyle: "italic",
  },
  editButton: {
    padding: 4,
  },
  deleteIconButton: {
    padding: 4,
    marginLeft: 8,
  },
  subjectHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gradeActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  editModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  editModalBody: {
    padding: 16,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  editTextArea: {
    height: 80,
    textAlignVertical: "top",
  },
  editModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
    width: "70%",
    
  },
  cancelEditButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,

  },
  cancelEditButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  saveEditButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    
  },
  saveEditButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  studentList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  studentSelectItem: {
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
  studentSelectItemSelected: {
    backgroundColor: "#e3f2fd",
    borderColor: "#007AFF",
  },
  studentSelectText: {
    fontSize: 14,
    color: "#000",
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 150,
  },
  pickerScroll: {
    maxHeight: 150,
  },
  pickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerOptionSelected: {
    backgroundColor: "#e3f2fd",
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#000",
  },
  pickerOptionTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  gradesInputList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  gradeInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  gradeInputStudentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  gradeInputStudentName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    marginLeft: 8,
  },
  gradeInputField: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: "center",
    fontSize: 14,
    backgroundColor: "#f9f9f9",
  },
  addGradeButton: {
    padding: 4,
  },
  studentInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f0f7ff",
    borderRadius: 8,
    marginBottom: 16,
  },
  studentInfoName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  studentInfoEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  subjectInfoContainer: {
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  subjectInfoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  examsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  examsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  examsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  smallButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#e3f2fd",
  },
  smallButtonText: {
    fontSize: 12,
    color: "#007AFF",
    marginLeft: 4,
    fontWeight: "600",
  },
  examItem: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  examHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  examHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  examInfo: {
    marginLeft: 12,
    flex: 1,
  },
  examTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  examDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  examMeta: {
    fontSize: 11,
    color: "#888",
    marginTop: 4,
  },
  examHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewAnswersButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#e8f5e9",
  },
  viewAnswersText: {
    fontSize: 11,
    color: "#4caf50",
    marginLeft: 4,
    fontWeight: "600",
  },
  downloadButton: {
    padding: 4,
  },
  examAnswersPreview: {
    padding: 12,
    backgroundColor: "#fff",
  },
  examAnswersText: {
    fontSize: 12,
    color: "#666",
  },
  answerItem: {
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  answerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  answerStudentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  answerStudentName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  answerStudentEmail: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  answerGradeInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#e8f5e9",
    borderRadius: 6,
  },
  answerGradeLabel: {
    fontSize: 12,
    color: "#666",
  },
  answerGradeValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4caf50",
    marginTop: 4,
  },
  answerComments: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  answerNotGraded: {
    fontSize: 12,
    color: "#ff9800",
    marginTop: 8,
    fontStyle: "italic",
  },
  gradeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#e3f2fd",
    alignSelf: "flex-start",
  },
  gradeButtonText: {
    fontSize: 12,
    color: "#007AFF",
    marginLeft: 4,
    fontWeight: "600",
  },
});

