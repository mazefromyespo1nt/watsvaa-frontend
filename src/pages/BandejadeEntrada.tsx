import React, { useState, useEffect, useRef } from "react";
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import {
    Box, Typography, TextField, InputAdornment, Chip, IconButton,
    Paper, useTheme, CircularProgress, List, Avatar, Menu, MenuItem,
    AppBar, Toolbar, ListItem, ListItemAvatar, ListItemText, Button, Modal, Badge, Link,
    Fab, Zoom, Select,
    ListItemIcon
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from '@mui/icons-material/Send';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { io, Socket } from "socket.io-client";

import welcomeCats from "../images/no-chat-found.svg";
import { Chat, Message } from '../types';
import config from "../config.json";
import { useNotify } from "../components/NotificationProvider";
import { db } from '../db';
import ImagePreviewModal from './ImagePreviewModal';
import notificationSound from '../notification/interface-124464.mp3';
import lightModeBackground from '../images/LightMode.png';
import darkModeBackground from '../images/DarkMode.jpg';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const fecha = new Date().toLocaleDateString();
const hora = new Date().toLocaleTimeString();

// ======================= SUB-COMPONENTES ==========================

const StatusChip: React.FC<{ status?: string; onUpdateStatus?: (status: 'open' | 'solved' | 'pending') => void }> = ({ status, onUpdateStatus }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    if (!status) return null;

    const statusConfig = {
        open: { label: 'Abierto', color: 'primary', emoji: '🟢' },
        solved: { label: 'Resuelto', color: 'success', emoji: '✅' },
        pending: { label: 'Pendiente', color: 'warning', emoji: '🤔' },
    };
    
    const configValue = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'default', emoji: '' };

    return (
        <>
            <Chip 
                label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {configValue.emoji} {configValue.label}
                        {onUpdateStatus && <KeyboardArrowDownIcon fontSize="small" />}
                    </Box>
                }
                color={configValue.color as any}
                size="small"
                onClick={onUpdateStatus ? (e) => setAnchorEl(e.currentTarget) : undefined}
                sx={{ mr: 1, fontWeight: 'bold', cursor: onUpdateStatus ? 'pointer' : 'default' }}
            />
            {onUpdateStatus && (
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                    <MenuItem onClick={() => { onUpdateStatus('open'); setAnchorEl(null); }}>🟢 Abierto</MenuItem>
                    <MenuItem onClick={() => { onUpdateStatus('pending'); setAnchorEl(null); }}>🤔 Pendiente</MenuItem>
                    <MenuItem onClick={() => { onUpdateStatus('solved'); setAnchorEl(null); }}>✅ Resuelto</MenuItem>
                </Menu>
            )}
        </>
    );
};

const ChatListItem: React.FC<{ chat: Chat; isSelected: boolean; onClick: () => void; }> = ({ chat, isSelected, onClick }) => {
    return (
        <ListItem button onClick={onClick} sx={{ backgroundColor: isSelected ? 'action.selected' : "transparent", "&:hover": { backgroundColor: 'action.hover' }, borderRadius: 2, mb: 1, pr: 1 }}>
            <ListItemAvatar>
                <Avatar src={chat.profilePicUrl}>
                    {!chat.profilePicUrl && (chat.name ? chat.name.charAt(0) : '?')}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography variant="subtitle1" noWrap sx={{ flexGrow: 1, pr: 1 }}>
                            {chat.name}
                        </Typography>
                        <Box sx={{ flexShrink: 0 }}>
                            <StatusChip status={chat.chatStatus} />
                        </Box>
                    </Box>
                }
                secondary={<Typography variant="body2" color="text.secondary" noWrap>{chat.lastMessage}</Typography>}
                sx={{ pr: 1 }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '55px', ml: 1 }}>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    {chat.timestamp}
                </Typography>
                <Badge 
                    color="primary" 
                    badgeContent={chat.unreadCount} 
                    invisible={!chat.unreadCount || chat.unreadCount === 0}
                    sx={{ mt: 0.5 }}
                />
            </Box>
        </ListItem>
    );
};

