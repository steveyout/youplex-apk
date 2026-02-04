import React from 'react';
import { StyleSheet, Platform, Linking } from 'react-native';
import { Modal, Text, Button, Card } from 'react-native-paper';

export const ForceUpdateModal = ({ visible, downloadUrl }) => {
    const handleUpdate = () => {
        // If we have a direct APK link from GitHub, use it.
        // Otherwise, fallback to Store links.
        const fallbackUrl = Platform.OS === 'ios'
            ? 'https://apps.apple.com/app/idYOUR_ID'
            : 'https://play.google.com/store/apps/details?id=YOUR_ID';

        const finalUrl = (Platform.OS === 'android' && downloadUrl)
            ? downloadUrl
            : fallbackUrl;

        Linking.openURL(finalUrl);
    };

    return (
        <Modal visible={visible} dismissable={false} contentContainerStyle={styles.wrapper}>
            <Card style={styles.card}>
                <Card.Content style={styles.content}>
                    <Text variant="headlineSmall" style={styles.title}>Update Required</Text>
                    <Text style={styles.message}>
                        A new version of Youplex is available. Please update to continue streaming.
                    </Text>
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
    card: { borderRadius: 28, width: Platform.OS === 'web' ? 350 : '100%', padding: 10, backgroundColor: '#1a1a1a' },
    content: { alignItems: 'center' },
    title: { fontWeight: '900', color: '#E91E63', marginBottom: 10 },
    message: { textAlign: 'center', marginBottom: 20, opacity: 0.7, color: '#fff' },
    button: { width: '100%', borderRadius: 12, backgroundColor: '#E91E63' }
});