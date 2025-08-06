import { Platform } from 'react-native';

export interface BarcodeResult {
  data: string;
  type: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ScanOptions {
  showFlashlight?: boolean;
  showMarker?: boolean;
  markerColor?: string;
  cameraType?: 'front' | 'back';
  resultDisplayDuration?: number;
}

class BarcodeService {
  private isSupported = false;
  private scanner: any = null;

  constructor() {
    this.initializeScanner();
  }

  private async initializeScanner() {
    try {
      if (Platform.OS === 'web') {
        // Web implementation using ZXing
        const { BrowserMultiFormatReader } = await import('@zxing/library');
        this.scanner = new BrowserMultiFormatReader();
        this.isSupported = true;
      } else {
        // React Native implementation
        const { RNCamera } = await import('react-native-camera');
        this.scanner = RNCamera;
        this.isSupported = true;
      }
    } catch (error) {
      console.warn('Barcode scanner not available:', error);
      this.isSupported = false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Check camera permissions for web
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } else {
        // Check camera permissions for React Native
        const { check, request, PERMISSIONS, RESULTS } = await import('react-native-permissions');
        
        const permission = Platform.OS === 'ios' 
          ? PERMISSIONS.IOS.CAMERA 
          : PERMISSIONS.ANDROID.CAMERA;
        
        const result = await check(permission);
        
        if (result === RESULTS.GRANTED) {
          return true;
        } else if (result === RESULTS.DENIED) {
          const requestResult = await request(permission);
          return requestResult === RESULTS.GRANTED;
        }
        
        return false;
      }
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return false;
    }
  }

  async scanBarcode(options: ScanOptions = {}): Promise<BarcodeResult | null> {
    if (!this.isSupported) {
      throw new Error('Barcode scanning is not supported on this device');
    }

    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      throw new Error('Camera permission required for barcode scanning');
    }

