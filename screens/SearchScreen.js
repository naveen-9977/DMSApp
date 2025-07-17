// DMSApp/screens/SearchScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    Alert,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { searchDocuments, fetchDocumentTags } from '../services/DocumentService';

/**
 * SearchScreen component allows users to search for documents using various filters
 * such as categories, tags, and date ranges. It displays the search results.
 */
const SearchScreen = ({ navigation }) => {
    const [majorHead, setMajorHead] = useState('');
    const [minorHead, setMinorHead] = useState('');
    const [tags, setTags] = useState([]); // Tags entered for search
    const [newTag, setNewTag] = useState(''); // Input for adding search tags
    const [availableTags, setAvailableTags] = useState([]); // Tags fetched from API for suggestions
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false); // Loading state for search

    // Minor head options based on major head selection (same as UploadScreen)
    const minorHeadOptions = {
        Personal: ['John', 'Tom', 'Emily', 'Sarah', 'David'],
        Professional: ['Accounts', 'HR', 'IT', 'Finance', 'Marketing', 'Operations'],
    };

    // Fetch all available tags for suggestions
    useEffect(() => {
        const getTags = async () => {
            try {
                const response = await fetchDocumentTags();
                if (response.success && Array.isArray(response.data)) {
                    setAvailableTags(response.data.map(tag => tag.tag_name));
                }
            } catch (error) {
                console.error('Failed to fetch available tags for search:', error);
            }
        };
        getTags();
    }, []);

    /**
     * Handles date change for the "From Date" picker.
     */
    const onFromDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || fromDate;
        setShowFromDatePicker(Platform.OS === 'ios');
        setFromDate(currentDate);
    };

    /**
     * Handles date change for the "To Date" picker.
     */
    const onToDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || toDate;
        setShowToDatePicker(Platform.OS === 'ios');
        setToDate(currentDate);
    };

    /**
     * Adds a new tag to the search tags list.
     */
    const handleAddTag = () => {
        const trimmedTag = newTag.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag]);
            setNewTag('');
        }
    };

    /**
     * Removes a tag from the search tags list.
     * @param {string} tagToRemove - The tag to be removed.
     */
    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    /**
     * Executes the document search based on current filter criteria.
     * Calls the DocumentService to perform the search.
     */
    const handleSearch = async () => {
        setLoading(true); // Start loading indicator

        // Format tags for API payload
        const formattedTags = tags.map(tag => ({ tag_name: tag }));

        const searchCriteria = {
            major_head: majorHead,
            minor_head: minorHead,
            from_date: fromDate ? fromDate.toISOString().split('T')[0] : '', // YYYY-MM-DD
            to_date: toDate ? toDate.toISOString().split('T')[0] : '',     // YYYY-MM-DD
            tags: formattedTags,
            uploaded_by: "", // Placeholder, if you need to filter by uploader
            start: 0,        // Pagination start index
            length: 10,      // Number of records per page
            filterId: "",    // Specific filter ID if applicable
            search: {
                value: ""    // Global search term (e.g., for document name)
            }
        };

        try {
            const results = await searchDocuments(searchCriteria);
            if (results.success && Array.isArray(results.data)) {
                setSearchResults(results.data); // Assuming results.data is the array of documents
                if (results.data.length === 0) {
                    Alert.alert('No Results', 'No documents found matching your criteria.');
                }
            } else {
                Alert.alert('Search Error', results.message || 'Failed to search documents.');
                setSearchResults([]);
            }
        } catch (error) {
            Alert.alert('Search Failed', error.message || 'An unexpected error occurred during search.');
            setSearchResults([]);
        } finally {
            setLoading(false); // Stop loading indicator
        }
    };

    /**
     * Renders each item in the FlatList of search results.
     * @param {object} item - The document object to render.
     */
    const renderDocumentItem = ({ item }) => (
        <View style={styles.documentItem}>
            <Text style={styles.documentName}>{item.document_name || 'Untitled Document'}</Text>
            <Text style={styles.documentDetail}>Category: {item.major_head} / {item.minor_head}</Text>
            <Text style={styles.documentDetail}>Date: {item.document_date}</Text>
            <Text style={styles.documentDetail}>Remarks: {item.document_remarks}</Text>
            <Text style={styles.documentDetail}>Tags: {item.tags && item.tags.map(tag => tag.tag_name).join(', ')}</Text>
            <View style={styles.documentActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Preview', { document: item })}
                >
                    <Text style={styles.actionButtonText}>Preview</Text>
                </TouchableOpacity>
                {/* Download functionality will be handled in PreviewScreen or directly here */}
                <TouchableOpacity
                    style={[styles.actionButton, styles.downloadButton]}
                    onPress={() => Alert.alert('Download', `Downloading ${item.document_name || 'document'}... (Functionality in Preview)`)}
                >
                    <Text style={styles.actionButtonText}>Download</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Text style={styles.sectionTitle}>Search Filters</Text>

                {/* Major Head Dropdown */}
                <Text style={styles.label}>Major Head:</Text>
                <View style={styles.pickerContainer}>
                    <Picker selectedValue={majorHead} onValueChange={setMajorHead}>
                        <Picker.Item label="-- All Major Heads --" value="" />
                        <Picker.Item label="Personal" value="Personal" />
                        <Picker.Item label="Professional" value="Professional" />
                    </Picker>
                </View>

                {/* Minor Head Dropdown (Dynamic) */}
                {majorHead ? (
                    <>
                        <Text style={styles.label}>Minor Head:</Text>
                        <View style={styles.pickerContainer}>
                            <Picker selectedValue={minorHead} onValueChange={setMinorHead}>
                                <Picker.Item label="-- All Minor Heads --" value="" />
                                {minorHeadOptions[majorHead] && minorHeadOptions[majorHead].map((item, index) => (
                                    <Picker.Item key={index} label={item} value={item} />
                                ))}
                            </Picker>
                        </View>
                    </>
                ) : null}

                {/* Tags Input Field for Search */}
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
                    placeholder="Add tag to search (e.g., invoice)"
                    value={newTag}
                    onChangeText={setNewTag}
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddTag}>
                    <Text style={styles.addButtonText}>Add Tag</Text>
                </TouchableOpacity>

                {/* Suggested Tags (from availableTags) */}
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

                {/* From Date Picker */}
                <Text style={styles.label}>From Date:</Text>
                <TouchableOpacity onPress={() => setShowFromDatePicker(true)} style={styles.datePickerButton}>
                    <Text style={styles.datePickerButtonText}>
                        {fromDate ? fromDate.toLocaleDateString() : "Select From Date"}
                    </Text>
                </TouchableOpacity>
                {showFromDatePicker && (
                    <DateTimePicker
                        value={fromDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={onFromDateChange}
                    />
                )}

                {/* To Date Picker */}
                <Text style={styles.label}>To Date:</Text>
                <TouchableOpacity onPress={() => setShowToDatePicker(true)} style={styles.datePickerButton}>
                    <Text style={styles.datePickerButtonText}>
                        {toDate ? toDate.toLocaleDateString() : "Select To Date"}
                    </Text>
                </TouchableOpacity>
                {showToDatePicker && (
                    <DateTimePicker
                        value={toDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={onToDateChange}
                    />
                )}

                {/* Search Button */}
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleSearch}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.searchButtonText}>Search Documents</Text>
                    )}
                </TouchableOpacity>

                {/* Search Results */}
                <Text style={styles.sectionTitle}>Search Results</Text>
                {searchResults.length > 0 ? (
                    <FlatList
                        data={searchResults}
                        keyExtractor={(item, index) => item.id || index.toString()} // Use a unique ID from item if available
                        renderItem={renderDocumentItem}
                        contentContainerStyle={styles.resultsList}
                    />
                ) : (
                    <Text style={styles.noResultsText}>
                        {loading ? 'Searching...' : 'Enter criteria and click "Search" to find documents.'}
                    </Text>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 50,
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
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: '#fff',
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
    searchButton: {
        backgroundColor: '#007bff',
        paddingVertical: 18,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    resultsList: {
        paddingBottom: 20, // Padding for the last item not to be cut off
    },
    documentItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    documentName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    documentDetail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 3,
    },
    documentActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    actionButton: {
        backgroundColor: '#17a2b8', // Info blue
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    downloadButton: {
        backgroundColor: '#28a745', // Success green
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    noResultsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#777',
        marginTop: 20,
    },
});

export default SearchScreen;
