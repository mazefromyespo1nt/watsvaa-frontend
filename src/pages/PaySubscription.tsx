import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Grid,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress, 
  Alert, 
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PaymentIcon from '@mui/icons-material/Payment'; 


const useQuery = () => {

  const search = window.location.search;
  return useMemo(() => new URLSearchParams(search), [search]);
};


const CardLogos = () => (
  <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto', alignItems: 'center' }}>
    <Typography variant="caption" sx={{ border: 1, borderColor: 'divider', color: 'text.primary', px: 0.5, py: 0.1, borderRadius: '2px' }}>
      VISA
    </Typography>
    <Typography variant="caption" sx={{ border: 1, borderColor: 'divider', px: 0.5, py: 0.1, borderRadius: '2px', bgcolor: '#003087', color: 'white' }}>
      MC
    </Typography>
    <Typography variant="caption" sx={{ border: 1, borderColor: 'divider', px: 0.5, py: 0.1, borderRadius: '2px', bgcolor: '#005ea6', color: 'white' }}>
      AMEX
    </Typography>
  </Box>
);

// Estilos de cada recuadro de método de pago.
// Usan los colores del tema de MUI, así se ven bien en modo claro y oscuro.
const methodBoxSx = (selected: boolean) => ({
  border: 1,
  borderColor: selected ? 'primary.main' : 'divider',
  borderRadius: 1,
  p: 2,
  mb: 2,
  color: 'text.primary',
  bgcolor: (theme: any) =>
    selected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
  cursor: 'pointer',
  transition: 'border-color 0.3s, background-color 0.3s',
  '& input::placeholder': {
    color: 'text.secondary',
    opacity: 1,
  },
});


