/**
 * WebAssembly module loader for running AI models in the browser
 * This handles ONNX Runtime Web initialization and model loading
 */

import * as ort from 'onnxruntime-web';

export interface WASMConfig {
  wasmPaths?: {
    'ort-wasm.wasm'?: string;
    'ort-wasm-threaded.wasm'?: string;
    'ort-wasm-simd.wasm'?: string;
    'ort-wasm-simd-threaded.wasm'?: string;
  };
  numThreads?: number;
  simd?: boolean;
}

class WASMLoader {
  private initialized = false;
  private config: WASMConfig;

  constructor(config: WASMConfig = {}) {
    this.config = {
      numThreads: 4,
      simd: true,
      ...config,
    };
  }

  async initializeWASM(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Configure ONNX Runtime Web
      ort.env.wasm.numThreads = this.config.numThreads || 4;
      ort.env.wasm.simd = this.config.simd !== false;

      // Set WASM paths if provided
      if (this.config.wasmPaths) {
        ort.env.wasm.wasmPaths = this.config.wasmPaths;
      }

      // Test WASM support
      await this.testWASMSupport();

      this.initialized = true;
      console.log('✅ WASM Runtime initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize WASM Runtime:', error);
      throw new Error(`WASM initialization failed: ${error.message}`);
    }
  }

  private async testWASMSupport(): Promise<void> {
    try {
      // Create a simple test session to verify WASM is working
      const testModelBuffer = this.createTestModel();
      const session = await ort.InferenceSession.create(testModelBuffer);
      await session.release();
    } catch (error) {
      throw new Error(`WASM support test failed: ${error.message}`);
    }
  }

  private createTestModel(): ArrayBuffer {
    // Create a minimal ONNX model for testing
    // This is a simple identity model that just passes input to output
    const modelProto = new Uint8Array([
      0x08, 0x01, 0x12, 0x0c, 0x62, 0x61, 0x63, 0x6b, 0x65, 0x6e, 0x64, 0x2d,
      0x74, 0x65, 0x73, 0x74, 0x3a, 0x5c, 0x0a, 0x05, 0x69, 0x6e, 0x70, 0x75,
      0x74, 0x12, 0x06, 0x6f, 0x75, 0x74, 0x70, 0x75, 0x74, 0x22, 0x08, 0x49,
      0x64, 0x65, 0x6e, 0x74, 0x69, 0x74, 0x79, 0x2a, 0x3b, 0x0a, 0x05, 0x69,
      0x6e, 0x70, 0x75, 0x74, 0x12, 0x0e, 0x0a, 0x0c, 0x08, 0x01, 0x12, 0x08,
      0x0a, 0x02, 0x08, 0x01, 0x0a, 0x02, 0x08, 0x01, 0x1a, 0x05, 0x69, 0x6e,
      0x70, 0x75, 0x74, 0x22, 0x1c, 0x0a, 0x06, 0x6f, 0x75, 0x74, 0x70, 0x75,
      0x74, 0x12, 0x0e, 0x0a, 0x0c, 0x08, 0x01, 0x12, 0x08, 0x0a, 0x02, 0x08,
      0x01, 0x0a, 0x02, 0x08, 0x01, 0x1a, 0x06, 0x6f, 0x75, 0x74, 0x70, 0x75,
      0x74
    ]);
    return modelProto.buffer.slice(modelProto.byteOffset, modelProto.byteOffset + modelProto.byteLength);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getCapabilities(): {
    webgl: boolean;
    wasm: boolean;
    simd: boolean;
    threads: boolean;
  } {
    return {
      webgl: ort.env.webgl.disabled !== true,
      wasm: ort.env.wasm.disabled !== true,
      simd: ort.env.wasm.simd,
      threads: ort.env.wasm.numThreads > 1,
    };
  }

  // Get optimal execution providers based on capabilities
  getExecutionProviders(): string[] {
    const providers: string[] = [];

    // Prefer WebGL for better performance if available
    if (ort.env.webgl.disabled !== true) {
      providers.push('webgl');
    }

    // Fallback to WebAssembly
    if (ort.env.wasm.disabled !== true) {
      providers.push('wasm');
    }

    // CPU as last resort
    providers.push('cpu');

    return providers;
  }

  // Set execution provider preferences
  setExecutionProviders(providers: string[]): void {
    // This would be used when creating inference sessions
    console.log('Setting execution providers:', providers);
  }

  // Memory management
  async cleanup(): Promise<void> {
    if (this.initialized) {
      // Cleanup any global resources if needed
      this.initialized = false;
      console.log('🧹 WASM Runtime cleaned up');
    }
  }
}

// Singleton instance
let wasmLoader: WASMLoader | null = null;

export const initializeWASM = async (config?: WASMConfig): Promise<void> => {
  if (!wasmLoader) {
    wasmLoader = new WASMLoader(config);
  }
  await wasmLoader.initializeWASM();
};

export const getWASMLoader = (): WASMLoader => {
  if (!wasmLoader) {
    throw new Error('WASM loader not initialized. Call initializeWASM() first.');
  }
  return wasmLoader;
};

export const isWASMInitialized = (): boolean => {
  return wasmLoader?.isInitialized() || false;
};

export { ort };
