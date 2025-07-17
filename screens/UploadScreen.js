// DMSApp/screens/UploadScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    Alert,
    Platform,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import { uploadDocument, fetchDocumentTags } from '../services/DocumentService';
import { useAuth } from '../context/AuthContext'; // To get user_id if available from auth

/**
 * UploadScreen component allows users to upload documents with various metadata.
 * Includes date picker, category dropdowns, tag input, remarks, and file/camera selection.
 */
const UploadScreen = () => {
    const { userToken } = useAuth(); // Assuming user ID can be derived from token or passed via context
    const [documentDate, setDocumentDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [majorHead, setMajorHead] = useState('');
    const [minorHead, setMinorHead] = useState('');
    const [remarks, setRemarks] = useState('');
    const [tags, setTags] = useState([]); // Tags currently selected/added by user
    const [newTag, setNewTag] = useState(''); // Input for adding new tags
    const [availableTags, setAvailableTags] = useState([]); // Tags fetched from API
    const [selectedFile, setSelectedFile] = useState(null); // Stores selected file object
    const [loading, setLoading] = useState(false); // Loading state for API calls

    // Define minor head options based on major head selection
    const minorHeadOptions = {
        Personal: ['John', 'Tom', 'Emily', 'Sarah', 'David'],
        Professional: ['Accounts', 'HR', 'IT', 'Finance', 'Marketing', 'Operations'],
    };

    // Fetch available tags from the backend when the component mounts
    useEffect(() => {
        const getTags = async () => {
            try {
                const response = await fetchDocumentTags();
                // Assuming response.data is an array like [{tag_name: "RMC"}, {tag_name: "2024"}]
                if (response.success && Array.isArray(response.data)) {
                    setAvailableTags(response.data.map(tag => tag.tag_name));
                } else {
                    Alert.alert('Error', response.message || 'Failed to fetch available tags.');
                }
            } catch (error) {
                Alert.alert('Error', `Failed to fetch tags: ${error.message}`);
            }
        };
        getTags();
    }, []);

    /**
     * Handles date change from the DateTimePicker.
     */
    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || documentDate;
        setShowDatePicker(Platform.OS === 'ios'); // Close picker on Android immediately
        setDocumentDate(currentDate);
    };

    /**
     * Opens the document picker to select image or PDF files.
     */
    const handleFilePick = async () => {
        try {
            const res = await DocumentPicker.pick({
                type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
            });
            // DocumentPicker returns an array, take the first selected file
            setSelectedFile(res[0]);
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                // User cancelled the picker
                console.log('User cancelled document picker');
            } else {
                console.error('DocumentPicker Error:', err);
                Alert.alert('Error', 'Failed to pick document. Please try again.');
            }
        }
    };

    /**
     * Launches the camera to take a photo.
     */
    const handleCameraCapture = async () => {
        try {
            const result = await launchCamera({
                mediaType: 'photo',
                quality: 0.5, // Compress image quality
                includeBase64: false, // No need for base64 for file upload
            });
            if (!result.didCancel && result.assets && result.assets.length > 0) {
                setSelectedFile(result.assets[0]); // Use the first asset
            }
        } catch (error) {
            console.error('Camera capture error:', error);
            Alert.alert('Error', 'Failed to capture image. Please check camera permissions.');
        }
    };

    /**
     * Adds a new tag to the tags list.
     * Prevents adding empty or duplicate tags.
     */
    const handleAddTag = () => {
        const trimmedTag = newTag.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag]);
            setNewTag(''); // Clear input field
            // In a real app, you might save new tags to the backend here or on document submission
        }
    };

    /**
     * Removes a tag from the tags list.
     * @param {string} tagToRemove - The tag to be removed.
     */
    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    /**
     * Handles the submission of the document upload form.
     * Validates inputs and calls the DocumentService to upload the document.
     */
    const handleSubmit = async () => {
        if (!selectedFile) {
            Alert.alert('Validation Error', 'Please select a file to upload.');
            return;
        }
        if (!majorHead || !minorHead) {
            Alert.alert('Validation Error', 'Please select both Major Head and Minor Head.');
            return;
        }
        if (tags.length === 0) {
            Alert.alert('Validation Error', 'Please add at least one tag.');
            return;
        }

        setLoading(true); // Start loading indicator

        // Format tags for API payload
        const formattedTags = tags.map(tag => ({ tag_name: tag }));
        const documentData = {
            major_head: majorHead,
            minor_head: minorHead,
            document_date: documentDate.toISOString().split('T')[0], // Format to YYYY-MM-DD
            document_remarks: remarks,
            tags: formattedTags,
            user_id: "example_user_id", // TODO: Replace with actual authenticated user ID
        };

        try {
            const response = await uploadDocument(
                selectedFile.uri,
                selectedFile.name,
                selectedFile.type,
                documentData
            );
            if (response.success) {
                Alert.alert('Success', 'Document uploaded successfully!');
                // Reset form fields after successful upload
                setDocumentDate(new Date());
                setMajorHead('');
                setMinorHead('');
                setRemarks('');
                setTags([]);
                setNewTag('');
                setSelectedFile(null);
            } else {
                Alert.alert('Upload Error', response.message || 'Failed to upload document.');
            }
        } catch (error) {
            Alert.alert('Upload Failed', error.message || 'An unexpected error occurred during upload.');
        } finally {
            setLoading(false); // Stop loading indicator
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <Text style={styles.sectionTitle}>Document Details</Text>

                    {/* Date Picker */}
                    <Text style={styles.label}>Document Date:</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                        <Text style={styles.datePickerButtonText}>
                            {documentDate.toLocaleDateString()}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={documentDate}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                        />
                    )}

                    {/* Major Head Dropdown */}
                    <Text style={styles.label}>Major Head:</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={majorHead}
                            onValueChange={(itemValue) => {
                                setMajorHead(itemValue);
                                setMinorHead(''); // Reset minor head when major head changes
                            }}>
                            <Picker.Item label="-- Select Major Head --" value="" />
                            <Picker.Item label="Personal" value="Personal" />
                            <Picker.Item label="Professional" value="Professional" />
                        </Picker>
                    </View>

                    {/* Minor Head Dropdown (Dynamic) */}
                    {majorHead ? (
                        <>
                            <Text style={styles.label}>Minor Head:</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={minorHead}
                                    onValueChange={(itemValue) => setMinorHead(itemValue)}>
                                    <Picker.Item label="-- Select Minor Head --" value="" />
                                    {minorHeadOptions[majorHead] && minorHeadOptions[majorHead].map((item, index) => (
                                        <Picker.Item key={index} label={item} value={item} />
                                    ))}
                                </Picker>
                            </View>
                        </>
                    ) : null}

                    {/* Tags Input Field */}
                    <Text style={styles.label}>Tags:</Text>
                    <View style={styles.tagsContainer}>
                        {tags.map((tag, index) => (
                            <View key={index} style={styles.tagChip}>
                                <Text style={styles.tagText}>{tag}</Text>
                                <TouchableOpacity onPress={() => handleRemoveTag(tag)} style={styles.removeTagButton}>
                                    <Text style={styles.removeTagText}>x</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Add new tag (e.g., invoice, 2024)"
                        value={newTag}
                        onChangeText={setNewTag}
                        onSubmitEditing={handleAddTag} // Add tag on Enter key press
                        returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.addButton} onPress={handleAddTag}>
                        <Text style={styles.addButtonText}>Add Tag</Text>
                    </TouchableOpacity>

                    {/* Available Tags as suggestions */}
                    {availableTags.length > 0 && (
                        <View style={styles.availableTagsContainer}>
                            <Text style={styles.availableTagsTitle}>Suggested Tags:</Text>
                            <View style={styles.tagsContainer}>
                                {availableTags.filter(tag => !tags.includes(tag)).map((tag, index) => (
                                    <TouchableOpacity key={index} style={styles.suggestedTagChip} onPress={() => {
                                        if (!tags.includes(tag)) setTags([...tags, tag]);
                                    }}>
                                        <Text style={styles.suggestedTagText}>{tag}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Remarks Text Field */}
                    <Text style={styles.label}>Remarks:</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Enter any remarks about the document"
                        value={remarks}
                        onChangeText={setRemarks}
                        multiline
                        numberOfLines={4}
                    />

                    <Text style={styles.sectionTitle}>File Upload</Text>
                    {/* File Upload/Camera Options */}
                    <TouchableOpacity style={styles.fileButton} onPress={handleFilePick}>
                        <Text style={styles.fileButtonText}>Pick Document (Image/PDF)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.fileButton} onPress={handleCameraCapture}>
                        <Text style={styles.fileButtonText}>Take Photo with Camera</Text>
                    </TouchableOpacity>

                    {selectedFile && (
                        <View style={styles.selectedFileContainer}>
                            <Text style={styles.selectedFileText}>Selected File:</Text>
                            <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
                        </View>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={loading} // Disable button when loading
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Upload Document</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 50, // Add some padding at the bottom for scrollability
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        marginTop: 10,
        color: '#333',
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#555',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#333',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top', // For Android
    },
    datePickerButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        backgroundColor: '#fff',
        alignItems: 'flex-start',
    },
    datePickerButtonText: {
        fontSize: 16,
        color: '#333',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: '#fff',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    tagChip: {
        backgroundColor: '#e0e0e0',
        borderRadius: 15,
        paddingVertical: 8,
        paddingHorizontal: 12,
        margin: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagText: {
        fontSize: 14,
        color: '#333',
        marginRight: 5,
    },
    removeTagButton: {
        marginLeft: 5,
        backgroundColor: '#ccc',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeTagText: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
    },
    addButton: {
        backgroundColor: '#28a745', // Green color for add button
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 15,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    availableTagsContainer: {
        marginTop: 10,
        marginBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 15,
    },
    availableTagsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#555',
    },
    suggestedTagChip: {
        backgroundColor: '#add8e6', // Light blue for suggested tags
        borderRadius: 15,
        paddingVertical: 8,
        paddingHorizontal: 12,
        margin: 4,
    },
    suggestedTagText: {
        fontSize: 14,
        color: '#0056b3',
    },
    fileButton: {
        backgroundColor: '#17a2b8', // Info blue color
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    fileButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    selectedFileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
        backgroundColor: '#e9ecef',
        padding: 10,
        borderRadius: 8,
    },
    selectedFileText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 5,
        color: '#333',
    },
    selectedFileName: {
        fontSize: 16,
        color: '#555',
        flexShrink: 1, // Allows text to wrap
    },
    submitButton: {
        backgroundColor: '#007bff',
        paddingVertical: 18,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default UploadScreen;
