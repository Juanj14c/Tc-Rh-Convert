import { useState } from "react";
import { useTheme } from "./contexts/useTheme";

import LoginPage from "./pages/LoginPage";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";

import MainLayout from "./layouts/MainLayout";

import ChatPage from "./pages/ChatPage";
import MuralPage from "./pages/MuralPage";
import SettingsPage from "./pages/SettingsPage";

import IntroAnimation from "./components/layout/IntroAnimation";
import EmployeesPage  from "./pages/EmployeesPage";
import type { AppPage } from "./types/navigation";
type UserRole = "admin" | "employee";



type AuthView =
  | "login"
  | "forgot-password"
  | "update-password";

function App() {
  const { resetTheme } = useTheme();

  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const [profile, setProfile] = useState({
    name: "Juan Pérez",
    email: "juan@empresa.com",
    image: "",
  });
  const [searchTerm, setSearchTerm]= useState("")

  const [userRole, setUserRole] =
    useState<UserRole>("employee");

  const [showIntro, setShowIntro] =
    useState(false);

  const [activePage, setActivePage] =
    useState<AppPage>("mural");

  const [authView, setAuthView] =
    useState<AuthView>("login");

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setIsAuthenticated(true);
    setShowIntro(true);
    setActivePage("mural");
  };

  const handleLogout = () => {
    resetTheme();

    setIsAuthenticated(false);
    setShowIntro(false);
    setActivePage("mural");
    setUserRole("employee");
    setAuthView("login");
  };

  /* =========================
     AUTENTICACIÓN
     ========================= */

  if (!isAuthenticated) {
    if (authView === "forgot-password") {
      return (
        <ForgotPassword
          onBack={() => setAuthView("login")}
        />
      );
    }

    if (authView === "update-password") {
      return (
        <UpdatePassword
          onPasswordUpdated={() =>
            setAuthView("login")
          }
        />
      );
    }

    return (
      <LoginPage
        onLogin={handleLogin}
        onForgotPassword={() =>
          setAuthView("forgot-password")
        }
      />
    );
  }

  /* =========================
     ANIMACIÓN DE ENTRADA
     ========================= */

  if (showIntro) {
    return (
      <IntroAnimation
        onComplete={() =>
          setShowIntro(false)
        }
      />
    );
  }

  /* =========================
     APLICACIÓN
     ========================= */

  return (
    <MainLayout
      isAdmin={userRole === "admin"}
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={handleLogout}
      profile={profile}
      searchTerm ={searchTerm}
      onSearchChange = {setSearchTerm}
    >
      {activePage === "mural" ? (
        <MuralPage
          isAdmin={userRole === "admin"}
          searchTerm={searchTerm}
        />
      ) : activePage === "anonymous-chat" ? (
        <ChatPage
        key="anonymous-chat"
          isAdmin={userRole === "admin"}
          chatMode="anonymous"
        />
      ): activePage === "internal-chat" ?(
        <ChatPage
        key="internal-chat"
        isAdmin={userRole ==="admin"}
        chatMode="internal"
        />
      
      ) : activePage === "settings" ?( 
        <SettingsPage
          isAdmin={userRole === "admin"}
          profile={profile}
          onProfileChange={setProfile}
        />
      ): activePage ==="employees" ?(
        <EmployeesPage />
        
      ):(
        <div>
          <h1>Página en construcción</h1>
        </div>
        )}
    </MainLayout>
  );
}

export default App;