    try {
      if (Platform.OS === 'web') {
        return await this.scanBarcodeWeb(options);
      } else {
        return await this.scanBarcodeNative(options);
      }
    } catch (error) {
      console.error('Barcode scanning error:', error);
      throw error;
    }
  }

  private async scanBarcodeWeb(options: ScanOptions): Promise<BarcodeResult | null> {
    return new Promise((resolve, reject) => {
      if (!this.scanner) {
        reject(new Error('Scanner not initialized'));
        return;
      }

      // Create video element
      const videoElement = document.createElement('video');
      videoElement.style.position = 'fixed';
      videoElement.style.top = '0';
      videoElement.style.left = '0';
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.zIndex = '9999';
      videoElement.style.backgroundColor = 'black';
      
      // Create overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.zIndex = '10000';
      overlay.style.pointerEvents = 'none';
      
      if (options.showMarker) {
        const marker = document.createElement('div');
        marker.style.position = 'absolute';
        marker.style.top = '50%';
        marker.style.left = '50%';
        marker.style.transform = 'translate(-50%, -50%)';
        marker.style.width = '250px';
        marker.style.height = '250px';
        marker.style.border = `2px solid ${options.markerColor || '#00ff00'}`;
        marker.style.borderRadius = '10px';
        overlay.appendChild(marker);
      }

      // Create close button
      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '20px';
      closeButton.style.right = '20px';
      closeButton.style.width = '40px';
      closeButton.style.height = '40px';
      closeButton.style.borderRadius = '50%';
      closeButton.style.backgroundColor = 'rgba(0,0,0,0.7)';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.fontSize = '24px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.pointerEvents = 'auto';
      closeButton.onclick = () => cleanup(null);
      overlay.appendChild(closeButton);

      document.body.appendChild(videoElement);
      document.body.appendChild(overlay);

      const cleanup = (result: BarcodeResult | null) => {
        this.scanner.reset();
        document.body.removeChild(videoElement);
        document.body.removeChild(overlay);
        resolve(result);
      };

      this.scanner.decodeFromVideoDevice(undefined, videoElement, (result: any, error: any) => {
        if (result) {
          cleanup({
            data: result.getText(),
            type: result.getBarcodeFormat(),
          });
        }
        if (error && error.name !== 'NotFoundException') {
          cleanup(null);
          reject(error);
        }
      });
    });
  }

  private async scanBarcodeNative(options: ScanOptions): Promise<BarcodeResult | null> {
    // This would be implemented with a React Native barcode scanner library
    // For now, return a mock implementation
    throw new Error('Native barcode scanning not yet implemented');
  }

  async scanBarcodeFromImage(imageUri: string): Promise<BarcodeResult | null> {
    if (!this.isSupported) {
      throw new Error('Barcode scanning is not supported on this device');
    }

    try {
      if (Platform.OS === 'web') {
        return await this.scanBarcodeFromImageWeb(imageUri);
      } else {
        return await this.scanBarcodeFromImageNative(imageUri);
      }
    } catch (error) {
      console.error('Image barcode scanning error:', error);
      return null;
    }
  }

  private async scanBarcodeFromImageWeb(imageUri: string): Promise<BarcodeResult | null> {
    if (!this.scanner) {
      throw new Error('Scanner not initialized');
    }

    try {
      const result = await this.scanner.decodeFromImageUrl(imageUri);
      return {
        data: result.getText(),
        type: result.getBarcodeFormat(),
      };
    } catch (error) {
      return null;
    }
  }

  private async scanBarcodeFromImageNative(imageUri: string): Promise<BarcodeResult | null> {
    // This would be implemented with a React Native barcode scanner library
    throw new Error('Native image barcode scanning not yet implemented');
  }

  isAvailable(): boolean {
    return this.isSupported;
  }

  getSupportedFormats(): string[] {
    const formats = [
      'CODE_128',
      'CODE_39',
      'CODE_93',
      'CODABAR',
      'EAN_13',
      'EAN_8',
      'ITF',
      'UPC_A',
      'UPC_E',
      'QR_CODE',
      'DATA_MATRIX',
      'PDF_417',
      'AZTEC'
    ];

    return formats;
  }

  // Food-specific barcode lookup
  async lookupFoodByBarcode(barcode: string): Promise<any> {
    try {
      // Try multiple food databases
      const databases = [
        'https://world.openfoodfacts.org/api/v0/product/' + barcode + '.json',
        'https://api.edamam.com/api/food-database/v2/parser',
        // Add more databases as needed
      ];

      for (const dbUrl of databases) {
        try {
          const response = await fetch(dbUrl);
          if (response.ok) {
            const data = await response.json();
            
            if (dbUrl.includes('openfoodfacts')) {
              if (data.status === 1 && data.product) {
                return this.formatOpenFoodFactsData(data.product);
              }
            }
            // Add parsing for other databases
          }
        } catch (error) {
          console.warn(`Failed to lookup in database: ${dbUrl}`, error);
        }
      }

      return null;
    } catch (error) {
      console.error('Barcode lookup error:', error);
      return null;
    }
  }

  private formatOpenFoodFactsData(product: any) {
    return {
      id: product.code || product._id,
      name: product.product_name || product.product_name_en,
      brand: product.brands,
      barcode: product.code,
      category: product.categories,
      description: product.generic_name || product.generic_name_en,
      
      // Nutritional information per 100g
      caloriesPer100g: parseFloat(product.nutriments?.['energy-kcal_100g']) || 0,
      proteinPer100g: parseFloat(product.nutriments?.['proteins_100g']) || 0,
      carbsPer100g: parseFloat(product.nutriments?.['carbohydrates_100g']) || 0,
      fatPer100g: parseFloat(product.nutriments?.['fat_100g']) || 0,
      fiberPer100g: parseFloat(product.nutriments?.['fiber_100g']) || 0,
      sugarPer100g: parseFloat(product.nutriments?.['sugars_100g']) || 0,
      sodiumPer100g: parseFloat(product.nutriments?.['sodium_100g']) || 0,
      
      // Additional data
      servingSizeG: parseFloat(product.serving_size) || undefined,
      servingDescription: product.serving_size,
      allergens: product.allergens_tags || [],
      imageUrl: product.image_url,
      source: 'Open Food Facts',
      dataQuality: product.data_quality_tags?.length > 0 ? 'high' : 'medium',
      verified: product.data_quality_tags?.includes('en:nutriscore-computed') || false,
    };
  }
}

export const barcodeService = new BarcodeService();
export default barcodeService;
