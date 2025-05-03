export interface User {
  id: string;
  email: string;
  api: string;
  keyPair: {
    publicKey: string;
    privateKey: string;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sPublicKey: string | null;
}

export interface PlateResult {
  id: string;
  imageUrl: string;
  extractedText: string;
  confidence?: number;
  timestamp: Date;
  userId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
