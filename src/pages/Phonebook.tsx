// Phonebook.tsx
import React, { useState, useEffect, useCallback } from "react"
import {
  Box, Card, CardContent, Typography, TextField, Button, Divider, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, Paper, IconButton, Checkbox, Toolbar,
  TablePagination, Chip, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
  Tabs, Tab, Snackbar, Alert, Menu, MenuItem, Stack, Tooltip, List, ListItemButton, ListItemIcon, ListItemText 
} from "@mui/material"
import ContactsIcon from '@mui/icons-material/Contacts';
import DeleteIcon from "@mui/icons-material/Delete"
import DownloadIcon from "@mui/icons-material/Download"
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined"
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined"
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined"
import phonebookImg from "../images/contact.svg"
import config from "../config.json"
import { useConfirm } from "../components/ConfirmProvider"

const fechaHora = new Date().toLocaleString("es-MX", { hour12: false });

// =================================================================
// LÓGICA DE API 
// =================================================================

const getApiHeaders = () => {
  const headers: Record<string, string> = { "Content-Type": "application/json", "Accept": "application/json" }
  const token = localStorage.getItem("token")
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  return headers
}

const handleResponse = async (response: Response) => {
  const data = await response.json()
  if (!response.ok || !(data.success || data.estatus)) {
    throw new Error(data.msg || data.mensaje || "Error en la solicitud a la API")
  }
  return data
}

const apiService = {
  getPhonebooks: async () => {
    const response = await fetch(`${config.API_URL}user/get_phonebooks`, {
      method: 'GET',
      headers: getApiHeaders(),
    })
    return handleResponse(response)
  },

  getContacts: async () => {
    const response = await fetch(`${config.API_URL}user/get_contacts`, {
      method: 'GET',
      headers: getApiHeaders(),
    })
    return handleResponse(response)
  },

  addPhonebook: async (title: string) => {
    const response = await fetch(`${config.API_URL}user/add_phonebook`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ title }), // Enviamos directo como lo espera el backend
    });
    return handleResponse(response);
  },

  updatePhonebook: async (payload: any) => {
    const response = await fetch(`${config.API_URL}user/update_phonebook`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  deletePhonebook: async (id: number) => {
    const response = await fetch(`${config.API_URL}user/del_book`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ id }),
    });
    return handleResponse(response);
  },

  addContact: async (payload: any) => {
    // El backend espera "mobile_with_country_code", lo mapeamos aquí:
    const backendPayload = { ...payload, mobile_with_country_code: payload.mobile };
    const response = await fetch(`${config.API_URL}user/add_contact`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(backendPayload),
    });
    return handleResponse(response);
  },

  updateContact: async (payload: any) => {
    const response = await fetch(`${config.API_URL}user/update_contact_number`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  deleteContacts: async (ids: number[]) => {
    const response = await fetch(`${config.API_URL}user/del_contacts`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ selected: ids }),
    });
    return handleResponse(response);
  },
}

// =================================================================
// TIPOS Y FUNCIONES AUXILIARES
// =================================================================

export type Agenda = {
  id: string
  name: string
  createdAt?: string
  phonebook_id?: string
  uid: string
  rawId: number
}

export type Contact = {
  id: string
  agendaId: string
  contactName: string
  phone: string
  var1?: string
  var2?: string
  var3?: string
  var4?: string
  var5?: string
  date?: string
}

