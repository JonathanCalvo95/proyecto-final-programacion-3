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
import { getBookings } from '../../services/bookings'
import { getAllPayments } from '../../services/payments'
import type { Payment } from '../../types/payment.types'
import ConfirmDialog from '../../components/ConfirmDialog'
import api from '../../services/api'
import type { Booking } from '../../types/booking.types'
import { type SpaceType, SPACE_TYPES, type BookingStateLabel, BOOKING_STATE_CHIP_COLOR } from '../../types/enums'
import { EditCalendar, ArrowUpward, ArrowDownward } from '@mui/icons-material'
import { alpha, useTheme } from '@mui/material/styles'
import { SPACE_TYPE_META as TYPE_META } from '../../constants/spaceTypeMeta'

const money = (v: number) => v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export default function AdminBookings() {
  const theme = useTheme()
  const [data, setData] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Booking | null>(null)
  const [start, setStart] = useState<dayjs.Dayjs | null>(null)
  const [end, setEnd] = useState<dayjs.Dayjs | null>(null)

  // Segundo paso de confirmación para reprogramar
  const [rescheduleConfirmOpen, setRescheduleConfirmOpen] = useState(false)
  const [rescheduleLoading, setRescheduleLoading] = useState(false)

  const [snack, setSnack] = useState<{ open: boolean; msg: string; error?: boolean }>({
    open: false,
    msg: '',
  })

  const [q, setQ] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<'' | BookingStateLabel>('')
  const [spaceType, setSpaceType] = useState<'' | SpaceType>('')

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

  // Validaciones para modal de reprogramar
  const rescheduleError = useMemo(() => {
    if (!current || !start || !end) return ''
    const s = start.startOf('day')
    const e = end.startOf('day') // backend trata `end` como exclusive
    if (!s.isAfter(today)) return 'La fecha de inicio debe ser futura.'
    if (!e.isAfter(s)) return 'La fecha de fin debe ser posterior al inicio.'

    // Conflicto contra otras reservas mismo espacio (excluyendo canceladas y la propia)
    const conflicts = data.some((b) => {
      if (b._id === current._id) return false
      if (b.status === 'canceled') return false
      const sameSpace =
        (typeof b.space === 'string' ? b.space : (b.space as any)?._id) ===
        (typeof current.space === 'string' ? current.space : (current.space as any)?._id)
      if (!sameSpace) return false
      const bs = dayjs(b.start)
      const be = dayjs(b.end) // stored as exclusive
      return bs.isBefore(e) && be.isAfter(s)
    })
    if (conflicts) return 'Las fechas seleccionadas se superponen con otra reserva.'
    return ''
  }, [current, start, end, data, today])

  // Se puede reprogramar si todavía no empezó y no está cancelada
  const canReschedule = useMemo(() => {
    if (!current) return false
    return dayjs(current.start).startOf('day').isAfter(today) && current.status !== 'canceled'
  }, [current, today])

  const canSaveReschedule = !!current && !!start && !!end && !rescheduleError && canReschedule

  // Sorting
  type SortKey = 'space' | 'type' | 'start' | 'end' | 'amount' | 'estado' | 'payment'
  const [sortBy, setSortBy] = useState<SortKey>('start')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const toggleSort = (key: SortKey) => {
    setSortBy((prev) => (prev === key ? key : key))
    setSortDir((prev) => (sortBy === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'))
  }

  const SortLabel = ({
    label,
    active,
    dir,
    onClick,
  }: {
    label: string
    active: boolean
    dir: 'asc' | 'desc'
    onClick: () => void
  }) => (
    <Button
      onClick={onClick}
      size="small"
      sx={{
        textTransform: 'none',
        fontWeight: 700,
        minWidth: 0,
        p: 0.3,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.4,
        color: 'inherit',
        '&:hover': { background: 'transparent', textDecoration: 'underline' },
      }}
    >
      {label}
      {active &&
        (dir === 'asc' ? (
          <ArrowUpward fontSize="inherit" sx={{ fontSize: 16 }} />
        ) : (
          <ArrowDownward fontSize="inherit" sx={{ fontSize: 16 }} />
        ))}
    </Button>
  )

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
    getAllPayments()
      .then((list) => setPayments(Array.isArray(list) ? list : []))
      .catch(() => setPayments([]))
  }, [])

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    const base = data.filter((r) => {
      if (estadoFilter && deriveEstado(r) !== estadoFilter) return false

      if (spaceType) {
        const st = typeof r.space === 'string' ? undefined : (r.space as any)?.type
        if (st !== spaceType) return false
      }

      if (ql) {
        const space = typeof r.space === 'string' ? r.space : (r.space as any)?.name || ''
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

    const dir = sortDir === 'asc' ? 1 : -1
    const sorted = [...base].sort((a, b) => {
      const aSpace = typeof a.space === 'string' ? a.space : (a.space as any)?.name || ''
      const bSpace = typeof b.space === 'string' ? b.space : (b.space as any)?.name || ''
      const aType = typeof a.space === 'string' ? '' : (a.space as any)?.type || ''
      const bType = typeof b.space === 'string' ? '' : (b.space as any)?.type || ''
      switch (sortBy) {
        case 'space':
          return aSpace.localeCompare(bSpace) * dir
        case 'type':
          return aType.localeCompare(bType) * dir
        case 'start':
          return (dayjs(a.start).valueOf() - dayjs(b.start).valueOf()) * dir
        case 'end':
          return (dayjs(a.end).valueOf() - dayjs(b.end).valueOf()) * dir
        case 'amount':
          return (a.amount - b.amount) * dir
        case 'estado':
          return deriveEstado(a).localeCompare(deriveEstado(b)) * dir
        case 'payment': {
          const ap = paymentMap[a._id] ? 1 : 0
          const bp = paymentMap[b._id] ? 1 : 0
          return (ap - bp) * dir || aSpace.localeCompare(bSpace)
        }
        default:
          return 0
      }
    })
    return sorted
  }, [data, q, estadoFilter, spaceType, from, to, sortBy, sortDir, paymentMap, deriveEstado])

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
              <TableCell sx={{ fontWeight: 700 }}>
                <SortLabel
                  label="Espacio"
                  active={sortBy === 'space'}
                  dir={sortDir}
                  onClick={() => toggleSort('space')}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                <SortLabel label="Tipo" active={sortBy === 'type'} dir={sortDir} onClick={() => toggleSort('type')} />
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                <SortLabel
                  label="Inicio"
                  active={sortBy === 'start'}
                  dir={sortDir}
                  onClick={() => toggleSort('start')}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                <SortLabel label="Fin" active={sortBy === 'end'} dir={sortDir} onClick={() => toggleSort('end')} />
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                <SortLabel
                  label="Importe"
                  active={sortBy === 'amount'}
                  dir={sortDir}
                  onClick={() => toggleSort('amount')}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                <SortLabel
                  label="Estado"
                  active={sortBy === 'estado'}
                  dir={sortDir}
                  onClick={() => toggleSort('estado')}
                />
              </TableCell>
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
                    No hay reservas que coincidan con los filtros.
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
                      {typeof r.space === 'string' ? '' : (r.space as any)?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {typeof r.user === 'object'
                        ? `${(r.user as any)?.firstName || ''} ${(r.user as any)?.lastName || ''}`.trim()
                        : ''}
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
                    {(() => {
                      const est = deriveEstado(r)
                      const color = BOOKING_STATE_CHIP_COLOR[est]
                      const payment = paymentMap[r._id]
                      if (payment) {
                        return (
                          <Tooltip
                            title={`Pagada: ${payment.brand} ****${payment.last4} · ${dayjs(payment.createdAt).format(
                              'DD/MM/YYYY'
                            )}`}
                          >
                            <Chip size="small" label={est} color={color} variant="outlined" />
                          </Tooltip>
                        )
                      }
                      return <Chip size="small" label={est} color={color} variant="outlined" />
                    })()}
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
                            Ver detalle
                          </Button>
                        </span>
                      </Tooltip>
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
          <Button variant="contained" disabled={!canSaveReschedule} onClick={() => setRescheduleConfirmOpen(true)}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACK */}
      <Snackbar
        open={snack.open}
        onClose={() => setSnack({ open: false, msg: '' })}
        autoHideDuration={2500}
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

      {/* CONFIRM RESCHEDULE MODAL */}
      <ConfirmDialog
        open={rescheduleConfirmOpen}
        title="Aplicar nueva programación"
        confirmText="Reprogramar"
        loading={rescheduleLoading}
        onClose={() => !rescheduleLoading && setRescheduleConfirmOpen(false)}
        onConfirm={async () => {
          if (!current || !start || !end) return
          setRescheduleLoading(true)
          try {
            await api.patch(`/bookings/${current._id}/reschedule`, {
              start: start.format('YYYY-MM-DD'),
              end: end.format('YYYY-MM-DD'),
            })
            setRescheduleConfirmOpen(false)
            setOpen(false)
            setCurrent(null)
            setSnack({ open: true, msg: 'Reserva reprogramada' })
            load()
          } catch (e: any) {
            const msg = e?.response?.data?.message || e?.response?.data || e?.message || 'Error al reprogramar'
            setSnack({ open: true, msg, error: true })
          } finally {
            setRescheduleLoading(false)
          }
        }}
        content={
          current && start && end ? (
            <Stack spacing={1}>
              <Typography variant="body2">
                Vas a reprogramar la reserva del espacio{' '}
                <strong>{typeof current.space === 'string' ? current.space : (current.space as any).name}</strong>.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Actual: {dayjs(current.start).format('DD/MM/YYYY')} →{' '}
                {dayjs(current.end).subtract(1, 'day').format('DD/MM/YYYY')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Nueva: {start.format('DD/MM/YYYY')} → {end.subtract(1, 'day').format('DD/MM/YYYY')}
              </Typography>
              {rescheduleError ? (
                <Alert severity="error" variant="outlined">
                  {rescheduleError}
                </Alert>
              ) : (
                <Alert severity="warning" variant="outlined">
                  Se actualizarán las fechas de la reserva.
                </Alert>
              )}
            </Stack>
          ) : null
        }
      />
    </>
  )
}
