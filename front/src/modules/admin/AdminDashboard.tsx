import { useEffect, useMemo, useState } from 'react'
import Grid from '@mui/material/Grid'
import {
  Box,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { MeetingRoom, EventAvailable, QueryStats, CalendarMonth, TrendingUp } from '@mui/icons-material'
import { BarChart, PieChart } from '@mui/x-charts'
import dayjs from 'dayjs'

import { getMetrics, getTopSpaces } from '../../services/admin'
import { getBookings } from '../../services/bookings'
import { getAllPayments } from '../../services/payments'

import type { Booking } from '../../types/booking.types'
import type { Payment } from '../../types/payment.types'
import { BOOKING_STATUS, type BookingStatus } from '../../types/enums'

type Metrics = {
  totalSpaces?: number
  totalBookings?: number
  occupancyRate?: number
}

type ChartBucketKey = BookingStatus

/* =================== Helpers de estado =================== */

function mapToChartStatus(b: Booking, payment?: Payment): BookingStatus {
  const rawStatus = (b.status as unknown as string) || ''

  if (rawStatus === BOOKING_STATUS.CANCELED || rawStatus.toLowerCase() === 'canceled') {
    return BOOKING_STATUS.CANCELED
  }

  if (
    rawStatus === BOOKING_STATUS.CONFIRMED ||
    rawStatus.toLowerCase() === 'paid' ||
    rawStatus.toLowerCase() === 'confirmada' ||
    !!payment
  ) {
    return BOOKING_STATUS.CONFIRMED
  }

  return BOOKING_STATUS.PENDING
}

export default function AdminDashboard() {
  const theme = useTheme()
  const [metrics, setMetrics] = useState<Metrics>({})
  const [top, setTop] = useState<any[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const [m, t, b, p] = await Promise.all([getMetrics(), getTopSpaces(), getBookings(), getAllPayments()])

        setMetrics(m || {})
        setTop(Array.isArray(t) ? t : [])
        setBookings(Array.isArray(b) ? b : [])
        setPayments(Array.isArray(p) ? p : [])
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Error cargando métricas')
        setMetrics({})
        setTop([])
        setBookings([])
        setPayments([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  /* ------------------------ MAPA DE PAGOS ------------------------ */

  const paymentMap = useMemo(() => {
    const m: Record<string, Payment> = {}
    payments.forEach((p) => {
      if (p.booking) m[String(p.booking)] = p
    })
    return m
  }, [payments])

  /* ------------------------ BOOKINGS ÚLTIMOS (últimos 30 días) ------------------------ */

  const last30Bookings = useMemo(() => {
    if (!bookings.length) return []
    const today = dayjs().endOf('day')
    const since = dayjs().subtract(30, 'day').startOf('day')

    return bookings.filter((b) => {
      const start = dayjs(b.start)
      const end = dayjs(b.end)
      return start.isBefore(today) && end.isAfter(since)
    })
  }, [bookings])

  /* ------------------------ INSIGHTS (últimos 30 días) ------------------------ */

  const mostBookedSpace = useMemo(() => {
    if (!last30Bookings.length) return null
    const map: Record<string, number> = {}

    for (const b of last30Bookings) {
      const name = typeof b.space === 'string' ? b.space : (b.space as any).name
      map[name] = (map[name] || 0) + 1
    }

    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    return sorted[0]
  }, [last30Bookings])

  const busiestDay = useMemo(() => {
    if (!last30Bookings.length) return null
    const map: Record<string, number> = {}

    for (const b of last30Bookings) {
      const start = dayjs(b.start).format('YYYY-MM-DD')
      map[start] = (map[start] || 0) + 1
    }

    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    return sorted[0]
  }, [last30Bookings])

  const topUser = useMemo(() => {
    if (!last30Bookings.length) return null
    const map: Record<string, number> = {}

    for (const b of last30Bookings) {
      const user =
        typeof b.user === 'string'
          ? b.user
          : `${(b.user as any)?.firstName || ''} ${(b.user as any)?.lastName || ''}`.trim()

      map[user] = (map[user] || 0) + 1
    }

    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    return sorted[0]
  }, [last30Bookings])

  const avgDuration = useMemo(() => {
    if (!last30Bookings.length) return 0

    const durations = last30Bookings.map((b) => dayjs(b.end).diff(dayjs(b.start), 'day'))

    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    return Math.round(avg * 10) / 10
  }, [last30Bookings])

  /* ------------------------ STATUS CHART (últimos 30 días) ------------------------ */

  const statusDist = useMemo(() => {
    const buckets: Record<ChartBucketKey, number> = {
      [BOOKING_STATUS.PENDING]: 0,
      [BOOKING_STATUS.CONFIRMED]: 0,
      [BOOKING_STATUS.CANCELED]: 0,
    }

    for (const b of last30Bookings) {
      const payment = paymentMap[String(b._id)]
      const chartStatus = mapToChartStatus(b, payment)
      buckets[chartStatus]++
    }

    return [
      {
        id: BOOKING_STATUS.PENDING,
        label: 'Pendiente de pago',
        value: buckets[BOOKING_STATUS.PENDING],
        color: theme.palette.warning.main,
      },
      {
        id: BOOKING_STATUS.CONFIRMED,
        label: 'Pagada',
        value: buckets[BOOKING_STATUS.CONFIRMED],
        color: theme.palette.success.main,
      },
      {
        id: BOOKING_STATUS.CANCELED,
        label: 'Cancelada',
        value: buckets[BOOKING_STATUS.CANCELED],
        color: theme.palette.error.main,
      },
    ]
  }, [last30Bookings, paymentMap, theme])

  /* ------------------------ Próximas reservas ------------------------ */

  const upcoming = useMemo(() => {
    const today = dayjs().startOf('day')
    return bookings
      .filter((b) => b.status !== BOOKING_STATUS.CANCELED && dayjs(b.start).startOf('day').isAfter(today))
      .sort((a, b) => dayjs(a.start).diff(dayjs(b.start)))
      .slice(0, 6)
  }, [bookings])

  const topNames = top.map((t) => t.name)
  const topCounts = top.map((t) => t.count)
  const occupancy = Math.round((metrics.occupancyRate || 0) * 100)

  const barColors = useMemo(() => {
    if (!topNames.length) return []

    const palette = [
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.info.main,
      theme.palette.warning.main,
      theme.palette.error.main,
    ]

    return topNames.map((_, idx) => palette[idx % palette.length])
  }, [topNames, theme])

  const isTopEmpty = !loading && (!top || top.length === 0)
  const isStatusEmpty = !loading && statusDist.every((s) => !s.value || s.value === 0)

  /* ------------------------ RENDER ------------------------ */

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Grid container spacing={3}>
        {/* Header */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h5" fontWeight={700}>
            Panel de métricas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Visión general del coworking (últimos 30 días)
          </Typography>
        </Grid>

        {/* Summary chips */}
        <Grid size={{ xs: 12 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip icon={<MeetingRoom />} label={`Salas / Oficinas / Escritorios: ${metrics.totalSpaces || 0}`} />
            <Chip
              icon={<EventAvailable />}
              color="primary"
              variant="outlined"
              label={`Reservas (últimos 30 días): ${metrics.totalBookings || 0}`}
            />
          </Stack>
        </Grid>

        {/* KPI cards */}
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard
            title="Espacios activos"
            value={metrics.totalSpaces || 0}
            icon={<MeetingRoom fontSize="small" />}
            color={theme.palette.primary.main}
            caption="Espacios publicados y disponibles."
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard
            title="Reservas (últimos 30 días)"
            value={metrics.totalBookings || 0}
            icon={<EventAvailable fontSize="small" />}
            color={theme.palette.success.main}
            caption="Reservas no canceladas en los últimos 30 días."
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{
              p: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              background: () =>
                `linear-gradient(135deg, ${alpha(
                  theme.palette.warning.main,
                  0.18
                )}, ${alpha(theme.palette.warning.main, 0.04)})`,
              borderRadius: 4,
              border: `1.5px solid ${alpha(theme.palette.warning.main, 0.35)}`,
              boxShadow: '0 18px 40px rgba(15,23,42,0.10)',
              transition: '150ms',
              '&:hover': {
                borderColor: alpha(theme.palette.warning.main, 0.75),
                boxShadow: '0 22px 55px rgba(15,23,42,0.18)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Stack direction="row" alignItems="flex-start" spacing={1.5}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.warning.main, 0.16),
                }}
              >
                <QueryStats fontSize="small" htmlColor={theme.palette.warning.dark} />
              </Box>
              <Box flex={1}>
                <Typography
                  variant="subtitle2"
                  color="warning.main"
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
                >
                  Ocupación estimada
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
                  {occupancy}%
                </Typography>
              </Box>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={occupancy}
              sx={{
                height: 10,
                borderRadius: 999,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Porcentaje de ocupación sobre la capacidad total en los últimos 30 días.
            </Typography>
          </Paper>
        </Grid>

        {/* Top + Pie charts */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            sx={{
              p: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Stack direction="row" justifyContent="space-between">
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Top espacios
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Los más reservados (últimos 30 días).
                </Typography>
              </Box>
              <Chip size="small" label={`${top.length} espacios`} variant="outlined" />
            </Stack>

            <Divider sx={{ my: 2 }} />

            {loading ? (
              <LinearProgress />
            ) : isTopEmpty ? (
              <Typography variant="body2" color="text.secondary">
                No hay datos suficientes.
              </Typography>
            ) : (
              <BarChart
                height={320}
                xAxis={[
                  {
                    scaleType: 'band',
                    data: topNames,
                    colorMap: {
                      type: 'ordinal',
                      values: topNames,
                      colors: barColors,
                    },
                  },
                ]}
                series={[
                  {
                    data: topCounts,
                  },
                ]}
                margin={{ left: 48, right: 16, top: 20, bottom: 40 }}
                slotProps={{ legend: { hidden: true } }}
              />
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 2.5, height: '100%', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              Estados de reservas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Distribución de reservas (últimos 30 días).
            </Typography>

            <Divider sx={{ my: 2 }} />

            {loading ? (
              <LinearProgress />
            ) : isStatusEmpty ? (
              <Typography variant="body2" color="text.secondary">
                No hay reservas registradas en los últimos 30 días.
              </Typography>
            ) : (
              <PieChart
                height={320}
                series={[
                  {
                    data: statusDist,
                    innerRadius: 60,
                    outerRadius: 110,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
              />
            )}
          </Paper>
        </Grid>

        {/* Insights */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2.5, height: '100%', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              Insights (últimos 30 días)
            </Typography>

            <Divider sx={{ my: 1 }} />

            <List dense>
              {/* Espacio más reservado */}
              <ListItem>
                <ListItemIcon>
                  <TrendingUp color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    mostBookedSpace ? `Espacio más reservado: ${mostBookedSpace[0]}` : 'No hay datos suficientes.'
                  }
                />
              </ListItem>

              {/* Día más activo */}
              <ListItem>
                <ListItemIcon>
                  <CalendarMonth color="secondary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    busiestDay
                      ? `Día con más reservas: ${dayjs(busiestDay[0]).format('DD/MM/YYYY')}`
                      : 'No hay datos suficientes.'
                  }
                />
              </ListItem>

              {/* Usuario que más reservó */}
              <ListItem>
                <ListItemIcon>
                  <MeetingRoom color="info" />
                </ListItemIcon>
                <ListItemText primary={topUser ? `Usuario más activo: ${topUser[0]}` : 'No hay datos suficientes.'} />
              </ListItem>

              {/* Duración promedio */}
              <ListItem>
                <ListItemIcon>
                  <QueryStats color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary={avgDuration ? `Duración promedio: ${avgDuration} días` : 'No hay datos suficientes.'}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Próximas reservas */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2.5, height: '100%', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              Próximas reservas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Reservas futuras ordenadas por día.
            </Typography>

            <Divider sx={{ my: 2 }} />

            {upcoming.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay reservas futuras.
              </Typography>
            ) : (
              <List dense>
                {upcoming.map((b) => {
                  const name = typeof b.space === 'string' ? b.space : (b.space as any).name
                  return (
                    <ListItem key={b._id}>
                      <ListItemIcon>
                        <EventAvailable />
                      </ListItemIcon>
                      <ListItemText
                        primary={name}
                        secondary={`Del ${dayjs(b.start).format('DD/MM/YYYY')} al ${dayjs(b.end)
                          .subtract(1, 'day')
                          .format('DD/MM/YYYY')}`}
                      />
                    </ListItem>
                  )
                })}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

/* =================== Componentes auxiliares =================== */

function KpiCard({ title, value, icon, color, caption }: any) {
  return (
    <Paper
      sx={{
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        background: () => `linear-gradient(135deg, ${alpha(color, 0.18)}, ${alpha(color, 0.04)})`,
        borderRadius: 4,
        border: `1.5px solid ${alpha(color, 0.35)}`,
        boxShadow: '0 18px 40px rgba(15,23,42,0.10)',
        transition: '150ms',
        '&:hover': {
          borderColor: alpha(color, 0.75),
          boxShadow: '0 22px 55px rgba(15,23,42,0.18)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(color, 0.18),
          }}
        >
          {icon}
        </Box>
        <Box flex={1}>
          <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, color }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
            {value}
          </Typography>
        </Box>
      </Stack>

      {caption && (
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      )}
    </Paper>
  )
}