const fmt = (dIso?: string) => {
  if (!dIso) return "-"
  const d = new Date(dIso)
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`
}


// =================================================================
// COMPONENTES DE DIÁLOGO
// =================================================================

type AddContactDialogProps = {
  open: boolean
  agenda?: Agenda
  onClose: () => void
  onSubmitMany: (rows: Omit<Contact, "id" | "date">[]) => void
}
const AddContactDialog: React.FC<AddContactDialogProps> = ({ open, agenda, onClose, onSubmitMany }) => {
  const [tab, setTab] = React.useState<0 | 1>(0)
  const [contactName, setContactName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [vars, setVars] = React.useState({ var1: "", var2: "", var3: "", var4: "", var5: "" })
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setTab(0)
      setContactName("")
      setPhone("")
      setVars({ var1: "", var2: "", var3: "", var4: "", var5: "" })
      setError(null)
    }
  }, [open])

  const submitSingle = () => {
    if (!contactName.trim() || !phone.trim()) {
      setError("Nombre y número son obligatorios.")
      return
    }
    onSubmitMany([
      {
        agendaId: agenda?.phonebook_id ?? agenda?.id ?? "",
        contactName: contactName.trim(),
        phone: phone.trim(),
        ...vars,
      },
    ])
    onClose()
  }
  const onCSV = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== "")
      if (lines.length < 2) {
        setError("El CSV no tiene datos.")
        return
      }
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase())
      const idx = {
        name: headers.indexOf("name") !== -1 ? headers.indexOf("name") : headers.indexOf("nombre"),
        phone: headers.indexOf("phone") !== -1 ? headers.indexOf("phone") : headers.indexOf("numero"),
        var1: headers.indexOf("var1"),
        var2: headers.indexOf("var2"),
        var3: headers.indexOf("var3"),
        var4: headers.indexOf("var4"),
        var5: headers.indexOf("var5"),
      }
      if (idx.name === -1 || idx.phone === -1) {
        setError('El CSV debe incluir columnas "name" y "phone".')
        return
      }
      const out: Omit<Contact, "id" | "date">[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",")
        const n = (cols[idx.name] || "").trim()
        const p = (cols[idx.phone] || "").replace(/\D/g, "").trim()
        if (!n || !p) continue
        out.push({
          agendaId: agenda?.phonebook_id ?? agenda?.id ?? "",
          contactName: n,
          phone: p,
          var1: idx.var1 === -1 ? "" : (cols[idx.var1] || "").trim(),
          var2: idx.var2 === -1 ? "" : (cols[idx.var2] || "").trim(),
          var3: idx.var3 === -1 ? "" : (cols[idx.var3] || "").trim(),
          var4: idx.var4 === -1 ? "" : (cols[idx.var4] || "").trim(),
          var5: idx.var5 === -1 ? "" : (cols[idx.var5] || "").trim(),
        })
      }
      if (!out.length) {
        setError("No se pudo leer ningún registro del CSV.")
        return
      }
      onSubmitMany(out)
      onClose()
    } catch (e: any) {
      setError(e?.message ?? "Error al leer CSV")
    }
  }

  const downloadTemplate = () => {
    const tpl = "name,phone,var1,var2,var3,var4,var5"
    const blob = new Blob([tpl], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla_contactos.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Agregando número {agenda ? `(${agenda.name})` : ""}</DialogTitle>
      <DialogContent dividers>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Escribiendo" />
          <Tab label="Por CSV" />
        </Tabs>
        {tab === 0 && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Nombre del contacto"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Número telefónico (agregue el código de país)"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
              InputProps={{ startAdornment: <InputAdornment position="start">+</InputAdornment> }}
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="var1"
                value={vars.var1}
                onChange={e => setVars({ ...vars, var1: e.target.value })}
                fullWidth
              />
              <TextField
                label="var2"
                value={vars.var2}
                onChange={e => setVars({ ...vars, var2: e.target.value })}
                fullWidth
              />
              <TextField
                label="var3"
                value={vars.var3}
                onChange={e => setVars({ ...vars, var3: e.target.value })}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="var4"
                value={vars.var4}
                onChange={e => setVars({ ...vars, var4: e.target.value })}
                fullWidth
              />
              <TextField
                label="var5"
                value={vars.var5}
                onChange={e => setVars({ ...vars, var5: e.target.value })}
                fullWidth
              />
            </Stack>
          </Stack>
        )}
        {tab === 1 && (
          <Stack spacing={2}>
            <Typography variant="body2">
              Sube un CSV con cabeceras: <b>name, phone</b> (opcional: var1..var5).
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadTemplate}>
                Descargar plantilla
              </Button>
              <Button component="label" variant="contained" startIcon={<UploadFileOutlinedIcon />}>
                Seleccionar CSV
                <input
                  type="file"
                  hidden
                  accept=".csv,text/csv"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) onCSV(f)
                  }}
                />
              </Button>
            </Stack>
          </Stack>
        )}
        {!!error && (
          <Alert sx={{ mt: 2 }} severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        {tab === 0 && (
          <Button variant="contained" onClick={submitSingle}>
            ENVIAR
          </Button>
        )}
        <Button variant="outlined" onClick={onClose}>
          {tab === 0 ? "Cancelar" : "Cerrar"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

type EditContactDialogProps = {
  open: boolean
  contact?: Contact
  onClose: () => void
  onSave: (updatedContact: Contact) => void
}
const EditContactDialog: React.FC<EditContactDialogProps> = ({ open, contact, onClose, onSave }) => {
  const [formData, setFormData] = React.useState<Partial<Contact>>({})
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (contact) {
      setFormData(contact)
    } else {
      setFormData({})
    }
    setError(null)
  }, [contact, open])

  const handleChange = (field: keyof Omit<Contact, "id" | "date" | "agendaId">, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (!formData.contactName?.trim() || !formData.phone?.trim()) {
      setError("Nombre y número son obligatorios.")
      return
    }
    if (!formData.id || !formData.agendaId) {
      setError("Falta información del contacto.")
      return
    }
    onSave(formData as Contact)
  }

  if (!open) return null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Editar Contacto</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Nombre del contacto"
            value={formData.contactName || ""}
            onChange={e => handleChange("contactName", e.target.value)}
            fullWidth
          />
          <TextField
            label="Número telefónico (agregue el código de país)"
            value={formData.phone || ""}
            onChange={e => handleChange("phone", e.target.value.replace(/\D/g, ""))}
            InputProps={{ startAdornment: <InputAdornment position="start">+</InputAdornment> }}
            fullWidth
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="var1"
              value={formData.var1 || ""}
              onChange={e => handleChange("var1", e.target.value)}
              fullWidth
            />
            <TextField
              label="var2"
              value={formData.var2 || ""}
              onChange={e => handleChange("var2", e.target.value)}
              fullWidth
            />
            <TextField
              label="var3"
              value={formData.var3 || ""}
              onChange={e => handleChange("var3", e.target.value)}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="var4"
              value={formData.var4 || ""}
              onChange={e => handleChange("var4", e.target.value)}
              fullWidth
            />
            <TextField
              label="var5"
              value={formData.var5 || ""}
              onChange={e => handleChange("var5", e.target.value)}
              fullWidth
            />
          </Stack>
        </Stack>
        {!!error && (
          <Alert sx={{ mt: 2 }} severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>
          GUARDAR CAMBIOS
        </Button>
      </DialogActions>
    </Dialog>
  )
}


// =================================================================
// COMPONENTE PRINCIPAL: Phonebook
// =================================================================

const Phonebook: React.FC = () => {
  const confirm = useConfirm()
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [newAgendaTitle, setNewAgendaTitle] = useState("")
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | undefined>(undefined)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Agenda | undefined>(undefined)
  const [renameValue, setRenameValue] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null)
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Lógica del Snackbar
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "error" }>({ open: false, msg: "", sev: 'success' });
  const showSuccess = useCallback((msg: string) => setSnack({ open: true, msg, sev: 'success' }), []);
  const showError = useCallback((msg: string) => setSnack({ open: true, msg, sev: 'error' }), []);

  // --- Lógica de Datos ---

const fetchContacts = useCallback(async (phonebookId: string) => {
  if (!phonebookId) {
    setContacts([]);
    return;
  }

  try {
    const response = await apiService.getContacts();

    // El backend te manda la data en .data
    const todosLosContactos = response?.data || [];  

    // Filtramos los contactos que pertenecen a la agenda seleccionada
    const contactos = todosLosContactos.filter((c: any) => String(c.phonebook_id) === String(phonebookId));

    const mapped = contactos.map((c: any) => ({
      id: String(c.id),
      agendaId: String(c.phonebook_id ?? phonebookId),
      contactName: c.name ?? "",
      phone: c.mobile ?? c.mobile_with_country_code ?? "",
      var1: c.var_one ?? "",
      var2: c.var_two ?? "",
      var3: c.var_three ?? "",
      var4: c.var_four ?? "",
      var5: c.var_five ?? "",
      date: c.createdAt,
    }));

    setContacts(mapped);

  } catch (error: any) {
    showError(`No se pudo cargar contactos: ${error.message}`);
  }
}, [showError]);


const fetchAgendas = useCallback(async (selectFirst = false) => {
  try {
    const response = await apiService.getPhonebooks();

    const agendasData = response.data || [];

    const mappedAgendas: Agenda[] = agendasData.map((item: any) => {
      const idReal = item.id;
      
      return {
        id: String(idReal),         
        name: item.name || item.title || "Agenda sin nombre",       
        createdAt: item.createdAt,
        phonebook_id: String(idReal),
        rawId: Number(idReal),
        uid: item.uid,
      };
    });

    setAgendas(mappedAgendas);

    if (selectFirst && mappedAgendas.length > 0) {
      const firstAgenda = mappedAgendas[0];
      setSelectedAgenda(firstAgenda);
      await fetchContacts(firstAgenda.id);
    } else if (selectedAgenda) {
      const currentSelected = mappedAgendas.find(a => a.id === selectedAgenda.id);

      if (currentSelected) {
        setSelectedAgenda(currentSelected);
      } else if (mappedAgendas.length > 0) {
        setSelectedAgenda(mappedAgendas[0]);
        await fetchContacts(mappedAgendas[0].id);
      } else {
        setSelectedAgenda(undefined);
        setContacts([]);
      }
    }

  } catch (error: any) {
    showError(`No se pudo cargar agendas: ${error.message}`);
  }
}, [fetchContacts, showError, selectedAgenda]);


  useEffect(() => {
    fetchAgendas(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Lógica de Eventos y Acciones ---

  const addAgenda = useCallback(async () => {
    if (!newAgendaTitle.trim()) return;
    try {
      await apiService.addPhonebook(newAgendaTitle.trim());
      setNewAgendaTitle("");
      showSuccess("Agenda agregada.");
      await fetchAgendas(false);
    } catch (error: any) {
      showError(`Error al agregar agenda: ${error.message}`);
    }
  }, [newAgendaTitle, showSuccess, showError, fetchAgendas]);

  const handleSubmitManyContacts = useCallback(async (rows: Omit<Contact, "id" | "date">[]) => {
    const agendaId = rows[0]?.agendaId || selectedAgenda?.id;
    if (!agendaId || !selectedAgenda) {
      return showError("Seleccione una agenda antes de agregar contactos.");
    }
    try {
      for (const r of rows) {
        const payload = {
          phonebook_id: agendaId, phonebook_name: selectedAgenda.name,
          name: r.contactName, mobile: r.phone,
          var1: r.var1, var2: r.var2, var3: r.var3, var4: r.var4, var5: r.var5,
        };
        await apiService.addContact(payload);
      }
      showSuccess(`Se agregaron ${rows.length} contacto(s).`);
      await fetchContacts(agendaId);
    } catch (error: any) {
      showError(`Error al agregar contactos: ${error.message}`);
    }
  }, [selectedAgenda, showSuccess, showError, fetchContacts]);

 
const handleUpdateContact = useCallback(async (updatedContact: Contact) => {
  try {
    const payload = {
      id: Number(updatedContact.id), 
      name: updatedContact.contactName, 
      mobile_with_country_code: updatedContact.phone, // Aceptado por el backend
      var_one: updatedContact.var1, 
      var_two: updatedContact.var2, 
      var_three: updatedContact.var3,
      var_four: updatedContact.var4, 
      var_five: updatedContact.var5,
    };
    await apiService.updateContact(payload);
    setEditingContact(undefined);
    showSuccess("Contacto actualizado.");
    await fetchContacts(updatedContact.agendaId);
  } catch (error: any) {
    showError(`Error al actualizar contacto: ${error.message}`);
  }
}, [showSuccess, showError, fetchContacts]);

const applyRename = useCallback(async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      const payload = {
        id: renameTarget.rawId, 
        newTitle: renameValue.trim(),
      };
      await apiService.updatePhonebook(payload);
      setRenameTarget(undefined);
      showSuccess("Agenda renombrada.");
      await fetchAgendas(false);
    } catch (error: any) {
      showError(`Error al renombrar: ${error.message}`);
    }
  }, [renameTarget, renameValue, showSuccess, showError, fetchAgendas]);

  const removeAgenda = useCallback(async (agenda: Agenda) => {
    const confirmed = await confirm({
      title: "Eliminar agenda",
      message: (
        <>
          Se eliminará la agenda <strong>“{agenda.name}”</strong>. Esta acción no se puede deshacer.
        </>
      ),
      confirmText: "Eliminar",
      severity: "danger",
    });
    if (!confirmed) return;
    try {
      await apiService.deletePhonebook(agenda.rawId);
      showSuccess("Agenda eliminada.");
      await fetchAgendas(false);
    } catch (error: any) {
      showError(`Error al eliminar agenda: ${error.message}`);
    }
  }, [confirm, showSuccess, showError, fetchAgendas]);

  const deleteSingleContact = useCallback(async (contact: Contact) => {
    const confirmed = await confirm({
      title: "Eliminar contacto",
      message: (
        <>
          Se eliminará el contacto <strong>“{contact.contactName}”</strong>. Esta acción no se puede deshacer.
        </>
      ),
      confirmText: "Eliminar",
      severity: "danger",
    });
    if (!confirmed) return;
    try {
      await apiService.deleteContacts([Number(contact.id)]);
      showSuccess("Contacto eliminado.");
      if (selectedAgenda) await fetchContacts(selectedAgenda.id);
    } catch (error: any) {
      showError(`Error al eliminar contacto: ${error.message}`);
    }
  }, [confirm, selectedAgenda, showSuccess, showError, fetchContacts]);

  const deleteSelectedContacts = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const confirmed = await confirm({
      title: "Eliminar contactos",
      message:
        selectedIds.size === 1
          ? "Se eliminará el contacto seleccionado. Esta acción no se puede deshacer."
          : `Se eliminarán ${selectedIds.size} contactos seleccionados. Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      severity: "danger",
    });
    if (!confirmed) return;
    try {
      const idsToDelete = Array.from(selectedIds).map(id => Number(id));
      await apiService.deleteContacts(idsToDelete);
      showSuccess("Contactos eliminados.");
      setSelectedIds(new Set());
      if (selectedAgenda) {
        await fetchContacts(selectedAgenda.id);
      }
    } catch (error: any) {
      showError(`Error al eliminar contactos: ${error.message}`);
    }
  }, [confirm, selectedIds, selectedAgenda, showSuccess, showError, fetchContacts]);

  const onSelectAgenda = useCallback(async (ag: Agenda) => {
    setSelectedAgenda(ag);
    await fetchContacts(ag.id);
    setSelectedIds(new Set());
  }, [fetchContacts]);

  const openAddContact = (agenda: Agenda) => {
    setSelectedAgenda(agenda)
    setOpenAddDialog(true)
  }

  const isSelected = (id: string) => selectedIds.has(id)
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage)
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }
  const paged = contacts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const allOnPageSelected = paged.length > 0 && paged.every(r => selectedIds.has(r.id))
  const someOnPageSelected = paged.some(r => selectedIds.has(r.id)) && !allOnPageSelected
  const toggleSelectAllOnPage = (checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      paged.forEach(r => {
        if (checked) next.add(r.id)
        else next.delete(r.id)
      })
      return next
    })
  }
