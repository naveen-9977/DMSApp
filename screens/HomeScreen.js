// DMSApp/screens/HomeScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

/**
 * HomeScreen component provides navigation options to other parts of the application
 * and allows the user to sign out.
 */
const HomeScreen = ({ navigation }) => {
    const { signOut } = useAuth(); // Get the signOut function from AuthContext

    return (
        <View style={styles.container}>
            <Text style={styles.welcomeText}>Welcome to Document Management System!</Text>

            {/* Button to navigate to Upload Document screen */}
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Upload')}
            >
                <Text style={styles.buttonText}>Upload Document</Text>
            </TouchableOpacity>

            {/* Button to navigate to Search Documents screen */}
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Search')}
            >
                <Text style={styles.buttonText}>Search Documents</Text>
            </TouchableOpacity>

            {/* Button to sign out */}
            <TouchableOpacity
                style={[styles.button, styles.signOutButton]}
                onPress={signOut}
            >
                <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    welcomeText: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 40,
        color: '#333',
    },
    button: {
        backgroundColor: '#007bff',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        marginBottom: 15,
        width: '80%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    signOutButton: {
        backgroundColor: '#dc3545', // Red color for sign out
        marginTop: 30,
    },
});

export default HomeScreen;
