// DMSApp/services/DocumentService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://apis.allsoft.co/api/documentManagement';

/**
 * Helper function to get the user token from AsyncStorage.
 * Throws an error if the token is not found.
 */
const getUserToken = async () => {
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken) {
        throw new Error('Authentication token not found. Please log in again.');
    }
    return userToken;
};

/**
 * Uploads a document to the server.
 * @param {string} fileUri - The URI of the file to upload.
 * @param {string} fileName - The name of the file.
 * @param {string} fileType - The MIME type of the file (e.g., 'image/jpeg', 'application/pdf').
 * @param {object} documentData - An object containing document metadata (major_head, minor_head, document_date, remarks, tags, user_id).
 * @returns {Promise<object>} - The API response.
 */
export const uploadDocument = async (fileUri, fileName, fileType, documentData) => {
    try {
        const userToken = await getUserToken();

        const formData = new FormData();
        // Append the file data
        formData.append('file', {
            uri: fileUri,
            name: fileName,
            type: fileType,
        });
        // Append the document metadata as a JSON string
        formData.append('data', JSON.stringify(documentData));

        const response = await fetch(`${API_BASE_URL}/saveDocumentEntry`, {
            method: 'POST',
            headers: {
                'token': userToken,
                // 'Content-Type': 'multipart/form-data' is typically set automatically by fetch when using FormData
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            // Handle HTTP errors (e.g., 401, 500)
            throw new Error(data.message || `API error: ${response.status}`);
        }
        return data;
    } catch (error) {
        console.error('Error uploading document:', error);
        throw error; // Re-throw to be handled by the calling component
    }
};

/**
 * Fetches existing document tags from the server.
 * @param {string} term - An optional search term to filter tags.
 * @returns {Promise<object>} - The API response, containing a list of tags.
 */
export const fetchDocumentTags = async (term = '') => {
    try {
        const userToken = await getUserToken();

        const response = await fetch(`${API_BASE_URL}/documentTags`, {
            method: 'POST',
            headers: {
                'token': userToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ term: term }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `API error: ${response.status}`);
        }
        return data; // Assuming data contains an array of tags (e.g., { success: true, data: [{ tag_name: 'RMC' }] })
    } catch (error) {
        console.error('Error fetching document tags:', error);
        throw error;
    }
};

/**
 * Searches for documents based on provided criteria.
 * @param {object} searchCriteria - An object containing search filters (major_head, minor_head, from_date, to_date, tags, etc.).
 * @returns {Promise<object>} - The API response, containing a list of matching documents.
 */
export const searchDocuments = async (searchCriteria) => {
    try {
        const userToken = await getUserToken();

        const response = await fetch(`${API_BASE_URL}/searchDocumentEntry`, {
            method: 'POST',
            headers: {
                'token': userToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(searchCriteria),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `API error: ${response.status}`);
        }
        return data; // Assuming data contains an array of documents
    } catch (error) {
        console.error('Error searching documents:', error);
        throw error;
    }
};

// Note: For download, you typically don't need a separate service function
// as react-native-fs handles the actual file download directly.
