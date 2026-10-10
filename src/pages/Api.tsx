import React, { useState, useEffect } from "react";
import ListAltIcon from '@mui/icons-material/ListAlt';
import config from "../config";
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import HttpIcon from '@mui/icons-material/Http';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import DescriptionIcon from '@mui/icons-material/Description';
import TokenImage from "../images/token.png";
import { data } from "framer-motion/client";


function a11yProps(index: number) {
  return {
    id: `api-tab-${index}`,
    'aria-controls': `api-tabpanel-${index}`,
  };
}

const generateToken = () => {
  const token = Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2);
  return token;
};

const GenerateTokenSection = () => {
  const [token, setToken] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [apitoken, setApitoken] = useState({
   token: ''
  });


  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch(config.API_URL+"/user/get_me", {
          method: "GET",
          headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token')},
        }); 
  
        const { data } =  await response.json();
        setApitoken({ token: data.token || '' });
        
        // Si el usuario ya tiene un token en la BD, forzamos a que aparezca la caja
        if (data.token) {
           setToken("visible"); 
        }
  
      } catch (error) {
        console.log(error);
      }
    };
    fetchToken();
  }, []);
  

  const handleGenerateToken = async () => {
    setLoading(true);
    setCopied(false);
    try {
      // Ahora sí llamamos al backend real en Node.js
      const response = await fetch(config.API_URL+"/user/gen_api_token", {
          method: "GET",
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('token')
          }
      });
      const data = await response.json();
      
      if (data.success) {
          setApitoken({ token: data.token }); // Guardamos el token real de JWT
          setToken("visible"); // Hacemos que aparezca la caja de texto
      }
    } catch (error) {
        console.log(error);
    } finally {
        setLoading(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(apitoken.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
        Gestión de Tokens API
      </Typography>
      <Typography variant="body1" align="center" sx={{ mb: 4, color: theme.palette.text.secondary }}>
        Utiliza tokens para automatizar tareas y conectar tus servicios.
      </Typography>

      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <img src={TokenImage} alt="Token API" style={{ maxWidth: '100px', height: 'auto' }} />
      </Box>

      <Divider sx={{ my: 3, borderColor: isDarkMode ? theme.palette.grey[700] : undefined }} />

      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Button
          variant="contained"
          onClick={handleGenerateToken}
          disabled={loading}
          sx={{
            backgroundColor: isDarkMode ? theme.palette.primary.dark : '#4e89ae',
            '&:hover': {
              backgroundColor: isDarkMode ? theme.palette.primary.light : '#437aa0',
            },
            p: '10px 24px',
            fontSize: '1rem'
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Generar Nuevo Token"}
        </Button>
      </Box>

      {token && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            Token Generado:
          </Typography>
          <TextField
            fullWidth
            value={apitoken.token || ""}
            variant="outlined"
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleCopyToken}
                    edge="end"
                    color="primary"
                    aria-label="copy token"
                    sx={{ '&:hover': { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' } }}
                  >
                    {copied ? <CheckCircleOutlineIcon color="success" /> : <ContentCopyIcon color={isDarkMode ? 'primary' : 'action'} />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                color: theme.palette.text.primary
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8',
                '& fieldset': { borderColor: isDarkMode ? theme.palette.grey[700] : '#ddd' },
                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
              },
            }}
          />
          {copied && (
            <Alert severity="success" sx={{ mt: 2, display: 'inline-flex' }}>
              Token copiado al portapapeles.
            </Alert>
          )}
        </Box>
      )}

      <Divider sx={{ my: 4, borderColor: isDarkMode ? theme.palette.grey[700] : undefined }} />
    </Box>
  );
};

const GetMethodSection = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const handleTabChange = (event: any, newValue: React.SetStateAction<number>) => {
    setTabValue(newValue);
  };

  const tabContents = [
    {
      title: "LISTAR CHATS",
      icon: <ListAltIcon />,
      content: (
        <>
          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            1. Enviar una petición GET a:
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #4e89ae' }}>
            <Typography variant="body2" sx={{ color: isDarkMode ? theme.palette.info.light : '#4e89ae', fontWeight: 'bold', overflowWrap: 'break-word', fontFamily: 'monospace' }}>
              http://localhost:8022/api/v1/get-chats?token=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>TOKEN_HERE</span>&instance_id=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>ID</span>
            </Typography>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            2. Indicadores
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #fcef00ff' }}>
            <Box component="ul" sx={{ pl: 2, mb: 0, listStyleType: 'none', color: theme.palette.text.secondary }}>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>token</span> = tu token de acceso API,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>instance_id</span> = ID de la instancia de WhatsApp.</Typography></li>
            </Box>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            3. Respuesta Exitosa
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: theme.palette.text.primary }}>
              {`{
  "success": true,
  "data": [
    { "chat_id": "...", "sender_name": "...", "sender_mobile": "..." }
  ]
}`}
            </Typography>
          </Paper>
        </>
      ),

    },
    {
      title: "LISTAR MENSAJES",
      icon: <ChatBubbleOutlineIcon />,
      content: (
        <>
          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            1. Enviar una petición GET a:
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #4e89ae' }}>
            <Typography variant="body2" sx={{ color: isDarkMode ? theme.palette.info.light : '#4e89ae', fontWeight: 'bold', overflowWrap: 'break-word', fontFamily: 'monospace' }}>
              http://localhost:8022/api/v1/get-messages?token=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>TOKEN_HERE</span>&instance_id=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>ID</span>&chat_id=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>CHAT_ID</span>
            </Typography>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            2. Indicadores
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #fcef00ff' }}>
            <Box component="ul" sx={{ pl: 2, mb: 0, listStyleType: 'none', color: theme.palette.text.secondary }}>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>token</span> = tu token de acceso API,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>instance_id</span> = ID de la instancia,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>chat_id</span> = ID del chat (obtenido al listar chats).</Typography></li>
            </Box>
          </Paper>
          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            3. Respuesta Exitosa
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: theme.palette.text.primary }}>
              {`{
  "success": true,
  "data": [
    {
      "group": ...,
      "type": "text",
      "msgId": "...",
      "remoteJid": "...@",
      "msgContext": { "text": "..." },
      "timestamp": ...,
      "senderName": "...",
      "status": "...",
      "route": "..."
    }
  ]
}`}
            </Typography>
          </Paper>
        </>
      ),
    },
    {
      title: "MENSAJE DE TEXTO",
      icon: <ChatBubbleOutlineIcon />,
      content: (
        <>
          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            1. Send a GET request to
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #4e89ae' }}>
            <Typography variant="body2" sx={{ color: isDarkMode ? theme.palette.info.light : '#4e89ae', fontWeight: 'bold', overflowWrap: 'break-word', fontFamily: 'monospace' }}>
              http://localhost:8022/api/v1/send-text?token=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>TOKEN_HERE</span>&instance_id=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>ID</span>&jid=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>JID</span>&msg=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>HELLO</span>
            </Typography>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            2. Indicators
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #fcef00ff' }}>
            <Box component="ul" sx={{ pl: 2, mb: 0, listStyleType: 'none', color: theme.palette.text.secondary }}>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>token</span> = your token,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>msg</span> = your text message,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>instance_id</span> = instance ID,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>jid</span> = 91999999999@s.whatsapp.net</Typography></li>
            </Box>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            3. Success response
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: theme.palette.text.primary }}>
              {`{
  "success": true,
  "message": "Message sent successfully!",
  "response": "<RESPONSE>"
}`}
            </Typography>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            4. Failed response
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #f44336' }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: theme.palette.text.primary }}>
              {`{
  "success": false,
  "message": "<REASON>"
}`}
            </Typography>
          </Paper>
        </>
      ),
    },
    {
      title: "ENVIAR IMAGEN",
      icon: <ImageIcon />,
      content: (
        <>
          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            1. Send a GET request to
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #4e89ae' }}>
            <Typography variant="body2" sx={{ color: isDarkMode ? theme.palette.info.light : '#4e89ae', fontWeight: 'bold', overflowWrap: 'break-word', fontFamily: 'monospace' }}>
              http://localhost:8022/api/v1/send-image?token=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>TOKEN_HERE</span>&instance_id=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>ID</span>&jid=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>JID</span>&caption=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>CAPTION</span>&imageurl=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>IMAGEURL</span>
            </Typography>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            2. Indicators
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #fcef00ff' }}>
            <Box component="ul" sx={{ pl: 2, mb: 0, listStyleType: 'none', color: theme.palette.text.secondary }}>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>token</span> = your token,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>caption</span> = your image caption message,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>instance_id</span> = instance ID,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>jid</span> = 91999999999@s.whatsapp.net,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>imageurl</span> = https://someimage.com/image.jpg</Typography></li>
            </Box>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            3. Success response
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: theme.palette.text.primary }}>
              {`{
  "success": true,
  "message": "Message sent successfully!",
  "response": "<RESPONSE>"
}`}
            </Typography>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            4. Failed response
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #f44336' }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: theme.palette.text.primary }}>
              {`{
  "success": false,
  "message": "<REASON>"
}`}
            </Typography>
          </Paper>
        </>
      ),
    },
    {
      title: "ENVIAR VIDEO",
      icon: <VideocamIcon />,
      content: (
        <>
          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            1. Send a GET request to
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #4e89ae' }}>
            <Typography variant="body2" sx={{ color: isDarkMode ? theme.palette.info.light : '#4e89ae', fontWeight: 'bold', overflowWrap: 'break-word', fontFamily: 'monospace' }}>
              http://localhost:8022/api/v1/send-video?token=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>TOKEN_HERE</span>&instance_id=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>ID</span>&jid=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>JID</span>&caption=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>CAPTION</span>&videourl=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>VIDEOURL</span>
            </Typography>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            2. Indicators
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #fcef00ff' }}>
            <Box component="ul" sx={{ pl: 2, mb: 0, listStyleType: 'none', color: theme.palette.text.secondary }}>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>token</span> = your token,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>caption</span> = your video caption message,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>instance_id</span> = instance ID,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>jid</span> = 91999999999@s.whatsapp.net,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>videourl</span> = https://someimage.com/video.mp4</Typography></li>
            </Box>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            3. Success response
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: theme.palette.text.primary }}>
              {`{
  "success": true,
  "message": "Message sent successfully!",
  "response": "<RESPONSE>"
}`}
            </Typography>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            4. Failed response
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #f44336' }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: theme.palette.text.primary }}>
              {`{
  "success": false,
  "message": "<REASON>"
}`}
            </Typography>
          </Paper>
        </>
      ),
    },
    {
      title: "ENVIAR AUDIO",
      icon: <AudiotrackIcon />,
      content: (
        <>
          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            1. Send a GET request to
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #4e89ae' }}>
            <Typography variant="body2" sx={{ color: isDarkMode ? theme.palette.info.light : '#4e89ae', fontWeight: 'bold', overflowWrap: 'break-word', fontFamily: 'monospace' }}>
              http://localhost:8022/api/v1/send-audio?token=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>TOKEN_HERE</span>&instance_id=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>ID</span>&jid=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>JID</span>&audiourl=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>AUDIOURL</span>
            </Typography>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            2. Indicators
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #fcef00ff' }}>
            <Box component="ul" sx={{ pl: 2, mb: 0, listStyleType: 'none', color: theme.palette.text.secondary }}>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>token</span> = your token,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>instance_id</span> = instance ID,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>jid</span> = 91999999999@s.whatsapp.net,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>audiourl</span> = https://someimage.com/audio.mp3</Typography></li>
            </Box>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            3. Success response
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: theme.palette.text.primary }}>
              {`{
  "success": true,
  "message": "Message sent successfully!",
  "response": "<RESPONSE>"
}`}
            </Typography>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            4. Failed response
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #f44336' }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: theme.palette.text.primary }}>
              {`{
  "success": false,
  "message": "<REASON>"
}`}
            </Typography>
          </Paper>
        </>
      ),
    },
    {
      title: "ENVIAR DOCUMENTO",
      icon: <DescriptionIcon />,
      content: (
        <>
          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            1. Send a GET request to
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #4e89ae' }}>
            <Typography variant="body2" sx={{ color: isDarkMode ? theme.palette.info.light : '#4e89ae', fontWeight: 'bold', overflowWrap: 'break-word', fontFamily: 'monospace' }}>
              http://localhost:8022/api/v1/send-doc?token=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>TOKEN_HERE</span>&instance_id=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>ID</span>&jid=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>JID</span>&caption=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>CAPTION</span>&docurl=<span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>DOCURL</span>
            </Typography>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            2. Indicators
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #fcef00ff' }}>
            <Box component="ul" sx={{ pl: 2, mb: 0, listStyleType: 'none', color: theme.palette.text.secondary }}>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>token</span> = your token,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>instance_id</span> = instance ID,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>jid</span> = 91999999999@s.whatsapp.net,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>caption</span> = your caption,</Typography></li>
              <li><Typography variant="body2"><span style={{ color: isDarkMode ? theme.palette.warning.light : '#c41151', fontWeight: 'bold' }}>docurl</span> = https://someimage.com/somedoc.pdf</Typography></li>
            </Box>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            3. Success response
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: theme.palette.text.primary }}>
              {`{
  "success": true,
  "message": "Message sent successfully!",
  "response": "<RESPONSE>"
}`}
            </Typography>
          </Paper>

          <Typography variant="h6" gutterBottom color={theme.palette.text.primary}>
            4. Failed response
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? theme.palette.grey[800] : '#f1f4f8', borderRadius: '8px', borderLeft: '4px solid #f44336' }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', color: theme.palette.text.primary }}>
              {`{
  "success": false,
  "message": "<REASON>"
}`}
            </Typography>
          </Paper>
        </>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
        Enviar mensaje usando solicitud GET
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: isDarkMode ? theme.palette.grey[700] : 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="api request types"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabContents.map((tab, index) => (
            <Tab
              key={index}
              icon={React.cloneElement(tab.icon, { color: tabValue === index ? 'primary' : 'inherit' })}
              label={tab.title}
              {...a11yProps(index)}
              sx={{
                color: isDarkMode && tabValue !== index ? theme.palette.grey[400] : undefined,
              }}
            />
          ))}
        </Tabs>
      </Box>
      
      <Box sx={{ p: { xs: 1, md: 3 } }}>
        {tabContents[tabValue].content}
      </Box>
      
    </Box>
  );
};

