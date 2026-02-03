import React from 'react';
import { StyleSheet, Platform, Linking } from 'react-native';
import { Modal, Text, Button, Card } from 'react-native-paper';

export const ForceUpdateModal = ({ visible }) => {
    const handleUpdate = () => {
        const url = Platform.OS === 'ios'
            ? 'https://apps.apple.com/app/id'
            : 'https://play.google.com/store/apps/details?id=';
        Linking.openURL(url);
    };

    return (
        <Modal visible={visible} dismissable={false} contentContainerStyle={styles.wrapper}>
            <Card style={styles.card}>
                <Card.Content style={styles.content}>
                    <Text variant="headlineSmall" style={styles.title}>Update Required</Text>
                    <Text style={styles.message}>Please update Youplex to the latest version to continue streaming.</Text>
                    <Button mode="contained" onPress={handleUpdate} style={styles.button}>
                        Update Now
                    </Button>
                </Card.Content>
            </Card>
        </Modal>
    );
};

const styles = StyleSheet.create({
    wrapper: { padding: 20, alignItems: 'center' },
    card: { borderRadius: 28, width: Platform.OS === 'web' ? 350 : '100%', padding: 10 },
    content: { alignItems: 'center' },
    title: { fontWeight: '900', color: '#E91E63', marginBottom: 10 },
    message: { textAlign: 'center', marginBottom: 20, opacity: 0.7 },
    button: { width: '100%', borderRadius: 12 }
});