// Código limpiado: SIN SIDEBAR y SIN TODA LA LÓGICA DE CAMPAÑAS

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Send, Pencil, Trash2 } from "lucide-react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  IconButton,
  TableContainer,
  CircularProgress,
  Alert
} from "@mui/material";
import config from "../config.json";
import { useConfirm } from "../components/ConfirmProvider";
import { useNotify } from "../components/NotificationProvider";

const fechaHora = new Date().toLocaleString("es-MX", { hour12: false });

interface Instance {
  id: number;
  instance_id: string;
  title: string;
}

interface Flow {
  id: number;
  flow_id: string;
  title: string;
}

interface Chatbot {
  id: number;
  title: string;
  for_all: number;
  flow: string;
  active: number;
  instance_id: string;
  prevent_book_id: string | number | null;
  ai_prompt?: string | null;
}

export default function Chatbot() {
  const confirm = useConfirm();
  const notify = useNotify();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userId, setUserId] = useState<number | null>(null);

  const [instances, setInstances] = useState<Instance[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);

  const [chatbots, setChatbots] = useState<Chatbot[]>([]);

  const [showAddChatbot, setShowAddChatbot] = useState(false);
  const [editChatbot, setEditChatbot] = useState<Chatbot | null>(null);

  const [titulo, setTitulo] = useState("");
  const [paraTodos, setParaTodos] = useState(true);
  const [flujo, setFlujo] = useState<Flow | null>(null);
  const [instancia, setInstancia] = useState("");
  const [activo, setActivo] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");

  const [phonebooks, setPhonebooks] = useState<any[]>([]);
  const [preventBook, setPreventBook] = useState<string | number>("");

  const apiCall = useCallback(async (endpoint: string, method: string = 'GET', body: object | null = null) => {
    try {
      const headers: HeadersInit = {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
      };
      const options: RequestInit = { method, headers };
      if (body) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${config.API_URL}${endpoint}`, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [chatbotsData, instancesData, flowsData, meData, phonebooksData] = await Promise.all([
        apiCall('chatbot/get_mine'),
        apiCall('session/get_instances_with_status'),
        apiCall('flow/get_mine'),
        apiCall('user/get_me'),
        apiCall('user/get_phonebooks')
      ]);

      setChatbots(chatbotsData.data);
      setInstances(instancesData.data.map((d: any) => d.i));
      setFlows(flowsData.data);
      setUserId(meData.data.id);
      setPhonebooks(phonebooksData.data);
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleEnviarChatbot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !instancia || !flujo) {
      setError("Por favor, llena todos los campos.");
      return;
    }
    setIsSubmitting(true);

try {

  if (editChatbot) {
    const payload = {
      fecha: fechaHora,
      auth: localStorage.getItem("token") || null,
      accion: "Actualizar chatbot",
      data: {
        payload: {
          id: editChatbot.id,
          title: titulo,
          instance_id: instancia,
          flow: flujo,
          for_all: paraTodos,
          prevent_book_id: preventBook || null,
          ai_prompt: aiPrompt
        }
      }
    };

    await apiCall("chatbot/update_bot", "POST", payload);

  } else {
    if (!userId) throw new Error("Usuario no encontrado");

    const payload = {
      fecha: fechaHora,
      auth: localStorage.getItem("token") || null,
      accion: "Agregar chatbot",
      data: {
        payload: {
          add: true,
          id: userId,
          title: titulo,
          instance_id: instancia,
          flow: flujo,
          for_all: paraTodos,
          prevent_book_id: null,
          ai_prompt: aiPrompt
        }
      }
    };

    await apiCall("chatbot/add_bot", "POST", payload);
  }

  resetChatbotForm();
  setShowAddChatbot(false);
  await fetchInitialData();

} finally {
  setIsSubmitting(false);
}

  };

const handleDeleteChatbot = async (bot: Chatbot) => {
  const confirmed = await confirm({
    title: "Eliminar chatbot",
    message: (
      <>
        Se eliminará el chatbot <strong>“{bot.title}”</strong>. Esta acción no se puede deshacer.
      </>
    ),
    confirmText: "Eliminar",
    severity: "danger",
  });

  if (!confirmed) return;

  try {
    const payload = {
      fecha: fechaHora,
      auth: localStorage.getItem("token") || null,
      accion: "Eliminar chatbot",
      data: {
        payload: {
          id: bot.id
        }
      }
    };

    await apiCall("chatbot/del_bot", "POST", payload);

    setChatbots(prev => prev.filter(c => c.id !== bot.id));
    notify.success("Chatbot eliminado correctamente.");

  } catch (err) {
    console.error(err);
    notify.error("No se pudo eliminar el chatbot. Intenta de nuevo.");
  }
};


const handleToggleChatbotStatus = async (bot: Chatbot) => {
  const newStatus = !bot.active;

  setChatbots(prev =>
    prev.map(b => {
      // El bot que el usuario clickeó
      if (b.id === bot.id) {
        return { ...b, active: newStatus ? 1 : 0 };
      }
      // Si estamos encendiendo, apagamos los otros bots que compartan la MISMA instancia
      if (newStatus && b.instance_id === bot.instance_id) {
        return { ...b, active: 0 };
      }
      return b;
    })
  );

  try {
    const payload = {
      fecha: fechaHora,
      auth: localStorage.getItem("token") || null,
      accion: "Cambiar estado de chatbot",
      data: {
        payload: {
          change: true,
          botId: bot.id,
          status: newStatus
        }
      }
    };

    await apiCall("chatbot/change_bot_status", "POST", payload);
  } catch (err) {}
};


  const resetChatbotForm = () => {
    setTitulo("");
    setParaTodos(true);
    setFlujo(null);
    setInstancia("");
    setActivo(true);
    setEditChatbot(null);
    setPreventBook("");
    setAiPrompt("");
  };

  return (
    <Box p={3} sx={{ overflowY: 'auto' }}>
      <Typography variant="h4" mb={2} fontWeight={700}>Chatbots</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Toolbar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Tus Chatbots</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => { resetChatbotForm(); setShowAddChatbot(true); }}>
          Agregar
        </Button>
      </Box>

      {/* Form */}
      {(showAddChatbot || editChatbot) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>{editChatbot ? 'Editar Chatbot' : 'Nuevo Chatbot'}</Typography>
            <Box component="form" onSubmit={handleEnviarChatbot}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Título" value={titulo} onChange={e => setTitulo(e.target.value)} required />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Select fullWidth size="small" value={instancia} displayEmpty onChange={e => setInstancia(e.target.value)} required>
                    <MenuItem value="" disabled>Seleccionar instancia</MenuItem>
                    {instances.map(i => <MenuItem key={i.id} value={i.instance_id}>{i.title}</MenuItem>)}
                  </Select>
                </Grid>

                <Grid item xs={12}>
                  <Select fullWidth size="small" value={flujo?.id || ""} displayEmpty onChange={e => setFlujo(flows.find(f => f.id === e.target.value) || null)} required>
                    <MenuItem value="" disabled>Seleccionar flujo</MenuItem>
                    {flows.map(f => <MenuItem key={f.id} value={f.id}>{f.title}</MenuItem>)}
                  </Select>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel control={<Switch checked={paraTodos} onChange={e => setParaTodos(e.target.checked)} />} label="Para todos los contactos" />
                </Grid>
                {!paraTodos && (
                  <Grid item xs={12}>
                    <Select fullWidth size="small" value={preventBook} displayEmpty onChange={e => setPreventBook(e.target.value)} required={!paraTodos}>
                      <MenuItem value="" disabled>Seleccionar agenda a ignorar (Ej. Soporte o Familia)</MenuItem>
                      {phonebooks.map(pb => (
                        <MenuItem key={pb.id} value={pb.id}>{pb.name}</MenuItem>
                      ))}
                    </Select>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    multiline
                    rows={4}
                    size="small" 
                    label="Personalidad y Reglas de la Inteligencia Artificial (Opcional)" 
                    placeholder="Ej: Eres un vendedor amable. Usa respuestas cortas y no uses emojis..."
                    value={aiPrompt} 
                    onChange={e => setAiPrompt(e.target.value)} 
                    inputProps={{ maxLength: 500 }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    Define cómo responderá Ollama cuando el cliente escriba algo fuera del flujo estático.
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end" gap={2}>
                    <Button variant="outlined" color="secondary" onClick={() => { setShowAddChatbot(false); setEditChatbot(null); }}>Cerrar</Button>
                    <Button type="submit" variant="contained" startIcon={<Send size={16} />} disabled={isSubmitting}>
                      {isSubmitting ? <CircularProgress size={24} /> : (editChatbot ? "Guardar cambios" : "Crear Chatbot")}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tabla */}
      <Card>
        <CardContent>
          {isLoading ? <CircularProgress /> : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Título</TableCell>
                    <TableCell>Instancia</TableCell>
                    <TableCell>Flujo</TableCell>
                    <TableCell>Para todos</TableCell>
                    <TableCell>Activo</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {chatbots.map(bot => {
                    let flowObj: any = null;
                    let flowTitle = 'N/A';
                    try {
                      flowObj = JSON.parse(bot.flow);
                      flowTitle = flowObj?.title || 'N/A';
                    } catch {}

                    return (
                      <TableRow key={bot.id}>
                        <TableCell>{bot.title}</TableCell>
                        <TableCell>{instances.find(i => i.instance_id === bot.instance_id)?.title || bot.instance_id}</TableCell>
                        <TableCell>{flowTitle}</TableCell>
                        <TableCell>{bot.for_all ? ('Sí') : (
                          <span style={{ color: "gray", fontSize: "0.9em" }}>
                            No (Excluye: {phonebooks.find(pb => String(pb.id) === String(bot.prevent_book_id))?.name || 'Agenda desconocida'})
                          </span>)}
                        </TableCell>
                        <TableCell><Switch checked={!!bot.active} onChange={() => handleToggleChatbotStatus(bot)} /></TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => {
                            const flowFound = flows.find(f => f.flow_id === flowObj?.flow_id);
                            setEditChatbot(bot);
                            setTitulo(bot.title);
                            setInstancia(bot.instance_id);
                            setParaTodos(!!bot.for_all);
                            setPreventBook(bot.prevent_book_id || "");
                            setFlujo(flowFound || null);
                            setActivo(!!bot.active);
                            setAiPrompt(bot.ai_prompt || "");
                            setShowAddChatbot(true);
                          }}>
                            <Pencil size={16} />
                          </IconButton>

                          <IconButton size="small" color="error" aria-label="Eliminar chatbot" onClick={() => handleDeleteChatbot(bot)}>
                            <Trash2 size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}