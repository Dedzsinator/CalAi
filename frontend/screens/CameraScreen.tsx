import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraView, CameraType, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import AIService from '../services/ai';
import ApiService from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface FoodPrediction {
  food_name: string;
  confidence: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion_estimate: string;
}

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanMode, setIsScanMode] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getCameraPermissions();

    const startPulseAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    const startScanLineAnimation = () => {
      Animated.loop(
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        })
      ).start();
    };

    startPulseAnimation();
    if (isScanMode) {
      startScanLineAnimation();
    }
  }, [isScanMode, pulseAnim, scanLineAnim]);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const takePicture = async () => {
    if (cameraRef.current && !isProcessing) {
      setIsProcessing(true);

      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        if (photo) {
          await processImage(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const pickImage = async () => {
    if (isProcessing) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to select images.');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      // Show processing feedback
      Alert.alert('Processing', 'Analyzing your food...', [], { cancelable: false });

      let predictions: FoodPrediction[] = [];

      // Try AI inference
      try {
        predictions = await AIService.classifyFood(imageUri);
      } catch (aiError) {
        console.error('AI inference failed:', aiError);
        // Fallback to manual entry
        predictions = [{
          food_name: 'Unknown food',
          confidence: 0.1,
          calories: 300,
          protein: 10,
          carbs: 30,
          fat: 10,
          portion_estimate: '1 serving',
        }];
      }

      // Navigate to meal confirmation screen with results
      router.push({
        pathname: '/meal-confirmation',
        params: {
          imageUri: encodeURIComponent(imageUri),
          predictions: JSON.stringify(predictions),
        },
      });

    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scannedData === data || isProcessing) return; // Prevent duplicate scans and overlapping processing

    console.log('Barcode scanned:', { type, data });
    setScannedData(data);
    setIsProcessing(true);

    try {
      // Look up barcode in database
      console.log('Looking up barcode in database...');
      const result = await ApiService.lookupBarcode(data);

      if (result.success && result.data.product) {
        const product = result.data.product;
        const prediction: FoodPrediction = {
          food_name: product.name,
          confidence: 0.95,
          calories: product.nutrition.calories,
          protein: product.nutrition.protein,
          carbs: product.nutrition.carbs,
          fat: product.nutrition.fat,
          portion_estimate: '1 serving',
        };

        console.log('Product found:', product);
        // Navigate to meal confirmation with barcode data
        router.push({
          pathname: '/meal-confirmation',
          params: {
            predictions: JSON.stringify([prediction]),
            barcode: data,
            brand: product.brand,
          },
        });
      } else {
        console.log('Product not found in database');
        Alert.alert(
          'Product Not Found',
          'This barcode wasn\'t found in our database. Would you like to add it manually?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setScannedData(null);
                setIsProcessing(false);
              }
            },
            {
              text: 'Add Manually',
              onPress: () => {
                setScannedData(null);
                setIsProcessing(false);
                router.push('/manual-entry');
              }
            },
          ]
        );
      }
    } catch (error) {
      console.error('Barcode lookup failed:', error);
      Alert.alert(
        'Lookup Failed',
        'Failed to look up this barcode. Would you like to add it manually?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setScannedData(null);
              setIsProcessing(false);
            }
          },
          {
            text: 'Add Manually',
            onPress: () => {
              setScannedData(null);
              setIsProcessing(false);
              router.push('/manual-entry');
            }
          },
        ]
      );
    } finally {
      // Reset state after a delay to prevent immediate re-scanning
      setTimeout(() => {
        setScannedData(null);
        setIsProcessing(false);
      }, 2000);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  const toggleScanMode = () => {
    setIsScanMode(current => !current);
    setScannedData(null);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera" size={64} color="#666" />
        <Text style={styles.noAccessText}>No access to camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={getCameraPermissions}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
          barcodeScannerSettings={
            isScanMode
              ? {
                barcodeTypes: [
                  'ean13',
                  'ean8',
                  'upc_a',
                  'upc_e',
                  'code128',
                  'code39',
                  'qr',
                ],
              }
              : undefined
          }
          onBarcodeScanned={isScanMode ? handleBarCodeScanned : undefined}
        />

        {/* Camera Overlay */}
        <View style={styles.overlay}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={() => router.back()}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.modeIndicator}>
              <Text style={styles.modeText}>
                {isScanMode ? 'Barcode Scanner' : 'Food Camera'}
              </Text>
            </View>

            <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
              <Ionicons
                name={flash === 'on' ? 'flash' : 'flash-off'}
                size={24}
                color={flash === 'on' ? '#FFD700' : 'white'}
              />
            </TouchableOpacity>
          </View>

          {/* Scan Area */}
          {isScanMode ? (
            <View style={styles.scanArea}>
              <View style={styles.scanFrame}>
                <View style={[styles.scanCorner, styles.topLeft]} />
                <View style={[styles.scanCorner, styles.topRight]} />
                <View style={[styles.scanCorner, styles.bottomLeft]} />
                <View style={[styles.scanCorner, styles.bottomRight]} />

                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      top: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '90%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.scanInstructions}>
                Point your camera at a barcode
              </Text>
            </View>
          ) : (
            <View style={styles.captureArea}>
              <View style={styles.captureGuide}>
                <Text style={styles.captureInstructions}>
                  Center your food in the frame
                </Text>
              </View>
            </View>
          )}

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
              <Ionicons name="image" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.manualEntryButton} onPress={() => router.push('/manual-entry')}>
              <Ionicons name="add" size={20} color="#007AFF" />
              <Text style={styles.manualEntryText}>Manual</Text>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.captureButton,
                  isProcessing && styles.captureButtonDisabled,
                ]}
                onPress={isScanMode ? undefined : takePicture}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="large" color="white" />
                ) : (
                  <View
                    style={[
                      styles.captureButtonInner,
                      isScanMode && styles.scanButtonInner,
                    ]}
                  />
                )}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity style={styles.secondaryButton} onPress={toggleScanMode}>
              <Ionicons
                name={isScanMode ? 'camera' : 'barcode'}
                size={24}
                color={isScanMode ? '#007AFF' : 'white'}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Processing Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingContent}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.processingText}>
                {isScanMode ? 'Looking up product...' : 'Analyzing food...'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
  },
  noAccessText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  modeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#007AFF',
    opacity: 0.8,
  },
  scanInstructions: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  captureArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureGuide: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInstructions: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 30,
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualEntryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualEntryText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
  },
  scanButtonInner: {
    backgroundColor: '#34C759',
  },
  flipButton: {
    position: 'absolute',
    top: 80,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    color: '#333',
  },
});
