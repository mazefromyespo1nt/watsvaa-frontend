import React, { useMemo, useRef, useState, useLayoutEffect, useEffect } from "react";
import {
  Box,
  Paper,
  Button,
  Typography,
  Divider,
  useTheme,
  TextField,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Zoom,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Stack,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
} from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";
import MenuIcon from "@mui/icons-material/Menu";
import DescriptionIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockIcon from "@mui/icons-material/Lock";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import VideocamIcon from "@mui/icons-material/Videocam";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PollIcon from "@mui/icons-material/Poll";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

import Draggable from "react-draggable";
import flo from "../images/flo.svg";
import config from "../config.json";
import { useConfirm } from "../components/ConfirmProvider";
import { useNotify } from "../components/NotificationProvider";

const fechaHora = new Date().toLocaleString("es-MX", { hour12: false });

const getApiHeaders = () => {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok || !(data.estatus || data.success)) {
    throw new Error(data.message || data.msg || "Error en la solicitud a la API");
  }
  return data;
};

const mapBlockTypeToServer = (t: string | undefined) => {
  if (!t) return "text";
  const s = String(t).toLowerCase();
  if (s.includes("texto") || s.includes("text")) return "text";
  if (s.includes("imagen") || s.includes("image")) return "image";
  if (s.includes("documento") || s.includes("document")) return "doc";
  if (s.includes("audio")) return "aud";
  if (s.includes("video")) return "video";
  if (s.includes("ubic") || s.includes("location")) return "location";
  if (s.includes("encuesta") || s.includes("poll")) return "poll";
  return "text";
};

const apiService = {
  getMyFlows: async () => {

  const extraHeaders = {
    fecha: fechaHora,
    accion: "Obtener flujos",
    auth: localStorage.getItem("token") || "",
  };

    const response = await fetch(`${config.API_URL}flow/get_mine`, {
      method: "GET",
      headers: {
    ...getApiHeaders(),
    ...extraHeaders
   }
    });
    return handleResponse(response);
  },

addFlow: async (payload: { title: string; nodes: any; edges: any; flowId: string }) => { 
  const requestBody = {                            
    fecha: fechaHora,                    
    auth: localStorage.getItem("token"),          
    accion: "crear nuevo flujo",                   
    data: { 
        payload 
    }                                 
  };

  const response = await fetch(`${config.API_URL}flow/add_flow`, {     
    method: "POST",                                                    
    headers: getApiHeaders(),                                          
    body: JSON.stringify(requestBody),                                
  });                                                              

  return handleResponse(response);         
},

getFlowById: async (flowId: string) => {

  const requestBody = {
    fecha: fechaHora,
    auth: localStorage.getItem("token") || "",
    accion: "Obtener flujo por ID",
    data: { flowId }
  };

  const response = await fetch(`${config.API_URL}flow/get_by_flow_id`, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify(requestBody),
  });

  return handleResponse(response);
},

  delFlow: async (flow_id: string) => {

        const requestBody = {
        fecha:fechaHora,
        auth: localStorage.getItem("token") || "",
        accion: "Eliminar flujo",
        data: { flow_id }   
  };

    const response = await fetch(`${config.API_URL}flow/del_flow`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(requestBody),
    });
    return handleResponse(response);
  },
};

const templateService = {
  addTemplate: async (payload: { title: string; type: string; content: any }) => {
    const addflowbody = {
        fecha: fechaHora,
        auth: localStorage.getItem("token") || "",
        accion: "Agregar plantilla",
        data: {
              title: payload.title,
              type: mapBlockTypeToServer(payload.type),
              content: typeof payload.content === "string" ? tryParseJSON(payload.content) ?? payload.content : payload.content,
        }
    };
    const response = await fetch(`${config.API_URL}templet/add_new`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(addflowbody),
    });
    return handleResponse(response);
  },

  getMyTemplates: async () => {

    const requestmytemplates = {
        fecha: fechaHora,
        auth: localStorage.getItem("token") || "",
        accion: "Obtener mis plantillas"
  };

    const response = await fetch(`${config.API_URL}templet/my_templet`, {
      method: "GET",
      headers: {
        ...getApiHeaders(), 
        ...requestmytemplates    
  }
    });
    return handleResponse(response);
  },

  delTemplate: async (id: number) => {

    const requestBody = {
    fecha: fechaHora,
    auth: localStorage.getItem("token") || "",
    accion: "Eliminar plantilla",
    data: { id }
  };


    const response = await fetch(`${config.API_URL}templet/del_templet`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(requestBody),
    });
    return handleResponse(response);
  },
};

