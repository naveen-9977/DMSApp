// DMSApp/screens/LoginScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    Alert,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { generateOTP, validateOTP } from '../services/AuthService';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

/**
 * LoginScreen component handles OTP-based user authentication.
 * It allows users to enter their mobile number, generate OTP, and validate it.
 */
const LoginScreen = () => {
    const { signIn } = useAuth(); // Get the signIn function from AuthContext
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false); // State for loading indicator

    /**
     * Handles the generation of OTP.
     * Calls the AuthService to send OTP to the provided mobile number.
     */
    const handleGenerateOtp = async () => {
        if (!mobileNumber) {
            Alert.alert('Input Error', 'Please enter your mobile number.');
            return;
        }
        setLoading(true); // Start loading
        try {
            const response = await generateOTP(mobileNumber);
            if (response.success) {
                setOtpSent(true);
                Alert.alert('Success', 'OTP sent to your mobile number!');
            } else {
                Alert.alert('Error', response.message || 'Failed to send OTP. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false); // Stop loading
        }
    };

    /**
     * Handles the validation of OTP.
     * Calls the AuthService to validate the OTP and then signs in the user via AuthContext.
     */
    const handleValidateOtp = async () => {
        if (!mobileNumber || !otp) {
            Alert.alert('Input Error', 'Please enter both mobile number and OTP.');
            return;
        }
        setLoading(true); // Start loading
        try {
            const response = await validateOTP(mobileNumber, otp);
            if (response.success && response.token) {
                await signIn(response.token); // Use signIn from AuthContext
                Alert.alert('Success', 'Login successful!');
                // Navigation to Home screen is handled by App.js based on userToken state
            } else {
                Alert.alert('Error', response.message || 'Invalid OTP. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false); // Stop loading
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.innerContainer}>
                    <Text style={styles.title}>Welcome to DMS App</Text>
                    <Text style={styles.label}>Mobile Number:</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="phone-pad"
                        placeholder="Enter mobile number"
                        value={mobileNumber}
                        onChangeText={setMobileNumber}
                        editable={!otpSent && !loading} // Disable input once OTP is sent or loading
                    />

                    {!otpSent ? (
                        <Button
                            title={loading ? "Sending OTP..." : "Generate OTP"}
                            onPress={handleGenerateOtp}
                            disabled={loading}
                        />
                    ) : (
                        <>
                            <Text style={styles.label}>Enter OTP:</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="number-pad"
                                placeholder="Enter received OTP"
                                value={otp}
                                onChangeText={setOtp}
                                editable={!loading}
                            />
                            <Button
                                title={loading ? "Verifying..." : "Validate OTP"}
                                onPress={handleValidateOtp}
                                disabled={loading}
                            />
                            <Button
                                title="Resend OTP"
                                onPress={() => { setOtpSent(false); setOtp(''); }} // Allow resending
                                disabled={loading}
                                color="gray"
                            />
                        </>
                    )}
                    {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />}
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    innerContainer: {
        padding: 20,
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#333',
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
        color: '#333',
    },
    loadingIndicator: {
        marginTop: 20,
    },
});

export default LoginScreen;
