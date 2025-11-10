import { useEffect, useMemo, useState } from 'react'
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
  Typography,
  Box,
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import dayjs from 'dayjs'
import { getBookings, cancelBooking, confirmBooking } from '../../services/bookings'
import api from '../../services/api'
import type { Booking } from '../../types/booking.types'
import type { BookingStatus } from '../../types/enums'
import { EditCalendar, Cancel, CheckCircle } from '@mui/icons-material'
import { useAuth } from '../../context/AuthContext'

const statusColor: Record<
  BookingStatus,
  { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' }
> = {
  pending: { label: 'Pendiente', color: 'warning' },
  confirmed: { label: 'Confirmada', color: 'success' },
  canceled: { label: 'Cancelada', color: 'error' },
}

const money = (v: number) => v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export default function Bookings() {
  const [data, setData] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Booking | null>(null)
  const [start, setStart] = useState<dayjs.Dayjs | null>(null)
  const [end, setEnd] = useState<dayjs.Dayjs | null>(null)
  const [snack, setSnack] = useState<{ open: boolean; msg: string; error?: boolean }>({ open: false, msg: '' })
  const [cancelOpen, setCancelOpen] = useState(false)
  const [toCancel, setToCancel] = useState<Booking | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { user } = useAuth()

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getBookings()
      setData(Array.isArray(list) ? list : [])
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Error cargando reservas')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const now = dayjs()
  const canCancel = useMemo(() => {
    if (!current) return false
    return dayjs(current.start).isAfter(now)
  }, [current, now])

  async function cancel(id: string) {
    try {
      await cancelBooking(id)
      setSnack({ open: true, msg: 'Reserva cancelada' })
      load()
    } catch (e: any) {
      setSnack({ open: true, msg: e?.response?.data?.message || 'Error al cancelar', error: true })
    }
  }

  function openCancelDialog(b: Booking) {
    setToCancel(b)
    setCancelOpen(true)
  }

  async function confirmCancel() {
    if (!toCancel) return
    setDeleting(true)
    try {
      await cancel(toCancel._id)
      setCancelOpen(false)
      setToCancel(null)
    } finally {
      setDeleting(false)
    }
  }

  async function reschedule() {
    if (!current || !start || !end) return
    try {
      await api.patch(`/bookings/${current._id}/reschedule`, {
        start: start.toISOString(),
        end: end.toISOString(),
      })
      setOpen(false)
      setCurrent(null)
      setSnack({ open: true, msg: 'Reserva reprogramada' })
      load()
    } catch (e: any) {
      setSnack({ open: true, msg: e?.response?.data?.message || 'Error al reprogramar', error: true })
    }
  }

  async function doConfirm(id: string) {
    try {
      await confirmBooking(id)
      setSnack({ open: true, msg: 'Reserva confirmada' })
      load()
    } catch (e: any) {
      setSnack({ open: true, msg: e?.response?.data?.message || 'Error al confirmar', error: true })
    }
  }

  if (loading) {
    return (
      <TableContainer component={Paper}>
        <Stack alignItems="center" sx={{ p: 3 }}>
          <CircularProgress />
        </Stack>
      </TableContainer>
    )
  }

  if (error) {
    return (
      <TableContainer component={Paper}>
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      </TableContainer>
    )
  }

  const list = Array.isArray(data) ? data : []

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Espacio</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Inicio</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Fin</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Importe</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Alert severity="info">No tenés reservas.</Alert>
                </TableCell>
              </TableRow>
            )}
            {list.map((r) => {
              const isPast = !dayjs(r.start).isAfter(now)
              return (
                <TableRow key={r._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {typeof r.space === 'string' ? r.space : r.space.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      #{r._id.slice(-6)}
                    </Typography>
                  </TableCell>
                  <TableCell>{dayjs(r.start).format('YYYY-MM-DD HH:mm')}</TableCell>
                  <TableCell>{dayjs(r.end).format('YYYY-MM-DD HH:mm')}</TableCell>
                  <TableCell>{money(r.amount)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={statusColor[r.status].label}
                      color={statusColor[r.status].color}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Reprogramar">
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditCalendar />}
                            disabled={isPast || r.status === 'canceled'}
                            onClick={() => {
                              setCurrent(r)
                              setStart(dayjs(r.start))
                              setEnd(dayjs(r.end))
                              setOpen(true)
                            }}
                          >
                            Reprogramar
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title={isPast ? 'No disponible' : 'Cancelar'}>
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            disabled={isPast || r.status === 'canceled'}
                            onClick={() => openCancelDialog(r)}
                          >
                            Cancelar
                          </Button>
                        </span>
                      </Tooltip>
                      {user?.role === 'admin' && r.status === 'pending' && (
                        <Tooltip title="Confirmar">
                          <span>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle />}
                              onClick={() => doConfirm(r._id)}
                            >
                              Confirmar
                            </Button>
                          </span>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Reprogramar</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <DateTimePicker label="Inicio" value={start} onChange={setStart} ampm={false} minutesStep={15} />
            <DateTimePicker
              label="Fin"
              value={end}
              onChange={setEnd}
              ampm={false}
              minutesStep={15}
              minDateTime={start || undefined}
            />
          </Stack>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Debe ser una fecha futura y el fin posterior al inicio.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cerrar</Button>
          <Button
            onClick={reschedule}
            variant="contained"
            disabled={!current || !start || !end || !canCancel || !end.isAfter(start)}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog confirmar cancelación */}
      <Dialog open={cancelOpen} onClose={() => !deleting && setCancelOpen(false)}>
        <DialogTitle>Cancelar reserva</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={1}>
            <Typography variant="body2">
              ¿Seguro que deseas cancelar la reserva
              {toCancel && (
                <>
                  del espacio{' '}
                  <strong>{typeof toCancel.space === 'string' ? toCancel.space : toCancel.space.name}</strong>?
                </>
              )}
            </Typography>
            {toCancel && (
              <Typography variant="caption" color="text.secondary">
                Inicio: {dayjs(toCancel.start).format('YYYY-MM-DD HH:mm')} | Fin:{' '}
                {dayjs(toCancel.end).format('YYYY-MM-DD HH:mm')}
              </Typography>
            )}
            <Alert severity="warning" sx={{ mt: 1 }} variant="outlined">
              Esta acción no se puede deshacer.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)} disabled={deleting}>
            Cerrar
          </Button>
          <Button color="error" variant="contained" onClick={confirmCancel} disabled={deleting}>
            {deleting ? 'Cancelando...' : 'Cancelar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        onClose={() => setSnack({ open: false, msg: '' })}
        autoHideDuration={2500}
        message={snack.msg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        color={snack.error ? 'error' : (undefined as any)}
      />
    </>
  )
}
