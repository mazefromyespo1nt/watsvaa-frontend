import React, { useCallback } from 'react';
import config from '../config';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Button,
    Chip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
    CircularProgress,
    Alert,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonIcon from '@mui/icons-material/Person';
import Badge from '@mui/material/Badge';
import { useConfirm } from '../components/ConfirmProvider';
import { useNotify } from '../components/NotificationProvider';

const fechaHora = new Date().toLocaleString("es-MX", { hour12: false });

const INTERVALO_MONITOREO = 3000;


interface Instance {
    id: string;
    name: string;
    isAvailable: boolean;
    userName: string;
    userId: string;
    uid: string;
    instance_id: string;
    title: string;
    status: string;
    webhook: string | null;
    userData: any;
    jid: string | null;
    a_status: string | null;
    createdAt: string;
    qr?: string;
}

interface StatusResponse {
    success: boolean;
    status: boolean; 
    qr?: string; 
    userData?: {
        id: string;
    };
    msg?: string;
}

const initialInstances: Instance[] = [];

const InstancesPage = () => {
    const confirm = useConfirm();
    const notify = useNotify();

    const [instances, setInstances] = React.useState<Instance[]>(initialInstances);
    const [openDialog, setOpenDialog] = React.useState(false);

    const [qrCodeImage, setQrCodeImage] = React.useState<string | null>(null);
    const [qrLoading, setQrLoading] = React.useState(false);
    const [instanceIdAfterAdd, setInstanceIdAfterAdd] = React.useState<string | null>(null);
    const [modalError, setModalError] = React.useState<string | null>(null); 
    

    const [sessionIdForStatus, setSessionIdForStatus] = React.useState<string | null>(null); 
    const [isMonitoring, setIsMonitoring] = React.useState(false); 
    const [connectionState, setConnectionState] = React.useState<'SCAN' | 'CONNECTING' | 'CONNECTED'>('SCAN');


    const [newInstance, setNewInstance] = React.useState({
        title: '',
        syncMax: false,
    });
    const [addLoading, setAddLoading] = React.useState(false);

    const handleOpenDialog = () => {
        setNewInstance({ title: '', syncMax: false });
        setQrCodeImage(null);
        setInstanceIdAfterAdd(null);
        setSessionIdForStatus(null);
        setIsMonitoring(false);
        setConnectionState('SCAN');
        setModalError(null);
        setOpenDialog(true);
    };
    
    const handleCloseDialog = () => {
        setIsMonitoring(false);
        setOpenDialog(false);
    };

    const fetchInstancias = useCallback(async () => {
        try {
            const response = await fetch(config.API_URL + '/session/get_mine', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + localStorage.getItem('token'),
                },
            });

            if (!response.ok) {
                console.error('API request failed with status:', response.status);
                return;
            }

            const data = await response.json();
            let rawInstances: any[] = [];
            if (data && Array.isArray(data.instances)) {
                rawInstances = data.instances;
            } else if (Array.isArray(data)) {
                rawInstances = data;
            } else if (data && Array.isArray(data.data)) {
                rawInstances = data.data;
            } else {
                console.error("Fetched data is not in a recognized array format:", data);
                return;
            }

            const mappedInstances: Instance[] = rawInstances.map((inst: any) => {
                let parsedUserData = { id: '', name: '' };
                
                const dbInst = inst.i || inst;
                
                if (dbInst.data) {
                    try {
                        const userData = typeof dbInst.data === 'string' ? JSON.parse(dbInst.data) : dbInst.data;
                        parsedUserData.id = dbInst.number || (userData?.id && typeof userData.id === 'string' ? userData.id.split(':')[0].replace(/@.*$/, '') : '') || '';
                        parsedUserData.name = userData?.name || '';
                    } catch (e) {
                        console.error("Error parsing data for instance:", dbInst.id, e);
                    }
                }
                
                const status = (dbInst.status || '').toUpperCase();
                const isAvailable = status === 'CONNECTED' || status === 'LOGGEDIN' || status === 'ACTIVE';

                return {
                    ...dbInst,
                    name: dbInst.title,
                    id: dbInst.instance_id || dbInst.id, 
                    isAvailable: isAvailable, 
                    userId: parsedUserData.id,
                    userName: parsedUserData.name,
                } as Instance; 
            });

            setInstances(mappedInstances);

        } catch (error) {
            console.error("Error fetching or parsing instances:", error);
        }
    }, []);

    React.useEffect(() => {
        fetchInstancias();
    }, [fetchInstancias]);


    const fetchStatus = useCallback(async (sessionId: string) => {
        try {
            const response = await fetch(config.API_URL + '/session/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + localStorage.getItem('token'),
                },
                body: JSON.stringify({ id: sessionId }),
            });

            const resp = await response.json();

            if (!response.ok || resp.estatus === false) {
                throw new Error(resp.mensaje || "Error de la API al consultar el estado.");
            }

            if (resp.status === true) {
                setIsMonitoring(false);
                setConnectionState('CONNECTED');
                handleCloseDialog(); 
                fetchInstancias();   
                return true;
            }

            if (resp.qr) {
                setQrCodeImage(resp.qr);
                setConnectionState('SCAN');
            } else {
                setConnectionState('SCAN');
            }

            return false;

        } catch (error) {
            console.error("Error al monitorear el estado:", error);
            setIsMonitoring(false); // Detenemos el bucle si hay error crítico
            setConnectionState('SCAN');
            return false;
        }
    }, [fetchInstancias]);

