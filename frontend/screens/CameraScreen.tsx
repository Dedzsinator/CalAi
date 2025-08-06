import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function CameraScreen() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTakePhoto = async () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      
      router.push({
        pathname: './meal-confirmation',
        params: {
          predictions: JSON.stringify([{
            food_name: 'Sample Food',
            confidence: 0.85,
            calories: 250,
            protein: 12,
            carbs: 30,
            fat: 8,
            portion_estimate: '1 serving',
          }]),
        },
      });
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Camera</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="camera" size={80} color="#007AFF" />
          <Text style={styles.placeholderText}>
            Camera functionality is being implemented
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.captureButton}
          onPress={handleTakePhoto}
          disabled={isProcessing}
        >
          <Text style={styles.captureButtonText}>
            {isProcessing ? 'Processing...' : 'Take Photo'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  cameraPlaceholder: {
    alignItems: 'center',
    marginBottom: 60,
  },
  placeholderText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  captureButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 25,
  },
  captureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
