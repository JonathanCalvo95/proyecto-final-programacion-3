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
  TextField,
  MenuItem,
  Divider,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { getBookings, cancelBooking, confirmBooking } from '../../services/bookings'
import api from '../../services/api'
import type { Booking } from '../../types/booking.types'
import type { BookingStatus, SpaceType } from '../../types/enums'
import { SPACE_TYPES } from '../../types/enums'
import { EditCalendar, Cancel, CheckCircle } from '@mui/icons-material'
import { useAuth } from '../../context/AuthContext'
import { alpha, useTheme } from '@mui/material/styles'
import { SPACE_TYPE_META as TYPE_META } from '../../constants/spaceTypeMeta'

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
  const theme = useTheme()
  const { user } = useAuth()
  const [data, setData] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Booking | null>(null)
  const [start, setStart] = useState<dayjs.Dayjs | null>(null)
  const [end, setEnd] = useState<dayjs.Dayjs | null>(null)

  const [cancelOpen, setCancelOpen] = useState(false)
  const [toCancel, setToCancel] = useState<Booking | null>(null)
  const deleting = false

  const [snack, setSnack] = useState<{ open: boolean; msg: string; error?: boolean }>({
    open: false,
    msg: '',
  })

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'' | BookingStatus>('')
  const [spaceType, setSpaceType] = useState<'' | SpaceType>('')

  const [from, setFrom] = useState<dayjs.Dayjs | null>(null)
  const [to, setTo] = useState<dayjs.Dayjs | null>(null)

  const today = dayjs().startOf('day')

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

  const canCancel = useMemo(() => {
    if (!current) return false
    return dayjs(current.start).startOf('day').isAfter(today)
  }, [current, today])

  async function cancel(id: string) {
    try {
      await cancelBooking(id)
      setSnack({ open: true, msg: 'Reserva cancelada' })
      load()
    } catch (e: any) {
      setSnack({ open: true, msg: e?.response?.data?.message || 'Error al cancelar', error: true })
    }
  }

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()

    return data.filter((r) => {
      if (status && r.status !== status) return false

      if (spaceType) {
        const st = typeof r.space === 'string' ? undefined : (r.space as any)?.type
        if (st !== spaceType) return false
      }

      if (ql) {
        const space = typeof r.space === 'string' ? r.space : r.space.name
        const type = typeof r.space === 'string' ? '' : (r.space as any)?.type || ''
        const typeLabel = (type && TYPE_META[type as SpaceType]?.label) || ''
        const userEmail = typeof r.user === 'string' ? '' : (r.user as any)?.email || ''
        const userName =
          typeof r.user === 'string'
            ? ''
            : `${(r.user as any)?.firstName || ''} ${(r.user as any)?.lastName || ''}`.trim()

        const hay = `${space} ${type} ${typeLabel} ${userEmail} ${userName}`.toLowerCase()
        if (!hay.includes(ql)) return false
      }

      if (from || to) {
        const bStart = dayjs(r.start).startOf('day')
        const bEnd = dayjs(r.end).subtract(1, 'day').endOf('day')

        const f = from ? from.startOf('day') : null
        const t = to ? to.endOf('day') : null

        const overlaps = (!f || bEnd.isSame(f) || bEnd.isAfter(f)) && (!t || bStart.isSame(t) || bStart.isBefore(t))

        if (!overlaps) return false
      }

      return true
    })
  }, [data, q, status, spaceType, from, to])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    )
  }

  return (
    <>
      {/* HEADER */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Gestionar reservas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestión de reservas activas y pasadas.
        </Typography>
      </Box>

      {/* FILTROS */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Buscar"
            placeholder="Espacio, email o nombre"
            size="small"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ minWidth: 220 }}
          />

          <TextField
            label="Tipo de espacio"
            select
            size="small"
            value={spaceType}
            onChange={(e) => setSpaceType(e.target.value as any)}
            sx={{ width: 200 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {SPACE_TYPES.map((t) => {
              const Icon = TYPE_META[t].Icon
              return (
                <MenuItem key={t} value={t}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Icon fontSize="small" />
                    <span>{TYPE_META[t].label}</span>
                  </Stack>
                </MenuItem>
              )
            })}
          </TextField>

          <TextField
            label="Estado"
            select
            size="small"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            sx={{ width: 180 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="pending">Pendiente</MenuItem>
            <MenuItem value="confirmed">Confirmada</MenuItem>
            <MenuItem value="canceled">Cancelada</MenuItem>
          </TextField>

          <DatePicker
            label="Desde"
            value={from}
            onChange={setFrom}
            format="DD/MM/YYYY"
            shouldDisableDate={(date) => {
              const d = date.day()
              return d === 0 || d === 6
            }}
            slotProps={{ textField: { size: 'small' } }}
          />

          <DatePicker
            label="Hasta"
            value={to}
            minDate={from || undefined}
            onChange={setTo}
            format="DD/MM/YYYY"
            shouldDisableDate={(date) => {
              const d = date.day()
              return d === 0 || d === 6
            }}
            slotProps={{ textField: { size: 'small' } }}
          />

          <Box flex={1} />

          <Button
            variant="outlined"
            onClick={() => {
              setQ('')
              setStatus('')
              setSpaceType('')
              setFrom(null)
              setTo(null)
            }}
          >
            Limpiar filtros
          </Button>
        </Stack>
      </Paper>

      {/* TABLA */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Espacio</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
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
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Alert severity="info" sx={{ my: 2 }}>
                    No tenés reservas que coincidan con los filtros.
                  </Alert>
                </TableCell>
              </TableRow>
            )}

            {filtered.map((r) => {
              const isPast = !dayjs(r.start).isAfter(today)

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

                  <TableCell>
                    {(() => {
                      if (typeof r.space === 'string') return <Chip size="small" variant="outlined" label="" />
                      const tp = ((r.space as any)?.type as SpaceType) || 'meeting_room'
                      const Meta = TYPE_META[tp]
                      const Ico = Meta.Icon
                      return (
                        <Chip
                          size="small"
                          variant="outlined"
                          color={Meta.color}
                          icon={<Ico fontSize="small" />}
                          label={Meta.label}
                        />
                      )
                    })()}
                  </TableCell>

                  <TableCell>{dayjs(r.start).format('DD/MM/YYYY')}</TableCell>
                  <TableCell>{dayjs(r.end).subtract(1, 'day').format('DD/MM/YYYY')}</TableCell>
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
                            onClick={() => {
                              setToCancel(r)
                              setCancelOpen(true)
                            }}
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
                              onClick={() => confirmBooking(r._id).then(load)}
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

      {/* DIALOG REPROGRAMAR */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Reprogramar reserva</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <DatePicker
              label="Inicio"
              value={start}
              onChange={setStart}
              disablePast
              format="DD/MM/YYYY"
              shouldDisableDate={(date) => {
                const d = date.day()
                return d === 0 || d === 6
              }}
            />
            <DatePicker
              label="Fin"
              value={end}
              minDate={start || undefined}
              onChange={setEnd}
              format="DD/MM/YYYY"
              shouldDisableDate={(date) => {
                const d = date.day()
                return d === 0 || d === 6
              }}
            />
          </Stack>
          <Typography variant="caption" sx={{ mt: 1 }} color="text.secondary">
            La fecha de fin debe ser posterior al inicio.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cerrar</Button>
          <Button
            variant="contained"
            disabled={!current || !start || !end || !canCancel || end.startOf('day').isBefore(start.startOf('day'))}
            onClick={async () => {
              await api.patch(`/bookings/${current!._id}/reschedule`, {
                start: start!.format('YYYY-MM-DD'),
                end: end!.format('YYYY-MM-DD'),
              })
              setOpen(false)
              setSnack({ open: true, msg: 'Reserva reprogramada' })
              load()
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG CANCELAR */}
      <Dialog open={cancelOpen} onClose={() => !deleting && setCancelOpen(false)}>
        <DialogTitle>Cancelar reserva</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2">
            ¿Seguro que deseas cancelar la reserva del espacio{' '}
            <strong>{toCancel && (typeof toCancel.space === 'string' ? toCancel.space : toCancel.space.name)}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Inicio: {toCancel && dayjs(toCancel.start).format('DD/MM/YYYY')} — Fin:{' '}
            {toCancel && dayjs(toCancel.end).subtract(1, 'day').format('DD/MM/YYYY')}
          </Typography>

          <Alert severity="warning" variant="outlined" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelOpen(false)} disabled={deleting}>
            Cerrar
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleting}
            onClick={async () => {
              await cancel(toCancel!._id)
              setCancelOpen(false)
              setToCancel(null)
            }}
          >
            {deleting ? 'Cancelando...' : 'Cancelar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACK */}
      <Snackbar
        open={snack.open}
        onClose={() => setSnack({ open: false, msg: '' })}
        autoHideDuration={2500}
        message={snack.msg}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      />
    </>
  )
}