const fetchQrCode = async (payload: { title: string; syncMax: boolean }) => {
        setQrLoading(true);
        setQrCodeImage(null);
        setModalError(null);

        try {
            const requestBody = {
                fecha: fechaHora,
                auth: localStorage.getItem("token") || "",
                accion: "Crear QR",
                ...payload
            };

            const response = await fetch(config.API_URL + "/session/create_qr", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("token"),
                },
                body: JSON.stringify(requestBody),
            });

            const api = await response.json();

            if (!api.success) {
                let errorMsg = api.msg || "Error al procesar la solicitud.";
                if (errorMsg.includes("instances limits are reached")) {
                    errorMsg = "Has alcanzado el límite de instancias de tu plan. Elimina una o mejora tu suscripción.";
                }
                throw new Error(errorMsg);
            }

            const responseData = api.data || api;
            const qrUrl = responseData.qrCodeUrl || responseData.url || responseData.qr || null;
            const sessionId = responseData.sessionId || responseData.id || null;

            if (qrUrl && sessionId) {
                setQrCodeImage(qrUrl);
                setSessionIdForStatus(sessionId);
                setIsMonitoring(true);
                setConnectionState("SCAN");
            } else {
                throw new Error("La respuesta del servidor no contiene un código QR válido.");
            }

            return api;

        } catch (error: any) {
            console.error("Error en QR:", error);
            setModalError(error.message); 
            setSessionIdForStatus(null);
            setInstanceIdAfterAdd(null);  
            throw error; 
        } finally {
            setQrLoading(false);
        }
    };

    const handleAddInstance = async () => {
        if (!newInstance.title) {
            setModalError('El nombre de la instancia es obligatorio.');
            return;
        }

        setAddLoading(true);
        setModalError(null);

        try {
            const payload = { title: newInstance.title, syncMax: newInstance.syncMax };
            setInstanceIdAfterAdd(newInstance.title); 
            await fetchQrCode(payload);
        } catch (error) {
            setIsMonitoring(false);
        } finally {
            setAddLoading(false);
        }
    };

    React.useEffect(() => {
        let interval: any = null; 

        if (isMonitoring && sessionIdForStatus && openDialog) {
            
            const pollStatus = async () => {
                await fetchStatus(sessionIdForStatus); 
            };
            interval = setInterval(pollStatus, INTERVALO_MONITOREO);
        } else if (interval) {
            clearInterval(interval);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isMonitoring, sessionIdForStatus, openDialog, fetchStatus]); 


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked } = e.target;
        setNewInstance((prev) => ({
            ...prev,
            [name]: name === 'syncMax' ? checked : value,
        }));

        if (name === 'title') {
            setQrCodeImage(null);
            setInstanceIdAfterAdd(null);
        }
    };
    
    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        notify.success('ID copiado al portapapeles.');
    };

    const handleDeleteInstance = async (id: string) => {
        const instanceName = instances.find((inst) => inst.id === id)?.name;

        const confirmed = await confirm({
            title: 'Eliminar instancia',
            message: instanceName ? (
                <>
                    Se eliminará la instancia <strong>“{instanceName}”</strong> junto con su
                    sesión de WhatsApp. Esta acción no se puede deshacer.
                </>
            ) : (
                'Se eliminará la instancia junto con su sesión de WhatsApp. Esta acción no se puede deshacer.'
            ),
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            severity: 'danger',
        });

        if (!confirmed) return;

        try {
            const response = await fetch(config.API_URL + '/session/del_ins', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + localStorage.getItem('token'),
            },
            body: JSON.stringify({
                fecha: fechaHora,
                auth: localStorage.getItem("token") || "",
                accion: "Eliminar instancia",
                data: {
                    id: id
                }
            }),
        });


            if (!response.ok) {
                const errorText = await response.text();
                console.error('API request failed with status:', response.status, 'Response:', errorText);
                notify.error('No se pudo eliminar la instancia. Intenta de nuevo.');
                return;
            }

            setInstances((prev) => prev.filter((inst) => inst.id !== id));
            notify.success('Instancia eliminada correctamente');

        } catch (error) {
            console.error('Error deleting instance:', error);
            notify.error('Ocurrió un error al eliminar la instancia.');
        }
    };
    

    return (
        <Box sx={{ p: 0 }}>
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1100,
                    backgroundColor: (theme) => theme.palette.background.default,
                    pb: 2,
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Instancias de administrador
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddCircleOutlineIcon />}
                            onClick={handleOpenDialog}
                            sx={{
                                borderRadius: '8px',
                                px: 3,
                                py: 1,
                                mr: 2,
                                fontWeight: 'bold',
                                textTransform: 'none',
                                boxShadow: 2,
                                transition: 'all 0.2s',
                                '&:hover': { 
                                    transform: 'translateY(-2px)',
                                    boxShadow: 4
                                }
                            }}
                        >
                            Agregar instancia
                        </Button>
                    </Box>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {instances.map((instance) => (
                    <Grid item xs={12} key={instance.id}>
                        <Paper elevation={3} sx={{
                            p: 3,
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 2,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Badge
                                    color={instance.isAvailable ? "success" : "error"}
                                    variant="dot"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    overlap="circular"
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            border: '2px solid white',
                                            backgroundColor: instance.isAvailable ? '#44b700' : '#f44336'
                                        }
                                    }}
                                >
                                    <WhatsAppIcon sx={{ fontSize: 48, color: instance.isAvailable ? '#25D366' : '#9e9e9e' }} />
                                </Badge>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">
                                        {instance.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                        <Chip
                                            label={instance.isAvailable ? 'Conectado' : 'Desconectado'}
                                            size="small"
                                            sx={{
                                                fontWeight: 'bold',
                                                bgcolor: instance.isAvailable ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                                                color: instance.isAvailable ? '#2e7d32' : '#d32f2f',
                                                border: `1px solid ${instance.isAvailable ? '#4caf50' : '#f44336'}`
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: { xs: 0, sm: 'auto' } }}>
                                <Box sx={{ textAlign: 'right', mr: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <PersonIcon fontSize="small" sx={{ mr: 0.5 }} /> {instance.userName || 'Sin perfil'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {instance.userId ? `+${instance.userId}` : 'Sin número vinculado'}
                                    </Typography>
                                </Box>
                                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>

                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteOutlineIcon />}
                                        onClick={() => handleDeleteInstance(instance.id)}
                                        sx={{ borderRadius: '8px' }}
                                    >
                                        Eliminar
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<ContentCopyIcon />}
                                        onClick={() => handleCopyId(instance.id)}
                                        sx={{ borderRadius: '8px' }}
                                    >
                                        Copiar ID
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {instances.length === 0 && (
                <Typography variant="h6" color="text.secondary" align="center" sx={{ mt: 5 }}>
                    No hay instancias activas. Agrega una para comenzar.
                </Typography>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {instanceIdAfterAdd ? `Conectar Instancia: ${instanceIdAfterAdd}` : 'Agregar nueva instancia'}
                </DialogTitle>
                <DialogContent>
                    {modalError && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setModalError(null)}>
                            {modalError}
                        </Alert>
                    )}
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={qrCodeImage || qrLoading ? 6 : 12}
                            sx={{
                                transition: 'width 0.3s',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}
                        >
                            <Box>
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    name="title"
                                    label="Nombre de la instancia"
                                    type="text"
                                    fullWidth
                                    variant="outlined"
                                    value={newInstance.title}
                                    onChange={handleInputChange}
                                    sx={{ mb: 2 }}

                                    disabled={addLoading || !!instanceIdAfterAdd || isMonitoring} 
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            name="syncMax"
                                            checked={newInstance.syncMax}
                                            onChange={handleInputChange}
                                        />
                                    }
                                    label="Sincronizar WhatsApp profundamente"
                                    sx={{ mt: 1 }}
                                    disabled={addLoading || !!instanceIdAfterAdd || isMonitoring}
                                />
                                
                            </Box>
                            <Box sx={{ mt: 3 }}>
                                <Button
                                    onClick={handleAddInstance}
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    sx={{
                                        borderRadius: '8px',
                                        py: 1.2,
                                        fontWeight: 'bold',
                                        textTransform: 'none',
                                        boxShadow: 2,
                                        transition: 'all 0.2s',
                                        '&:hover': { 
                                            transform: 'translateY(-2px)',
                                            boxShadow: 4
                                        }
                                    }}
                                    disabled={!newInstance.title || addLoading || !!instanceIdAfterAdd}
                                >
                                    {addLoading ? <CircularProgress size={24} color="inherit" /> : 'Generar código QR'}
                                </Button>
                            </Box>
                        </Grid>

<Grid item xs={12} sm={6}>
     { (qrCodeImage || qrLoading) && (
     <Paper
         elevation={3}
             sx={{
                 p: 2,
                 borderRadius: '12px',
                textAlign: 'center',
                minHeight: 250,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {qrLoading || connectionState === 'CONNECTING' ? (
                                        <Box sx={{ p: 3 }}>
                                            <CircularProgress color="primary" />
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                {qrLoading ? 'Generando código QR...' : 'Verificando estado...'}
                                            </Typography>
                                        </Box>
                                    ) : qrCodeImage ? (
                                        <Box>
                                            <img
                                                src={qrCodeImage}
                                                alt={`Código QR para ${instanceIdAfterAdd}`}
                                                style={{ width: 180, height: 180, display: 'block', margin: '0 auto' }}
                                            />
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                                QR se refrescará automáticamente.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Typography color="error">No se pudo cargar el QR. Intenta de nuevo.</Typography>
                                    )}
                                </Paper>
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                        onClick={handleCloseDialog} 
                        disabled={addLoading || qrLoading}
                        sx={{ 
                            color: 'text.secondary', 
                            textTransform: 'none',
                            fontWeight: 'medium',
                            '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.04)',
                                color: 'text.primary'
                            }
                        }}
                    >
                        Cancelar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default InstancesPage;