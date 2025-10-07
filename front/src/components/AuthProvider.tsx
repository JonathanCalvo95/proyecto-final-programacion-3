import React from "react";

// Definición del tipo para el usuario
interface User {
  uid: string;
  username: string | null;
  displayName: string | null;
}

// Definición del tipo para el contexto
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

// Crear el contexto de autenticación
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Crear el proveedor de autenticación
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);

  // Simula el inicio de sesión
  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    console.log('Usuario iniciado sesión:', userData);
  };

  // Simula el cierre de sesión
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    console.log('Usuario cerrado sesión');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto de autenticación
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
