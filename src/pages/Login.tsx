import * as React from "react";
import config from '../../config.json';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff, Login as LoginIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

const fechaHora = new Date().toLocaleString("es-MX", { hour12: false });

type LoginForm = {
  email: string;
  password: string;
  remember: boolean;
};

const validateEmail = (value: string) =>
  /^(?:[a-zA-Z0-9_\'^&/+{}!#$%*?|~.-]+)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(value);

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Datos que llegan desde el registro (si el usuario viene de ahí)
  const fromSignup = location.state as { registered?: boolean; email?: string } | null;

  const [values, setValues] = React.useState<LoginForm>({
    email: fromSignup?.email || "",
    password: "",
    remember: true,
  });
  
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [alert, setAlert] = React.useState<{ type: "success" | "error"; msg: string } | null>(
    fromSignup?.registered
      ? { type: "success", msg: "Cuenta creada correctamente. Inicia sesión para entrar." }
      : null
  );

  // Limpia el estado del historial para que el aviso no reaparezca al recargar
  React.useEffect(() => {
    if (fromSignup?.registered) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (field: keyof LoginForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === "remember" ? e.target.checked : e.target.value;
    setValues((v) => ({ ...v, [field]: value }));
  };

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!values.email) next.email = "Ingresa tu correo";
    else if (!validateEmail(values.email)) next.email = "Correo inválido";

    if (!values.password) next.password = "Ingresa tu contraseña";
    else if (values.password.length < 6) next.password = "Mínimo 6 caracteres";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setAlert(null);

  if (!validate()) return;

  setSubmitting(true);

  try {

    const payload = {
      fecha: fechaHora,
      auth: localStorage.getItem("token")  || null,
      accion: "Ingresar al sistema",
      data: { 
        ...values  
      }
    };

    const response = await fetch(config.API_URL + 'user/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.success) {
      setAlert({ type: "success", msg: "¡Bienvenido! Autenticación exitosa." });

      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      navigate('/panel/dashboard');
    } else {
      setAlert({ type: "error", msg: data.msg || "Ocurrió un error. Inténtalo de nuevo." });
    }

  } catch (error) {
    console.error(error);
    setAlert({ type: "error", msg: "Email o contraseña incorrectos. Inténtalo de nuevo." });
  } finally {
    setSubmitting(false);
  }
};


  /*   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch(config.API_URL + 'user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        setAlert({ type: "success", msg: "¡Bienvenido! Autenticación exitosa." });
        localStorage.setItem("token", data.token);
        navigate('/panel/dashboard');
      } else {
        setAlert({ type: "error", msg: data.msg || "Ocurrió un error. Inténtalo de nuevo." });
      }
    } catch (error) {
      console.error(error);
      setAlert({ type: "error", msg: "Email o contraseña incorrectos. Inténtalo de nuevo." });
    } finally {
      setSubmitting(false);
    }
  };  */


  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 10% -10%, rgba(99, 102, 241, 0.15), transparent), radial-gradient(800px 400px at 110% 110%, rgba(16, 185, 129, 0.15), transparent)",
      }}
      spacing={2}
      flexDirection={{ xs: "column", md: "row" }}
    >
      <Grid item>
        <Box
          component="img"
          src="src/images/wcrmlogo.png"
          alt="Imagen Login"
          sx={{
            width: { xs: "450px", md: "530px" },
            height: { xs: "450px", md: "530px" },
            borderRadius: 2,
            objectFit: "cover",
            mb: { xs: 2, md: 0 },
          }}
        />
      </Grid>

      <Grid item>
        <Paper
          elevation={8}
          sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, backdropFilter: "blur(3px)" }}
        >
          <Box textAlign="center" mb={2}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Inicia sesión
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Accede con tu correo y contraseña
            </Typography>
          </Box>
          {alert && (
            <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 2, borderRadius: 2 }}>
              {alert.msg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Correo electrónico"
              placeholder="correo@example.com"
              type="email"
              value={values.email}
              onChange={onChange("email")}
              error={Boolean(errors.email)}
              helperText={errors.email || ""}
              margin="normal"
              fullWidth
              autoComplete="email"
              autoFocus={!values.email}
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
                autoFocus={Boolean(values.email)}
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


            <Box mt={1} mb={2} display="flex" alignItems="center" justifyContent="space-between">
              <FormControlLabel
                control={
                  <Checkbox checked={values.remember} onChange={onChange("remember")} color="primary" />
                }
                label="Recordarme"
              />
              
              <Link
                component={RouterLink}
                to="/recuperar-contrasena"
                variant="body2"
                underline="hover"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : <LoginIcon />}
              sx={{ py: 1.2, borderRadius: 3, textTransform: "none", fontWeight: 700 }}
            >
              {submitting ? "Ingresando..." : "Entrar"}
            </Button>

            <Box mt={2}>
              <Button
                component={RouterLink}
                to="/"
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<ArrowBackIcon />}
                sx={{ py: 1.2, borderRadius: 3, textTransform: "none", fontWeight: 700 }}
              >
                Regresar
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="body2" textAlign="center" color="text.secondary">
              ¿No tienes cuenta?{" "}
              <Link component={RouterLink} to="/register" underline="hover">
                Regístrate
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}