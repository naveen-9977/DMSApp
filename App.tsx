// DMSApp/App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Import screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import UploadScreen from './screens/UploadScreen';
import SearchScreen from './screens/SearchScreen';
import PreviewScreen from './screens/PreviewScreen';

// Import AuthContext for state management
import { AuthProvider, useAuth } from './context/AuthContext';

const Stack = createNativeStackNavigator();

/**
 * AppContent component handles conditional rendering based on authentication state.
 * It uses the useAuth hook to get userToken and isLoading status.
 */
const AppContent = () => {
    const { userToken, isLoading } = useAuth();

    // Show a loading indicator while the authentication token is being loaded
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <Stack.Navigator>
            {/* If userToken exists, user is authenticated, show main app screens */}
            {userToken ? (
                <>
                    <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Document Management System' }} />
                    <Stack.Screen name="Upload" component={UploadScreen} options={{ title: 'Upload Document' }} />
                    <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search Documents' }} />
                    <Stack.Screen name="Preview" component={PreviewScreen} options={{ title: 'Document Preview' }} />
                </>
            ) : (
                // If no userToken, show the Login screen
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            )}
        </Stack.Navigator>
    );
};

/**
 * Main App component that provides the AuthContext and sets up NavigationContainer.
 */
const App = () => {
    return (
        <AuthProvider>
            <NavigationContainer>
                <AppContent />
            </NavigationContainer>
        </AuthProvider>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default App;
