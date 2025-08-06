/**
 * OCR Service for extracting text from nutrition labels and food packaging
 * Uses Tesseract.js for client-side text recognition
 */

import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes: Array<{
    text: string;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
    confidence: number;
  }>;
}

export interface NutritionLabelData {
  servingSize?: string;
  calories?: number;
  totalFat?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  totalCarbs?: number;
  dietaryFiber?: number;
  sugars?: number;
  protein?: number;
  confidence: number;
  rawText: string;
}

class OCRService {
  private worker: Tesseract.Worker | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.worker = await Tesseract.createWorker({
        logger: m => console.log('OCR:', m.status, m.progress),
      });

      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
      
      // Configure for better number recognition
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789.,% ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz():/-',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      });

      this.isInitialized = true;
      console.log('✅ OCR Service initialized');
    } catch (error) {
      console.error('❌ OCR initialization failed:', error);
      throw new Error(`OCR initialization failed: ${error.message}`);
    }
  }

  async extractText(imageUri: string): Promise<OCRResult> {
    if (!this.worker || !this.isInitialized) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    try {
      const { data } = await this.worker.recognize(imageUri);
      
      // Extract bounding boxes for individual words
      const boundingBoxes = data.words.map(word => ({
        text: word.text,
        bbox: word.bbox,
        confidence: word.confidence,
      }));

      return {
        text: data.text,
        confidence: data.confidence,
        boundingBoxes,
      };
    } catch (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  async extractNutritionLabel(imageUri: string): Promise<NutritionLabelData> {
    const ocrResult = await this.extractText(imageUri);
    const text = ocrResult.text.toLowerCase();
    
    const nutritionData: NutritionLabelData = {
      confidence: ocrResult.confidence,
      rawText: ocrResult.text,
    };

    try {
      // Extract serving size
      const servingSizeMatch = text.match(/serving size[:\s]+([^(\n]+)/i);
      if (servingSizeMatch) {
        nutritionData.servingSize = servingSizeMatch[1].trim();
      }

      // Extract calories
      const caloriesMatch = text.match(/calories[:\s]+(\d+)/i);
      if (caloriesMatch) {
        nutritionData.calories = parseInt(caloriesMatch[1]);
      }

      // Extract total fat
      const totalFatMatch = text.match(/total fat[:\s]+(\d+(?:\.\d+)?)/i);
      if (totalFatMatch) {
        nutritionData.totalFat = parseFloat(totalFatMatch[1]);
      }

      // Extract saturated fat
      const saturatedFatMatch = text.match(/saturated fat[:\s]+(\d+(?:\.\d+)?)/i);
      if (saturatedFatMatch) {
        nutritionData.saturatedFat = parseFloat(saturatedFatMatch[1]);
      }

      // Extract trans fat
      const transFatMatch = text.match(/trans fat[:\s]+(\d+(?:\.\d+)?)/i);
      if (transFatMatch) {
        nutritionData.transFat = parseFloat(transFatMatch[1]);
      }

      // Extract cholesterol
      const cholesterolMatch = text.match(/cholesterol[:\s]+(\d+)/i);
      if (cholesterolMatch) {
        nutritionData.cholesterol = parseInt(cholesterolMatch[1]);
      }

      // Extract sodium
      const sodiumMatch = text.match(/sodium[:\s]+(\d+)/i);
      if (sodiumMatch) {
        nutritionData.sodium = parseInt(sodiumMatch[1]);
      }

      // Extract total carbohydrates
      const totalCarbsMatch = text.match(/total carbohydrate[s]?[:\s]+(\d+(?:\.\d+)?)/i);
      if (totalCarbsMatch) {
        nutritionData.totalCarbs = parseFloat(totalCarbsMatch[1]);
      }

      // Extract dietary fiber
      const fiberMatch = text.match(/dietary fiber[:\s]+(\d+(?:\.\d+)?)/i);
      if (fiberMatch) {
        nutritionData.dietaryFiber = parseFloat(fiberMatch[1]);
      }

      // Extract sugars
      const sugarsMatch = text.match(/(?:total )?sugars[:\s]+(\d+(?:\.\d+)?)/i);
      if (sugarsMatch) {
        nutritionData.sugars = parseFloat(sugarsMatch[1]);
      }

      // Extract protein
      const proteinMatch = text.match(/protein[:\s]+(\d+(?:\.\d+)?)/i);
      if (proteinMatch) {
        nutritionData.protein = parseFloat(proteinMatch[1]);
      }

      // Calculate confidence based on how many fields were extracted
      const extractedFields = Object.keys(nutritionData).filter(
        key => key !== 'confidence' && key !== 'rawText' && nutritionData[key] !== undefined
      ).length;
      
      const maxFields = 11; // Total possible fields
      const extractionRate = extractedFields / maxFields;
      nutritionData.confidence = Math.min(ocrResult.confidence, extractionRate * 100);

      return nutritionData;
    } catch (error) {
      console.error('Nutrition label parsing error:', error);
      return {
        confidence: 0,
        rawText: ocrResult.text,
      };
    }
  }

  async extractBarcode(imageUri: string): Promise<{
    barcodes: string[];
    confidence: number;
  }> {
    const ocrResult = await this.extractText(imageUri);
    const text = ocrResult.text;
    
    // Extract potential barcodes (UPC, EAN-13, etc.)
    const barcodePatterns = [
      /\b\d{12}\b/g, // UPC-A
      /\b\d{13}\b/g, // EAN-13
      /\b\d{8}\b/g,  // EAN-8 or UPC-E
    ];

    const barcodes: string[] = [];
    
    for (const pattern of barcodePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        barcodes.push(...matches);
      }
    }

    // Remove duplicates
    const uniqueBarcodes = [...new Set(barcodes)];

    return {
      barcodes: uniqueBarcodes,
      confidence: uniqueBarcodes.length > 0 ? ocrResult.confidence : 0,
    };
  }

  async extractIngredients(imageUri: string): Promise<{
    ingredients: string[];
    confidence: number;
    rawText: string;
  }> {
    const ocrResult = await this.extractText(imageUri);
    const text = ocrResult.text.toLowerCase();

    // Look for ingredients section
    const ingredientsMatch = text.match(/ingredients?[:\s]+(.*?)(?:\n\n|allergen|contains|nutrition|$)/is);
    
    if (!ingredientsMatch) {
      return {
        ingredients: [],
        confidence: 0,
        rawText: ocrResult.text,
      };
    }

    const ingredientsText = ingredientsMatch[1];
    
    // Split by commas and clean up
    const ingredients = ingredientsText
      .split(',')
      .map(ingredient => ingredient.trim())
      .filter(ingredient => ingredient.length > 1)
      .map(ingredient => {
        // Remove parenthetical information but keep the main ingredient
        return ingredient.replace(/\([^)]*\)/g, '').trim();
      })
      .filter(ingredient => ingredient.length > 0);

    return {
      ingredients,
      confidence: ingredients.length > 0 ? ocrResult.confidence : 0,
      rawText: ocrResult.text,
    };
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('🧹 OCR Service cleaned up');
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.worker !== null;
  }

  // Batch processing for multiple images
  async batchExtractText(imageUris: string[]): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    
    for (const imageUri of imageUris) {
      try {
        const result = await this.extractText(imageUri);
        results.push(result);
      } catch (error) {
        console.error('Batch OCR error:', error);
        results.push({
          text: '',
          confidence: 0,
          boundingBoxes: [],
        });
      }
    }
    
    return results;
  }

  // Helper method to improve OCR accuracy
  async preprocessImage(imageUri: string): Promise<string> {
    try {
      // Create canvas for image preprocessing
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUri;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Get image data for preprocessing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Apply contrast enhancement
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        // Apply threshold (make text more distinct)
        const threshold = gray > 127 ? 255 : 0;
        
        data[i] = threshold;     // Red
        data[i + 1] = threshold; // Green
        data[i + 2] = threshold; // Blue
        // Alpha stays the same
      }

      // Put processed data back
      ctx.putImageData(imageData, 0, 0);
      
      return canvas.toDataURL();
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      return imageUri; // Return original if preprocessing fails
    }
  }
}

// Singleton instance
let ocrService: OCRService | null = null;

export const getOCRService = (): OCRService => {
  if (!ocrService) {
    ocrService = new OCRService();
  }
  return ocrService;
};

export const extractText = async (imageUri: string): Promise<OCRResult> => {
  const service = getOCRService();
  return await service.extractText(imageUri);
};

export const extractNutritionLabel = async (imageUri: string): Promise<NutritionLabelData> => {
  const service = getOCRService();
  return await service.extractNutritionLabel(imageUri);
};
