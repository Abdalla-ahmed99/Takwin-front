
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import { Ionicons, Feather, AntDesign } from "@expo/vector-icons";
import { useLanguage } from "../hooks/useLanguage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector, useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
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

// ---------- HOME SCREEN ----------
function HomeScreen({ navigation }) {
  const { t, rtl } = useLanguage();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editedName, setEditedName] = useState("");
  const { user } = useSelector((state) => state.user);

  // Load classes from API
  useEffect(() => {
    if (user?.role === "teacher" || user?.role === "student") {
      loadClasses();
    }
  }, [user]);

  // Refresh classes when screen comes into focus (e.g., returning from AddClass)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (user?.role === "teacher" || user?.role === "student") {
        loadClasses();
      }
    });

    return unsubscribe;
  }, [navigation, user]);

  const loadClasses = async () => {
    if (user?.role !== "teacher" && user?.role !== "student") return;

    setLoading(true);
    try {
      const data = await apiCall("/api/classes");
      setClasses(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
    setRefreshing(false);
  };

  // Handle class click - navigate to details
  const handleClassPress = (classItem) => {
    // Navigate to parent stack navigator
    const parentNavigator = navigation.getParent();
    if (parentNavigator) {
      parentNavigator.navigate("ClassDetails", { classData: classItem });
    } else {
      // Fallback if parent navigator is not available
      navigation.navigate("ClassDetails", { classData: classItem });
    }
  };

  // normalize incoming newClass and add to state (for backward compatibility)
  const handleAddClass = (newClass) => {
    // Refresh classes from API instead of adding locally
    loadClasses();
  };

  // navigate to AddClass screen and pass callback
  const goToAddClass = () => {
    // Navigate to parent stack navigator
    const parentNavigator = navigation.getParent();
    if (parentNavigator) {
      parentNavigator.navigate("AddClass", { onAddClass: handleAddClass });
    } else {
      // Fallback if parent navigator is not available
      navigation.navigate("AddClass", { onAddClass: handleAddClass });
    }
  };

  // delete class
  const deleteClass = async (classItem, index) => {
    Alert.alert(
      "Delete Class",
      `Are you sure you want to delete "${classItem.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // If it's a local class (string or simple object), remove it
            if (typeof classItem === "string" || !classItem.id) {
              setClasses((prev) => prev.filter((_, i) => i !== index));
              return;
            }

            // For API classes, delete via API
            setLoading(true);
            try {
              await apiCall(`/api/classes/${classItem.id}`, {
                method: "DELETE",
              });
              Alert.alert("Success", "Class deleted successfully");
              await loadClasses();
            } catch (error) {
              Alert.alert("Error", error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // open edit modal; accept item as string or object
  const openEditModal = (item, index) => {
    const name = typeof item === "string" ? item : item?.name ?? "";
    setEditedName(name);
    setEditingClass(index);
  };

  // save edited name, preserve original type (string -> string, object -> object with name)
  const saveEdit = () => {
    if (editedName.trim() === "") {
      Alert.alert("Error", "Please enter class name.");
      return;
    }

    setClasses((prev) => {
      const updated = [...prev];
      const original = updated[editingClass];

      if (typeof original === "string") {
        updated[editingClass] = editedName;
      } else {
        updated[editingClass] = { ...(original || {}), name: editedName };
      }

      return updated;
    });

    setEditingClass(null);
    setEditedName("");
  };

  // helper to render name regardless of item shape
  const renderName = (item) => (typeof item === "string" ? item : item?.name ?? "");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, rtl && { textAlign: 'right' }]}>{t('home')}</Text>

          <View style={styles.headerIcons}>
            <TouchableOpacity
               style={styles.iconButton}
               onPress={() => navigation.getParent()?.navigate("Settings")}
                                                  >
          <Feather name="settings" size={20} color="black" />
          </TouchableOpacity>

            {/* <TouchableOpacity style={styles.iconButton}>
              <Feather name="search" size={20} color="black" />
            </TouchableOpacity> */}
          {user?.role === "teacher" ? (
            <TouchableOpacity
              style={[styles.iconButton, styles.addCircle]}
              onPress={goToAddClass}
            >
              <AntDesign name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          ) : null}
          </View>
        </View>

        {/* Class List */}
        {loading && classes.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : classes.length === 0 ? (
          <Text style={[styles.emptyText, rtl && { textAlign: 'right' }]}>
            {user?.role === "teacher" ? t('no_classes_teacher') : t('no_classes_student')}
          </Text>
        ) : (
          <FlatList
            data={classes}
            keyExtractor={(item, index) => (item.id ? String(item.id) : index.toString())}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item, index }) => {
              const isApiClass = item.id !== undefined;
              const students = isApiClass ? (item.students || []).map((s) => s.name).join(", ") : "";
              const subjects = isApiClass
                ? (item.subjects || item.Subjects || []).map((s) => s.name).join(", ")
                : "";

              return (
                <TouchableOpacity
                  style={styles.classCard}
                  onPress={() => {
                    if (isApiClass) {
                      handleClassPress(item);
                    } else {
                      openEditModal(item, index);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.classCardContent}>
                    <Text style={styles.className}>{renderName(item)}</Text>
                    {isApiClass && (
                      <View style={styles.classInfo}>
                        {item.description && (
                          <Text style={styles.classDescription} numberOfLines={1}>
                            {item.description}
                          </Text>
                        )}
                        {user?.role === "teacher" && students && (
                          <Text style={styles.classMeta}>
                            <Feather name="users" size={14} color="#666" /> {item.students?.length || 0} students
                          </Text>
                        )}
                        {user?.role === "teacher" && subjects && (
                          <Text style={styles.classMeta}>
                            <Feather name="book" size={14} color="#666" /> {item.subjects?.length || item.Subjects?.length || 0} subjects
                          </Text>
                        )}
                        {user?.role === "student" && (
                          <>
                            {item.teacher && (
                              <Text style={styles.classMeta}>
                                <Feather name="user" size={14} color="#666" /> Teacher: {item.teacher?.name || "Unknown"}
                              </Text>
                            )}
                            {item.subjects && item.subjects.length > 0 && (
                              <View style={styles.subjectsList}>
                                <Text style={styles.subjectsLabel}>
                                  <Feather name="book" size={14} color="#666" /> Subjects:
                                </Text>
                                {item.subjects.map((subject, idx) => (
                                  <Text key={subject.id} style={styles.subjectTag}>
                                    {subject.name}{idx < item.subjects.length - 1 ? ", " : ""}
                                  </Text>
                                ))}
                              </View>
                            )}
                            {(!item.subjects || item.subjects.length === 0) && (
                              <Text style={styles.classMeta}>
                                <Feather name="book" size={14} color="#666" /> No subjects yet
                              </Text>
                            )}
                          </>
                        )}
                      </View>
                    )}
                  </View>

                  <View style={styles.actions}>
                    {!isApiClass && (
                      <>
                        <TouchableOpacity onPress={() => openEditModal(item, index)}>
                          <Feather name="edit-3" size={22} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteClass(item, index)}>
                          <Feather name="trash-2" size={22} color="red" />
                        </TouchableOpacity>
                      </>
                    )}
                    {isApiClass && user?.role === "teacher" && (
                      <>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            deleteClass(item, index);
                          }}
                          style={styles.deleteButton}
                        >
                          <Feather name="trash-2" size={20} color="red" />
                        </TouchableOpacity>
                        <Feather name="chevron-right" size={22} color="#007AFF" />
                      </>
                    )}
                    {isApiClass && user?.role !== "teacher" && (
                      <Feather name="chevron-right" size={22} color="#007AFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* EDIT MODAL */}
      <Modal visible={editingClass !== null} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Class</Text>

            <TextInput
              style={styles.input}
              placeholder="Class name"
              value={editedName}
              onChangeText={setEditedName}
            />

            <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setEditingClass(null);
                setEditedName("");
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ------ TABS ------
function ExamsScreen({ navigation }) {
  const { user } = useSelector((state) => state.user);
  const { t, rtl } = useLanguage();
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [answerPdfFile, setAnswerPdfFile] = useState({}); // { examId: file }
  const [uploadingAnswer, setUploadingAnswer] = useState({}); // { examId: boolean }
  const [showUploadAnswerModal, setShowUploadAnswerModal] = useState(false);
  const [selectedExamForAnswer, setSelectedExamForAnswer] = useState(null);
  
  // Modal state for student answer grading
  const [showStudentAnswerModal, setShowStudentAnswerModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [grade, setGrade] = useState("");
  const [comment, setComment] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    if (user?.role === "teacher" || user?.role === "student") {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (user?.role === "teacher" || user?.role === "student") {
        loadData();
      }
    });
    return unsubscribe;
  }, [navigation, user]);

  const loadData = async () => {
    if (user?.role !== "teacher" && user?.role !== "student") return;

    setLoading(true);
    try {
      if (user?.role === "teacher") {
        const [examsData, classesData] = await Promise.all([
          apiCall("/api/exams"),
          apiCall("/api/classes"),
        ]);
        setExams(examsData);
        setClasses(classesData);
      } else {
        // For students, only load exams
        const examsData = await apiCall("/api/exams");
        setExams(examsData);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStudentsForClass = (classId) => {
    const classData = classes.find((c) => c.id === classId);
    return classData?.students || [];
  };

  const getSubmittedStudents = (exam) => {
    return exam.answers?.map((answer) => ({
      student: answer.student,
      answerId: answer.id,
      grade: answer.grade,
      comments: answer.comments,
    })) || [];
  };

  const getNotSubmittedStudents = (exam) => {
    const classId = exam.Subject?.Class?.id;
    if (!classId) return [];

    const allStudents = getStudentsForClass(classId);
    const submittedStudentIds = exam.answers?.map((answer) => answer.studentId) || [];
    return allStudents.filter((student) => !submittedStudentIds.includes(student.id));
  };

  // Open modal for student answer
  const openStudentAnswerModal = (answerData, exam) => {
    setSelectedAnswer(answerData);
    setSelectedExam(exam);
    setGrade(answerData.grade !== null && answerData.grade !== undefined ? String(answerData.grade) : "");
    setComment(answerData.comments || "");
    setShowStudentAnswerModal(true);
  };

  // Close modal
  const closeStudentAnswerModal = () => {
    setShowStudentAnswerModal(false);
    setSelectedAnswer(null);
    setSelectedExam(null);
    setGrade("");
    setComment("");
  };

  // Download student answer PDF
  const downloadStudentAnswerPdf = async () => {
    if (!selectedAnswer || !selectedExam) return;

    try {
      const token = await AsyncStorage.getItem("token");
      
      // Create filename using student name and email
      const studentName = selectedAnswer.student?.name || "student";
      const studentEmail = selectedAnswer.student?.email || "unknown";
      const sanitizedName = studentName.replace(/[^a-z0-9._-]/gi, "_");
      const sanitizedEmail = studentEmail.replace(/[^a-z0-9._-]/gi, "_");
      const fileName = `${sanitizedName}_${sanitizedEmail}_answer_${selectedAnswer.answerId}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      // Download the file
      const downloadUrl = `${API_BASE_URL}/api/exams/${selectedExam.id}/answers/${selectedAnswer.answerId}/answer-pdf`;
      
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

      // Share/save the file
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: "application/pdf",
          dialogTitle: `Save Answer PDF - ${studentName}`,
          UTI: "com.adobe.pdf",
        });
      } else {
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

  // Save grade and comment
  const handleSaveGrade = async () => {
    if (!selectedAnswer || !selectedExam) return;

    const gradeNum = parseFloat(grade);
    if (grade === "" || isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      Alert.alert("Error", "Grade must be a number between 0 and 100");
      return;
    }

    setSavingGrade(true);
    try {
      await apiCall(`/api/exams/${selectedExam.id}/answers/${selectedAnswer.answerId}/grade`, {
        method: "PATCH",
        body: JSON.stringify({
          grade: gradeNum,
          comments: comment.trim() || null,
        }),
      });

      Alert.alert("Success", "Grade and comment saved successfully");
      // Reload exams to update the data
      await loadData();
      closeStudentAnswerModal();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSavingGrade(false);
    }
  };

  const goToCreateExam = () => {
    const parentNavigator = navigation.getParent();
    if (parentNavigator) {
      parentNavigator.navigate("Exam");
    } else {
      navigation.navigate("Exam");
    }
  };

  // Student functions
  const handlePickAnswerPdf = async (examId) => {
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
        setAnswerPdfFile((prev) => ({ ...prev, [examId]: result.assets[0] }));
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("Error", "Failed to pick file. Please try again.");
    }
  };

  const handleUploadAnswer = async (exam) => {
    const examId = exam.id;
    const file = answerPdfFile[examId];

    if (!file) {
      Alert.alert("Error", "Please select an answer PDF file");
      return;
    }

    // Check if already submitted
    const hasSubmitted = exam.answers && exam.answers.length > 0;
    if (hasSubmitted) {
      Alert.alert(
        "Already Submitted",
        "You have already submitted an answer for this exam. You cannot change it."
      );
      return;
    }

    setUploadingAnswer((prev) => ({ ...prev, [examId]: true }));
    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();
      formData.append("answerPdf", {
        uri: file.uri,
        type: "application/pdf",
        name: file.name || "answer.pdf",
      });

      const response = await fetch(`${API_BASE_URL}/api/exams/${examId}/answers`, {
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
      Alert.alert(
        "Success",
        "Answer uploaded successfully! Note: You can only upload once and cannot change it.",
        [
          {
            text: "OK",
            onPress: () => {
              setAnswerPdfFile((prev) => {
                const newState = { ...prev };
                delete newState[examId];
                return newState;
              });
              loadData();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setUploadingAnswer((prev) => ({ ...prev, [examId]: false }));
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

  const hasSubmittedAnswer = (exam) => {
    return exam.answers && exam.answers.length > 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, rtl && { textAlign: 'right' }]}>{t('exams')}</Text>
          <View style={styles.headerIcons}>
            {user?.role === "teacher" && (
              <TouchableOpacity
                style={[styles.iconButton, styles.addCircle]}
                onPress={goToCreateExam}
              >
                <Feather name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Exams List */}
        {loading && exams.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : exams.length === 0 ? (
          <Text style={[styles.emptyText, rtl && { textAlign: 'right' }]}>
            {user?.role === "teacher" ? t('no_exams_teacher') : t('no_exams_student')}
          </Text>
        ) : (
          <FlatList
            data={exams}
            keyExtractor={(item) => String(item.id)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item: exam }) => {
              if (user?.role === "teacher") {
                const submittedStudents = getSubmittedStudents(exam);
                const notSubmittedStudents = getNotSubmittedStudents(exam);
                const className = exam.Subject?.Class?.name || "Unknown Class";
                const subjectName = exam.Subject?.name || "Unknown Subject";

                return (
                  <View style={styles.examCard}>
                    <View style={styles.examCardHeader}>
                      <View style={styles.examCardContent}>
                        <Text style={styles.examTitle}>{exam.title}</Text>
                        <View style={styles.examMeta}>
                          <Text style={styles.examMetaText}>
                            <Feather name="book" size={14} color="#666" /> {subjectName}
                          </Text>
                          <Text style={styles.examMetaText}>
                            <Feather name="users" size={14} color="#666" /> {className}
                          </Text>
                        </View>
                        {exam.description && (
                          <Text style={styles.examDescription} numberOfLines={2}>
                            {exam.description}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Submitted Students */}
                    <View style={styles.studentsSection}>
                        <View style={styles.studentsSectionHeader}>
                          <Feather name="check-circle" size={16} color="#4caf50" />
                          <Text style={[styles.studentsSectionTitle, rtl && { textAlign: 'right' }]}>
                            {t('submitted')} ({submittedStudents.length})
                          </Text>
                        </View>
                      {submittedStudents.length === 0 ? (
                        <Text style={styles.noStudentsText}>No submissions yet</Text>
                      ) : (
                        <View style={styles.studentsList}>
                          {submittedStudents.map((answerData) => (
                            <TouchableOpacity
                              key={answerData.student.id}
                              style={styles.studentBadge}
                              onPress={() => openStudentAnswerModal(answerData, exam)}
                              activeOpacity={0.7}
                            >
                              <Text  >
                                {answerData.student.name || "Unknown"}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Not Submitted Students */}
                    {notSubmittedStudents.length > 0 && (
                      <View style={styles.studentsSection}>
                        <View style={styles.studentsSectionHeader}>
                          <Feather name="x-circle" size={16} color="#f44336" />
                          <Text style={[styles.studentsSectionTitle, rtl && { textAlign: 'right' }]}>
                            {t('not_submitted')} ({notSubmittedStudents.length})
                          </Text>
                        </View>
                        <View style={styles.studentsList}>
                          {notSubmittedStudents.map((student) => (
                            <View key={student.id} style={styles.studentBadge}>
                               <Text>
                                  {student.name}
                                </Text>
                               <Text style={[styles.studentName, styles.studentNameInactive]} numberOfLines={1}>
                                {student.name || "Unknown"}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              } else {
                // Student view
                const className = exam.Subject?.Class?.name || "Unknown Class";
                const subjectName = exam.Subject?.name || "Unknown Subject";
                const submitted = hasSubmittedAnswer(exam);
                const answerFile = answerPdfFile[exam.id];
                const uploading = uploadingAnswer[exam.id];

                return (
                  <View style={styles.examCard}>
                    <View style={styles.examCardHeader}>
                      <View style={styles.examCardContent}>
                        <Text style={styles.examTitle}>{exam.title}</Text>
                        <View style={styles.examMeta}>
                          <Text style={styles.examMetaText}>
                            <Feather name="book" size={14} color="#666" /> {subjectName}
                          </Text>
                          <Text style={styles.examMetaText}>
                            <Feather name="users" size={14} color="#666" /> {className}
                          </Text>
                        </View>
                        {exam.description && (
                          <Text style={styles.examDescription} numberOfLines={2}>
                            {exam.description}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Submission Status */}
                    {submitted && (
                      <View style={styles.submissionStatus}>
                        <Feather name="check-circle" size={16} color="#4caf50" />
                        <Text style={styles.submissionStatusText}>
                          You have already submitted your answer. You cannot change it.
                        </Text>
                      </View>
                    )}

                    {/* Actions for Students */}
                    <View style={styles.examActions}>
                      <TouchableOpacity
                        style={styles.downloadExamButton}
                        onPress={() => downloadExamPdf(exam)}
                      >
                        <Feather name="download" size={16} color="#007AFF" />
                        <Text style={styles.downloadExamButtonText}>{t('download_exam')}</Text>
                      </TouchableOpacity>

                      {!submitted && (
                        <View style={styles.uploadAnswerSection}>
                          <Text style={styles.uploadAnswerLabel}>{t('upload_your_answer')}</Text>
                          <TouchableOpacity
                            style={styles.selectFileButton}
                            onPress={() => handlePickAnswerPdf(exam.id)}
                          >
                            <Feather name="upload" size={16} color="#2563eb" />
                            <Text style={styles.selectFileButtonText}>
                              {answerFile ? answerFile.name : t('select_answer_pdf')}
                            </Text>
                          </TouchableOpacity>
                          {answerFile && (
                            <TouchableOpacity
                              style={styles.removeFileButton}
                              onPress={() => {
                                setAnswerPdfFile((prev) => {
                                  const newState = { ...prev };
                                  delete newState[exam.id];
                                  return newState;
                                });
                              }}
                            >
                              <Feather name="x" size={14} color="#f44336" />
                              <Text style={styles.removeFileText}>{t('remove')}</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={[
                              styles.uploadAnswerButton,
                              (!answerFile || uploading) && styles.uploadAnswerButtonDisabled,
                            ]}
                            onPress={() => handleUploadAnswer(exam)}
                            disabled={!answerFile || uploading}
                          >
                            {uploading ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Feather name="upload" size={16} color="#fff" />
                                <Text style={styles.uploadAnswerButtonText}>{t('upload_answer')}</Text>
                              </>
                            )}
                          </TouchableOpacity>
                          <Text style={styles.uploadWarning}>
                            ⚠️ {t('upload_once_warning')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              }
            }}
          />
        )}
      </View>

      {/* Student Answer Modal */}
      <Modal visible={showStudentAnswerModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedAnswer?.student?.name || "Student"} - Answer
            </Text>
            
            {/* Student Info */}
            <View style={styles.modalInfoSection}>
              <Text style={styles.modalInfoText}>
                <Text style={styles.modalInfoLabel}>Name: </Text>
                {selectedAnswer?.student?.name || "Unknown"}
              </Text>
              <Text style={styles.modalInfoText}>
                <Text style={styles.modalInfoLabel}>Email: </Text>
                {selectedAnswer?.student?.email || "Unknown"}
              </Text>
            </View>

            {/* Download Button */}
            <TouchableOpacity
              style={styles.downloadExamButton}
              onPress={downloadStudentAnswerPdf}
            >
              <Feather name="download" size={16} color="#007AFF" />
              <Text style={styles.downloadExamButtonText}>
                Download Answer PDF
              </Text>
            </TouchableOpacity>

            {/* Grade Input */}
            <Text style={styles.modalLabel}>Grade (0-100)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter grade"
              value={grade}
              onChangeText={setGrade}
              keyboardType="numeric"
              maxLength={6}
            />

            {/* Comment Input */}
            <Text style={styles.modalLabel}>Comment</Text>
            <TextInput
              style={[styles.input, styles.commentInput]}
              placeholder="Enter comment (optional)"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.saveButton, savingGrade && styles.saveButtonDisabled]}
              onPress={handleSaveGrade}
              disabled={savingGrade}
            >
              {savingGrade ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save Grade & Comment</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeStudentAnswerModal}
              disabled={savingGrade}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const Exams = ExamsScreen;

// ---------- RESULTS SCREEN ----------
function Results({ navigation }) {
  const { user } = useSelector((state) => state.user);
  const { t, rtl } = useLanguage();
  const [grades, setGrades] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role === "student") {
      loadResults();
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (user?.role === "student") {
        loadResults();
      }
    });
    return unsubscribe;
  }, [navigation, user]);

  const loadResults = async () => {
    if (user?.role !== "student") return;

    setLoading(true);
    try {
      const [gradesData, examsData] = await Promise.all([
        apiCall("/api/grades/my-grades"),
        apiCall("/api/exams"),
      ]);
      setGrades(gradesData || []);
      setExams(examsData || []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResults();
    setRefreshing(false);
  };

  // Get exam answers with grades for the student
  const getStudentExamAnswers = () => {
    const examAnswers = [];
    exams.forEach((exam) => {
      if (exam.answers && exam.answers.length > 0) {
        exam.answers.forEach((answer) => {
          if (answer.grade !== null && answer.grade !== undefined) {
            examAnswers.push({
              examId: exam.id,
              examTitle: exam.title,
              subjectName: exam.Subject?.name || "Unknown Subject",
              className: exam.Subject?.Class?.name || "Unknown Class",
              grade: answer.grade,
              comments: answer.comments,
              submittedAt: answer.createdAt,
            });
          }
        });
      }
    });
    return examAnswers;
  };

  if (user?.role !== "student") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={[styles.title, rtl && { textAlign: 'right' }]}>{t('results')}</Text>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={[styles.emptyText, rtl && { textAlign: 'right' }]}>{t('access_denied_student')}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const examAnswers = getStudentExamAnswers();
  const hasGrades = grades.length > 0;
  const hasExamScores = examAnswers.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={[styles.title, rtl && { textAlign: 'right' }]}>{t('results')}</Text>
        </View>

        {loading && !hasGrades && !hasExamScores ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : !hasGrades && !hasExamScores ? (
          <Text style={[styles.emptyText, rtl && { textAlign: 'right' }]}>{t('no_results')}</Text>
        ) : (
          <FlatList
            data={[]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListHeaderComponent={
              <>
                {/* Grades Section - Only show if grades exist */}
                {hasGrades && (
                  <View style={styles.resultsSection}>
                    <View style={styles.resultsSectionHeader}>
                      <Feather name="award" size={20} color="#007AFF" />
                      <Text style={styles.resultsSectionTitle}>Assignment Grades</Text>
                    </View>
                    <FlatList
                      data={grades}
                      keyExtractor={(item) => String(item.id)}
                      scrollEnabled={false}
                      renderItem={({ item: grade }) => (
                        <View style={styles.resultCard}>
                          <View style={styles.resultCardHeader}>
                            <Text style={styles.resultCardTitle}>
                              {grade.assignment || "Assignment"}
                            </Text>
                            <View style={styles.resultCardGrade}>
                              <Text
                                style={[
                                  styles.resultGradeValue,
                                  (typeof grade.grade === "number"
                                    ? grade.grade
                                    : parseFloat(grade.grade) || 0) >= 90
                                    ? styles.gradeExcellent
                                    : (typeof grade.grade === "number"
                                      ? grade.grade
                                      : parseFloat(grade.grade) || 0) >= 70
                                    ? styles.gradeGood
                                    : (typeof grade.grade === "number"
                                      ? grade.grade
                                      : parseFloat(grade.grade) || 0) >= 60
                                    ? styles.gradeAverage
                                    : styles.gradePoor,
                                ]}
                              >
                                {typeof grade.grade === "number"
                                  ? grade.grade.toFixed(1)
                                  : parseFloat(grade.grade || 0).toFixed(1)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.resultCardMeta}>
                            <Text style={styles.resultCardSubject}>
                              <Feather name="book" size={14} color="#666" /> {grade.Subject?.name || "Unknown Subject"}
                            </Text>
                            <Text style={styles.resultCardClass}>
                              <Feather name="users" size={14} color="#666" /> {grade.Subject?.Class?.name || "Unknown Class"}
                            </Text>
                          </View>
                          {grade.comments && (
                            <Text style={styles.resultCardComments}>{grade.comments}</Text>
                          )}
                        </View>
                      )}
                    />
                  </View>
                )}

                {/* Exam Scores Section - Only show if exam scores exist */}
                {hasExamScores && (
                  <View style={styles.resultsSection}>
                    <View style={styles.resultsSectionHeader}>
                      <Feather name="file-text" size={20} color="#4caf50" />
                      <Text style={styles.resultsSectionTitle}>{t('exam_scores')}</Text>
                    </View>
                    <FlatList
                      data={examAnswers}
                      keyExtractor={(item, index) => `${item.examId}-${index}`}
                      scrollEnabled={false}
                      renderItem={({ item: examAnswer }) => (
                        <View style={styles.resultCard}>
                          <View style={styles.resultCardHeader}>
                            <Text style={styles.resultCardTitle}>{examAnswer.examTitle}</Text>
                            <View style={styles.resultCardGrade}>
                              <Text
                                style={[
                                  styles.resultGradeValue,
                                  (typeof examAnswer.grade === "number"
                                    ? examAnswer.grade
                                    : parseFloat(examAnswer.grade) || 0) >= 90
                                    ? styles.gradeExcellent
                                    : (typeof examAnswer.grade === "number"
                                      ? examAnswer.grade
                                      : parseFloat(examAnswer.grade) || 0) >= 70
                                    ? styles.gradeGood
                                    : (typeof examAnswer.grade === "number"
                                      ? examAnswer.grade
                                      : parseFloat(examAnswer.grade) || 0) >= 60
                                    ? styles.gradeAverage
                                    : styles.gradePoor,
                                ]}
                              >
                                {typeof examAnswer.grade === "number"
                                  ? examAnswer.grade.toFixed(1)
                                  : parseFloat(examAnswer.grade || 0).toFixed(1)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.resultCardMeta}>
                            <Text style={styles.resultCardSubject}>
                              <Feather name="book" size={14} color="#666" /> {examAnswer.subjectName}
                            </Text>
                            <Text style={styles.resultCardClass}>
                              <Feather name="users" size={14} color="#666" /> {examAnswer.className}
                            </Text>
                          </View>
                          {examAnswer.comments && (
                            <Text style={styles.resultCardComments}>{examAnswer.comments}</Text>
                          )}
                        </View>
                      )}
                    />
                  </View>
                )}
              </>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const Achievements = () => (
  <View style={styles.center}>
    <Text>Achievements</Text>
  </View>
);

const Tab = createBottomTabNavigator();

export default function Home() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "black",
        tabBarStyle: { height: 85, paddingBottom: 10, paddingTop: 10 },
        tabBarIcon: ({ color }) => {
          if (route.name === "Home") {
            return <Ionicons name="home-outline" size={26} color={color} />;
          } else if (route.name === "Exams") {
            return <Feather name="check-square" size={26} color={color} />;
          } else if (route.name === "Results") {
            return <Feather name="grid" size={26} color={color} />;
          } else if (route.name === "Achievements") {
            return <Ionicons name="ribbon-outline" size={26} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Exams" component={Exams} />
      <Tab.Screen name="Results" component={Results} />
      <Tab.Screen name="Achievements" component={Achievements} />
    </Tab.Navigator>
  );
}

// ------ STYLES ------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { flex: 1, padding: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  title: { fontSize: 28, fontWeight: "bold" },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: 50,
    padding: 8,
    marginLeft: 8,
  },
  addCircle: { backgroundColor: "#007AFF" },
  emptyText: { textAlign: "center", fontSize: 16, color: "#888", marginTop: 40 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  classCard: {
    backgroundColor: "#f8f8f8",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  classCardContent: {
    flex: 1,
    marginRight: 12,
  },
  className: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  classInfo: {
    marginTop: 4,
  },
  classDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  classMeta: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  actions: { flexDirection: "row", gap: 12, alignItems: "center" },
  deleteButton: {
    padding: 4,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },
  saveText: { color: "#fff", fontWeight: "bold" },
  cancelButton: {
    backgroundColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },
  cancelText: { color: "#333", fontWeight: "bold" },
  // Exam Card Styles
  examCard: {
    backgroundColor: "#f8f8f8",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  examCardHeader: {
    marginBottom: 12,
  },
  examCardContent: {
    flex: 1,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000",
  },
  examMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  examMetaText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  examDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  studentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  studentsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  studentsSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  studentsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  studentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    maxWidth: "48%",
  },
  studentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4caf50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  studentAvatarInactive: {
    backgroundColor: "#ccc",
  },
  studentAvatarText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  studentName: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  studentNameInactive: {
    color: "#999",
  },
  noStudentsText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  // Student Home Styles
  subjectsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  subjectsLabel: {
    fontSize: 12,
    color: "#666",
    marginRight: 4,
  },
  subjectTag: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  // Student Exam Styles
  submissionStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  submissionStatusText: {
    fontSize: 12,
    color: "#4caf50",
    fontWeight: "500",
    flex: 1,
  },
  examActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  downloadExamButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  downloadExamButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  uploadAnswerSection: {
    marginTop: 8,
  },
  uploadAnswerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  selectFileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    marginBottom: 8,
    gap: 8,
  },
  selectFileButtonText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
  },
  uploadAnswerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  uploadAnswerButtonDisabled: {
    opacity: 0.6,
  },
  uploadAnswerButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  uploadWarning: {
    fontSize: 11,
    color: "#ff9800",
    marginTop: 8,
    fontStyle: "italic",
    textAlign: "center",
  },
  // Results Screen Styles
  resultsSection: {
    marginBottom: 24,
  },
  resultsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  resultsSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  resultCard: {
    backgroundColor: "#f8f8f8",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  resultCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resultCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  resultCardGrade: {
    marginLeft: 12,
  },
  resultGradeValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  gradeExcellent: {
    color: "#4caf50",
  },
  gradeGood: {
    color: "#2196F3",
  },
  gradeAverage: {
    color: "#FF9800",
  },
  gradePoor: {
    color: "#f44336",
  },
  resultCardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  resultCardSubject: {
    fontSize: 12,
    color: "#666",
  },
  resultCardClass: {
    fontSize: 12,
    color: "#666",
  },
  resultCardComments: {
    fontSize: 13,
    color: "#555",
    marginTop: 8,
    fontStyle: "italic",
  },
  // Student Answer Modal Styles
  modalInfoSection: {
    width: "100%",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalInfoText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
  },
  modalInfoLabel: {
    fontWeight: "600",
    color: "#666",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  commentInput: {
    height: 100,
    textAlignVertical: "top",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
});