const fileService = {
    uploadFile: async (file: File) => {
  const formData = new FormData();

  formData.append("file", file);

  formData.append(
    "data",
    JSON.stringify({
      payload: {
        description: "Archivo subido desde el front",
      },
    })
  );

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${config.API_URL}user/return_url`, {
    method: "POST",
    headers,
    body: formData,
  });

  return handleResponse(response);
},
};

const tryParseJSON = (s: string) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

const formatSurveyText = (question: string, options: string[]) => [
  question.trim(),
  ...options.map((option, index) => `${index + 1}. ${option}`),
].filter(Boolean).join("\n");

type BlockType = "Texto" | "Imagen" | "Documento" | "Audio" | "Video" | "Ubicación" | "Encuesta";

type Block = {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  data?: any;
};

type Connection = {
  from: string;
  fromPort: string;
  to: string;
};

const BLOCK_BASE_X = 220;
const BLOCK_BASE_Y = 100;
const BLOCK_SPACING_Y = 160;
const BLOCK_WIDTH = 260;
const UNTITLED_FLOW_ID_PREFIX = "local_";

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1200;
const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 150;


const FlowBuilder: React.FC = () => {
  const theme = useTheme();
  const confirm = useConfirm();
  const notify = useNotify();

  const [title, setTitle] = useState("Untitled");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(`${UNTITLED_FLOW_ID_PREFIX}${Date.now()}`);

  const [mainView, setMainView] = useState<"canvas" | "templates">("canvas");

  const [flows, setFlows] = useState<{ id: number; name: string; flow_id?: string }[]>([]);

  const [zoom, setZoom] = useState(100);
  const [interactive, setInteractive] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const [flowsDrawer, setFlowsDrawer] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogOption, setDialogOption] = useState<BlockType | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const [templates, setTemplates] = useState<any[]>([]);

  const [textContent, setTextContent] = useState("");
  const [forAll, setForAll] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [claveInput, setClaveInput] = useState("");
  const [legend, setLegend] = useState<string>("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [surveyQuestion, setSurveyQuestion] = useState("");
  const [surveyOptions, setSurveyOptions] = useState<string[]>(["", ""]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileOriginalName, setUploadedFileOriginalName] = useState<string | null>(null);
const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const nextId = useRef(1);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const inputPortRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const optionPortRefs = useRef<Record<string, Record<string, HTMLDivElement | null>>>({});
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportRect, setViewportRect] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const [pendingConnection, setPendingConnection] = useState<{ from: string; fromPort: string } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  type Rect = { left: number; top: number; width: number; height: number };
  const [nodeRects, setNodeRects] = useState<Record<string, Rect>>({});
  const [inputPortRects, setInputPortRects] = useState<Record<string, Rect>>({});
  const [optionPortRects, setOptionPortRects] = useState<Record<string, Record<string, Rect>>>({});

  useEffect(() => {
    if (dialogOption === "Texto") {
      if (forAll) {
        setKeywords([]);
      } 
    }
  }, [forAll, dialogOption]);
// CORRECCIÓN: Recalculamos las coordenadas de los puertos cada vez que los bloques cambian
  useEffect(() => {
    const timer = setTimeout(() => {
      computeRects();
    }, 50);
    return () => clearTimeout(timer);
  }, [blocks]);
  
  const isFormValid = useMemo(() => {
    if (!dialogOption) return false;

    switch (dialogOption) {
      case "Texto":
        if (!textContent.trim()) return false;
        return true;

      case "Imagen":
      case "Video":
      case "Documento":
        return !!uploadedFileUrl;

      case "Audio":
        return !!uploadedFileUrl && keywords.length > 0;

      case "Ubicación":
        return !!(lat.trim() && lng.trim());

      case "Encuesta":
        const validOptions = surveyOptions.filter((opt) => opt.trim() !== "").length;
        return !!(surveyQuestion.trim() && validOptions >= 2);

      default:
        return false;
    }
  }, [dialogOption, textContent, keywords, forAll, uploadedFileUrl, legend, lat, lng, surveyQuestion, surveyOptions]);

  const optionDefs: { label: BlockType; icon: React.ReactNode }[] = useMemo(
    () => [
      { label: "Texto", icon: <TextFieldsIcon /> },
      { label: "Imagen", icon: <ImageIcon /> },
      { label: "Documento", icon: <DescriptionOutlinedIcon /> },
      { label: "Audio", icon: <AudiotrackIcon /> },
      { label: "Video", icon: <VideocamIcon /> },
      { label: "Ubicación", icon: <LocationOnIcon /> },
      { label: "Encuesta", icon: <PollIcon /> },
    ],
    []
  );

  const blockColors: Record<BlockType, string> = {
    Texto: "#4C8BF5",
    Imagen: "#E57373",
    Documento: "#8E24AA",
    Audio: "#FFB300",
    Video: "#26A69A",
    Ubicación: "#43A047",
    Encuesta: "#7E57C2",
  };

  const getIconForType = (t: BlockType) => {
    const icons: Record<string, React.ReactNode> = {
      Texto: <TextFieldsIcon fontSize="small" />,
      Imagen: <ImageIcon fontSize="small" />,
      Documento: <DescriptionOutlinedIcon fontSize="small" />,
      Audio: <AudiotrackIcon fontSize="small" />,
      Video: <VideocamIcon fontSize="small" />,
      Ubicación: <LocationOnIcon fontSize="small" />,
      Encuesta: <PollIcon fontSize="small" />,
    };
    return icons[t] || <DescriptionIcon fontSize="small" />;
  };

  const normalizeType = (nodeType: string | undefined): BlockType => {
    if (!nodeType) return "Texto";
    const s = String(nodeType).toLowerCase();
    if (s.includes("text")) return "Texto";
    if (s.includes("image")) return "Imagen";
    if (s.includes("document")) return "Documento";
    if (s.includes("audio")) return "Audio";
    if (s.includes("video")) return "Video";
    if (s.includes("location")) return "Ubicación";
    if (s.includes("poll")) return "Encuesta";
    return "Texto";
  };

  const getKeywordPortId = (keyword: string) => String(keyword ?? "").trim();

  const parseLegacyPortIndex = (portId: string) => {
    const match = /^opt-(\d+)$/i.exec(portId || "");
    return match ? Number(match[1]) : -1;
  };

  const computeRects = () => {
    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!stageRect) return;

    const factor = zoom / 100;

    const nmap: Record<string, Rect> = {};
    const inMap: Record<string, Rect> = {};
    const optMap: Record<string, Record<string, Rect>> = {};

    for (const b of blocks) {
      const el = document.getElementById(`node-${b.id}`);
      if (el) {
        const r = el.getBoundingClientRect();
        nmap[b.id] = {
          left: (r.left - stageRect.left) / factor,
          top: (r.top - stageRect.top) / factor,
          width: r.width / factor,
          height: r.height / factor,
        };
      }

      const inEl = inputPortRefs.current[b.id];
      if (inEl) {
        const r = inEl.getBoundingClientRect();
        inMap[b.id] = {
          left: (r.left - stageRect.left) / factor,
          top: (r.top - stageRect.top) / factor,
          width: r.width / factor,
          height: r.height / factor,
        };
      }

      const optRefs = optionPortRefs.current[b.id] || {};
      for (const k of Object.keys(optRefs)) {
        const oEl = optRefs[k];
        if (oEl) {
          if (!optMap[b.id]) optMap[b.id] = {};
          const r = oEl.getBoundingClientRect();
          optMap[b.id][k] = {
            left: (r.left - stageRect.left) / factor,
            top: (r.top - stageRect.top) / factor,
            width: r.width / factor,
            height: r.height / factor,
          };
        }
      }
    }
    setNodeRects(nmap);
    setInputPortRects(inMap);
    setOptionPortRects(optMap);
  };



  useEffect(() => {
    const handleResize = () => computeRects();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const vp = viewportRef.current;

    const updateViewport = () => {
      if (!vp) return;
      const { scrollTop, scrollLeft, clientWidth, clientHeight } = vp;
      const factor = zoom / 100;
      setViewportRect({
        top: scrollTop / factor,
        left: scrollLeft / factor,
        width: clientWidth / factor,
        height: clientHeight / factor,
      });
    };

    updateViewport();

    window.addEventListener("resize", updateViewport);
    vp?.addEventListener("scroll", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
      vp?.removeEventListener("scroll", updateViewport);
    };
  }, [zoom]);

const loadFlows = async () => {
  try {
    const response = await apiService.getMyFlows();

    const data = response.data;

    const mapped = Array.isArray(data)
      ? data.map((f: any) => ({
          id: f.id,
          name: f.title,
          flow_id: f.flow_id,
        }))
      : [];

    setFlows(mapped);

  } catch (err: any) {
    console.error("Error cargando flujos:", err);
    notify.error(err.message || "No se pudo cargar la lista de flujos");
  }
};

const loadTemplates = async () => {
  try {
    const response = await templateService.getMyTemplates();
    const templatesArray = response?.data ?? [];
    const mapped = Array.isArray(templatesArray) ? templatesArray : [];

    setTemplates(mapped);

  } catch (err: any) {
    console.error("Error cargando plantillas:", err);
    notify.error(err.message || "No se pudieron cargar las plantillas");
  }
};

const handleLoadFlow = async (flowId: string, flowTitle: string) => {
    try {
        const response = await apiService.getFlowById(flowId);
        const data = response.data;

        const nodes = Array.isArray(data.nodes) ? data.nodes : [];
        const edges = Array.isArray(data.edges) ? data.edges : [];

        const mappedBlocks: Block[] = nodes.map((n: any) => {
          const state = n.data?.state || {};
          const isSurvey = normalizeType(n.nodeType) === "Encuesta" || (state.question && Array.isArray(state.options));
          const options = Array.isArray(state.options) ? state.options : [];
          return {
            id: String(n.id),
            type: isSurvey ? "Encuesta" : normalizeType(n.nodeType),
            x: n.position?.x ?? BLOCK_BASE_X,
            y: n.position?.y ?? BLOCK_BASE_Y,
            data: {
              ...state,
              keywords: isSurvey ? options.map((_: string, index: number) => String(index + 1)) : (n.keyword || state.options || []),
              text: isSurvey ? formatSurveyText(state.question || "", options) : state.text,
            },
          };
        });

        const mappedConns: Connection[] = edges
            .map((e: any) => {
                if (!e.source || !e.target) return null;
                const sourceNode = mappedBlocks.find(b => String(b.id) === String(e.source));
                if (!sourceNode) return null;
                const options = sourceNode.data?.keywords || [];
            const sourceHandle = typeof e.sourceHandle === "string" ? e.sourceHandle : "";
            const portIndex = sourceHandle ? options.findIndex((opt: string) => opt === sourceHandle) : -1;
            const resolvedFromPort = portIndex !== -1 ? getKeywordPortId(options[portIndex]) : (sourceHandle || `opt-${parseLegacyPortIndex(sourceHandle)}`);
            if (!resolvedFromPort) return null;
                return { 
                    from: String(e.source), 
                    to: String(e.target), 
              fromPort: resolvedFromPort
                };
            })
            .filter(Boolean) as Connection[];

        setTitle(flowTitle);
        setCurrentFlowId(flowId);
        setConnections(mappedConns);
        
        setBlocks(mappedBlocks);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => computeRects());
        });

        setFlowsDrawer(false);
        setMainView("canvas");
    } catch (err: any) {
        console.error("Error cargando flujo:", err);
        notify.error(err.message || "No se pudo cargar el flujo");
    }
};

const handleLocationClick = (lat?: string, lng?: string) => {
    if (lat && lng) {
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        window.open(url, "_blank");
    }
};
  const randomString = (length: number) => {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

const handleSaveFlowToServer = async () => {
    try {
        if (!title.trim()) return notify.warning("Por favor, dale un título al flujo.");

        const mappedNodes = blocks.map((b) => {
            const stateData = { ...b.data };
            const nodeServerType = b.type === "Encuesta" ? "text" : mapBlockTypeToServer(b.type);

          if (b.type === "Encuesta") {
            const surveyOptions = Array.isArray(stateData.options) ? stateData.options : [];
            stateData.options = surveyOptions;
            stateData.keywords = surveyOptions.map((_: string, index: number) => String(index + 1));
            stateData.text = formatSurveyText(stateData.question || "", surveyOptions);
          }

            let msgContent: any = {};
            
            switch (nodeServerType) {
                case 'text':
                    msgContent = { text: stateData.text || '' };
                    break;
                case 'image':
                    msgContent = {
                        image: {
                            url: stateData.filename || '', 
                            caption: stateData.legend || ''
                        }
                    };
                    break;
               case 'doc':
    msgContent = {
        document: {
            url: stateData.filename || '',
        },
        caption: stateData.legend || '',
        fileName: stateData.originalName || '' 
    };
    break;
                case 'video':
                     msgContent = {
                        video: {
                            url: stateData.filename || '',
                            caption: stateData.legend || ''
                        }
                    };
                    break;
                case 'aud':
                    msgContent = {
                        audio: {
                            url: stateData.filename || ''
                        },
                          fileName: stateData.originalName || ''
                    };
                    break;
                case 'location':
                    msgContent = {
                        location: {
                            degreesLatitude: stateData.lat || '',
                            degreesLongitude: stateData.lng || ''
                        }
                    };
                    break;
                default:
                    msgContent = {};
                    break;
            }

            return {
                id: b.id,
                type: "CustomNode",
                nodeType: nodeServerType,
                position: { x: b.x, y: b.y },
                data: {
                    data: "data",
                    source: false,
                    state: stateData, 
                },
                width: BLOCK_WIDTH,
                height: 214,
                dragging: false,
                selected: false,
                positionAbsolute: { x: b.x, y: b.y },
                keyword: stateData.keywords || [],
                msgContent: msgContent,
            };
        });
        
        const mappedEdges = connections.map((c) => {
            const sourceBlock = blocks.find(b => b.id === c.from);
            if (!sourceBlock) return null;
            const options = (sourceBlock.data?.keywords || sourceBlock.data?.options || []);
            const sourceHandleValue =
              typeof c.fromPort === "string" && options.includes(c.fromPort)
                ? c.fromPort
                : (options[parseLegacyPortIndex(c.fromPort)] ?? c.fromPort);
            const normalizedSourceHandle = sourceBlock.type === "Encuesta"
              ? (sourceHandleValue && /^\d+$/.test(String(sourceHandleValue))
                ? String(sourceHandleValue)
                : String(Math.max(0, options.indexOf(sourceHandleValue) + 1)))
              : sourceHandleValue;
            return {
                source: c.from,
                target: c.to,
                sourceHandle: normalizedSourceHandle,
                id: `reactflow_edge-${c.from}${normalizedSourceHandle}-${c.to}undefined_target`,
            };
        }).filter(Boolean);

        const flowId = currentFlowId && !currentFlowId.startsWith(UNTITLED_FLOW_ID_PREFIX) ? currentFlowId : `${randomString(32)}`;

        const payload = {
            title: title,
            nodes: mappedNodes,
            edges: mappedEdges,
            flowId,
        };
        
        await apiService.addFlow(payload);

        notify.success("Flujo guardado en servidor correctamente");
        setCurrentFlowId(flowId);
        await loadFlows();

    } catch (err: any) {
        console.error("Error guardando flujo:", err);
        notify.error(err.message || "No se pudo guardar el flujo");
    }
};
  const handleDeleteFlow = async (flowId: string | undefined) => {
    if (!flowId) return;
    const confirmed = await confirm({
      title: "Eliminar flujo",
      message: "Se eliminará este flujo. Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      severity: "danger",
    });
    if (!confirmed) return;
    try {
      await apiService.delFlow(flowId);
      notify.success("Flujo eliminado correctamente");
      await loadFlows();
      if (currentFlowId === flowId) handleNewFlow();
    } catch (err: any) {
      console.error("Error al eliminar flujo:", err);
      notify.error(err.message || "No se pudo eliminar el flujo");
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    const confirmed = await confirm({
      title: "Eliminar plantilla",
      message: "Se eliminará esta plantilla. Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      severity: "danger",
    });
    if (!confirmed) return;
    try {
      await templateService.delTemplate(id);
      notify.success("Plantilla eliminada.");
      await loadTemplates();
    } catch (err: any) {
      console.error("Error eliminando plantilla:", err);
      notify.error(err.message || "No se pudo eliminar la plantilla");
    }
  };

  const handleNewFlow = () => {
    setTitle("Untitled");
    setBlocks([]);
    setConnections([]);
    setCurrentFlowId(`${UNTITLED_FLOW_ID_PREFIX}${Date.now()}`);
    setDialogOpen(false);
    setPendingConnection(null);
    setMainView("canvas");
  };

  const openDialogFor = (opt: BlockType) => {
    setEditingBlockId(null);
    setDialogOption(opt);
    setDialogOpen(true);
    // Reset all form fields
    setTextContent("");
    setForAll(false);
    setKeywords([]);
    setClaveInput("");
    setLat("");
    setLng("");
    setSurveyQuestion("");
    setSurveyOptions(["", ""]);
    setLegend("");
    setUploadedFileUrl(null);
    setUploadedFileOriginalName(null);
setUploadedFileName(null);
  };

  const openEditDialog = (block: Block) => {
    setEditingBlockId(block.id);
    setDialogOption(block.type);
    setDialogOpen(true);
    setTextContent(block.data?.text ?? "");
    setForAll(block.data?.forAll ?? false);
    setKeywords(block.data?.keywords ?? []);
    setLegend(block.data?.legend ?? "");
    setLat(block.data?.lat ?? "");
    setLng(block.data?.lng ?? "");
    setSurveyQuestion(block.data?.question ?? "");
    setSurveyOptions(Array.isArray(block.data?.options) && block.data.options.length > 0 ? [...block.data.options] : ["", ""]);
    setUploadedFileUrl(block.data?.url ?? null);
    setUploadedFileOriginalName(block.data?.originalName ?? null);
setUploadedFileName(block.data?.filename ?? null);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogOption(null);
    setEditingBlockId(null);
  };

  const addKeyword = () => {
    const k = claveInput.trim();
    if (k && !keywords.includes(k)) setKeywords((p) => [...p, k]);
    setClaveInput("");
  };

  const removeKeyword = (kw: string, blockId?: string) => {
    setKeywords((p) => p.filter((x) => x !== kw));
    if (blockId) {
      setConnections((prev) => prev.filter((c) => !(c.from === blockId && c.fromPort === kw)));
    }
  };

  const deleteBlock = (id: string) => {
    setConnections((conns) => conns.filter((c) => c.from !== id && c.to !== id));
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileUrl(null);
    setUploadedFileOriginalName(null);

    try {
    const data = await fileService.uploadFile(file);

    if (data.estatus || data.success) {
        
        setUploadedFileUrl(data.url);
        setUploadedFileOriginalName(data.originalName);
        setUploadedFileName(data.filename);

    } else {
        throw new Error(data.mensaje || data.message || "Error al subir el archivo.");
    }

    } catch (err: any) {
    console.error("Error en la subida:", err);
    notify.error(err.message || "No se pudo subir el archivo.");

    } finally {
    setIsUploading(false);
    event.target.value = "";
    }

  };

  const handleSurveyOptionChange = (index: number, value: string) => {
    const newOptions = [...surveyOptions];
    newOptions[index] = value;
    setSurveyOptions(newOptions);
  };

  const addSurveyOption = () => {
    setSurveyOptions([...surveyOptions, ""]);
  };

  const removeSurveyOption = (index: number) => {
    if (surveyOptions.length > 1) {
      setSurveyOptions(surveyOptions.filter((_, i) => i !== index));
    }
  };

  const addBlockFromDialog = () => {
    if (!dialogOption) return;
    const id = editingBlockId ?? `${Date.now()}_${nextId.current++}`;

    let finalKeywords = [...keywords];
    if (dialogOption === "Texto" && forAll) {
      finalKeywords = ["{{OTHER_MSG}}"];
    } else if (dialogOption === "Texto" && !forAll) {
      finalKeywords = finalKeywords.filter((k) => k !== "{{OTHER_MSG}}");
    }

    const data: any = { keywords: finalKeywords };

    switch (dialogOption) {
      case "Texto":
        data.text = textContent;
        data.forAll = forAll;
        break;
      case "Imagen":
      case "Video":
      case "Documento":
        data.url = uploadedFileUrl;
        data.originalName = uploadedFileOriginalName;
data.filename = uploadedFileName; 
        data.legend = legend;
        break;
      case "Audio":
        data.url = uploadedFileUrl;
        data.originalName = uploadedFileOriginalName;
data.filename = uploadedFileName;
        break;
      case "Ubicación":
        data.lat = lat;
        data.lng = lng;
        break;
      case "Encuesta":
        data.question = surveyQuestion;
        const nonEmptyOptions = surveyOptions.filter((opt) => opt.trim() !== "");
        data.options = nonEmptyOptions;
        data.keywords = nonEmptyOptions.map((_, index) => String(index + 1));
        data.text = formatSurveyText(surveyQuestion, nonEmptyOptions);
        break;
    }

    if (editingBlockId) {
    setBlocks((prev) =>
        prev.map((b) =>
            b.id === editingBlockId
                ? { ...b, type: dialogOption, data: { ...b.data, ...data } }
                : b
        )
    );
} else {
      setBlocks((prev) => [...prev, { id, type: dialogOption, x: BLOCK_BASE_X, y: BLOCK_BASE_Y + prev.length * BLOCK_SPACING_Y, data }]);
    }

    closeDialog();
    setTimeout(() => computeRects(), 40);
  };

  const startConnectionFromOption = (blockId: string, portId: string) => {
    setPendingConnection({ from: blockId, fromPort: portId });
  };

  const completeConnection = (targetId: string) => {
    if (pendingConnection && pendingConnection.from !== targetId) {
      const exists = connections.some((c) => c.from === pendingConnection.from && c.fromPort === pendingConnection.fromPort && c.to === targetId);
      if (!exists) setConnections((prev) => [...prev, { from: pendingConnection.from, fromPort: pendingConnection.fromPort, to: targetId }]);
    }
    setPendingConnection(null);
  };

  const registerOptionRef = (blockId: string, portId: string) => (el: HTMLDivElement | null) => {
    if (!optionPortRefs.current[blockId]) optionPortRefs.current[blockId] = {};
    optionPortRefs.current[blockId][portId] = el;
  };

  const registerInputRef = (blockId: string) => (el: HTMLDivElement | null) => {
    inputPortRefs.current[blockId] = el;
  };

  const renderConnections = () => {
    const isConnectionLocked = !!pendingConnection;

    return connections.map((c, i) => {
      const fromR = optionPortRects[c.from]?.[c.fromPort];
      const toR = inputPortRects[c.to];
      if (!fromR || !toR) return null;

      const x1 = fromR.left + fromR.width / 2;
      const y1 = fromR.top + fromR.height / 2;
      const x2 = toR.left + toR.width / 2;
      const y2 = toR.top + toR.height / 2;
      const dx = Math.max(30, Math.abs(x2 - x1) / 2);
      const path = `M ${x1} ${y1} C ${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;

      return (
        <path
          key={i}
          d={path}
          stroke="#6b7280"
          strokeWidth={2}
          fill="none"
          markerEnd="url(#arrow)"
          pointerEvents={isConnectionLocked ? "none" : "visibleStroke"}
          style={{
            cursor: isConnectionLocked ? "default" : "pointer",
            transition: "stroke 0.15s ease, strokeWidth 0.15s ease",
          }}
          onMouseEnter={(event) => {
            if (isConnectionLocked) return;
            event.currentTarget.setAttribute("stroke", "#f97316");
            event.currentTarget.setAttribute("stroke-width", "3.5");
          }}
          onMouseLeave={(event) => {
            if (isConnectionLocked) return;
            event.currentTarget.setAttribute("stroke", "#6b7280");
            event.currentTarget.setAttribute("stroke-width", "2");
          }}
          onClick={(event) => {
            if (isConnectionLocked) return;
            event.stopPropagation();
            setConnections((prev) => prev.filter((_, idx) => idx !== i));
          }}
        >
          <title>{isConnectionLocked ? "Se está creando otra conexión" : "Clic para eliminar conexión"}</title>
        </path>
      );
    });
  };

  const saveBlockAsTemplate = async (block: Block) => {
    try {
      const templateTitle = window.prompt("Introduce un título para la plantilla:", `${block.type} - Bloque`);
      if (!templateTitle || !templateTitle.trim()) return;

      const payload = { title: templateTitle, type: block.type, content: block.data || {} };
      await templateService.addTemplate(payload);
      await loadTemplates();

      notify.success("Plantilla guardada correctamente");
    } catch (err: any) {
      console.error(err);
      notify.error(err.message || "No se pudo guardar la plantilla");
    }
  };

  const insertTemplateIntoCanvas = (tpl: any) => {
    try {
      const rawContent = typeof tpl.content === "string" ? tryParseJSON(tpl.content) ?? tpl.content : tpl.content;

      const newBlock: Block = {
        id: `${Date.now()}_${nextId.current++}`,
        type: normalizeType(tpl.type),
        x: BLOCK_BASE_X,
        y: BLOCK_BASE_Y + blocks.length * 60,
        data: rawContent,
      };
      setBlocks((prev) => [...prev, newBlock]);
      setMainView("canvas");
      setTimeout(() => computeRects(), 40);
    } catch (err: any) {
      console.error(err);
      notify.error("No se pudo insertar la plantilla");
    }
  };

  useEffect(() => {
    loadFlows();
    loadTemplates();
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const stageRect = stageRef.current?.getBoundingClientRect();
      if (!stageRect) return;
      const factor = zoom / 100;
      setMousePos({ x: (e.clientX - stageRect.left) / factor, y: (e.clientY - stageRect.top) / factor });
    };
    if (pendingConnection) window.addEventListener("mousemove", onMove);
    else setMousePos(null);
    return () => window.removeEventListener("mousemove", onMove);
  }, [pendingConnection, zoom]);

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, minHeight: "calc(100vh - 100px)", gap: 2, p: { xs: 1, sm: 2 } }}>
      <Paper elevation={3} sx={{ width: { xs: "100%", lg: 280 }, p: 2, display: "flex", flexDirection: "column", gap: 2, alignItems: "center", flexShrink: 0 }}>
        <Box component="img" src={flo} alt="Ilustración" sx={{ width: "85%", maxWidth: 190, mt: 1 }} />
        <Typography variant="body1" sx={{ textAlign: "center", fontWeight: 500 }}>
          Construya su flujo fácilmente utilizando el constructor de flujos potente
        </Typography>
        <Button variant="contained" color="primary" fullWidth sx={{ borderRadius: 1.5, py: 1.4 }} onClick={handleNewFlow}>
          Agregar nuevo flujo
        </Button>
        <Button variant="outlined" color="primary" fullWidth sx={{ borderRadius: 1.5, py: 1.2 }} onClick={() => setMainView("templates")}>
          Guardado como plantilla
        </Button>
      </Paper>

      <Box sx={{ flex: 1, position: "relative", borderRadius: 2, bgcolor: theme.palette.background.paper, overflow: "hidden", minHeight: { xs: "70vh", lg: "auto" } }}>
        {mainView === "canvas" ? (
          <>
            <Box sx={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(100,100,100,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,100,0.12) 1px, transparent 1px)", backgroundSize: "20px 20px", zIndex: 0 }} />
            <Paper elevation={1} sx={{ position: "absolute", top: { xs: 8, sm: 12 }, left: { xs: 8, sm: 12 }, zIndex: 4, px: { xs: 1, sm: 2 }, py: 1, display: "flex", alignItems: "center", gap: 1, borderRadius: 2 }}>
              <TextField value={title} onChange={(e) => setTitle(e.target.value)} variant="standard" sx={{ minWidth: 160 }} inputProps={{ "aria-label": "Título del flujo" }} />
              <Tooltip title="Guardar flujo en servidor" arrow>
                <IconButton color="primary" onClick={handleSaveFlowToServer}>
                  <SaveIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Lista de flujos" arrow>
                <IconButton color="inherit" onClick={() => setFlowsDrawer(true)}>
                  <MenuIcon />
                </IconButton>
              </Tooltip>
            </Paper>

            <Box
              ref={viewportRef}
              sx={{ position: "absolute", inset: 0, zIndex: 1, overflow: "auto" }}
              onClick={() => {
                if (pendingConnection) {
                  setPendingConnection(null);
                }
              }}
            >
              <Box ref={stageRef} sx={{ position: "relative", width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px`, transform: `scale(${zoom / 100})`, transformOrigin: "0 0", pointerEvents: interactive ? "auto" : "none" }}>
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 4, pointerEvents: "none" }}>
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
                    </marker>
                  </defs>
                  {renderConnections()}
                  {pendingConnection &&
                    (() => {
                      const fromR = optionPortRects[pendingConnection.from]?.[pendingConnection.fromPort];
                      if (!fromR || !mousePos) return null;
                      const x1 = fromR.left + fromR.width / 2;
                      const y1 = fromR.top + fromR.height / 2;
                      const x2 = mousePos.x;
                      const y2 = mousePos.y;
                      const dx = Math.max(30, Math.abs(x2 - x1) / 2);
                      const d = `M ${x1} ${y1} C ${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
                      return <path d={d} stroke="#ff6f00" strokeWidth={2} fill="none" strokeDasharray="6 4" />;
                    })()}
                </svg>

                {blocks.map((b) => {
          const outputPorts = b.data?.options || b.data?.keywords || [];
                  return (
                    <Draggable
                      key={b.id}
                      position={{ x: b.x, y: b.y }}
                      onDrag={(_, data) => {
                        setBlocks((prev) => prev.map((blk) => (blk.id === b.id ? { ...blk, x: data.x, y: data.y } : blk)));
                      }}
                      onStop={() => {
                        setTimeout(() => computeRects(), 40);
                      }}
                    >
                      <Paper id={`node-${b.id}`} elevation={3} sx={{ position: "absolute", width: BLOCK_WIDTH, borderRadius: 2, userSelect: "none", zIndex: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.25, py: 0.6, bgcolor: blockColors[b.type], cursor: "move" }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ color: "white", display: "flex" }}>{getIconForType(b.type)}</Box>
                            <Typography sx={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}>{b.type}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Guardar como plantilla" arrow>
                              <IconButton size="small" onClick={() => saveBlockAsTemplate(b)} sx={{ color: "white" }}>
                                <SaveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar" arrow>
                              <IconButton size="small" onClick={() => openEditDialog(b)} sx={{ color: "white" }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar" arrow>
                              <IconButton size="small" onClick={() => deleteBlock(b.id)} sx={{ color: "white" }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>

<Box sx={{ px: 2, py: 1.25, bgcolor: "background.paper", position: "relative", minHeight: 40 }}>
      {b.type === "Texto" && (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '120px', overflowY: 'auto' }} title={b.data?.text}>
        {String(b.data?.text ?? "").slice(0, 150) || "Sin texto"}
        </Typography>
    )}

{b.type === "Imagen" && (b.data?.url || b.data?.filename) && (
        <Box sx={{ my: 1 }}>
            <Box
                component="img"
                src={`${config.API_URL.replace('api/', 'media/')}${b.data?.filename || (b.data?.url ? String(b.data.url).split('/').pop() : '')}`}
                alt="Vista previa"
                sx={{ width: '100%', maxHeight: 150, objectFit: 'contain', borderRadius: 1 }}
                onError={(e: any) => { e.target.src = 'https://placehold.co/150x150/f0f0f0/a0a0a0.png?text=Sin+Imagen' }}
            />
            {b.data?.legend && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'center', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.data.legend}
                </Typography>
            )}
        </Box>
    )}
    
    {b.type === "Video" && (b.data?.url || b.data?.filename) && (
        <Box sx={{ my: 1 }}>
            <Box sx={{ '& video': { width: '100%', borderRadius: 1, maxHeight: 150, backgroundColor: '#000' } }}>
                <video 
                    src={`${config.API_URL.replace('api/', 'media/')}${b.data?.filename || (b.data?.url ? String(b.data.url).split('/').pop() : '')}`} 
                    controls muted playsInline 
                />
            </Box>
            {b.data?.legend && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'center', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.data.legend}
                </Typography>
            )}
        </Box>
    )}

    {b.type === "Audio" && (b.data?.url || b.data?.filename) && (
        <Box sx={{ my: 1 }}>
            <audio 
                src={`${config.API_URL.replace('api/', 'media/')}${b.data?.filename || (b.data?.url ? String(b.data.url).split('/').pop() : '')}`} 
                controls style={{ width: '100%' }} 
            />
        </Box>
    )}
    
    {b.type === "Documento" && (
        <Paper variant="outlined" sx={{ p: 1, my: 1, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'grey.100' }}>
            <DescriptionOutlinedIcon color="action" />
            <Typography variant="body2" noWrap sx={{ flex: 1 }} title={b.data?.originalName}>
                {b.data?.originalName || "Archivo no seleccionado"}
            </Typography>
        </Paper>
    )}
    
    {b.type === "Ubicación" && (
        <Tooltip title="Abrir en Google Maps">
            <Paper 
                variant="outlined" 
                onClick={() => handleLocationClick(b.data?.lat, b.data?.lng)}
                sx={{ p: 1, my: 1, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', '&:hover': { bgcolor: 'grey.100' } }}
            >
                <LocationOnIcon color="action" />
                <Typography variant="body2" noWrap>
                    Lat: {b.data?.lat || "-"}, Lng: {b.data?.lng || "-"}
                </Typography>
            </Paper>
        </Tooltip>
    )}

    {b.type === "Encuesta" && (
        <Typography variant="body2" noWrap sx={{ my: 1 }} title={b.data?.question}>
            Pregunta: {b.data?.question || "Sin pregunta"}
        </Typography>
    )}

    <Stack spacing={0.5} sx={{ mt: 1 }}>
        {(b.type === "Encuesta" ? (b.data?.keywords || []) : outputPorts).map((k: string) => {
          const portId = getKeywordPortId(k);
          const optionIndex = Number(k) - 1;
          const portLabel = b.type === "Encuesta" && b.data?.options?.[optionIndex]
            ? `${k}. ${b.data.options[optionIndex]}`
            : k;
            return (
                <Box key={portId} sx={{ position: "relative" }}>
                    <Button variant="outlined" size="small" fullWidth sx={{ justifyContent: "flex-start", textTransform: "none" }}>
                        {portLabel}
                    </Button>
                    <Box ref={registerOptionRef(b.id, portId)} sx={{ position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)" }}>
                        <Tooltip title="Conectar desde esta opción" arrow>
                            <IconButton size="small" onClick={() => startConnectionFromOption(b.id, portId)} sx={{ color: "primary.main", bgcolor: "background.paper", boxShadow: 1, '&:hover': { bgcolor: "primary.light", color: "white" } }}>
                                <FiberManualRecordIcon sx={{ fontSize: "14px" }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            );
        })}
    </Stack>
</Box>

                        <Box ref={registerInputRef(b.id)} sx={{ position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)", zIndex: 5 }}>
                          <Tooltip title="Aceptar conexión" arrow>
                            <IconButton size="small" onClick={() => completeConnection(b.id)} sx={{ color: "primary.main", bgcolor: "background.paper", boxShadow: 1, '&:hover': { bgcolor: "primary.light", color: "white" } }}>
                                <RadioButtonUncheckedIcon sx={{ fontSize: "16px" }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Paper>
                    </Draggable>
                  );
                })}
              </Box>
            </Box>

            <Box sx={{ position: "absolute", bottom: 16, left: 16, display: "flex", flexDirection: "column", gap: 1, zIndex: 6 }}>
              <Tooltip title="Acercar" arrow>
                <IconButton color="primary" onClick={() => setZoom((z) => Math.min(150, z + 10))} sx={{ bgcolor: "background.paper" }}>
                  <AddCircleOutlineIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Alejar" arrow>
                <IconButton color="primary" onClick={() => setZoom((z) => Math.max(30, z - 10))} sx={{ bgcolor: "background.paper" }}>
                  <RemoveCircleOutlineIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Restablecer vista" arrow>
                <IconButton color="primary" onClick={() => setZoom(100)} sx={{ bgcolor: "background.paper" }}>
                  <FitScreenIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Bloquear movimiento" arrow>
                <IconButton color="primary" onClick={() => setInteractive((p) => !p)} sx={{ bgcolor: "background.paper" }}>
                  {interactive ? <LockOpenIcon /> : <LockIcon />}
                </IconButton>
              </Tooltip>
            </Box>

            <Box onMouseEnter={() => setMenuOpen(true)} onMouseLeave={() => setMenuOpen(false)} sx={{ position: "absolute", top: "50%", right: { xs: 8, sm: 16 }, transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, zIndex: 7 }}>
              {menuOpen &&
                optionDefs.map((opt, idx) => (
                  <Zoom in={menuOpen} key={opt.label} style={{ transitionDelay: `${idx * 50}ms` }}>
                    <Button variant="contained" color="primary" onClick={() => openDialogFor(opt.label)} startIcon={opt.icon} sx={{ borderRadius: "20px", justifyContent: "flex-start", minWidth: "170px" }}>
                      {opt.label}
                    </Button>
                  </Zoom>
                ))}
              <Fab color="secondary" sx={{ boxShadow: 4 }} onClick={() => setMenuOpen((p) => !p)} aria-label="abrir opciones">
                {menuOpen ? <CloseIcon /> : <AddIcon />}
              </Fab>
            </Box>

            <Paper
              elevation={4}
              sx={{
                position: "absolute",
                bottom: 16,
                right: 16,
                width: MINIMAP_WIDTH,
                height: MINIMAP_HEIGHT,
                zIndex: 6,
                overflow: "hidden",
                bgcolor: "rgba(240, 240, 240, 0.95)",
                border: `1px solid ${theme.palette.divider}`,
                userSelect: "none",
              }}
            >

              {blocks.map((b) => (
                <Box
                  key={`map-${b.id}`}
                  sx={{
                    position: "absolute",
                    left: `${(b.x / CANVAS_WIDTH) * 100}%`,
                    top: `${(b.y / CANVAS_HEIGHT) * 100}%`,
                    width: `${(BLOCK_WIDTH / CANVAS_WIDTH) * 100}%`,
                    height: "15px",
                    bgcolor: blockColors[b.type] || "grey.500",
                    borderRadius: "1px",
                  }}
                />
              ))}
              <Box
                sx={{
                  position: "absolute",
                  left: `${(viewportRect.left / CANVAS_WIDTH) * 100}%`,
                  top: `${(viewportRect.top / CANVAS_HEIGHT) * 100}%`,
                  width: `${(viewportRect.width / CANVAS_WIDTH) * 100}%`,
                  height: `${(viewportRect.height / CANVAS_HEIGHT) * 100}%`,
                  border: `1px solid ${theme.palette.primary.main}`,
                  bgcolor: "rgba(25, 118, 210, 0.15)",
                  boxSizing: "border-box",
                  transition: "all 50ms ease-out",
                }}
              />
            </Paper>
          </>
        ) : (
          <Paper sx={{ p: 2, height: "100%", overflowY: "auto" }}>
            <Typography variant="h6" gutterBottom>
              Lista de plantillas guardadas
            </Typography>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Título</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map((tpl) => (
                    <TableRow key={tpl.id} hover>
                      <TableCell>{tpl.id}</TableCell>
                      <TableCell>{tpl.title}</TableCell>
                      <TableCell>
                        <Chip label={tpl.type} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="outlined" onClick={() => insertTemplateIntoCanvas(tpl)}>
                            Cargar
                          </Button>
                          <IconButton color="error" size="small" onClick={() => handleDeleteTemplate(tpl.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {templates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No hay plantillas guardadas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>

      <Drawer anchor="right" open={flowsDrawer} onClose={() => setFlowsDrawer(false)} sx={{ "& .MuiDrawer-paper": { width: { xs: "85vw", sm: 340 }, p: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <ListAltIcon />
          <Typography variant="h6">Mis Flujos</Typography>
        </Box>
        <Divider sx={{ mb: 1 }} />
        <List>
          {flows.map((flow) => (
            <ListItem
              key={flow.id}
              sx={{ display: "flex", alignItems: "center", gap: 1, px: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 36, flexShrink: 0 }}>
                <DescriptionIcon />
              </ListItemIcon>

              {/* El texto ocupa el espacio disponible y salta de línea si el nombre es largo */}
              <ListItemText
                primary={flow.name}
                title={flow.name}
                sx={{ flex: 1, minWidth: 0, m: 0 }}
                primaryTypographyProps={{ sx: { overflowWrap: "anywhere" } }}
              />

              {/* Los botones nunca se encogen ni se mueven, sin importar el largo del nombre */}
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Tooltip title="Editar este flujo" arrow>
                  <IconButton color="primary" onClick={() => handleLoadFlow(flow.flow_id!, flow.name)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar flujo" arrow>
                  <IconButton color="error" onClick={() => handleDeleteFlow(flow.flow_id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </ListItem>
          ))}
          {flows.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
              No se encontraron flujos.
            </Typography>
          )}
        </List>
      </Drawer>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingBlockId ? "Editar" : "Agregar"} {dialogOption}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {dialogOption === "Texto" && (
              <Stack spacing={2}>
                <FormControlLabel control={<Switch checked={forAll} onChange={(e) => setForAll(e.target.checked)} />} label="¿Para todos?" />
                <TextField multiline minRows={5} placeholder="Ingresar mensaje..." value={textContent} onChange={(e) => setTextContent(e.target.value)} fullWidth />
              </Stack>
            )}

            {(dialogOption === "Imagen" || dialogOption === "Video" || dialogOption === "Audio" || dialogOption === "Documento") && (
              <Stack spacing={2}>
                <Button variant="outlined" component="label" fullWidth sx={{ py: 2, position: "relative" }} disabled={isUploading}>
                  Subir {dialogOption}
                  {isUploading && <CircularProgress size={24} sx={{ position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />}
                  <input type="file" hidden onChange={handleFileSelect} disabled={isUploading} accept={dialogOption === "Imagen" ? "image/*" : dialogOption === "Video" ? "video/*" : dialogOption === "Audio" ? "audio/*" : "*/*"} />
                </Button>
                {uploadedFileOriginalName && (
                  <Typography variant="body2" color="text.secondary" align="center">
                    Archivo subido: <strong>{uploadedFileOriginalName}</strong>
                  </Typography>
                )}
                {(dialogOption === "Imagen" || dialogOption === "Video" || dialogOption === "Documento") && <TextField label="Ingresar leyenda" value={legend} onChange={(e) => setLegend(e.target.value)} fullWidth />}
              </Stack>
            )}

            {dialogOption === "Ubicación" && (
              <Stack direction="row" spacing={2}>
                <TextField label="Latitud" value={lat} onChange={(e) => setLat(e.target.value)} fullWidth />
                <TextField label="Longitud" value={lng} onChange={(e) => setLng(e.target.value)} fullWidth />
              </Stack>
            )}

            {dialogOption === "Encuesta" && (
              <Stack spacing={2}>
                <TextField label="Pregunta de la encuesta" value={surveyQuestion} onChange={(e) => setSurveyQuestion(e.target.value)} fullWidth />
                <Typography variant="subtitle2">Opciones de respuesta</Typography>
                {surveyOptions.map((option, index) => (
                  <Stack direction="row" spacing={1} key={index} alignItems="center">
                    <TextField size="small" fullWidth value={option} onChange={(e) => handleSurveyOptionChange(index, e.target.value)} placeholder={`Opción ${index + 1}`} />
                    <IconButton onClick={() => removeSurveyOption(index)} size="small" disabled={surveyOptions.length <= 1}>
                      <RemoveCircleOutlineIcon />
                    </IconButton>
                  </Stack>
                ))}
                <Button onClick={addSurveyOption} startIcon={<AddIcon />} size="small" sx={{ alignSelf: "flex-start" }}>
                  Añadir opción
                </Button>
              </Stack>
            )}

            {dialogOption !== "Encuesta" && !(dialogOption === "Texto" && forAll) && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Palabras Clave de Respuesta</Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ my: 1 }}>
                  {keywords.map((k) => (
                    <Chip key={k} label={k} onDelete={() => removeKeyword(k, editingBlockId ?? undefined)} />
                  ))}
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField placeholder="Añadir palabra clave" value={claveInput} onChange={(e) => setClaveInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addKeyword()} fullWidth size="small" />
                  <IconButton color="primary" onClick={addKeyword}>
                    <AddCircleIcon />
                  </IconButton>
                </Stack>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancelar</Button>
          <Button variant="contained" onClick={addBlockFromDialog} disabled={isUploading || !isFormValid}>
            {editingBlockId ? "Guardar Cambios" : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FlowBuilder;