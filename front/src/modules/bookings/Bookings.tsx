import { useEffect, useMemo, useState } from 'react'
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
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
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { getMyBookings, cancelBooking } from '../../services/bookings'
import { getMyPayments } from '../../services/payments'
import type { Payment } from '../../types/payment.types'
import ConfirmDialog from '../../components/ConfirmDialog'
import type { Booking } from '../../types/booking.types'
import { Cancel, CreditCard } from '@mui/icons-material'
import { useAuth } from '../../context/AuthContext'
import { alpha, useTheme } from '@mui/material/styles'
import { BOOKING_STATE_CHIP_COLOR, type BookingStateLabel } from '../../types/enums'

const money = (v: number) => v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export default function Bookings() {
  const theme = useTheme()
  const { user } = useAuth()

  const [data, setData] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [cancelOpen, setCancelOpen] = useState(false)
  const [toCancel, setToCancel] = useState<Booking | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [snack, setSnack] = useState<{ open: boolean; msg: string; error?: boolean }>({
    open: false,
    msg: '',
  })

  const [q, setQ] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<'' | BookingStateLabel>('')
  const [from, setFrom] = useState<dayjs.Dayjs | null>(null)
  const [to, setTo] = useState<dayjs.Dayjs | null>(null)

  const [payments, setPayments] = useState<Payment[]>([])
  const paymentMap = useMemo(() => {
    const m: Record<string, Payment> = {}
    payments.forEach((p) => {
      if (p.booking) m[p.booking] = p
    })
    return m
  }, [payments])

  const today = dayjs().startOf('day')
  const todayValue = today.valueOf()

  const deriveEstado = (b: Booking): BookingStateLabel => {
    if (b.status === 'canceled') return 'Cancelada'

    const payment = paymentMap[b._id]
    const endExclusive = dayjs(b.end)

    if (!payment && endExclusive.valueOf() <= todayValue) {
      return 'Vencida'
    }
    if (payment) return 'Pagada'
    return 'Pendiente de pago'
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getMyBookings()
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
    getMyPayments()
      .then((list) => setPayments(Array.isArray(list) ? list : []))
      .catch(() => setPayments([]))
  }, [])

  async function cancel(id: string) {
    try {
      await cancelBooking(id)
      setSnack({ open: true, msg: 'Reserva cancelada' })
      load()
    } catch (e: any) {
      setSnack({
        open: true,
        msg: e?.response?.data?.message || 'Error al cancelar',
        error: true,
      })
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

  const list = Array.isArray(data) ? data : []

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()

    return list.filter((r) => {
      if (estadoFilter && deriveEstado(r) !== estadoFilter) return false

      if (ql) {
        const spaceName = typeof r.space === 'string' ? '' : (r.space as any)?.name || ''
        if (!spaceName.toLowerCase().includes(ql)) return false
      }

      if (from || to) {
        const bStart = dayjs(r.start).startOf('day')
        const bEndIncl = dayjs(r.end).subtract(1, 'day').endOf('day')
        const f = from ? from.startOf('day') : null
        const t = to ? to.endOf('day') : null
        const overlaps =
          (!f || bEndIncl.isSame(f) || bEndIncl.isAfter(f)) && (!t || bStart.isSame(t) || bStart.isBefore(t))

        if (!overlaps) return false
      }

      return true
    })
  }, [list, q, estadoFilter, from, to, paymentMap, todayValue])

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
          Mis reservas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Revisá, filtrá y gestioná tus reservas activas y pasadas.
        </Typography>
      </Box>

      {/* FILTROS */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            label="Buscar"
            placeholder="Nombre del espacio"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
          />

          <TextField
            label="Estado"
            select
            size="small"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value as any)}
            sx={{ width: 200 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="Pendiente de pago">Pendiente de pago</MenuItem>
            <MenuItem value="Pagada">Pagada</MenuItem>
            <MenuItem value="Cancelada">Cancelada</MenuItem>
            <MenuItem value="Vencida">Vencida</MenuItem>
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
              setEstadoFilter('')
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
                <TableCell colSpan={7}>
                  <Alert severity="info" sx={{ my: 2 }}>
                    No tenés reservas que coincidan con los filtros.
                  </Alert>
                </TableCell>
              </TableRow>
            )}

            {filtered.map((r) => {
              const isPast = !dayjs(r.start).isAfter(today)
              const canCancelRow = dayjs(r.start).startOf('day').isAfter(today) && r.status !== 'canceled'
              const estado = deriveEstado(r)
              const payment = paymentMap[r._id]

              return (
                <TableRow key={r._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {typeof r.space === 'string' ? r.space : (r.space as any).name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      #{r._id.slice(-6)}
                    </Typography>
                  </TableCell>
                  <TableCell>{dayjs(r.start).format('DD/MM/YYYY')}</TableCell>
                  <TableCell>{dayjs(r.end).subtract(1, 'day').format('DD/MM/YYYY')}</TableCell>
                  <TableCell>{money(r.amount)}</TableCell>
                  <TableCell>
                    {payment ? (
                      <Tooltip
                        title={`Pagada: ${payment.brand} ****${payment.last4} · ${dayjs(payment.createdAt).format(
                          'DD/MM/YYYY'
                        )}`}
                      >
                        <Chip size="small" label={estado} color={BOOKING_STATE_CHIP_COLOR[estado]} variant="outlined" />
                      </Tooltip>
                    ) : (
                      <Chip size="small" label={estado} color={BOOKING_STATE_CHIP_COLOR[estado]} variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Ver detalle">
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              window.location.href = `/bookings/${r._id}`
                            }}
                          >
                            Detalle
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
                            disabled={!canCancelRow}
                            onClick={() => openCancelDialog(r)}
                          >
                            Cancelar
                          </Button>
                        </span>
                      </Tooltip>

                      {user?.role !== 'admin' && estado === 'Pendiente de pago' && (
                        <Tooltip title="Pagar">
                          <span>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<CreditCard />}
                              onClick={() => {
                                window.location.href = `/pay/${r._id}`
                              }}
                            >
                              Pagar
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

      {/* DIALOG CANCELAR */}
      <ConfirmDialog
        open={cancelOpen}
        title="Cancelar reserva"
        confirmText={deleting ? 'Cancelando...' : 'Cancelar'}
        loading={deleting}
        onClose={() => !deleting && setCancelOpen(false)}
        onConfirm={confirmCancel}
        content={
          toCancel ? (
            <Stack spacing={1}>
              <Typography variant="body2">
                ¿Seguro que deseas cancelar la reserva del espacio{' '}
                <strong>{typeof toCancel.space === 'string' ? toCancel.space : (toCancel.space as any).name}</strong>?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Inicio: {dayjs(toCancel.start).format('DD/MM/YYYY')} — Fin:{' '}
                {dayjs(toCancel.end).subtract(1, 'day').format('DD/MM/YYYY')}
              </Typography>
              <Alert severity="warning" sx={{ mt: 1 }} variant="outlined">
                Esta acción no se puede deshacer.
              </Alert>
            </Stack>
          ) : null
        }
      />

      {/* SNACKBAR */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack({ open: false, msg: '' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnack({ open: false, msg: '' })}
          severity={snack.error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  )
}
