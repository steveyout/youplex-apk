import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking, BackHandler } from 'react-native';

const ForceUpdateModal = ({ visible, updateData }) => {
    if (!visible || !updateData) return null;

    const handleUpdate = () => {
        Linking.openURL(updateData.downloadUrl);
    };

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>Update Required</Text>
                    <Text style={styles.version}>Version: {updateData.versionName}</Text>
                    <Text style={styles.description}>
                        To keep YouPlex running smoothly and securely, you need to install the latest update.
                    </Text>

                    <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                        <Text style={styles.buttonText}>Download & Install</Text>
                    </TouchableOpacity>

                    <Text style={styles.footer}>The app will close if you don't update.</Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E91E63', // Using your theme color
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    version: {
        fontSize: 14,
        color: '#E91E63',
        marginBottom: 15,
        fontWeight: '600',
    },
    description: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    button: {
        backgroundColor: '#E91E63',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 20,
        fontSize: 12,
        color: '#666',
    },
});

export default ForceUpdateModal;