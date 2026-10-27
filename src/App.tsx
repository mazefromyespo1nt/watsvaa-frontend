import React, { useMemo, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import DashboardLayout from "./layouts/DashboardLayout";
import LandingLayout from "./layouts/LandingLayout";
import Users from "./pages/Users";
import SignupForm from "./pages/SignupForm";
import Phonebook from "./pages/Phonebook";
import RecuperarContrasena from "./pages/RecuperarContrasena"; 
import Login from "./pages/Login";
import WelcomeCard from "./components/WelcomeCard";
import ConfirmProvider from "./components/ConfirmProvider";
import NotificationProvider from "./components/NotificationProvider";
import baseTheme from "./theme";
import BandejadeEntrada from "./pages/BandejadeEntrada";
import CalentadorWhatsapp from "./pages/CalentadorWhatsapp";
import PanelControl from "./pages/PanelControl";
import Chatbot from "./pages/Chatbot";
import QrWhatsapp from "./pages/QrWhatsapp";
import Api from "./pages/Api";
import ConstructorFlujo from "./pages/ConstructorFlujos";
import InstancesPage from "./pages/InstancesPage"
import AccountPage from "./pages/AccountPage";
import PaySubscription from "./pages/PaySubscription";
import Broadcast from "./pages/Broadcast";
import AdminLogin from "./pages/AdminLogin";

function App() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const location = useLocation();
  const navigate = useNavigate();

  const theme = useMemo(
    () =>
      createTheme({
        ...baseTheme,
        palette: {
          ...baseTheme.palette,
          mode,
          background: {
            default: mode === "light" ? "#ffffff" : "#121212",
            paper: mode === "light" ? "#ffffff" : "#1e1e1e",
          },
          text: {
            primary: mode === "light" ? "#1a1a1a" : "#ffffff",
            secondary: mode === "light" ? "#666666" : "#bbbbbb",
          },
        },
      }),
    [mode]
  );

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <ConfirmProvider>
          <Routes>
            <Route
              path="/"
              element={
                <LandingLayout onToggleTheme={toggleMode} mode={mode}>
                  <WelcomeCard />
                </LandingLayout>
              }
            />

            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/register" element={<SignupForm />} />
            <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
            
            <Route
              path="/panel/*"
              element={<DashboardLayout onToggleTheme={toggleMode} mode={mode} />}
            >
              <Route path="inbox" element={<BandejadeEntrada />} />
              <Route path="calentador" element={<CalentadorWhatsapp />} />
              <Route path="contacts" element={<Phonebook />} />
              <Route path="broadcast" element={<Broadcast />} />
              <Route path="dashboard" element={<PanelControl />} />
              <Route path="users" element={<Users />} />
              <Route path="chatbot" element={<Chatbot />} />
              <Route path="api" element={<Api />} />
              <Route path="flows" element={<ConstructorFlujo />} />
              <Route path="instances" element={<InstancesPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="pago" element={<PaySubscription/>} />
            
            </Route>
          </Routes>
        </ConfirmProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;