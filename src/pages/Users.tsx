import * as React from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip, CircularProgress, Alert, Snackbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import config from '../config.json';

type User = { id: number; name: string; email: string; uid: string; mobile_with_country_code: string };

export default function Users() {
  const [rows, setRows] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<User | null>(null);
  const [form, setForm] = React.useState({ name: '', email: '', mobile: '', newPassword: '' });
  const [confirmId, setConfirmId] = React.useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [snack, setSnack] = React.useState<{ open: boolean; msg: string; sev: "success" | "error" }>({ open: false, msg: "", sev: 'success' });
  const showMessage = (msg: string, sev: "success" | "error") => setSnack({ open: true, msg, sev });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(config.API_URL + 'admin/all_users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
        },
      });
      const data = await response.json();
      if (data.success) {
        setRows(data.data);
      } else {
        showMessage(data.msg || "Error al obtener usuarios.", "error");
      }
    } catch (err) {
      showMessage("Error de conexión al servidor.", "error");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const onOpenNew = () => { setEditing(null); setForm({ name: '', email: '', mobile: '', newPassword: '' }); setOpen(true); };
  
  const onOpenEdit = (u: User) => { 
    setEditing(u); 
    setForm({ name: u.name, email: u.email, mobile: u.mobile_with_country_code || '', newPassword: '' }); 
    setOpen(true); 
  };
  
  const onClose = () => setOpen(false);

  const onSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      showMessage("El nombre y correo son obligatorios.", "error");
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (editing) {
        const payload = {
          uid: editing.uid,
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          newPassword: form.newPassword // Si está vacío, el backend lo ignora
        };
        const res = await fetch(config.API_URL + 'admin/update_user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(data.success) {
          showMessage("Usuario actualizado con éxito", "success");
          fetchUsers();
          setOpen(false);
        } else {
          showMessage(data.msg, "error");
        }
      } else {
        if (!form.newPassword || form.newPassword.length < 6) {
          showMessage("La contraseña es obligatoria y debe tener al menos 6 caracteres.", "error");
          setIsSubmitting(false);
          return;
        }
        const payload = {
          data: {
            payload: {
              name: form.name,
              email: form.email,
              password: form.newPassword,
              mobile: form.mobile,
              acceptPolicy: true
            }
          }
        };
        const res = await fetch(config.API_URL + 'user/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(data.success || data.estatus) {
          showMessage("Usuario creado con éxito", "success");
          fetchUsers();
          setOpen(false);
        } else {
          showMessage(data.msg || data.message, "error");
        }
      }
    } catch (err) {
      showMessage("Error de conexión al guardar.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onConfirmDelete = async () => {
    if (confirmId == null) return;
    try {
      const response = await fetch(config.API_URL + 'admin/del_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
        },
        body: JSON.stringify({ id: confirmId }),
      });
      const data = await response.json();
      if (data.success) {
        showMessage("Usuario eliminado permanentemente", "success");
        setRows(prev => prev.filter(r => r.id !== confirmId));
      } else {
        showMessage(data.msg || "Error al eliminar.", "error");
      }
    } catch (err) {
      showMessage("Error de red al intentar eliminar.", "error");
    }
    setConfirmId(null);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>Gestión de Usuarios (Admin)</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={onOpenNew}>Agregar Usuario</Button>
      </Box>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Teléfono</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.mobile_with_country_code || 'N/A'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Editar">
                    <IconButton onClick={() => onOpenEdit(row)} color="primary"><EditIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton color="error" onClick={() => setConfirmId(row.id)}><DeleteIcon /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
               <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}>No hay usuarios registrados en el sistema</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogo Crear/Editar */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle fontWeight="bold">{editing ? 'Editar Información del Usuario' : 'Registrar Nuevo Usuario'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            autoFocus
            label="Nombre completo"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ej. Juan Pérez"
          />
          <TextField
            label="Correo Electrónico"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="correo@dominio.com"
          />
          <TextField
            label="Teléfono con código de país"
            value={form.mobile}
            onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
            placeholder="Ej. +52727..."
          />
          <TextField
            label="Contraseña"
            type="password"
            value={form.newPassword}
            onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
            placeholder={editing ? "Dejar en blanco para mantener la actual" : "Mínimo 6 caracteres"}
            helperText={editing ? "Solo llénalo si deseas cambiar su contraseña" : "Obligatorio para nuevos registros"}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button variant="contained" onClick={onSave} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de eliminación */}
      <Dialog open={confirmId != null} onClose={() => setConfirmId(null)}>
        <DialogTitle>¿Estás completamente seguro?</DialogTitle>
        <DialogContent>
          <Typography>Esta acción eliminará al usuario de forma permanente y no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmId(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={onConfirmDelete}>Sí, Eliminar</Button>
        </DialogActions>
      </Dialog>

      {/* Notificaciones */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.sev} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}