import React, { useState, useEffect } from "react";
import config from "../config";
import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    AppBar,
    IconButton,
    Typography,
    Box,
    useTheme,
    Menu,
    MenuItem,
    Divider,
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    Button,
    TextField,
} from "@mui/material";

import SubscriptionModal from "../components/SubscriptionModal"; 

import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ChatIcon from "@mui/icons-material/Chat";
import ContactsIcon from "@mui/icons-material/Contacts";
import BuildIcon from "@mui/icons-material/Build";
import CampaignIcon from "@mui/icons-material/Campaign";
import ApiIcon from "@mui/icons-material/Api";
import GitHubIcon from "@mui/icons-material/GitHub";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AdbIcon from "@mui/icons-material/Adb";
import PaidIcon from "@mui/icons-material/Paid";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SyncLockIcon from '@mui/icons-material/SyncLock';


const fechaHora = new Date().toLocaleString("es-MX", { hour12: false });


interface DashboardLayoutProps {
    onToggleTheme?: () => void;
    mode?: "light" | "dark";
}

type NavItemProps = {
    to: string;
    icon: React.ReactNode;
    label: string;
};

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
    const location = useLocation();
    const selected = location.pathname === to;
    return (
        <ListItemButton
            component={Link}
            to={to}
            selected={selected}
            sx={{
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                transition: 'background-color 0.2s',
                '&:hover': {
                    backgroundColor: (theme) => selected ? theme.palette.action.selected : theme.palette.action.hover,
                }
            }}
        >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={label} />
        </ListItemButton>
    );
};


const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    onToggleTheme,
    mode = "light",
}) => {
    const [open, setOpen] = useState(false);
    const theme = useTheme();
    const isLight = mode === "light";
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    const [subscriptionOpen, setSubscriptionOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const [userData, setUserData] = useState({
        name: '',
        email: '',
        mobile: ''
    });
    const [originalUserData, setOriginalUserData] = useState({
        name: '',
        email: '',
        mobile: ''
    });

    const [password, setPassword] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileUpdate = async () => {
        const dataToUpdate: { name: string; email: string; mobile: string; newPassword?: string } = {
            ...userData,
        };

        if (password) {
            dataToUpdate.newPassword = password;
        }
    try {
        const response = await fetch(config.API_URL + "/user/update_profile", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
              fecha: fechaHora,
              auth: localStorage.getItem("token") || "",
              accion: "update_profile",
              data: dataToUpdate
          }),
      });


      if (response.ok) {
        console.log("Profile updated successfully");
        const emailChanged = originalUserData.email !== userData.email;
        if (password || emailChanged) {
          handleLogout();
        } else {
          handleProfileClose();
        }
      } else {
        console.error("Failed to update profile. Status:", response.status);
        try {
          const errorData = await response.json();
          console.error("API Error Body:", errorData);
        } catch (e) {
          console.error("Could not parse error response as JSON.", await response.text());
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

    useEffect(() => {
        const fetchPerfil = async () => {
            try {
                const response = await fetch(config.API_URL + "/user/get_me", {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    },
                });

                const { data } = await response.json();
                console.log(data);

                const initialData = {
                    name: data.name || '',
                    email: data.email || '',
                    mobile: data.mobile || ''
                };
                setUserData(initialData);
                setOriginalUserData(initialData);

            } catch (error) {
                console.error(error);
            }
        };

        if (profileOpen) {
            fetchPerfil();
        }

    }, [profileOpen]);

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleSubscriptionClick = () => {
        handleMenuClose();
        setSubscriptionOpen(true);
    };

    const handleSubscriptionClose = () => {
        setSubscriptionOpen(false);
    };

    const handleProfileClick = () => {
        handleMenuClose();
        setProfileOpen(true);
    };

    const handleProfileClose = () => {
        setProfileOpen(false);
        setPassword('');
    };
    

    const toggleDrawer = () => setOpen(!open);

    const handleLogout = () => {
        handleMenuClose();
        localStorage.removeItem('token');
        navigate('/login');
    };
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }


    return (
        <Box sx={{ display: "flex", height: "100vh" }}>
            <AppBar
                position="fixed"
                sx={{
                    zIndex: 1201,
                    borderRadius: 0,
                    transition: (theme) => theme.transitions.create(['background-color', 'box-shadow'], {
                        duration: theme.transitions.duration.shorter,
                    }),
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={toggleDrawer}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                        Whatsvaa
                    </Typography>
                    {onToggleTheme && (
                        <IconButton
                            onClick={onToggleTheme}
                            color="inherit"
                            sx={{
                                mr: 2,
                                borderRadius: "999px",
                                backgroundColor: isLight
                                    ? theme.palette.grey[200]
                                    : theme.palette.grey[700],
                                transition: 'transform 0.2s',
                                "&:hover": {
                                    backgroundColor: isLight
                                        ? theme.palette.grey[300]
                                        : theme.palette.grey[600],
                                    transform: 'scale(1.05)'
                                },
                            }}
                        >
                            {isLight ? (
                                <DarkModeIcon htmlColor="#000" />
                            ) : (
                                <LightModeIcon htmlColor="#fff" />
                            )}
                        </IconButton>
                    )}
 
                    <IconButton
                        color="inherit"
                        onClick={handleMenuClick}
                        aria-controls={menuOpen ? "account-menu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={menuOpen ? "true" : undefined}
                        sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)' } }}
                    >
                        <AccountCircleIcon />
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        id="account-menu"
                        open={menuOpen}
                        onClose={handleMenuClose}
                        onClick={handleMenuClose}
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                overflow: "visible",
                                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                                mt: 1.5,
                                "& .MuiAvatar-root": {
                                    width: 32,
                                    height: 32,
                                    ml: -0.5,
                                    mr: 1,
                                },
                                "&::before": {
                                    content: '""',
                                    display: "block",
                                    position: "absolute",
                                    top: 0,
                                    right: 14,
                                    width: 10,
                                    height: 10,
                                    bgcolor: "background.paper",
                                    transform: "translateY(-50%) rotate(45deg)",
                                    zIndex: 0,
                                },
                            },
                        }}
                        transformOrigin={{ horizontal: "right", vertical: "top" }}
                        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                    >
                        <MenuItem component={Link} to="/panel/instances" onClick={handleMenuClose}>
                            <ListItemIcon>
                                <AdbIcon fontSize="small" />
                            </ListItemIcon>
                            Administrar instancias
                        </MenuItem>
                        <MenuItem onClick={handleSubscriptionClick}>
                            <ListItemIcon>
                                <PaidIcon fontSize="small" />
                            </ListItemIcon>
                            Suscripción
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleProfileClick}>
                            <ListItemIcon>
                                <PersonIcon fontSize="small" />
                            </ListItemIcon>
                            Perfil
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            Cerrar sesión
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="temporary"
                open={open}
                onClose={toggleDrawer}
                ModalProps={{ keepMounted: true }}
                sx={{
                    ['& .MuiDrawer-paper']: {
                        width: 250,
                        boxSizing: "border-box",
                        transition: (theme) => theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                    },
                }}
            >
                <Toolbar />
                <List>
                    <NavItem
                        to="dashboard"
                        icon={<DashboardIcon />}
                        label="Panel de control"
                    />
                    <NavItem
                        to="users"
                        icon={<PersonIcon />}
                        label="Usuarios"
                    />
                    <NavItem
                        to="inbox"
                        icon={<ChatIcon />}
                        label="Bandeja de entrada"
                    />
                    <NavItem
                        to="calentador"
                        icon={<ChatIcon />}
                        label="Calentador de WhatsApp"
                    />
                    <NavItem
                        to="contacts"
                        icon={<ContactsIcon />}
                        label="Agenda telefónica"
                    />
                    <NavItem
                        to="broadcast"
                        icon={<CampaignIcon />}
                        label="Campañas de difusión"
                    />
                    <NavItem
                        to="/panel/flows"
                        icon={<BuildIcon />}
                        label="Constructor de flujos"
                    />
                    <NavItem
                        to="chatbot"
                        icon={<CampaignIcon />}
                        label="Chatbots"
                    />
                    <NavItem
                        to="/panel/api"
                        icon={<ApiIcon />}
                        label="Acceso API" />
                </List>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 3, overflowY: "auto" }}>
                <Toolbar />
                <Outlet />
            </Box>

            <SubscriptionModal
                open={subscriptionOpen}
                onClose={handleSubscriptionClose}
            />

            <Dialog
                open={profileOpen}
                onClose={handleProfileClose}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">Editar Perfil</Typography>
                    <IconButton
                        aria-label="close"
                        onClick={handleProfileClose}
                        sx={{ color: (theme) => theme.palette.grey[500] }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0, borderColor: 'divider' }}>
                    <Box sx={{
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                        backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[900],
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <AccountCircleIcon sx={{ fontSize: 80, color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight="bold">{userData.name || 'Usuario'}</Typography>
                        <Typography variant="body2" color="text.secondary">{userData.email || 'correo@ejemplo.com'}</Typography>
                    </Box>

                    <Box sx={{ p: 2, pt: 3 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Información Personal
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nombre"
                                    name="name"
                                    value={userData.name}
                                    onChange={handleInputChange}
                                    InputProps={{
                                        startAdornment: (
                                            <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>
                                                <DriveFileRenameOutlineIcon fontSize="small" />
                                            </ListItemIcon>
                                        ),
                                    }}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Correo electrónico"
                                    name="email"
                                    value={userData.email}
                                    onChange={handleInputChange}
                                    InputProps={{
                                        startAdornment: (
                                            <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>
                                                <MailOutlineIcon fontSize="small" />
                                            </ListItemIcon>
                                        ),
                                    }}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Tu número de móvil"
                                    name="mobile"
                                    value={userData.mobile}
                                    onChange={handleInputChange}
                                    InputProps={{
                                        startAdornment: (
                                            <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>
                                                <WhatsAppIcon fontSize="small" />
                                            </ListItemIcon>
                                        ),
                                    }}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 3 }} />

                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Actualizar Contraseña
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nueva Contraseña"
                                    type="password"
                                    variant="outlined"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>
                                                <SyncLockIcon fontSize="small" />
                                            </ListItemIcon>
                                        ),
                                    }}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                                    Solo llena este campo si deseas cambiar tu contraseña.
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>

                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleProfileUpdate}
                        sx={{
                            py: 1.5,
                            mt: 1,
                            backgroundColor: 'primary.main',
                            transition: 'background-color 0.2s, box-shadow 0.2s',
                            "&:hover": {
                                backgroundColor: 'primary.dark',
                                boxShadow: (theme) => theme.shadows[8],
                            },
                        }}
                    >
                        GUARDAR CAMBIOS
                    </Button>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => { handleProfileClose(); setSubscriptionOpen(true); }} 
                        sx={{
                            py: 1.5,
                            mt: 1,
                            borderColor: 'divider',
                            color: 'text.primary',
                            transition: 'background-color 0.2s, box-shadow 0.2s',
                            "&:hover": {
                                backgroundColor: (theme) => theme.palette.action.hover,
                                borderColor: 'text.primary',
                                boxShadow: (theme) => theme.shadows[4],
                            },
                        }}
                    >
                        VER TODOS LOS PLANES
                    </Button>
                </Box>
            </Dialog>
        </Box>
    );
};

export default DashboardLayout;