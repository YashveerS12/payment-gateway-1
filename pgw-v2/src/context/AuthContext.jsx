import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("pgw_token") || "");
  const [merchant, setMerchant] = useState(
    JSON.parse(localStorage.getItem("pgw_merchant") || "null")
  );

  // Auto logout if token expired
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          logout();
        }
      } catch (e) {
        logout();
      }
    }
  }, []);

  const login = (tokenData, merchantData) => {
    setToken(tokenData);
    setMerchant(merchantData);
    localStorage.setItem("pgw_token", tokenData);
    localStorage.setItem("pgw_merchant", JSON.stringify(merchantData));
  };

  const logout = () => {
    setToken("");
    setMerchant(null);
    localStorage.removeItem("pgw_token");
    localStorage.removeItem("pgw_merchant");
  };

  return (
    <AuthContext.Provider value={{ token, merchant, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
