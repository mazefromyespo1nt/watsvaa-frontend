import * as React from "react";
import config from "../../config.json";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";

type AdminLoginForm = {
  email: string;
  password: string;
};

const validateEmail = (value: string) =>
  /^(?:[a-zA-Z0-9_\'^&/+{}!#$%*?|~.-]+)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(value);

export default function AdminLogin() {
  const [values, setValues] = React.useState<AdminLoginForm>({
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [alert, setAlert] = React.useState<{ type: "success" | "error"; msg: string } | null>(null);

  const onChange = (field: keyof AdminLoginForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
  };

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!values.email) next.email = "Ingresa el correo de administrador";
    else if (!validateEmail(values.email)) next.email = "Correo inválido";

    if (!values.password) next.password = "Ingresa la contraseña";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      // routes/admin.js espera { email, password } directo en req.body
      const response = await fetch(config.API_URL + "admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email.trim(),
          password: values.password,
        }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        setAlert({ type: "success", msg: "¡Bienvenido Administrador! Redirigiendo..." });
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", "admin");
        navigate("/panel/users");
      } else {
        setAlert({
          type: "error",
          msg: data.msg || "Credenciales de administrador inválidas.",
        });
      }
    } catch (error) {
      console.error(error);
      setAlert({ type: "error", msg: "Error de conexión con el servidor." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        p: 2,
      }}
    >
      <Grid item xs={12} sm={8} md={5} lg={4}>
        <Paper
          elevation={12}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            borderTop: "6px solid #6366f1",
          }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" mb={3}>
            <Avatar sx={{ bgcolor: "#6366f1", width: 56, height: 56, mb: 1.5 }}>
              <AdminIcon fontSize="large" />
            </Avatar>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Panel Admin
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Acceso exclusivo de administración del sistema
            </Typography>
          </Box>

          {alert && (
            <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 2, borderRadius: 2 }}>
              {alert.msg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Correo de Administrador"
              placeholder="admin@dominio.com"
              type="email"
              value={values.email}
              onChange={onChange("email")}
              error={Boolean(errors.email)}
              helperText={errors.email || ""}
              margin="normal"
              fullWidth
              autoComplete="email"
              autoFocus
            />

            <TextField
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              value={values.password}
              onChange={onChange("password")}
              error={Boolean(errors.password)}
              helperText={errors.password || ""}
              margin="normal"
              fullWidth
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              sx={{
                mt: 3,
                py: 1.2,
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#6366f1",
                "&:hover": { bgcolor: "#4f46e5" },
              }}
            >
              {submitting ? "Verificando..." : "Entrar como Administrador"}
            </Button>

            <Divider sx={{ my: 3 }} />

            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<ArrowBackIcon />}
              sx={{ py: 1.2, borderRadius: 3, textTransform: "none", fontWeight: 700 }}
            >
              Ir al Login de Clientes
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}