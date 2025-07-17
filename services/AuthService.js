// DMSApp/services/AuthService.js

const API_BASE_URL = 'https://apis.allsoft.co/api/documentManagement';

/**
 * Calls the API to generate an OTP for the given mobile number.
 * @param {string} mobileNumber - The user's mobile number.
 * @returns {Promise<object>} - The API response, typically containing success status and message.
 */
export const generateOTP = async (mobileNumber) => {
    try {
        const response = await fetch(`${API_BASE_URL}/generateOTP`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mobile_number: mobileNumber }),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error generating OTP:', error);
        // Re-throw to allow calling components to handle the error
        throw new Error('Network error or failed to generate OTP. Please check your connection.');
    }
};

/**
 * Calls the API to validate the provided OTP for the given mobile number.
 * @param {string} mobileNumber - The user's mobile number.
 * @param {string} otp - The OTP entered by the user.
 * @returns {Promise<object>} - The API response, typically containing success status and a token on success.
 */
export const validateOTP = async (mobileNumber, otp) => {
    try {
        const response = await fetch(`${API_BASE_URL}/validateOTP`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mobile_number: mobileNumber, otp: otp }),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error validating OTP:', error);
        // Re-throw to allow calling components to handle the error
        throw new Error('Network error or failed to validate OTP. Please try again.');
    }
};