//exportar csv
  const exportCSV = useCallback(() => {
    if (contacts.length === 0) {
        showError("No hay contactos para exportar.");
        return;
    }

    // 1. Definir los encabezados del CSV
    const headers = [
        "Nombre",
        "Agenda",
        "Móvil",
        "Variable 1",
        "Variable 2",
        "Variable 3",
        "Variable 4",
        "Variable 5",
        "Fecha de Creación"
    ];

    // Función para escapar comas y comillas en los datos
    const escapeCsvCell = (cell: any) => {
        const cellString = String(cell || "").trim();
        // Si el dato contiene comas, comillas dobles o saltos de línea, lo encerramos en comillas dobles
        if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')) {
            // Reemplazar comillas dobles internas con dobles-comillas
            return `"${cellString.replace(/"/g, '""')}"`;
        }
        return cellString;
    };

    // 2. Mapear los datos de los contactos a filas de CSV
    const csvRows = contacts.map(contact => {
        const agendaName = agendas.find(a => a.id === contact.agendaId)?.name ?? "-";
        const row = [
            contact.contactName,
            agendaName,
            contact.phone,
            contact.var1,
            contact.var2,
            contact.var3,
            contact.var4,
            contact.var5,
            fmt(contact.date)
        ];
        return row.map(escapeCsvCell).join(',');
    });

    // 3. Unir encabezados y filas
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    // 4. Crear el Blob con BOM para compatibilidad con Excel (UTF-8)
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 5. Crear y simular clic en el enlace de descarga
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "lista_de_contactos.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showSuccess("La exportación a CSV se ha completado.");

}, [contacts, agendas, showSuccess, showError]); // Dependencias para que la función se actualice si los datos cambian
  const printTable = useCallback(() => {
    if (contacts.length === 0) {
        showError("No hay datos en la tabla para imprimir.");
        return;
    }

    // 1. Obtener el HTML de la tabla
    const tableHtml = document.getElementById('contacts-table')?.outerHTML;
    if (!tableHtml) {
        showError("No se pudo encontrar la tabla para imprimir.");
        return;
    }

    // 2. Crear una nueva ventana para la impresión
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showError("No se pudo abrir la ventana de impresión. Revisa si tu navegador lo está bloqueando.");
        return;
    }

    // 3. Escribir el HTML y los estilos en la nueva ventana
    printWindow.document.write(`
        <html>
            <head>
                <title>Lista de Contactos</title>
                <style>
                    body { font-family: sans-serif; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }
                    th { background-color: #f2f2f2; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    /* Ocultar la columna de acciones en la impresión */
                    th:nth-child(2), td:nth-child(2) { display: none; }
                </style>
            </head>
            <body>
                <h1>Lista de Contactos</h1>
                ${tableHtml}
            </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus(); // Requerido por algunos navegadores

    // 4. Llamar al diálogo de impresión y cerrar la ventana
    setTimeout(() => { // Un pequeño retraso para asegurar que el contenido se renderice
        printWindow.print();
        printWindow.close();
    }, 250);

}, [contacts.length, showError]); // Dependencia para que la función sepa si hay contactos

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 3, p: { xs: 1, sm: 3 }, minHeight: "calc(100vh - 80px)" }}>
      
      {/* 1. BARRA LATERAL: MIS AGENDAS */}
      <Card sx={{ width: { xs: "100%", lg: 320 }, display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: 3 }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6" fontWeight="bold">Directorio de Agendas</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Organiza tus campañas y contactos</Typography>
        </Box>
        
        {/* Input para nueva agenda */}
        <Box sx={{ p: 2, display: 'flex', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <TextField 
                size="small" 
                placeholder="Nombre de nueva agenda..." 
                value={newAgendaTitle} 
                onChange={e => setNewAgendaTitle(e.target.value)} 
                onKeyDown={e => { if (e.key === 'Enter') addAgenda() }} 
                fullWidth 
                variant="outlined"
            />
            <Tooltip title="Crear Agenda">
                <Button variant="contained" onClick={addAgenda} sx={{ minWidth: 'auto', px: 2 }}>
                    <AddCircleOutlineIcon />
                </Button>
            </Tooltip>
        </Box>

        {/* Lista limpia de Agendas */}
        <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
            {agendas.map(ag => (
                <ListItemButton 
                    key={ag.id} 
                    selected={selectedAgenda?.id === ag.id} 
                    onClick={() => onSelectAgenda(ag)}
                    sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}
                >
                    <ListItemIcon>
                        <ContactsIcon color={selectedAgenda?.id === ag.id ? "primary" : "inherit"} />
                    </ListItemIcon>
                    <ListItemText 
                        primary={ag.name} 
                        primaryTypographyProps={{ fontWeight: selectedAgenda?.id === ag.id ? 'bold' : 'normal' }}
                    />
                </ListItemButton>
            ))}
            {agendas.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No tienes agendas creadas.</Typography>
                </Box>
            )}
        </List>
      </Card>

      {/* 2. PANEL PRINCIPAL: CONTACTOS DE LA AGENDA SELECCIONADA */}
      <Card sx={{ flex: 1, display: "flex", flexDirection: "column", boxShadow: 3, overflow: 'hidden' }}>
        {selectedAgenda ? (
            <>
                {/* Cabecera de la Agenda Seleccionada con Acciones Contextuales */}
                <Toolbar sx={{ gap: 1, flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover', py: 1 }}>
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h5" fontWeight="bold">{selectedAgenda.name}</Typography>
                        <Tooltip title="Renombrar Agenda">
                            <IconButton size="small" onClick={() => { setRenameTarget(selectedAgenda); setRenameValue(selectedAgenda.name) }}>
                                <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar Agenda">
                            <IconButton size="small" color="error" onClick={() => removeAgenda(selectedAgenda)}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Botones de acción masiva */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => openAddContact(selectedAgenda)}>
                            Nuevo Contacto
                        </Button>
                        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={e => setExportAnchor(e.currentTarget)}>
                            Exportar
                        </Button>
                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={selectedIds.size === 0} onClick={deleteSelectedContacts}>
                            Eliminar ({selectedIds.size})
                        </Button>
                    </Box>

                    {/* Menú de exportación */}
                    <Menu open={Boolean(exportAnchor)} anchorEl={exportAnchor} onClose={() => setExportAnchor(null)}>
                        <MenuItem onClick={() => { setExportAnchor(null); exportCSV(); }}>Descargar CSV</MenuItem>
                        <MenuItem onClick={() => { setExportAnchor(null); printTable(); }}>Imprimir</MenuItem>
                    </Menu>
                </Toolbar>

                {/* Tabla de Contactos */}
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <TableContainer sx={{ flex: 1 }}>
                        <Table id="contacts-table" stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={allOnPageSelected}
                                            indeterminate={someOnPageSelected}
                                            onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Móvil</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Var 1</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Var 2</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paged.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                            <Typography variant="body1" color="text.secondary">Esta agenda está vacía. Agrega contactos para comenzar.</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paged.map(row => (
                                        <TableRow key={row.id} hover selected={isSelected(row.id)}>
                                            <TableCell padding="checkbox">
                                                <Checkbox checked={isSelected(row.id)} onChange={() => toggleSelect(row.id)} />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{row.contactName}</TableCell>
                                            <TableCell>+{row.phone}</TableCell>
                                            <TableCell>{row.var1 || '-'}</TableCell>
                                            <TableCell>{row.var2 || '-'}</TableCell>
                                            <TableCell>{fmt(row.date)}</TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                    <Tooltip title="Editar Contacto">
                                                        <IconButton size="small" onClick={() => setEditingContact(row)}>
                                                            <EditOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Eliminar Contacto">
                                                        <IconButton size="small" color="error" onClick={() => deleteSingleContact(row)}>
                                                            <CloseOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        component="div"
                        count={contacts.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        labelRowsPerPage="Filas:"
                        sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                    />
                </Box>
            </>
        ) : (
            // Pantalla vacía cuando no hay agenda seleccionada
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', alignItems: 'center', p: 4 }}>
                <ContactsIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No hay agenda seleccionada</Typography>
                <Typography variant="body2" color="text.secondary">Selecciona una agenda en el panel izquierdo o crea una nueva para gestionar tus contactos.</Typography>
            </Box>
        )}
      </Card>

      {/* DIÁLOGOS Y NOTIFICACIONES */}
      <AddContactDialog open={openAddDialog} agenda={selectedAgenda} onClose={() => setOpenAddDialog(false)} onSubmitMany={handleSubmitManyContacts} />
      <EditContactDialog open={!!editingContact} contact={editingContact} onClose={() => setEditingContact(undefined)} onSave={handleUpdateContact} />
      <Dialog open={!!renameTarget} onClose={() => setRenameTarget(undefined)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">Renombrar agenda</DialogTitle>
        <DialogContent dividers>
          <TextField autoFocus label="Nuevo nombre" value={renameValue} onChange={e => setRenameValue(e.target.value)} fullWidth variant="outlined" />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRenameTarget(undefined)}>Cancelar</Button>
          <Button variant="contained" onClick={applyRename}>Guardar Cambios</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.sev} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}

export default Phonebook;