const PaySubscription = () => {
  const query = useQuery();
 
  const planName = query.get('plan') || 'Plan Desconocido';

  
  const [paymentMethod, setPaymentMethod] = useState<'creditCard' | 'paypal'>('creditCard');

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [securityCode, setSecurityCode] = useState('');

  const [showSecurityCode, setShowSecurityCode] = useState(false);


  const [isPaypalProcessing, setIsPaypalProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  
  const handlePaymentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(event.target.value as 'creditCard' | 'paypal');

    setPaymentSuccess(false);
    setIsPaypalProcessing(false);
  };


  const handleClickShowSecurityCode = () => {
    setShowSecurityCode((show) => !show);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const isCreditCardValid =
    cardNumber.length === 16 && 
    cardHolder.trim().length > 3 && 
    expiryDate.length === 5 && 
    securityCode.length === 3; 

  const isButtonEnabled =
    paymentMethod === 'paypal' || isCreditCardValid;

  
  const handleCheckout = () => {
   
    if (isPaypalProcessing) return;

    if (paymentMethod === 'paypal') {
    
      console.log('Iniciando redirección simulada a PayPal...');
      setIsPaypalProcessing(true);
      setPaymentSuccess(false); 

      setTimeout(() => {
        setIsPaypalProcessing(false);
        setPaymentSuccess(true);
        console.log(`Pago simulado con éxito para el plan: ${planName} usando PayPal.`);
      }, 3000);

    } else if (paymentMethod === 'creditCard' && isCreditCardValid) {
      console.log(`Procediendo al pago del plan: ${planName} con Tarjeta de Crédito`);
      setPaymentSuccess(true);
    } else {
      console.error("El formulario no es válido o hay un error de lógica.");
    }
  };

  const formatExpiryDate = (value: string) => {
    let cleaned = value.replace(/\D/g, '');
    cleaned = cleaned.substring(0, 4);

    if (cleaned.length > 2) {
      cleaned = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }

    return cleaned;
  };


  return (
    <Container
      maxWidth="sm"
      sx={{
        textAlign: 'center',
        paddingTop: '50px',
        paddingBottom: '50px',
        minHeight: '80vh',
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
        Revisando para el Plan: <Box component="span" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{planName}</Box>
      </Typography>

      <Card
        variant="outlined"
        sx={{
          margin: '20px auto 40px',
          padding: '20px',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)', 
          borderRadius: 2,
        }}
      >
        {paymentSuccess && (
            <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
                ¡Pago simulado realizado con éxito! Gracias por tu suscripción al plan **{planName}**.
            </Alert>
        )}

        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
          Selecciona tu método de pago
        </Typography>

        <RadioGroup
          name="payment-method-group"
          value={paymentMethod}
          onChange={handlePaymentChange}
        >
          <Box
            onClick={() => setPaymentMethod('creditCard')}
            sx={methodBoxSx(paymentMethod === 'creditCard')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                value="creditCard"
                control={<Radio size="small" />}
                label={<Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Tarjeta de crédito</Typography>}
                sx={{ m: 0, flexGrow: 1 }}
              />
              <CardLogos />
            </Box>
            {paymentMethod === 'creditCard' && (
              <Box sx={{ pt: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Número de tarjeta (16 dígitos)"
                  value={cardNumber}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '');
                    setCardNumber(digitsOnly.slice(0, 16));
                  }}
                  variant="outlined"
                  size="small"
                  margin="dense"
                  error={paymentMethod === 'creditCard' && cardNumber.length > 0 && cardNumber.length < 16}
                  helperText={paymentMethod === 'creditCard' && cardNumber.length > 0 && cardNumber.length < 16 ? "Faltan dígitos" : " "}
                  inputProps={{ maxLength: 16 }}
                  InputProps={{
                    endAdornment: <LockOutlinedIcon color="action" sx={{ fontSize: '18px' }} />,
                  }}
                  required
                />
                <TextField
                  fullWidth
                  placeholder="Nombre del titular"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  variant="outlined"
                  size="small"
                  margin="dense"
                  required
                />
                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      placeholder="Fecha de vencimiento (MM / AA)"
                      value={expiryDate}
                      onChange={(e) => {
                          setExpiryDate(formatExpiryDate(e.target.value));
                      }}
                      variant="outlined"
                      size="small"
                      required
                      inputProps={{ maxLength: 5 }} 
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      placeholder="CVV / Código de seguridad"
                      value={securityCode}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        setSecurityCode(digitsOnly.slice(0, 3));
                      }}
                      variant="outlined"
                      size="small"
                      type={showSecurityCode ? 'text' : 'password'}
                      inputProps={{ maxLength: 3 }}
                      error={paymentMethod === 'creditCard' && securityCode.length > 0 && securityCode.length < 3}
                      helperText={paymentMethod === 'creditCard' && securityCode.length > 0 && securityCode.length < 3 ? "Mínimo 3 dígitos" : " "}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle security code visibility"
                              onClick={handleClickShowSecurityCode}
                              onMouseDown={handleMouseDownPassword}
                              edge="end"
                              size="small"
                            >
                              {showSecurityCode ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 1 }} />
          <Box
            onClick={() => setPaymentMethod('paypal')}
            sx={methodBoxSx(paymentMethod === 'paypal')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                value="paypal"
                control={<Radio size="small" />}
                label={<Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>PayPal</Typography>}
                sx={{ m: 0, flexGrow: 1 }}
              />
              <Box sx={{
                bgcolor: '#ffc439',
                color: '#003087',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontWeight: 'bold',
                fontSize: '0.8rem'
              }}>
                <PaymentIcon sx={{ fontSize: '16px', mr: 0.5 }} /> PayPal
              </Box>
            </Box>
            {paymentMethod === 'paypal' && (
              <Box sx={{ pt: 2, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Serás redirigido a la página de PayPal para completar tu compra de forma segura.
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={isPaypalProcessing ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
                    disabled={isPaypalProcessing}
                    onClick={handleCheckout}
                    sx={{
                        width: '100%',
                        bgcolor: '#003087',
                        color: '#fff',
                        '&:hover': {
                            bgcolor: '#005ea6',
                        },
                        '&.Mui-disabled': {
                            bgcolor: 'action.disabledBackground',
                            color: 'text.secondary'
                        }
                    }}
                >
                    {isPaypalProcessing ? 'Redirigiendo a PayPal...' : 'Pagar Ahora con PayPal'}
                </Button>
              </Box>
            )}
          </Box>
        </RadioGroup>
        {paymentMethod === 'creditCard' && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              disabled={!isButtonEnabled || paymentSuccess}
              onClick={handleCheckout}
              sx={{
                width: '100%',
                mt: 4,
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'text.secondary',
                  border: 1,
                  borderColor: 'divider',
                },
              }}
            >
              Proceder al Pago
            </Button>
        )}
      </Card>
    </Container>
  );
};

export default PaySubscription;