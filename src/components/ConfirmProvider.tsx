import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

/**
 * Reemplazo de window.confirm() con un diálogo de Material UI
 * que usa el tema de la app (claro u oscuro).
 *
 * Uso:
 *   const confirm = useConfirm();
 *   const ok = await confirm({ title: 'Eliminar instancia', message: '...', severity: 'danger' });
 *   if (!ok) return;
 */

type Severity = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  severity?: Severity;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

const DEFAULTS: Required<Omit<ConfirmOptions, 'message'>> = {
  title: '¿Estás seguro?',
  confirmText: 'Aceptar',
  cancelText: 'Cancelar',
  severity: 'info',
};

const SEVERITY_STYLES: Record<
  Severity,
  { color: 'error' | 'warning' | 'primary'; Icon: React.ElementType }
> = {
  danger: { color: 'error', Icon: DeleteOutlineRoundedIcon },
  warning: { color: 'warning', Icon: WarningAmberRoundedIcon },
  info: { color: 'primary', Icon: InfoOutlinedIcon },
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    // Si ya había un diálogo abierto, se cancela el anterior
    resolverRef.current?.(false);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions(opts);
      setOpen(true);
    });
  }, []);

  const close = (result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOpen(false);
  };

  const { title, message, confirmText, cancelText, severity } = {
    ...DEFAULTS,
    ...options,
  };
  const { color, Icon } = SEVERITY_STYLES[severity];

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <Dialog
        open={open}
        onClose={() => close(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, pt: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: `${color}.main`,
              bgcolor: (theme) => alpha(theme.palette[color].main, 0.14),
            }}
          >
            <Icon />
          </Box>
          <DialogTitle id="confirm-dialog-title" sx={{ p: 0, fontWeight: 700 }}>
            {title}
          </DialogTitle>
        </Box>

        <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
          <DialogContentText
            id="confirm-dialog-description"
            component="div"
            sx={{ color: 'text.secondary' }}
          >
            {message}
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
          <Button
            onClick={() => close(false)}
            color="inherit"
            autoFocus={severity === 'danger'}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {cancelText}
          </Button>
          <Button
            onClick={() => close(true)}
            color={color}
            variant="contained"
            disableElevation
            autoFocus={severity !== 'danger'}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.5 }}
          >
            {confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  }
  return ctx;
};

export default ConfirmProvider;