const MessageInput: React.FC<{ onSendMessage: (text: string) => void; disabled?: boolean; }> = ({ onSendMessage, disabled = false }) => {
    const [text, setText] = useState('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (text.trim()) { onSendMessage(text.trim()); setText(''); } };
    return (
        <Paper component="form" onSubmit={handleSubmit} elevation={2} sx={{ p: '4px 8px', display: 'flex', alignItems: 'center', width: '100%', backgroundColor: 'background.default' }}>
            <TextField fullWidth variant="standard" placeholder="Escribe un mensaje..." value={text} onChange={(e) => setText(e.target.value)} disabled={disabled} InputProps={{ disableUnderline: true }} autoComplete="off" />
            <IconButton type="submit" sx={{ color: 'text.primary' }} disabled={!text.trim() || disabled}>
                <SendIcon />
            </IconButton>
        </Paper>
    );
};

const MessageStatus: React.FC<{ status?: string; isSticker?: boolean }> = ({ status, isSticker }) => {
    if (!status) return null;
    const isRead = status === 'read';
    const iconColor = isRead ? '#34B7F1' : (isSticker ? '#ffffff' : 'action.active');
    const iconStyles = { fontSize: '1.1rem', color: iconColor, marginLeft: '4px' };
    
    if (status === 'pending') return <CircularProgress size={12} sx={{ ...iconStyles, color: isSticker ? '#fff' : 'action.active' }} />;
    if (status === 'sent') return <CheckIcon sx={iconStyles} />;
    if (status === 'delivered') return <DoneAllIcon sx={iconStyles} />;
    if (status === 'read') return <DoneAllIcon sx={iconStyles} />; 
    return null;
};

const ChatActions: React.FC<{ onDeleteChat: () => void; }> = ({ onDeleteChat }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    return (
        <Box>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <MoreVertIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { onDeleteChat(); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
                    <ListItemIcon sx={{ color: 'inherit' }}>
                        <DeleteOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    Eliminar Chat
                </MenuItem>
            </Menu>
        </Box>
    );
};

const AttachmentMenu: React.FC<{ onSendMedia: (file: File) => void; }> = ({ onSendMedia }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) { onSendMedia(file); }
        handleClose();
    };
    const openFileDialog = (accept: string) => {
        if(fileInputRef.current) {
            fileInputRef.current.accept = accept;
            fileInputRef.current.click();
        }
    };
    return (
        <Box>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
            <IconButton onClick={handleClick} sx={{ color: 'text.primary' }}>
                <AttachFileIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <MenuItem onClick={() => openFileDialog('image/*')}>Imagen</MenuItem>
                <MenuItem onClick={() => openFileDialog('video/*')}>Video</MenuItem>
                <MenuItem onClick={() => openFileDialog('audio/*')}>Audio</MenuItem>
                <MenuItem onClick={() => openFileDialog('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx')}>Documento</MenuItem>
            </Menu>
        </Box>
    );
};

const DeleteChatModal: React.FC<{ open: boolean; onClose: () => void; onConfirm: () => void; chatName: string; }> = ({ open, onClose, onConfirm, chatName }) => {
    const style = { position: 'absolute' as 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4, borderRadius: 2 };
    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">Confirmar Eliminación</Typography>
                <Typography sx={{ mt: 2 }}>¿Estás seguro de que quieres eliminar el chat con **{chatName}**?</Typography>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button variant="text" onClick={onClose}>Cancelar</Button>
                    <Button variant="contained" color="error" onClick={onConfirm}>Eliminar</Button>
                </Box>
            </Box>
        </Modal>
    );
}

const ContactDetailsModal: React.FC<{ open: boolean; onClose: () => void; details: { name: string; status?: string; profilePhoto?: string; } | null; }> = ({ open, onClose, details }) => {
    const style = { position: 'absolute' as 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4, borderRadius: 2, textAlign: 'center' };
    if (!details) return null;
    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Avatar src={details.profilePhoto} sx={{ width: 100, height: 100, margin: '0 auto 16px', fontSize: '3rem' }}>
                    {!details.profilePhoto && details.name.charAt(0)}
                </Avatar>
                <Typography variant="h6" component="h2">{details.name}</Typography>
                <Typography sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                    "{details.status || 'Estado no disponible'}"
                </Typography>
                {details.profilePhoto && (
                    <Typography sx={{ mt: 2 }}>
                        <Link href={details.profilePhoto} target="_blank" rel="noopener noreferrer">Ver foto de perfil completa</Link>
                    </Typography>
                )}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" onClick={onClose}>Cerrar</Button>
                </Box>
            </Box>
        </Modal>
    );
};

