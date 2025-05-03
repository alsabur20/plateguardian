import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthState } from "../types";
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  sendClientPublicKeyToServer,
  getEncryptedApiKey,
} from "../services/authService";
import { toast } from "react-toastify";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    sPublicKey: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      const response = await getCurrentUser();
      if (response.success && (response.data?.id && response.data?.email)) {
        setAuthState((prev) => {
          return {
            ...prev,
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          };
        });
      } else {
        setAuthState({
          user: null,
          sPublicKey: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await loginUser(email, password);
      if (response.success && response.data) {
        setAuthState({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
          sPublicKey: response.data.sKey,
        });
        await getKeyPair(response.data.sKey);
        toast.success("Login successful");
        return true;
      }
      throw new Error(response.error);
    } catch (error) {
      toast.error("Login failed");
      return false;
    }
  };

  const signup = async (email: string, password: string): Promise<boolean> => {
    const response = await registerUser(email, password);
    if (response.success && response.data) {
      setAuthState({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
        sPublicKey: response.data.sKey,
      });
      await getKeyPair(response.data.sKey);
      await toast.success("Registration successful");
      return true;
    } else {
      toast.error(response.error || "Registration failed");
      return false;
    }
  };

  const logout = async () => {
    await logoutUser();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sPublicKey: "",
    });
    toast.success("Logged out successfully");
  };

  const getKeyPair = async (sPublicKey: string) => {
    if (!sPublicKey) return;

    try {
      const response = await sendClientPublicKeyToServer();
      if (!response.success || !response.clientKeyPair) {
        throw new Error("Failed to get key pair from server");
      }

      // First update the state with the key pair
      setAuthState((prev) => {
        if (!prev.user) {
          // If no user exists, we can't proceed - this should theoretically never happen
          // because getKeyPair is called after login/signup which sets the user
          console.error("No user available to associate key pair with");
          return prev;
        }

        return {
          ...prev,
          user: {
            ...prev.user,
            keyPair: {
              publicKey: response.clientKeyPair.publicKeyPEM,
              privateKey: response.clientKeyPair.privateKeyPEM,
            },
          },
        };
      });

      // Now get the API key using the updated state
      const apiKeyResponse = await getAPIKey(
        response.clientKeyPair.privateKeyPEM
      );
      if (!apiKeyResponse) {
        throw new Error("Failed to get API key");
      }

      // Finally update with the API key
      setAuthState((prev) => {
        if (!prev.user) {
          console.error("No user available to associate API key with");
          return prev;
        }

        return {
          ...prev,
          user: {
            ...prev.user,
            apiKey: {
              timestamp: apiKeyResponse.timestamp,
              api: apiKeyResponse.apiKey,
            },
          },
        };
      });
    } catch (error) {
      console.error("Error in key pair process:", error);
      toast.error("Failed to complete cryptographic setup");
    }
  };

  const getAPIKey = async (privateKey: string) => {
    try {
      const response = await getEncryptedApiKey(privateKey);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || "Failed to get encrypted API key");
    } catch (error) {
      console.error("Error getting API key:", error);
      toast.error("Failed to retrieve API key");
      return null;
    }
  };
  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
