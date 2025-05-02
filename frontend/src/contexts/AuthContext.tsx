import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { User, AuthState } from "../types";
import { loginUser, registerUser, logoutUser } from "../services/authService";
import { toast } from "react-toastify";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode<{ user: User }>(token);
        setAuthState({
          user: decodedToken.user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        localStorage.removeItem("token");
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await loginUser(email, password);
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem("token", token);
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        toast.success("Login successful");
        return true;
      } else {
        toast.error(response.error || "Login failed");
        return false;
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
      return false;
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string
  ): Promise<boolean> => {
    try {
      const response = await registerUser(email, password, name);
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem("token", token);
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        toast.success("Registration successful");
        return true;
      } else {
        toast.error(response.error || "Registration failed");
        return false;
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    logoutUser();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
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
