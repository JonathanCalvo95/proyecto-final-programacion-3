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
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { MeetingRoom, EventAvailable, QueryStats, CalendarMonth, TrendingUp } from '@mui/icons-material'
import { BarChart, PieChart } from '@mui/x-charts'
import { getMetrics, getTopSpaces } from '../../services/admin'
import { getBookings } from '../../services/bookings'
import dayjs from 'dayjs'

type Metrics = {
  totalSpaces?: number
  totalBookings?: number
  occupancyRate?: number
}

export default function AdminDashboard() {
  const theme = useTheme()
  const [metrics, setMetrics] = useState<Metrics>({})
  const [top, setTop] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const [m, t, b] = await Promise.all([getMetrics(), getTopSpaces(), getBookings()])

        setMetrics(m || {})
        setTop(Array.isArray(t) ? t : [])
        setBookings(Array.isArray(b) ? b : [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  /* ------------------------ INSIGHTS ------------------------ */

  const mostBookedSpace = useMemo(() => {
    if (!bookings.length) return null
    const map: Record<string, number> = {}

    for (const b of bookings) {
      const name = typeof b.space === 'string' ? b.space : b.space.name
      map[name] = (map[name] || 0) + 1
    }

    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    return sorted[0]
  }, [bookings])

  const busiestDay = useMemo(() => {
    if (!bookings.length) return null
    const map: Record<string, number> = {}

    for (const b of bookings) {
      const start = dayjs(b.start).format('YYYY-MM-DD')
      map[start] = (map[start] || 0) + 1
    }

    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    return sorted[0]
  }, [bookings])

  /* ------------------------ STATUS CHART ------------------------ */

  const statusDist = useMemo(() => {
    const map: Record<'pending' | 'confirmed' | 'canceled', number> = {
      pending: 0,
      confirmed: 0,
      canceled: 0,
    }

    for (const b of bookings) {
      const status = b.status as 'pending' | 'confirmed' | 'canceled'
      if (status in map) map[status]++
    }

    return [
      { id: 'pending', label: 'Pendiente', value: map.pending, color: theme.palette.warning.main },
      { id: 'confirmed', label: 'Confirmada', value: map.confirmed, color: theme.palette.success.main },
      { id: 'canceled', label: 'Cancelada', value: map.canceled, color: theme.palette.error.main },
    ]
  }, [bookings, theme])

  /* ------------------------ NEXT BOOKINGS (timeline) ------------------------ */

  const upcoming = useMemo(() => {
    const today = dayjs().startOf('day')
    return bookings
      .filter((b) => dayjs(b.start).startOf('day').isAfter(today))
      .sort((a, b) => dayjs(a.start).diff(dayjs(b.start)))
      .slice(0, 6)
  }, [bookings])

  const topNames = top.map((t) => t.name)
  const topCounts = top.map((t) => t.count)
  const occupancy = Math.round((metrics.occupancyRate || 0) * 100)

  const isTopEmpty = !loading && (!top || top.length === 0)
  const isStatusEmpty = !loading && statusDist.every((s) => !s.value || s.value === 0)

  /* ------------------------ RENDER ------------------------ */

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
              label={`Reservas: ${metrics.totalBookings || 0}`}
            />
            <Chip icon={<TrendingUp />} color="success" variant="outlined" label={`Ocupación: ${occupancy}%`} />
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
            title="Reservas activas"
            value={metrics.totalBookings || 0}
            icon={<EventAvailable fontSize="small" />}
            color={theme.palette.success.main}
            caption="Reservas futuras y en curso."
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
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.warning.main,
                0.12
              )}, ${alpha(theme.palette.warning.main, 0.04)})`,
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
                <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
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
              Calculado según reservas del último mes.
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
                  Los más reservados del mes.
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
                xAxis={[{ scaleType: 'band', data: topNames }]}
                series={[{ data: topCounts, color: theme.palette.primary.main }]}
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
              Distribución general.
            </Typography>

            <Divider sx={{ my: 2 }} />

            {loading ? (
              <LinearProgress />
            ) : isStatusEmpty ? (
              <Typography variant="body2" color="text.secondary">
                No hay reservas registradas.
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
              Insights
            </Typography>
            <Divider sx={{ my: 1 }} />
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <TrendingUp color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={mostBookedSpace ? `Espacio más reservado: ${mostBookedSpace[0]}` : 'Sin datos suficientes'}
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <CalendarMonth color="secondary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    busiestDay
                      ? `Día con más reservas: ${dayjs(busiestDay[0]).format('DD/MM/YYYY')}`
                      : 'Sin datos suficientes'
                  }
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
              Las reservas ordenadas por día.
            </Typography>

            <Divider sx={{ my: 2 }} />

            {upcoming.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay reservas futuras.
              </Typography>
            ) : (
              <List dense>
                {upcoming.map((b) => {
                  const name = typeof b.space === 'string' ? b.space : b.space.name
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
        background: (t) => `linear-gradient(135deg, ${alpha(color, 0.14)}, ${alpha(color, 0.04)})`,
        borderRadius: 3,
        border: '1px solid rgba(148,163,184,0.35)',
        transition: '150ms ease',
        '&:hover': {
          borderColor: 'rgba(129,140,248,0.75)',
          boxShadow: '0 22px 55px rgba(15,23,42,0.12)',
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
