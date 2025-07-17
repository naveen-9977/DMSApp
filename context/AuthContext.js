// DMSApp/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a Context for authentication
const AuthContext = createContext();

/**
 * AuthProvider component manages the authentication state (user token).
 * It loads the token from AsyncStorage on app start and provides functions to sign in/out.
 */
export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Function to load the user token from AsyncStorage
        const loadToken = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                setUserToken(token); // Set the token in state
            } catch (e) {
                console.error('Failed to load token from AsyncStorage:', e);
            } finally {
                setIsLoading(false); // Mark loading as complete
            }
        };
        loadToken(); // Call the function when the component mounts
    }, []); // Empty dependency array ensures this runs only once on mount

    /**
     * Signs in the user by storing the token in AsyncStorage and updating state.
     * @param {string} token - The authentication token received from the backend.
     */
    const signIn = async (token) => {
        try {
            await AsyncStorage.setItem('userToken', token);
            setUserToken(token);
        } catch (e) {
            console.error('Failed to save token to AsyncStorage:', e);
        }
    };

    /**
     * Signs out the user by removing the token from AsyncStorage and clearing state.
     */
    const signOut = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            setUserToken(null);
        } catch (e) {
            console.error('Failed to remove token from AsyncStorage:', e);
        }
    };

    // Provide the authentication state and functions to children components
    return (
        <AuthContext.Provider value={{ userToken, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Custom hook to easily access the authentication context.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
