import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Sparkles, Download, ArrowRight } from 'lucide-react-native';

export const ForceUpdateModal = ({ visible, updateData, onDismiss }) => {
    if (!visible || !updateData) return null;

    const handleUpdate = () => {
        if (updateData.downloadUrl) {
            Linking.openURL(updateData.downloadUrl);
        }
    };

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <BlurView intensity={85} tint="dark" style={styles.modalContainer}>
                    <View style={styles.iconCircle}>
                        <Sparkles color="#FF3030" size={28} />
                    </View>

                    <Text style={styles.title}>Update Required</Text>
                    <Text style={styles.version}>Version: {updateData.versionName}</Text>
                    <Text style={styles.description}>
                        To keep Youplex running smoothly and enjoy new features, please install the latest update.
                    </Text>

                    <Pressable style={styles.buttonWrapper} onPress={handleUpdate}>
                        <LinearGradient
                            colors={['#FF4565', '#FF3030', '#B71833']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.button}
                        >
                            <Download color="#FFFFFF" size={18} />
                            <Text style={styles.buttonText}>Download & Install</Text>
                        </LinearGradient>
                    </Pressable>

                    {/* Allow dismissing in local dev / testing */}
                    {Boolean(onDismiss) && (
                        <Pressable style={styles.dismissBtn} onPress={onDismiss}>
                            <Text style={styles.dismissBtnText}>Continue Anyway (Dev / Test)</Text>
                            <ArrowRight color="#8A99A8" size={16} />
                        </Pressable>
                    )}

                    <Text style={styles.footer}>
                        {typeof __DEV__ !== 'undefined' && __DEV__
                            ? 'Development mode active'
                            : "The app will close if you don't update."}
                    </Text>
                </BlurView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(5, 5, 5, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 420,
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1.2,
        borderColor: 'rgba(255, 48, 48, 0.35)',
        overflow: 'hidden',
        shadowColor: '#FF3030',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 12,
    },
    iconCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: 'rgba(255, 48, 48, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 48, 48, 0.3)',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    version: {
        fontSize: 14,
        color: '#FF4D4D',
        marginBottom: 14,
        fontWeight: '700',
    },
    description: {
        fontSize: 14,
        color: '#919EAB',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 24,
    },
    buttonWrapper: {
        width: '100%',
        borderRadius: 25,
        overflow: 'hidden',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 25,
        gap: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
    dismissBtn: {
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        gap: 6,
    },
    dismissBtnText: {
        color: '#E0E6ED',
        fontSize: 13,
        fontWeight: '700',
    },
    footer: {
        marginTop: 18,
        fontSize: 12,
        color: '#637381',
    },
});

export default ForceUpdateModal;