const MessageBubble: React.FC<{ msg: any }> = ({ msg }) => {
    const theme = useTheme();
    const formatTime = (ts: number) => ts ? new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    
    const isSticker = msg.type === 'sticker';

    const renderMedia = () => {
        if (!msg.media) return null;
        const { url, mimetype, caption, fileName } = msg.media;
        
        if (isSticker) {
            return <img src={url} alt="Sticker" style={{ width: '130px', height: '130px', objectFit: 'contain' }} />;
        }
        if (mimetype?.startsWith('image/')) {
            return (
                <Link href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={caption || 'imagen'} style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', display: 'block' }} />
                </Link>
            );
        }
        if (mimetype?.startsWith('video/')) {
            return <video src={url} controls style={{ maxWidth: '100%', borderRadius: '8px', display: 'block' }} />;
        }
        if (mimetype?.startsWith('audio/') || msg.type === 'aud' || msg.type === 'audio') {
            return (
                <Box sx={{ minWidth: '250px', pt: 1 }}>
                    <audio src={url} controls style={{ width: '100%', height: '40px' }} />
                </Box>
            );
        }
        
        let docIcon = <DescriptionIcon sx={{ fontSize: 40 }} />;
        if (mimetype?.includes('pdf')) docIcon = <PictureAsPdfIcon sx={{ fontSize: 40, color: '#D32F2F' }} />;
        if (mimetype?.includes('word')) docIcon = <ArticleIcon sx={{ fontSize: 40, color: '#2B579A' }} />;
        
        return (
            <Link href={url} target="_blank" rel="noopener noreferrer" download={fileName} sx={{ textDecoration: 'none', color: 'inherit' }}>
                <Box display="flex" alignItems="center" gap={1} p={1} sx={{ backgroundColor: 'action.hover', borderRadius: 1 }}>
                    {docIcon}
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{fileName || 'Documento'}</Typography>
                </Box>
            </Link>
        );
    };

    const renderSpecialText = () => {
        if (msg.type === 'loc') {
            try {
                const loc = JSON.parse(msg.text || '{}');
                const mapsLink = `https://maps.google.com/?q=${loc.lat},${loc.long}`;
                return (
                    <Link href={mapsLink} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none', color: 'inherit' }}>
                        <Box display="flex" alignItems="center" gap={1.5} p={1.5} sx={{ backgroundColor: 'action.hover', borderRadius: 1, minWidth: '200px' }}>
                            <LocationOnIcon color="error" fontSize="large" />
                            <Box>
                                <Typography variant="body2" fontWeight="bold">Ubicación compartida</Typography>
                                {loc.name && <Typography variant="caption" color="text.secondary" display="block" noWrap>{loc.name}</Typography>}
                                <Typography variant="caption" color="primary">Ver en Google Maps</Typography>
                            </Box>
                        </Box>
                    </Link>
                );
            } catch(e) { return <Typography>{msg.text}</Typography>; }
        }

        // 🔥 CONTACTOS V-CARD: Extraemos el JSON, creamos un archivo en RAM y lo hacemos descargable
        if (msg.type === 'contact') {
            try {
                const contact = JSON.parse(msg.text || '{}');
                const vcardBlob = new Blob([contact.vcard], { type: 'text/vcard' });
                const vcardUrl = URL.createObjectURL(vcardBlob);

                return (
                    <Link href={vcardUrl} download={`${contact.displayName || 'Contacto'}.vcf`} sx={{ textDecoration: 'none', color: 'inherit' }}>
                        <Box display="flex" alignItems="center" gap={1.5} p={1.5} sx={{ backgroundColor: 'action.hover', borderRadius: 1, minWidth: '200px', cursor: 'pointer' }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}><PersonIcon /></Avatar>
                            <Box>
                                <Typography variant="body2" fontWeight="bold">{contact.displayName || 'Contacto'}</Typography>
                                <Typography variant="caption" color="primary" display="block">Clic para guardar</Typography>
                            </Box>
                        </Box>
                    </Link>
                );
            } catch(e) { return <Typography>{msg.text}</Typography>; }
        }

        const messageText = msg.text || msg.media?.caption;
        if (messageText) {
            return (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', mt: msg.media ? 0.5 : 0 }}>
                    {messageText}
                </Typography>
            );
        }
        return null;
    };

    return (
        // Añadimos margen extra (mb: 2.5) si hay una reacción para que no choque con el siguiente mensaje
        <Box key={msg.msgId} display="flex" justifyContent={msg.fromMe ? 'flex-end' : 'flex-start'} mb={msg.reaction ? 2.5 : 1} sx={{ position: 'relative' }}>
            <Paper elevation={isSticker ? 0 : 1} sx={{ 
                p: isSticker ? 0.5 : 1.5, 
                borderRadius: 2, 
                maxWidth: '70%', 
                backgroundColor: isSticker ? 'transparent' : (msg.fromMe ? (theme.palette.mode === 'dark' ? '#005c4b' : '#dcf8c6') : theme.palette.background.paper) 
            }}>
                {msg.media && renderMedia()}
                {(!msg.media || msg.media.caption) && renderSpecialText()}
                
                <Box display="flex" justifyContent="flex-end" alignItems="center" mt={isSticker ? -1.5 : 0.5} sx={{ 
                    backgroundColor: isSticker ? 'rgba(0,0,0,0.3)' : 'transparent',
                    borderRadius: 4, px: isSticker ? 1 : 0, width: 'fit-content', ml: 'auto'
                }}>
                    <Typography variant="caption" sx={{ color: isSticker ? '#fff' : 'text.secondary', mr: 0.5 }}>{formatTime(msg.timestamp)}</Typography>
                    {msg.fromMe && <MessageStatus status={msg.status} isSticker={isSticker} />}
                </Box>
            </Paper>

            {msg.reaction && (
                <Box sx={{
                    position: 'absolute',
                    bottom: -15,
                    [msg.fromMe ? 'right' : 'left']: 15,
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: '16px',
                    padding: '2px 6px',
                    fontSize: '1rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    zIndex: 2,
                    border: `1px solid ${theme.palette.divider}`
                }}>
                    {msg.reaction}
                </Box>
            )}
        </Box>
    );
};

