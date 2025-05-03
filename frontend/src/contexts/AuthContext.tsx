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
      if (response.success && response.data?.user) {
        setAuthState((prev) => {
          return {
            ...prev,
            user: response.data.user,
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
    } else {
      toast.error(response.error || "Login failed");
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
    if (sPublicKey) {
      const response = await sendClientPublicKeyToServer();

      if (response.success && response.data && response.clientKeyPair) {
        const res = await getAPIKey();
        if (!res) return;
        setAuthState((prev) => {
          // Transform the incoming res object to match your User interface
          const transformedApiKey = {
            timestamp: res.timestamp,
            api: res.apiKey, // Map the apiKey string to the api property
          };

          if (prev.user) {
            return {
              ...prev,
              user: {
                ...prev.user,
                apiKey: transformedApiKey, // Use the transformed object
                keyPair: {
                  publicKey: response.clientKeyPair.publicKeyPEM,
                  privateKey: response.clientKeyPair.privateKeyPEM,
                },
              },
            };
          }

          return {
            ...prev,
            user: {
              id: "",
              email: "",
              apiKey: transformedApiKey,
              keyPair: {
                publicKey: response.clientKeyPair.publicKeyPEM,
                privateKey: response.clientKeyPair.privateKeyPEM,
              },
            },
          };
        });
      } else {
        console.error("Failed to send key to server or receive keypair");
      }
    }
  };

  const getAPIKey = async () => {
    if (!authState.user) {
      return;
    }
    const response = await getEncryptedApiKey(
      authState.user.keyPair.privateKey
    );
    if (response.success && response.data) {
      return response.data;
    } else {
      toast.error(response.error);
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
