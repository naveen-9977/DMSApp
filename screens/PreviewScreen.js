// DMSApp/screens/PreviewScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Dimensions,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    ScrollView
} from 'react-native';
import Pdf from 'react-native-pdf';
import RNFS from 'react-native-fs'; // For file system operations

const { width, height } = Dimensions.get('window');

/**
 * PreviewScreen component displays a preview of a selected document (image or PDF)
 * and provides options to download the document.
 */
const PreviewScreen = ({ route }) => {
    const { document } = route.params; // Get the document object passed via navigation params
    const [downloading, setDownloading] = useState(false); // State for download loading

    // Determine file type based on URL extension
    const fileExtension = document.file_url ? document.file_url.split('.').pop().toLowerCase() : '';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
    const isPdf = fileExtension === 'pdf';

    /**
     * Handles the download of the document.
     * Uses react-native-fs to save the file to the device's download directory.
     */
    const handleDownload = async () => {
        if (!document.file_url) {
            Alert.alert('Error', 'File URL is missing. Cannot download.');
            return;
        }

        setDownloading(true);
        const fileName = document.document_name || `document_${Date.now()}.${fileExtension}`;
        // Determine download directory based on platform
        const downloadDest = Platform.select({
            ios: `${RNFS.DocumentDirectoryPath}/${fileName}`,
            android: `${RNFS.DownloadDirectoryPath}/${fileName}`,
        });

        try {
            const response = await RNFS.downloadFile({
                fromUrl: document.file_url,
                toFile: downloadDest,
                background: true, // Allow download to continue in background
                discretionary: true, // For iOS, allows system to optimize download
                progress: (res) => {
                    // Optional: Update download progress (res.bytesWritten / res.contentLength)
                    console.log(`Downloaded: ${res.bytesWritten} / ${res.contentLength}`);
                },
            }).promise;

            if (response.statusCode === 200) {
                Alert.alert('Success', `File downloaded to: ${downloadDest}`);
            } else {
                Alert.alert('Download Error', `Failed to download file. Status: ${response.statusCode}`);
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Download Failed', `An error occurred during download: ${error.message}`);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Text style={styles.title}>{document.document_name || 'Document Preview'}</Text>

                {/* Conditional rendering for Image preview */}
                {isImage && (
                    <Image
                        source={{ uri: document.file_url }}
                        style={styles.media}
                        resizeMode="contain" // Ensures the entire image is visible
                        onError={(e) => console.error('Image loading error:', e.nativeEvent.error)}
                    />
                )}

                {/* Conditional rendering for PDF preview */}
                {isPdf && (
                    <Pdf
                        source={{ uri: document.file_url, cache: true }} // Cache PDF for better performance
                        onLoadComplete={(numberOfPages, filePath) => {
                            console.log(`Number of pages: ${numberOfPages}`);
                        }}
                        onPageChanged={(page, numberOfPages) => {
                            console.log(`Current page: ${page}`);
                        }}
                        onError={(error) => {
                            console.error('PDF loading error:', error);
                            Alert.alert('Error', 'Failed to load PDF document.');
                        }}
                        style={styles.media}
                        // Enable zooming and scrolling for PDF
                        enablePaging={false}
                        horizontal={false}
                        showsVerticalScrollIndicator={true}
                        showsHorizontalScrollIndicator={false}
                    />
                )}

                {/* Message for unsupported file types */}
                {!isImage && !isPdf && (
                    <View style={styles.unsupportedContainer}>
                        <Text style={styles.message}>
                            Preview not available for this file type ({fileExtension || 'unknown'}).
                        </Text>
                        <Text style={styles.message}>You can still try to download it.</Text>
                    </View>
                )}

                {/* Document Details */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.detailText}><Text style={styles.detailLabel}>Category:</Text> {document.major_head} / {document.minor_head}</Text>
                    <Text style={styles.detailText}><Text style={styles.detailLabel}>Date:</Text> {document.document_date}</Text>
                    <Text style={styles.detailText}><Text style={styles.detailLabel}>Remarks:</Text> {document.document_remarks || 'N/A'}</Text>
                    <Text style={styles.detailText}><Text style={styles.detailLabel}>Tags:</Text> {document.tags && document.tags.map(tag => tag.tag_name).join(', ') || 'N/A'}</Text>
                </View>

                {/* Download Button */}
                <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={handleDownload}
                    disabled={downloading}
                >
                    {downloading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.downloadButtonText}>Download Document</Text>
                    )}
                </TouchableOpacity>

                {/* Placeholder for "Download All as ZIP" - requires backend support */}
                <TouchableOpacity
                    style={[styles.downloadButton, styles.zipDownloadButton]}
                    onPress={() => Alert.alert('Feature Info', 'Downloading all files as a ZIP requires a backend API endpoint to generate the archive. This functionality is not implemented on the frontend yet.')}
                >
                    <Text style={styles.downloadButtonText}>Download All as ZIP</Text>
                </TouchableOpacity>
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
        alignItems: 'center',
        paddingBottom: 50,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    media: {
        width: width * 0.9, // 90% of screen width
        height: height * 0.5, // 50% of screen height
        backgroundColor: '#e9ecef',
        marginBottom: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        overflow: 'hidden', // Ensures content respects border-radius
    },
    unsupportedContainer: {
        backgroundColor: '#ffe0b2', // Light orange background
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffcc80',
    },
    message: {
        fontSize: 16,
        color: '#e65100', // Darker orange text
        textAlign: 'center',
        marginBottom: 5,
    },
    detailsContainer: {
        width: '100%',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    detailText: {
        fontSize: 15,
        marginBottom: 5,
        color: '#555',
    },
    detailLabel: {
        fontWeight: 'bold',
        color: '#333',
    },
    downloadButton: {
        backgroundColor: '#28a745', // Success green
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 10,
        alignItems: 'center',
        width: '80%',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    downloadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    zipDownloadButton: {
        backgroundColor: '#6c757d', // Gray color for secondary action
    },
});

export default PreviewScreen;
