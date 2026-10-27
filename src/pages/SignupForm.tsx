import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Paper,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  FormHelperText,
  Grid,
} from '@mui/material';
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiKey,
  FiEye,
  FiEyeOff,
  FiAlertTriangle,
  FiCheckCircle,
} from 'react-icons/fi';
import { useTheme } from '@mui/material/styles';
import config from '../config.json'; 

const fechaHora = new Date().toLocaleString("es-MX", { hour12: false });

// Interfaz para el estado del formulario
interface FormDataState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  mobile: string;
  acceptPolicy: boolean;
}

const SignupForm: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormDataState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    acceptPolicy: false,
  });

  const [errors, setErrors] = useState<Partial<FormDataState>>({});
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // limpiar errores al escribir
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setMessage(null);
  };

  const validate = () => {
    let newErrors: Partial<FormDataState> = {};

    if (!formData.name.trim()) newErrors.name = "El nombre es obligatorio";

    if (!formData.email) {
      newErrors.email = "El correo es obligatorio";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El correo no es válido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (formData.password.length < 6) {
      newErrors.password = "Debe tener al menos 6 caracteres";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (!formData.mobile) {
      newErrors.mobile = "El número de móvil es obligatorio";
    } else if (!/^[+0-9]+$/.test(formData.mobile)) {
      newErrors.mobile = "Formato inválido (solo números y +)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;

  const { confirmPassword, ...payload } = formData;

  try {

    // === Construimos la estructura requerida ===
    const requestAdduser = {
      fecha: fechaHora,                          
      auth: localStorage.getItem("token"),       
      accion: "Registrar usuario",               
      data: {
        payload                                  
      }
    };

    // === Petición con nueva estructura ===
    const response = await fetch(config.API_URL + 'user/signup', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem("token")}` // si quiere envia el token
      },
      body: JSON.stringify(requestAdduser),
    });

    const data = await response.json();

    // === Manejo del response del backend existente ===
    if (response.ok && (data.success || data.estatus)) {
      // Registro correcto: se manda directo al login.
      // Se pasa el correo y un aviso para que el login lo muestre.
      // La contraseña nunca se envía por aquí.
      setErrors({});
      navigate('/login', {
        state: { registered: true, email: formData.email },
      });
      return;
    } else {
      setMessage({ 
        text: data.message || data.msg || 'Error al registrar el usuario.', 
        type: 'error' 
      });
    }

  } catch (error) {
    console.error(error);
    setMessage({ 
      text: 'Error al registrar el usuario. Intenta de nuevo más tarde.', 
      type: 'error' 
    });
  }
};

  const MessageBox: React.FC<{ msg: { text: string; type: 'success' | 'error' } }> = ({ msg }) => {
    const isSuccess = msg.type === 'success';
    return (
      <Box
        role="alert"
        aria-live="assertive"
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          backgroundColor: isSuccess ? theme.palette.success.light : theme.palette.error.light,
          color: isSuccess ? theme.palette.success.contrastText : theme.palette.error.contrastText,
          fontWeight: 600,
          fontSize: 14,
          boxShadow: 1,
        }}
      >
        {isSuccess ? <FiCheckCircle /> : <FiAlertTriangle />}
        <Box component="span" sx={{ ml: 0.5 }}>
          {msg.text}
        </Box>
      </Box>
    );
  };

  return (
    <Grid container sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      {/* Columna izquiera */}
      <Grid
        item
        xs={false}
        md={7}
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          backgroundColor: '#0e0e0e',
          color: '#fff',
          p: 8,
          borderTopRightRadius: '40px',
          borderBottomRightRadius: '40px',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          Todo lo que necesitas para hacer crecer tu negocio en WhatsApp
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Personaliza la comunicación y vende más con la plataforma de API de WhatsApp Business
          que automatiza el marketing, las ventas, el servicio y el soporte.
        </Typography>
      </Grid>

      {/* Columna Derecha */}
      <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: { xs: 3, md: 6 } }}>
        <Box sx={{ width: '100%', maxWidth: 420, maxHeight: '100vh', overflowY: 'auto' }}>
          <Paper elevation={0} sx={{ width: '100%', p: 4, backgroundColor: 'transparent' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
              Comienza tu prueba gratuita
            </Typography>
            <Typography sx={{ color: theme.palette.text.secondary, mb: 3 }}>
              Comienza con una cuenta de demostración en WaCRM
            </Typography>

            <Typography align="center" sx={{ mb: 3, color: theme.palette.text.secondary, fontSize: 14 }}>
              Iniciar sesión o registrarse
            </Typography>

            {message && <MessageBox msg={message} />}

            <form onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                size="small"
                placeholder="Tu nombre"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="dense"
                required
                error={!!errors.name}
                helperText={errors.name}
                sx={{ mb: 1.5 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><FiUser /></InputAdornment> }}
              />

              <TextField
                fullWidth
                size="small"
                placeholder="Tu correo electrónico"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="dense"
                required
                error={!!errors.email}
                helperText={errors.email}
                sx={{ mb: 1.5 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><FiMail /></InputAdornment> }}
              />

              <TextField
                fullWidth
                size="small"
                placeholder="Contraseña"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                margin="dense"
                required
                error={!!errors.password}
                helperText={errors.password}
                sx={{ mb: 1.5 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><FiLock /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} size="small" type="button">
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                size="small"
                placeholder="Confirmar contraseña"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                margin="dense"
                required
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                sx={{ mb: 1.5 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><FiLock /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} size="small" type="button">
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                size="small"
                placeholder="Tu número de móvil"
                name="mobile"
                type="tel"
                value={formData.mobile}
                onChange={handleChange}
                margin="dense"
                required
                error={!!errors.mobile}
                helperText={errors.mobile || "Ejemplo: +12234556879"}
                sx={{ mb: 2 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><FiPhone /></InputAdornment> }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Checkbox
                  checked={formData.acceptPolicy}
                  onChange={handleChange}
                  name="acceptPolicy"
                  required
                  sx={{ color: theme.palette.primary.main, '&.Mui-checked': { color: theme.palette.primary.main } }}
                />
                <FormHelperText sx={{ mt: 0, color: errors.acceptPolicy ? "error.main" : theme.palette.text.secondary }}>
                  {errors.acceptPolicy || "Al hacer clic aquí, aceptas nuestra Política de privacidad, Términos y condiciones *"}
                </FormHelperText>
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                startIcon={<FiKey />}
                sx={{
                  mt: 2,
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: 20,
                  py: 1.2,
                  fontWeight: 'bold',
                  '&:hover': { backgroundColor: theme.palette.primary.dark },
                }}
              >
                Registrarse
              </Button>

              <Typography align="center" sx={{ mt: 2, fontSize: 14, color: theme.palette.text.secondary }}>
                ¿Ya tienes una cuenta?{' '}
                <RouterLink to="/login" style={{ textDecoration: 'underline', fontWeight: 'bold', color: theme.palette.primary.main }}>
                  Iniciar sesión
                </RouterLink>
              </Typography>
            </form>
          </Paper>
        </Box>
      </Grid>
    </Grid>
  );
};

export default SignupForm;