const ConversationView: React.FC<{ chat: Chat; messages: Message[]; isLoading?: boolean; typingInfo: { jid: string, isTyping: boolean } | null; onSendMessage: (text: string) => void; onSendMedia: (file: File) => void; onDeleteChat: () => void; onUpdateStatus: (status: 'open' | 'solved' | 'pending') => void; onGetSenderDetails: () => void; }> = (props) => {
    const { chat, messages, onSendMessage, isLoading, typingInfo, onSendMedia, onDeleteChat, onUpdateStatus, onGetSenderDetails } = props;
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const scrollContainerRef = useRef<null | HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    
    const theme = useTheme();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, [messages, chat]);

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const target = event.currentTarget;
        const threshold = 200;
        const isScrolledUp = target.scrollHeight - target.scrollTop - target.clientHeight > threshold;
        setShowScrollButton(isScrolledUp);
    };
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <Box display="flex" flexDirection="column" height="100%" width="100%" sx={{ position: 'relative' }}>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    {/* Toda el área de la foto, nombre y número ahora es un botón gigante */}
                    <Box 
                        display="flex" 
                        alignItems="center" 
                        flexGrow={1} 
                        onClick={onGetSenderDetails} 
                        title="Ver detalles del contacto"
                        sx={{ cursor: 'pointer', py: 0.5 }}
                    >
                        <Avatar src={chat.profilePicUrl} sx={{ mr: 2 }}>
                            {!chat.profilePicUrl && (chat.name ? chat.name.charAt(0) : '?')}
                        </Avatar>
                        <Box>
                            <Typography variant="h6">{chat.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {typingInfo?.jid === chat.jid && typingInfo?.isTyping 
                                    ? <em style={{ color: 'primary.main' }}>escribiendo...</em> 
                                    : (chat.phoneNumber?.includes('@lid') ? '' : chat.phoneNumber)}
                            </Typography>
                        </Box>
                    </Box>
                    
                    <StatusChip status={chat.chatStatus} onUpdateStatus={onUpdateStatus} />
                    <ChatActions onDeleteChat={onDeleteChat} />
                </Toolbar>
            </AppBar>

            <Box
                flex={1}
                p={2}
                ref={scrollContainerRef}
                onScroll={handleScroll}
                sx={{
                    overflowY: 'auto',
                    backgroundImage: `url(${theme.palette.mode === 'dark' ? darkModeBackground : lightModeBackground})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <Box>
                    {isLoading ? <Box display="flex" justifyContent="center" alignItems="center" height="100%"><CircularProgress /></Box> :
                        messages.length > 0 ? messages.map((msg, index) => {
                            if (msg.type === 'reaction' || msg.type === 'update') return null;
                            const currentLabel = getDateLabel(msg.timestamp * 1000);
                            const prevLabel = index > 0 ? getDateLabel(messages[index - 1].timestamp * 1000) : null;
                            
                            // Solo mostramos la burbuja si cambió el día respecto al mensaje anterior
                            const showSeparator = currentLabel !== prevLabel;

                            return (
                                <React.Fragment key={msg.msgId}>
                                    {showSeparator && (
                                        <Box display="flex" justifyContent="center" my={2}>
                                            <Paper elevation={0} sx={{ 
                                                px: 1.5, 
                                                py: 0.5, 
                                                borderRadius: 2, 
                                                backgroundColor: theme.palette.mode === 'dark' ? '#1e2b33' : '#e1f5fe', 
                                                color: theme.palette.text.secondary, 
                                                fontSize: '0.75rem', 
                                                textTransform: 'uppercase' 
                                            }}>
                                                {currentLabel}
                                            </Paper>
                                        </Box>
                                    )}
                                    <MessageBubble msg={msg} />
                                </React.Fragment>
                            );
                        }) :
                        <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexDirection="column" color="text.secondary">
                            <ChatBubbleOutlineIcon sx={{ fontSize: 50, mb: 2 }} />
                            <Typography>No hay mensajes en este chat.</Typography>
                        </Box>
                    }
                    <div ref={messagesEndRef} />
                </Box>
            </Box>
            
            <Zoom in={showScrollButton}>
                <Fab 
                    color="primary" 
                    size="small" 
                    onClick={scrollToBottom}
                    sx={{
                        position: 'absolute',
                        bottom: '80px',
                        right: '24px',
                    }}
                >
                    <KeyboardArrowDownIcon />
                </Fab>
            </Zoom>

            <Box p={1} sx={{ backgroundColor: 'background.default', display: 'flex', alignItems: 'center' }}>
                <AttachmentMenu onSendMedia={onSendMedia} />
                <MessageInput onSendMessage={onSendMessage} disabled={isLoading} />
            </Box>
        </Box>
    );
};

// Función para la burbuja separadora central de fechas en el chat
const getDateLabel = (timestampInMs: number): string => {
    if (!timestampInMs) return '';
    const date = new Date(timestampInMs);
    const today = new Date();
    
    const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = todayMidnight.getTime() - dateMidnight.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays === 2) return "Antier";
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatChatTimestamp = (timestampInMs: number): string => {
    if (!timestampInMs) return '';
    const date = new Date(timestampInMs);
    const today = new Date();
    
    const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = todayMidnight.getTime() - dateMidnight.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); 
    } else if (diffDays === 1) {
        return "Ayer";
    } else if (diffDays === 2) {
        return "Antier";
    } else {
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
    }
};

// ======================= COMPONENTE PRINCIPAL ==========================
const BandejadeEntrada: React.FC = () => {
    const theme = useTheme();
    const notify = useNotify();
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [userInstances, setUserInstances] = useState<any[]>([]); // Aquí almacenamos las instancias del usuario
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [instanceId, setInstanceId] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState("connecting");
    const [typingInfo, setTypingInfo] = useState<{ jid: string, isTyping: boolean } | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [contactDetails, setContactDetails] = useState<{ name: string; status?: string; profilePhoto?: string; } | null>(null);
    const [pastedImage, setPastedImage] = useState<File | null>(null);

    const selectedChatRef = useRef<Chat | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const typingTimeoutRef = useRef<number | null>(null);
    const notificationAudio = useRef(new Audio(notificationSound));

    useEffect(() => {
        const unlockAudio = () => {
            notificationAudio.current.play().then(() => {
                notificationAudio.current.pause();
                notificationAudio.current.currentTime = 0;
            }).catch(() => {}); // Ignoramos si el navegador lo bloquea silenciosamente
            
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { setSelectedChat(null); } };
        if (selectedChat) { document.addEventListener('keydown', handleEscapeKey); }
        return () => { document.removeEventListener('keydown', handleEscapeKey); };
    }, [selectedChat]);

    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            if (!selectedChatRef.current) return;
            const items = event.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        event.preventDefault();
                        setPastedImage(file);
                    }
                    break;
                }
            }
        };
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, []);

    const transformBackendMessage = (msg: any, jid: string): Message => {
        const baseURL = new URL(config.API_URL).origin;
        const messageType = msg.type?.toLowerCase();
        
        const reactionData = msg.reaction || msg.msgContext?.reaction || "";
        
        if (['image', 'video', 'doc', 'aud', 'doc_cap', 'sticker'].includes(messageType)) {
            const mediaType = messageType === 'doc_cap' ? 'doc' : messageType;
            let mimetype = msg.msgContext?.mimetype;
            if ((mediaType === 'image' || mediaType === 'sticker') && !mimetype) {
                mimetype = mediaType === 'sticker' ? 'image/webp' : 'image/jpeg';
            }
            
            return {
                msgId: msg.msgId, chatId: jid, fromMe: msg.route === 'outgoing',
                timestamp: msg.timestamp, type: mediaType, status: msg.status,
                reaction: reactionData, 
                media: { 
                    url: `${baseURL}/media/${msg.msgContext?.fileName}`, 
                    fileName: msg.msgContext?.fileName, 
                    mimetype: mimetype,
                    caption: msg.msgContext?.caption || '' 
                }
            };
        }
        
        let textContent = msg.msgContext?.text || '';
        if (messageType === 'loc' || messageType === 'contact') {
            textContent = JSON.stringify(msg.msgContext);
        }

        return {
            msgId: msg.msgId, chatId: jid, fromMe: msg.route === 'outgoing',
            text: textContent, timestamp: msg.timestamp,
            type: messageType || 'text', status: msg.status,
            reaction: reactionData 
        };
    };

    const formatLastMessagePreview = (message: Message): string => {
        const prefix = message.fromMe ? "Tú: " : "";
        
        if (message.type === 'sticker') return `${prefix}🖼️ Sticker`;
        if (message.type === 'loc') return `${prefix}📍 Ubicación`;
        if (message.type === 'contact') return `${prefix}👤 Contacto`;
        
        if (message.media?.caption) {
            return `${prefix}${message.media.caption}`;
        }
        if (message.text && !['loc', 'contact'].includes(message.type)) {
            return `${prefix}${message.text}`;
        }
        if (message.media) {
            switch (message.type) {
                case 'image': return `${prefix}📷 Imagen`;
                case 'video': return `${prefix}📹 Video`;
                case 'audio':
                case 'aud': return `${prefix}🎵 Audio`;
                case 'doc':
                case 'doc_cap': return `${prefix}📄 Documento`;
                default: return `${prefix}📎 Archivo`;
            }
        }
        return "Chat iniciado";
    };
    
    useEffect(() => {
        const setupSockets = () => {
            const socketUrl = new URL(config.API_URL).origin;
            const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
            socketRef.current = socket;
            
            // Parche para obtener el userId del token JWT almacenado en localStorage
            const token = localStorage.getItem('token');
            let userId = null;
            if (token) {
                try {
                    userId = JSON.parse(atob(token.split('.')[1])).uid;
                } catch (e) {
                    console.error("No se pudo desencriptar el token");
                }
            }

            socket.on('connect', () => {
                console.log('🔌 Conectado al servidor de Sockets.');
               // setConnectionStatus('open'); 
                if (userId) socket.emit('user_connected', { userId });
            });
            
            socket.on('whatsapp-status', ({ status }: { status: string }) => { 
                setConnectionStatus(status); 
            });
            
            socket.on('push_new_msg', (data: any) => {
                if (!data || !data.msg || !data.msg.remoteJid) { return; }
                const newMessageRaw = data.msg;
                const chatId = newMessageRaw.remoteJid;
                const messageData = transformBackendMessage(newMessageRaw, chatId);

                if (!messageData.fromMe && (selectedChatRef.current?.jid !== messageData.chatId || document.hidden)) {
                    notificationAudio.current.play().catch(() => {});
                }

                if (selectedChatRef.current?.jid === messageData.chatId) {
                    setMessages(prev => {
                        if (messageData.fromMe) {
                            const tempMessage = [...prev].reverse().find(m => m.status === 'pending');
                            if (tempMessage) {
                                db.messages.delete(tempMessage.msgId);
                                db.messages.put(messageData);
                                return prev.map(m => m.msgId === tempMessage.msgId ? messageData : m);
                            }
                        }
                        if (prev.some(msg => msg.msgId === messageData.msgId)) { return prev; }
                        db.messages.put(messageData);
                        return [...prev, messageData];
                    });
                } else {
                     db.messages.put(messageData);
                     db.chats.where({ jid: messageData.chatId }).modify(chat => { chat.unreadCount = (chat.unreadCount || 0) + 1; });
                }

                setChats(prev => {
                    const chatIndex = prev.findIndex(c => c.jid === messageData.chatId);
                    let newChats = [...prev];
                    const newTimestamp = formatChatTimestamp(messageData.timestamp * 1000);
                    const lastMessageText = formatLastMessagePreview(messageData);

                    if (chatIndex > -1) {
                        const existingChat = newChats[chatIndex];
                        const isChatOpen = selectedChatRef.current?.jid === messageData.chatId;
                        const updatedChat = { ...existingChat, lastMessage: lastMessageText, timestamp: newTimestamp, unreadCount: isChatOpen ? existingChat.unreadCount : (existingChat.unreadCount || 0) + 1 };
                        newChats.splice(chatIndex, 1);
                        newChats.unshift(updatedChat);
                    } else {
                        const newChat: Chat = { id: messageData.chatId, jid: messageData.chatId, name: newMessageRaw.senderName || messageData.chatId.split('@')[0], lastMessage: lastMessageText, timestamp: newTimestamp, phoneNumber: messageData.chatId.split('@')[0], dbChatId: data.chatId, unreadCount: 1, chatStatus: 'open' };
                        newChats.unshift(newChat);
                        db.chats.put(newChat);
                    }
                    return newChats;
                });
            });
            socket.on('push_new_reaction', (data: any) => {
                const { msgId, reaction } = data;
                db.messages.update(msgId, { reaction: reaction });
                setMessages(prev => prev.map(m => m.msgId === msgId ? { ...m, reaction: reaction } : m));
            });

            socket.on('update_delivery_status', (data: any) => {
                const { msgId, status } = data;
                db.messages.update(msgId, { status: status });
                setMessages(prev => prev.map(m => m.msgId === msgId ? { ...m, status: status } : m));
            });

            socket.on('presence-update', (data: { jid: string, presence: string }) => {
                const { jid, presence } = data;
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                if (presence === 'composing') {
                    setTypingInfo({ jid, isTyping: true });
                    typingTimeoutRef.current = window.setTimeout(() => setTypingInfo({ jid, isTyping: false }), 3000);
                } else {
                    setTypingInfo({ jid, isTyping: false });
                }
            });
            
            socket.on('disconnect', () => {
                console.log('🔌 Desconectado del servidor de Sockets.');
                setConnectionStatus('close');
            });
        };

        if (!socketRef.current) setupSockets();
        return () => {
            if (socketRef.current?.connected) socketRef.current.disconnect();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    const fetchChats = async (selectedIns?: string) => {
        setIsLoadingChats(true);
        setError(null);
        try {
            const insRes = await fetch(`${config.API_URL}session/get_instances_with_status`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
            const insData = await insRes.json();
            if (insData.success) {
                setUserInstances(insData.data.map((d: any) => d.i));
            }

            // Cargar los chats de la instancia seleccionada
            const url = selectedIns 
                ? `${config.API_URL}inbox/get_my_chats?instance=${encodeURIComponent(selectedIns)}`
                : `${config.API_URL}inbox/get_my_chats`;

            const cachedChats = await db.chats.toArray();
            if (cachedChats.length > 0 && !selectedIns) { setChats(cachedChats); } // Usar caché solo al inicio

            const response = await fetch(url, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
            if (!response.ok) throw new Error('Error de red');
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                if (data.userData?.id === 'Desconectado') { 
                    setConnectionStatus('disconnected'); 
                } else {
                    setConnectionStatus('open');
                }
                if (data.userData?.selIns) setInstanceId(data.userData.selIns);
                const serverChats: Chat[] = data.data.map((chat: any) => {
                    let lastMessageText = 'Chat iniciado';
                    try {
                        const parsedRawMessage = JSON.parse(chat.last_message);
                        const lastMessageObject = transformBackendMessage(parsedRawMessage, chat.sender_jid);
                        lastMessageText = formatLastMessagePreview(lastMessageObject);
                    } catch (e) {
                        if (typeof chat.last_message === 'string' && chat.last_message.trim() !== '') {
                            lastMessageText = chat.last_message;
                        }
                    }
                    const cachedVersion = cachedChats.find(c => c.jid === chat.sender_jid);
                    return { 
                        id: chat.id.toString(), 
                        jid: chat.sender_jid, 
                        name: chat.sender_name, 
                        lastMessage: lastMessageText, 
                        timestamp: chat.last_message_came ? formatChatTimestamp(Number(chat.last_message_came) * 1000) : '',
                        phoneNumber: chat.sender_mobile, 
                        dbChatId: chat.chat_id, 
                        unreadCount: cachedVersion?.unreadCount || 0, 
                        profilePicUrl: cachedVersion?.profilePicUrl, 
                        chatStatus: chat.chat_status || 'open' 
                    };
                });
                if (!selectedIns) await db.chats.bulkPut(serverChats);
                setChats(serverChats);
            } else if (!cachedChats.length) { setError(data.msg || "No se pudieron cargar los chats."); }
        } catch (err: any) { if (!chats.length) setError(err.message); } 
        finally { setIsLoadingChats(false); }
    };
    useEffect(() => { fetchChats() }, []);

    const handleSelectChat = async (chat: Chat) => {
        if (selectedChat?.id === chat.id) return;
        if (chat.unreadCount && chat.unreadCount > 0) {
            await db.chats.update(chat.jid, { unreadCount: 0 });
            setChats(prev => prev.map(c => c.jid === chat.jid ? { ...c, unreadCount: 0 } : c));
        }
        setSelectedChat({ ...chat, unreadCount: 0 });
        setIsLoadingMessages(true);
        try {
            const cachedMessages = await db.messages.where('chatId').equals(chat.jid).toArray();
            setMessages(cachedMessages.sort((a, b) => a.timestamp - b.timestamp));
            const response = await fetch(`${config.API_URL}user/get_convo`, { 
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token') 
                },
                body: JSON.stringify({ chatId: chat.dbChatId })
            });
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                const transformedMessages: Message[] = data.data.map((msg: any) => transformBackendMessage(msg, chat.jid));
                await db.messages.bulkPut(transformedMessages);
                setMessages(transformedMessages);
            }
        } catch (err) { console.error("Error cargando conversación:", err); } 
        finally { setIsLoadingMessages(false); }
    };
    
    const handleSendMessage = async (text: string) => {
        if (!selectedChat || !instanceId) return;
        try {
            const response = await fetch(`${config.API_URL}inbox/send_text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                body: JSON.stringify({ 
                    fecha: fecha + " " + hora,
                    auth: localStorage.getItem("token"),
                    accion: "POST",
                    data: { 
                    text, toJid: selectedChat.jid, toName: selectedChat.name, chatId: selectedChat.dbChatId, instance: instanceId 
                    }
                }),
            });
            if (!response.ok) { throw new Error(`El servidor respondió con el estado ${response.status}`); }
            const data = await response.json();
            if (!data.success) { throw new Error(data.msg || "El backend indicó un error al enviar el mensaje."); }
        } catch (err: any) {
            console.error("Error al enviar mensaje:", err);
            notify.error(`No se pudo enviar el mensaje: ${err.message}`);
        }
    };
    
    const apiCall = async (path: string, body: object, method: string = 'POST') => { 
        try { 
            const response = await fetch(`${config.API_URL}${path}`, { 
                method, 
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') }, 
                body: JSON.stringify({ 
                    fecha: fecha + " " + hora,
                    auth: localStorage.getItem("token"),
                    accion: "POST",
                    data: {
                       body
          }
          }),
      });
            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error("Respuesta inválida del servidor:", responseText);
                throw new Error("Respuesta inválida del servidor.");
            }

            if (!response.ok) throw new Error(data.msg || `HTTP error! status: ${response.status}`); 
            if (data.success === false) throw new Error(data.msg || 'Error en la API'); 
            
            return data; 
        } catch (error) { 
            console.error(`Error en la llamada a ${path}:`, error); 
            throw error; 
        } 
    };

    const handleSendMedia = async (file: File, caption: string = '') => {
        if (!selectedChat || !instanceId) {
            notify.warning('Selecciona un chat y asegúrate que la instancia esté disponible.');
            return;
        }
        
        const tempId = `temp_${Date.now()}`;
        let mediaType: Message['type'] = 'doc';
        if (file.type.startsWith('image/')) mediaType = 'image';
        if (file.type.startsWith('video/')) mediaType = 'video';
        if (file.type.startsWith('audio/')) mediaType = 'audio';
        
        const optimisticMessage: Message = {
            msgId: tempId, 
            chatId: selectedChat.jid, 
            fromMe: true, 
            timestamp: Math.floor(Date.now() / 1000),
            type: mediaType, 
            status: 'pending', 
            media: { 
                url: URL.createObjectURL(file), 
                mimetype: file.type, 
                fileName: file.name,
                caption: caption
            }
        };

        setMessages(prev => [...prev, optimisticMessage]);
        await db.messages.put(optimisticMessage);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadResponse = await fetch(`${config.API_URL}user/return_url`, { 
                method: 'POST', 
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }, 
                body: formData 
            });
            
            const uploadData = await uploadResponse.json();
            if (!uploadData.success) throw new Error(uploadData.msg || 'Error al subir el archivo.');
            
            let payload: any = { 
                toJid: selectedChat.jid, 
                toName: selectedChat.name, 
                chatId: selectedChat.dbChatId, 
                instance: instanceId, 
                caption: caption 
            };

            if (mediaType === 'image') {
                payload.image = uploadData.filename;
                payload.fileName = uploadData.originalName;
            } else {
                payload.fileName = uploadData.filename;
                payload.originalFile = uploadData.originalName;
            }
            
            const endpointType = mediaType === 'audio' ? 'aud' : mediaType;
            await apiCall(`inbox/send_${endpointType}`, payload);

        } catch (error: any) {
            console.error("Fallo al enviar media:", error);
            notify.error(`No se pudo enviar el archivo: ${error.message}`);
            await db.messages.update(tempId, { status: 'error' });
            setMessages(prev => prev.map(m => m.msgId === tempId ? { ...m, status: 'error' } : m));
        }
    };

    const handleDeleteChat = () => { if (!selectedChat) return; setDeleteModalOpen(true); };
    const confirmDeleteChat = async () => { if (!selectedChat) return; await apiCall('inbox/del_chat', { chatId: selectedChat.dbChatId }); await db.messages.where('chatId').equals(selectedChat.jid).delete(); await db.chats.delete(selectedChat.jid); setChats(prev => prev.filter(c => c.jid !== selectedChat.jid)); setSelectedChat(null); setDeleteModalOpen(false); };
    
    const handleUpdateChatStatus = async (newStatus: 'open' | 'solved' | 'pending') => {
        if (!selectedChat) return;
        const originalStatus = selectedChat.chatStatus;
        const updatedChat = { ...selectedChat, chatStatus: newStatus };
        setSelectedChat(updatedChat);
        setChats(prevChats => prevChats.map(c => c.id === selectedChat.id ? updatedChat : c));
        await db.chats.update(selectedChat.jid, { chatStatus: newStatus });
        try {
            await apiCall('user/change_chat_ticket_status', { chatId: selectedChat.dbChatId, status: newStatus });
        } catch (error) {
            console.error("Fallo al actualizar el estado en el servidor:", error);
            const revertedChat = { ...selectedChat, chatStatus: originalStatus };
            setSelectedChat(revertedChat);
            setChats(prevChats => prevChats.map(c => c.id === selectedChat.id ? revertedChat : c));
            await db.chats.update(selectedChat.jid, { chatStatus: originalStatus });
            notify.error("No se pudo actualizar el estado del chat. Por favor, inténtalo de nuevo.");
        }
    };
    
    const handleGetSenderDetails = async () => {
        if (!selectedChat || !instanceId) return;
        const data = await apiCall('inbox/get_sender_details', { sessionId: instanceId, jid: selectedChat.jid });
        if (data) {
            const details = { name: selectedChat.name, status: data.status?.status, profilePhoto: data.profilePhoto };
            setContactDetails(details);
            setDetailsModalOpen(true);
            if (data.profilePhoto) {
                const profilePicUrl = data.profilePhoto;
                setChats(prev => prev.map(c => c.jid === selectedChat.jid ? { ...c, profilePicUrl } : c));
                setSelectedChat(prev => prev ? { ...prev, profilePicUrl } : null);
                await db.chats.update(selectedChat.jid, { profilePicUrl });
            }
        }
    };

    return (
        <Box display="flex" height="94.9%" width="100%" bgcolor={theme.palette.background.default} overflow="hidden" sx={{ flexDirection: { xs: "column", sm: "row" } }}>
            <DeleteChatModal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDeleteChat} chatName={selectedChat?.name || ''} />
            <ContactDetailsModal open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} details={contactDetails} />

            <ImagePreviewModal
                open={!!pastedImage}
                imageFile={pastedImage}
                onClose={() => setPastedImage(null)}
                onSend={async (file, caption) => {
                    await handleSendMedia(file, caption);
                    setPastedImage(null);
                }}
            />

           <Paper elevation={1} sx={{ width: { xs: "100%", sm: "400px" }, p: 2, borderRight: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', display: "flex", flexDirection: "column", height: "100%", boxSizing: 'border-box' }}>
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                    {userInstances.length > 0 ? (
                        <Select
                            variant="standard"
                            disableUnderline
                            value={instanceId || (userInstances.length > 0 ? userInstances[0].instance_id : '')}
                            onChange={(e) => {
                                const val = e.target.value as string;
                                setInstanceId(val);
                                setSelectedChat(null);
                                fetchChats(val);
                            }}
                            sx={{ 
                                fontSize: '1.5rem', 
                                fontWeight: 'bold', 
                                color: 'text.primary',
                                '.MuiSelect-select': { py: 0, paddingRight: '24px !important' }
                            }}
                        >
                            {userInstances.map((ins, idx) => (
                                <MenuItem key={idx} value={ins.instance_id}>
                                    {ins.title}
                                </MenuItem>
                            ))}
                        </Select>
                    ) : (
                        <Typography variant="h5" fontWeight="bold">Chats</Typography>
                    )}
                    
                    <Chip 
                        label={
                            connectionStatus === 'open' ? 'Conectado' :
                            connectionStatus === 'connecting' ? 'Conectando...' : 'Desconectado'
                        } 
                        color={
                            connectionStatus === 'open' ? 'success' :
                            connectionStatus === 'connecting' ? 'warning' : 'error'
                        } 
                        size="small" 
                    />
                </Box>

                <TextField variant="outlined" size="small" placeholder="Buscar o iniciar un chat nuevo" fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), }} sx={{mb: 2, mt: 1}} />
                
                <Box flex={1} sx={{ overflowY: 'auto' }}>
                    {isLoadingChats ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box> :
                        error ? <Typography color="error" padding={2}>{error}</Typography> :
                        <List sx={{ paddingRight: 1 }}>
                            {chats.map(chat => <ChatListItem key={chat.id} chat={chat} isSelected={selectedChat?.id === chat.id} onClick={() => handleSelectChat(chat)} />)}
                        </List>
                    }
                </Box>
            </Paper>
            <Box flex={1} display="flex" flexDirection="column" height="100%">
                {selectedChat ?
                    <ConversationView
                        chat={selectedChat} messages={messages} isLoading={isLoadingMessages} typingInfo={typingInfo}
                        onSendMessage={handleSendMessage} onSendMedia={(file) => handleSendMedia(file)}
                        onDeleteChat={handleDeleteChat} onUpdateStatus={handleUpdateChatStatus}
                        onGetSenderDetails={handleGetSenderDetails}
                    /> :
                    <Box flex={1} display="flex" justifyContent="center" alignItems="center" flexDirection="column" sx={{textAlign: 'center', p: 2}}>
                        <img src={welcomeCats} alt="Welcome" style={{ width: "250px", marginBottom: "16px" }} />
                        <Typography variant="h4" sx={{ fontWeight: "bold" }}>Tu Bandeja de Entrada</Typography>
                        <Typography color="textSecondary">Selecciona un chat para comenzar a conversar en tiempo real.</Typography>
                    </Box>
                }
            </Box>
        </Box>
    );
};

export default BandejadeEntrada;