import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, Box } from '@mui/material'
import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  content: ReactNode
  confirmText?: string
  cancelText?: string
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
  confirmColor?: 'primary' | 'error' | 'success' | 'warning' | 'info'
}

export function ConfirmDialog({
  open,
  title,
  content,
  confirmText = 'Confirmar',
  cancelText = 'Cerrar',
  loading = false,
  onConfirm,
  onClose,
  confirmColor = 'primary',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>{content}</DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant="contained" color={confirmColor} onClick={onConfirm} disabled={loading}>
          {loading ? 'Procesando...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDialog