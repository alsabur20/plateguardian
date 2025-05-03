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
        setAuthState({
          user: response.data.user,
          sPublicKey: response.data.sKey,
          isAuthenticated: true,
          isLoading: false,
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
        sPublicKey: "",
      });
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
        sPublicKey: "",
      });
      toast.success("Registration successful");
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
