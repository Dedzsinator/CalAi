import { Platform, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export const requestCameraPermission = async (): Promise<boolean> => {
    try {
        const permission = Platform.OS === 'ios' 
            ? PERMISSIONS.IOS.CAMERA 
            : PERMISSIONS.ANDROID.CAMERA;

        const result = await check(permission);

        switch (result) {
            case RESULTS.UNAVAILABLE:
                Alert.alert('Camera not available', 'This device does not have a camera.');
                return false;

            case RESULTS.DENIED:
                const requestResult = await request(permission);
                return requestResult === RESULTS.GRANTED;

            case RESULTS.LIMITED:
            case RESULTS.GRANTED:
                return true;

            case RESULTS.BLOCKED:
                Alert.alert(
                    'Camera permission required',
                    'Please enable camera access in your device settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Settings', onPress: () => Linking.openSettings() }
                    ]
                );
                return false;

            default:
                return false;
        }
    } catch (error) {
        console.error('Error requesting camera permission:', error);
        return false;
    }
};

export const requestStoragePermission = async (): Promise<boolean> => {
    try {
        if (Platform.OS === 'ios') {
            // iOS doesn't require explicit storage permissions for app documents
            return true;
        }

        const permission = PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
        const result = await check(permission);

        switch (result) {
            case RESULTS.UNAVAILABLE:
                // Permission not available on this device
                return true;

            case RESULTS.DENIED:
                const requestResult = await request(permission);
                return requestResult === RESULTS.GRANTED;

            case RESULTS.LIMITED:
            case RESULTS.GRANTED:
                return true;

            case RESULTS.BLOCKED:
                Alert.alert(
                    'Storage permission required',
                    'Please enable storage access in your device settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Settings', onPress: () => Linking.openSettings() }
                    ]
                );
                return false;

            default:
                return false;
        }
    } catch (error) {
        console.error('Error requesting storage permission:', error);
        return false;
    }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
    try {
        const permission = Platform.OS === 'ios'
            ? PERMISSIONS.IOS.NOTIFICATIONS
            : PERMISSIONS.ANDROID.POST_NOTIFICATIONS;

        const result = await check(permission);

        switch (result) {
            case RESULTS.UNAVAILABLE:
                // Notifications not available
                return false;

            case RESULTS.DENIED:
                const requestResult = await request(permission);
                return requestResult === RESULTS.GRANTED;

            case RESULTS.LIMITED:
            case RESULTS.GRANTED:
                return true;

            case RESULTS.BLOCKED:
                Alert.alert(
                    'Notification permission required',
                    'Please enable notifications in your device settings to receive meal reminders.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Settings', onPress: () => Linking.openSettings() }
                    ]
                );
                return false;

            default:
                return false;
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
};
