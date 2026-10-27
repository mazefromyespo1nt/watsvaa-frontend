import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Snackbar } from '@mui/material';
import type { SnackbarCloseReason } from '@mui/material';

/**
 * Reemplazo de window.alert() con notificaciones de Material UI
 * que usan el tema de la app (claro u oscuro).
 *
 * Uso:
 *   const notify = useNotify();
 *   notify.success('Instancia eliminada correctamente');
 *   notify.error('No se pudo eliminar la instancia');
 *   notify.warning('Tu plan vence pronto');
 *   notify.info('ID copiado al portapapeles');
 *
 * Si se lanzan varias seguidas, se muestran una tras otra (cola).
 */

type Severity = 'success' | 'error' | 'warning' | 'info';

interface Notice {
  key: number;
  message: React.ReactNode;
  severity: Severity;
  duration: number;
}

type NotifyFn = (message: React.ReactNode, duration?: number) => void;

export interface NotifyApi {
  success: NotifyFn;
  error: NotifyFn;
  warning: NotifyFn;
  info: NotifyFn;
}

const NotifyContext = createContext<NotifyApi | null>(null);

// Los errores duran más para que dé tiempo de leerlos
const DEFAULT_DURATION: Record<Severity, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 6000,
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<Notice[]>([]);
  const [current, setCurrent] = useState<Notice | null>(null);
  const [open, setOpen] = useState(false);
  const keyRef = useRef(0);

  const push = useCallback(
    (severity: Severity, message: React.ReactNode, duration?: number) => {
      keyRef.current += 1;
      const notice: Notice = {
        key: keyRef.current,
        message,
        severity,
        duration: duration ?? DEFAULT_DURATION[severity],
      };
      setQueue((prev) => [...prev, notice]);
    },
    []
  );

  // Muestra la siguiente notificación de la cola
  useEffect(() => {
    if (queue.length > 0 && !current) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
      setOpen(true);
    } else if (queue.length > 0 && current && open) {
      // Hay una abierta y llegó otra: se cierra la actual para dar paso a la siguiente
      setOpen(false);
    }
  }, [queue, current, open]);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  const handleExited = () => {
    setCurrent(null);
  };

  const api = useMemo<NotifyApi>(
    () => ({
      success: (message, duration) => push('success', message, duration),
      error: (message, duration) => push('error', message, duration),
      warning: (message, duration) => push('warning', message, duration),
      info: (message, duration) => push('info', message, duration),
    }),
    [push]
  );

  return (
    <NotifyContext.Provider value={api}>
      {children}

      {current && (
        <Snackbar
          key={current.key}
          open={open}
          autoHideDuration={current.duration}
          onClose={handleClose}
          TransitionProps={{ onExited: handleExited }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleClose}
            severity={current.severity}
            variant="filled"
            elevation={6}
            sx={{ width: '100%', maxWidth: 480, borderRadius: 2, alignItems: 'center' }}
          >
            {current.message}
          </Alert>
        </Snackbar>
      )}
    </NotifyContext.Provider>
  );
};

export const useNotify = (): NotifyApi => {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    throw new Error('useNotify debe usarse dentro de <NotificationProvider>');
  }
  return ctx;
};

export default NotificationProvider;