const Api = () => {
  const [selectedMenuItem, setSelectedMenuItem] = React.useState("generarToken");
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const renderContent = () => {
    switch (selectedMenuItem) {
      case "generarToken":
        return <GenerateTokenSection />;
      case "metodoGET":
        return <GetMethodSection />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100vh',
      backgroundColor: isDarkMode ? theme.palette.background.default : '#f5f7fa',
      color: theme.palette.text.primary,
    }}>

      <Paper elevation={1} sx={{
        width: 280,
        flexShrink: 0,
        backgroundColor: isDarkMode ? theme.palette.background.paper : '#ffffff',
        borderRight: `1px solid ${isDarkMode ? theme.palette.grey[800] : '#e0e0e0'}`,
        p: 2,
        borderRadius: '0',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
      }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
            Automatiza tus otras tareas usando API
          </Typography>
        </Box>
        <List>
          <ListItem disablePadding>
            <ListItemButton
              selected={selectedMenuItem === "generarToken"}
              onClick={() => setSelectedMenuItem("generarToken")}
              sx={{
                borderRadius: '8px',
                '&.Mui-selected': {
                  backgroundColor: isDarkMode ? theme.palette.primary.dark : '#e3f2fd',
                  '&:hover': {
                    backgroundColor: isDarkMode ? theme.palette.primary.main : '#d1e5fa',
                  },
                },
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f0f0f0',
                },
              }}
            >
              <ListItemIcon>
                <VpnKeyIcon color={selectedMenuItem === "generarToken" ? "primary" : "inherit"} />
              </ListItemIcon>
              <ListItemText primary="Generar token" sx={{ color: isDarkMode ? theme.palette.text.primary : 'inherit' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={selectedMenuItem === "metodoGET"}
              onClick={() => setSelectedMenuItem("metodoGET")}
              sx={{
                borderRadius: '8px',
                '&.Mui-selected': {
                  backgroundColor: isDarkMode ? theme.palette.primary.dark : '#e3f2fd',
                  '&:hover': {
                    backgroundColor: isDarkMode ? theme.palette.primary.main : '#d1e5fa',
                  },
                },
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f0f0f0',
                },
              }}
            >
              <ListItemIcon>
                <HttpIcon color={selectedMenuItem === "metodoGET" ? "primary" : "inherit"} />
              </ListItemIcon>
              <ListItemText primary="Método GET" sx={{ color: isDarkMode ? theme.palette.text.primary : 'inherit' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Paper>

      <Box sx={{
        display: { xs: 'block', md: 'none' },
        width: '100%',
        borderBottom: `1px solid ${isDarkMode ? theme.palette.grey[700] : 'divider'}`,
      }}>
        <Tabs
          value={selectedMenuItem === "generarToken" ? 0 : 1}
          onChange={(e, value) => setSelectedMenuItem(value === 0 ? "generarToken" : "metodoGET")}
          variant="fullWidth"
          aria-label="mobile navigation"
        >
          <Tab
            icon={<VpnKeyIcon />}
            label="Token"
            id="mobile-tab-0"
            aria-controls="mobile-tabpanel-0"
            sx={{
              color: isDarkMode ? theme.palette.text.primary : 'inherit',
            }}
          />
          <Tab
            icon={<HttpIcon />}
            label="Método GET"
            id="mobile-tab-1"
            aria-controls="mobile-tabpanel-1"
            sx={{
              color: isDarkMode ? theme.palette.text.primary : 'inherit',
            }}
          />
        </Tabs>
      </Box>

      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, overflowY: 'auto' }}>
        <Grid container spacing={4} justifyContent="center" alignItems="flex-start">
          <Grid item xs={12} md={10}>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: '12px', backgroundColor: isDarkMode ? theme.palette.background.paper : '#ffffff' }}>
              {renderContent()}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Api;