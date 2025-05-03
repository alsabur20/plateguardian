import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sun, Moon, LogOut, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { motion } from "framer-motion";

// import { ThemeContext } from "../../contexts/ThemeContext";
// import { useContext } from "react";
// import { ThemeContextType } from "../../contexts/ThemeContext";

const Header: React.FC = () => {
  const { isAuthenticated, logout, user, sPublicKey } = useAuth();

  // const context = useContext<ThemeContextType | undefined>(ThemeContext);
  // const theme = context?.theme;
  // const toggleTheme = context?.toggleTheme;

  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-primary mr-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="12" x="3" y="6" rx="2" />
                  <path d="M3 10h18" />
                </svg>
              </motion.div>
              <span className="font-semibold text-xl text-primary">
                PlateGuardian
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {isAuthenticated && (
              <>
                <div className="flex items-center space-x-1">
                  <User
                    size={16}
                    className="text-gray-500 dark:text-gray-400"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user?.email}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-error focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                  aria-label="Log out"
                >
                  <LogOut size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
