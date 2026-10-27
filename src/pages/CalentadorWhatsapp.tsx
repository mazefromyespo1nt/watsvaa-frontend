import React, { useState, useEffect } from "react";
import config from "../config";
import { useNotify } from "../components/NotificationProvider";
import {
    Box,
    Button,
    Paper,
    TextField,
    Typography,
    Alert,
    Divider,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Switch, 
    FormControlLabel,
    IconButton,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import chatsImage from "../images/chats.png";
import { Forum, Help, NearMe, DeleteOutline } from "@mui/icons-material";

interface Message {
    id: string;
    text: string;
}

interface Instance {
    id: string; 
    name: string;
    phoneNumber: string; 
}

type ActiveTab = "script" | "config";
const generateId = () => Math.random().toString(36).substr(2, 9);

const encodeInstanceToBase64 = (instanceData: any): string => {
    const jsonString = JSON.stringify(instanceData);
    return btoa(jsonString);
};

interface ActivarCalentadorContentProps {
    isWarmerActive: boolean;
    setIsWarmerActive: (active: boolean) => void;
    fetchMyWarmer: () => Promise<any>; 
}

const ActivarCalentadorContent: React.FC<ActivarCalentadorContentProps> = ({ isWarmerActive, setIsWarmerActive, fetchMyWarmer }) => {
    const notify = useNotify();

    const [selectedInstances, setSelectedInstances] = useState<string[]>([]);
    const [instances, setInstances] = useState<Instance[]>([]);

    useEffect(() => {
        const initSettings = async () => {
            await getInstances();
            const warmerData = await fetchMyWarmer();
            if (warmerData) {
                setIsWarmerActive(warmerData.is_active === 1 || warmerData.is_active === true);
                if (Array.isArray(warmerData.instances)) {
                    setSelectedInstances(warmerData.instances);
                }
            }
        }
        initSettings();
    }, []);

    const getInstances = async () => {
        try {
            const response = await fetch(config.API_URL + "/session/get_instances_with_status", {
                method: "GET", 
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
            });
            if (response.ok) {
                const data = await response.json();
                const rawInstances = data.data || data || [];
                
                const mappedInstances: Instance[] = rawInstances.map((item: any) => {
                    const client_id = item.i?.title || item.userData?.name || "Instancia sin nombre";
                    const instanceDataToEncode = { uid: item.i?.uid, client_id: client_id };
                    const encodedInstanceId = encodeInstanceToBase64(instanceDataToEncode);
                    
                    return {
                        id: encodedInstanceId, 
                        name: client_id,
                        phoneNumber: item.userData?.id || item.i?.phone_number || item.userData?.phone_number || "",
                    };
                });
                setInstances(mappedInstances);
            }
        } catch (error) {
            console.error("Error al cargar las instancias", error);
        }
    };

    const fetchToggleIns = async(instanceIdBase64: string) => {
        console.log("Sincronizando instancia con el calentador:", instanceIdBase64);
        try {
            const response = await fetch(config.API_URL + "/user/add_ins_to_warm", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", 
                    Authorization: "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({ instance: instanceIdBase64 })
            });
            
            if (response.ok) {
                console.log("Operación completada en la BD.");
            }
        } catch (error){
            console.error("Error de red:", error);
        } 
    }
    
    const handleInstanceToggle = (instanceId: string) => {
        setSelectedInstances(prev => {
            const isCurrentlySelected = prev.includes(instanceId);
            let newSelectedInstances;

            if (isCurrentlySelected) {
                newSelectedInstances = prev.filter(id => id !== instanceId);
            } else {
                newSelectedInstances = [...prev, instanceId];
            }
            
            // El backend usa esta ruta como interruptor (toggle)
            fetchToggleIns(instanceId);
            return newSelectedInstances;
        });
    };

    const fetchChangeStatus = async(status: boolean) => {
      try { 
          const response = await fetch(config.API_URL + "/user/change_status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json", 
                Authorization: "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({ status: status }) 
          });
          
          if (response.ok) {
              console.log(`Estado del calentador actualizado a: ${status}`);
          }
      } catch(error){
        console.error("Error de red al cambiar el estado del calentador:", error);
      }
    }

    const handleWarmerToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newActiveState = event.target.checked;
        if (newActiveState && selectedInstances.length < 2) {
            notify.warning("Seleccione al menos 2 instancias para activar el calentador");
            return;
        }
        
        setIsWarmerActive(newActiveState);
        fetchChangeStatus(newActiveState);
    };

    return (
        <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 3, bgcolor: "background.paper", minHeight: '400px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                    Activar calentador
                </Typography>
            </Box>

            <Alert severity="info" icon={<Help />} sx={{ bgcolor: 'rgba(2, 139, 237, 1)', color: '#ffffff', borderLeft: `5px solid ${isWarmerActive? 'error.main' : 'info.main'}`, '& .MuiAlert-icon': { color: '#FFFFFF' }, fontWeight: 'bold' }}>
                Asegúrese de marcar al menos 2 casillas de instancias para calentar la instancia
            </Alert>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox"></TableCell>
                            <TableCell>Lista de instancias disponibles:</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {instances.map((instance) => (
                            <TableRow key={instance.id}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedInstances.includes(instance.id)}
                                        onChange={() => handleInstanceToggle(instance.id)}
                                    />
                                </TableCell>
                                <TableCell component="th" scope="row">
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                            {instance.name.split(':')[0].trim()}
                                        </Typography>
                                        {instance.phoneNumber && (
                                            <Typography variant="body2" color="text.secondary">
                                                {instance.phoneNumber.split(':')[0].trim()}
                                            </Typography>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2 }}>
                <FormControlLabel
                    control={<Switch checked={isWarmerActive} onChange={handleWarmerToggle} color={isWarmerActive ? "success" : "error"} />}
                    label={<Typography variant="button" sx={{ fontWeight: 'bold', color: isWarmerActive ? 'success.main' : 'error.main' }}>{isWarmerActive ? 'ENCENDIDO' : 'APAGADO'}</Typography>}
                    labelPlacement="start" 
                />
            </Box>
        </Paper>
    );
}
   
export const CalentadorWhatsapp = () => {
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
    const [newMessageText, setNewMessageText] = useState<string>(""); 
    const [activeTab, setActiveTab] = useState<ActiveTab>("script");
    const [isWarmerActive, setIsWarmerActive] = useState<boolean>(false);

    const fetchMyWarmer = async () => {
        try {
            const response = await fetch(config.API_URL + "/user/get_my_warmer", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("token"),
                },
            });
            const result = await response.json();
    
            // Leemos "success" en vez de "estatus"
            if (!response.ok || !result.success) {
                console.log("Aviso Calentador:", result.msg || "No inicializado");
                return null;
            }
            return result.data;
        } catch (error) {
            console.error("Algo salió mal al obtener el warmer:", error);
            return null;
        }
    };

    const handleAddMessage = async () => {
        const textToSave = newMessageText.trim();
        if (textToSave === "") {
            setSaveStatus("error");
            return;
        }

        try {
            //  Simplificamos el payload para que el backend lo entienda
            const payload = { msg: textToSave };

            const response = await fetch(config.API_URL + "/user/add_warmer_msg", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("token"),
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.msg || "No se pudo guardar el mensaje");
            }

            console.log("Mensaje guardado:", result.msg);

            const newId = generateId();
            setMessages(prev => [...prev, { id: newId, text: textToSave }]);
            setNewMessageText("");
            setSaveStatus("success");

        } catch (error) {
            console.error(error);
            setSaveStatus("error");
        }
    };
    const handleDeleteMessage = async (msgId: string) => {
        try {
            const response = await fetch(config.API_URL + "/user/del_warmer_msg", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("token"),
                },
                body: JSON.stringify({ id: msgId }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setMessages(prev => prev.filter(m => m.id !== msgId));
            } else {
                console.error(result.msg);
            }
        } catch (error) {
            console.error("Error al borrar el mensaje:", error);
        }
    };

    useEffect(() => {
        const fetchWarmer = async () => {
            try {
                const response = await fetch(config.API_URL + "/user/get_warmer_msg", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    },
                });
                const data = await response.json();

                let messageData = [];
                if (Array.isArray(data)) messageData = data;
                else if (data && Array.isArray(data.messages)) messageData = data.messages;
                else if (data && Array.isArray(data.data)) messageData = data.data;
                else if (data && Array.isArray(data.warmer_msg)) messageData = data.warmer_msg;

                const messagesWithId = messageData.map((msg: any) => ({
                    text: msg.text || msg.message || msg.msg || "",
                    id: msg.id || generateId(),
                }));

                setMessages(messagesWithId);
            } catch (error) {
                console.log("Error fetching warmer messages:", error);
            }
        };

        fetchWarmer();
    }, []);

    const renderContent = () => {
        if (activeTab === "config") {
            return (
                <ActivarCalentadorContent
                    isWarmerActive={isWarmerActive}
                    setIsWarmerActive={setIsWarmerActive}
                    fetchMyWarmer={fetchMyWarmer} 
                />
            );
        }

        return (
            <>
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 2 }}>
                    Agregar mensajes de script de calentamiento
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2, bgcolor: "background.paper" }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        value={newMessageText}
                        onChange={(e) => { setNewMessageText(e.target.value); setSaveStatus("idle"); }}
                        placeholder="Ingrese mensaje..."
                        error={saveStatus === "error" && newMessageText.trim() === ""}
                        helperText={saveStatus === "error" && newMessageText.trim() === "" ? "El mensaje no puede estar vacío" : ""}
                        InputProps={{
                            endAdornment: (
                                <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                                    <Button variant="contained" startIcon={<NearMe />} onClick={handleAddMessage} disabled={newMessageText.trim() === ""} >
                                        Enviar
                                    </Button>
                                </Box>
                            )
                        }}
                    />

                    {messages.map((message, index) => (
                        <TextField
                            key={message.id}
                            fullWidth
                            multiline
                            rows={2}
                            value={message.text}
                            inputProps={{ readOnly: true }} 
                            placeholder={`Mensaje ${index + 1}`}
                            InputProps={{
                                endAdornment: (
                                    <IconButton 
                                        onClick={() => handleDeleteMessage(message.id)} 
                                        color="error"
                                        title="Eliminar mensaje"
                                    >
                                        <DeleteOutline />
                                    </IconButton>
                                ),
                            }}
                        />
                    ))}
                </Paper>

                {saveStatus === "success" && (
                    <Alert severity="success" sx={{ mt: 3 }}>
                        ¡Mensaje guardado exitosamente!
                    </Alert>
                )}
            </>
        );
    };

    return (
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, p: 3, minHeight: "100vh", bgcolor: "background.default", color: "text.primary", gap: 4 }}>
            <Box sx={{ width: { xs: "100%", md: "300px" }, display: "flex", flexDirection: "column", gap: 2 }}>
                <Paper elevation={2} sx={{ p: 2, bgcolor: "background.paper", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Box component="img" src={chatsImage} alt="Chats illustration" sx={{ width: "100%", height: "auto", mb: 2 }} />
                    <Typography variant="body2" sx={{ textAlign: "center", fontWeight: "bold", mb: 2 }}>
                        Calentar su WhatsApp antes de enviar una campaña o mensaje de texto con el Calentador es la mejor manera de reducir el riesgo de ser baneado.
                    </Typography>
                    <Divider sx={{ width: '100%', my: 1 }} />
                    <Button variant="text" startIcon={<Forum />} fullWidth onClick={() => setActiveTab("script")} sx={{ justifyContent: "flex-start", fontWeight: activeTab === "script" ? 'bold' : 'normal', bgcolor: activeTab === "script" ? 'action.selected' : 'transparent', "&:hover": { bgcolor: activeTab === "script" ? 'action.selected' : 'action.hover' } }}>
                        Script de calentamiento
                    </Button>
                    <Button variant="text" startIcon={<SettingsIcon />} fullWidth onClick={() => setActiveTab("config")} sx={{ justifyContent: "flex-start", fontWeight: activeTab === "config" ? 'bold' : 'normal', bgcolor: activeTab === "config" ? 'action.selected' : 'transparent', "&:hover": { bgcolor: activeTab === "config" ? 'action.selected' : 'action.hover' } }}>
                        Configurar calentador
                    </Button>
                </Paper>
            </Box>
            <Box sx={{ flexGrow: 1 }}>
                {renderContent()}
            </Box>
        </Box>
    );
};

export default CalentadorWhatsapp;