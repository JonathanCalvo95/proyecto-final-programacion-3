import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Paper, Stack, Typography, Divider, Button, Alert, CircularProgress, Chip } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import dayjs from 'dayjs'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import type { Booking } from '../../types/booking.types'
import type { Payment } from '../../types/payment.types'
import { getMyBookings, getBookings } from '../../services/bookings'
import { getMyPayments } from '../../services/payments'
import { useAuth } from '../../context/AuthContext'
import type { SpaceType } from '../../types/enums'
import { SPACE_TYPE_META as TYPE_META } from '../../constants/spaceTypeMeta'

export default function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const { user } = useAuth()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        let bookings: Booking[] = []

        if (user?.role === 'admin') {
          const all = await getBookings()
          bookings = Array.isArray(all) ? all : []
        } else {
          const mine = await getMyBookings()
          bookings = Array.isArray(mine) ? mine : []
        }

        const b = bookings.find((x) => x._id === id)
        if (!b) {
          setError('Reserva no encontrada')
        } else {
          setBooking(b)
          try {
            const payments = await getMyPayments()
            const pmList = Array.isArray(payments) ? payments : []
            const pm = pmList.find((p) => p.booking === b._id)
            setPayment(pm || null)
          } catch {
            setPayment(null)
          }
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Error cargando reserva')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, user])

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={28} />
        <Typography variant="body2" color="text.secondary">
          Cargando detalle de la reserva...
        </Typography>
      </Box>
    )
  }

  if (error || !booking) {
    return (
      <Box
        sx={{
          maxWidth: 720,
          mx: 'auto',
          mt: { xs: 4, md: 8 },
          px: { xs: 2, md: 0 },
        }}
      >
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            boxShadow: 3,
            background: (t) => alpha(t.palette.error.light, 0.04),
          }}
        >
          <Alert severity="error">{error || 'Reserva no encontrada'}</Alert>
          <Box mt={2}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => {
                if (user?.role === 'admin') {
                  navigate('/admin/bookings')
                } else {
                  navigate('/bookings')
                }
              }}
              size="small"
            >
              Volver a {user?.role === 'admin' ? 'gestión de reservas' : 'mis reservas'}
            </Button>
          </Box>
        </Paper>
      </Box>
    )
  }

  // Datos de espacio / usuario
  const spaceObj = typeof booking.space === 'object' ? (booking.space as any) : null
  const spaceName = spaceObj?.name ?? String(booking.space)
  const spaceType = (spaceObj?.type as SpaceType | undefined) ?? 'meeting_room'
  const spaceMeta = TYPE_META[spaceType]
  const SpaceIcon = spaceMeta.Icon

  const userObj = typeof booking.user === 'object' ? (booking.user as any) : null
  const userLabel =
    userObj && (userObj.firstName || userObj.lastName || userObj.email)
      ? `${[userObj.firstName, userObj.lastName].filter(Boolean).join(' ') || userObj.email}`
      : user?.role === 'client'
        ? 'Vos'
        : String(booking.user)

  // Fechas: misma convención que en el resto de la app
  const today = dayjs().startOf('day')
  const startDate = dayjs(booking.start)
  const endDisplayDate = dayjs(booking.end).subtract(1, 'day').startOf('day') // fin inclusivo

  const start = startDate.format('DD/MM/YYYY')
  const end = endDisplayDate.format('DD/MM/YYYY')

  const amount = booking.amount.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  })

  const isCanceled = booking.status === 'canceled'
  const isVencida = !isCanceled && !payment && endDisplayDate.isBefore(today)

  let statusLabel: string
  let statusColor: 'default' | 'success' | 'warning' | 'error'

  if (isCanceled) {
    statusLabel = 'Cancelada'
    statusColor = 'error'
  } else if (isVencida) {
    statusLabel = 'Vencida'
    statusColor = 'default'
  } else if (payment) {
    statusLabel = 'Pago registrado'
    statusColor = 'success'
  } else {
    statusLabel = 'Pendiente de pago'
    statusColor = 'warning'
  }

  const paymentBgColor = payment
    ? alpha(theme.palette.success.main, 0.04)
    : isCanceled
      ? alpha(theme.palette.error.main, 0.04)
      : isVencida
        ? alpha(theme.palette.grey[500], 0.06)
        : alpha(theme.palette.warning.main, 0.04)

  const paymentBorderColor = payment
    ? alpha(theme.palette.success.main, 0.35)
    : isCanceled
      ? alpha(theme.palette.error.main, 0.35)
      : isVencida
        ? alpha(theme.palette.grey[500], 0.35)
        : alpha(theme.palette.warning.main, 0.35)

  const paymentTitleColor = payment
    ? 'success.main'
    : isCanceled
      ? 'error.main'
      : isVencida
        ? 'text.secondary'
        : 'warning.main'

  return (
    <Box
      sx={{
        maxWidth: 960,
        mx: 'auto',
        mt: { xs: 3, md: 6 },
        px: { xs: 1.5, md: 0 },
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Detalle de la reserva
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Información completa de tu reserva y su estado de pago.
          </Typography>
        </Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            if (user?.role === 'admin') {
              navigate('/admin/bookings')
            } else {
              navigate('/bookings')
            }
          }}
          size="small"
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          Volver a {user?.role === 'admin' ? 'gestión de reservas' : 'mis reservas'}
        </Button>
      </Stack>

      <Paper
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 3,
          boxShadow: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
          background: (t) => alpha(t.palette.background.paper, 0.98),
        }}
      >
        {/* Cabecera de la tarjeta */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={1.5}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" fontWeight={700}>
                {spaceName}
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                color={spaceMeta.color}
                icon={<SpaceIcon fontSize="small" />}
                label={spaceMeta.label}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Reservada por <strong>{userLabel}</strong>
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label={statusLabel}
              color={statusColor}
              variant="filled"
              size="small"
              sx={{ textTransform: 'uppercase', fontWeight: 600 }}
            />
          </Stack>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        {/* Contenido principal */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
          {/* Columna izquierda: datos de reserva */}
          <Stack spacing={1.75} flex={1}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Período
              </Typography>
              <Typography variant="body2">
                Desde <strong>{start}</strong> hasta <strong>{end}</strong>
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Importe
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {amount}
              </Typography>
            </Box>
          </Stack>

          {/* Columna derecha: información de pago */}
          <Box
            sx={{
              flex: 1,
              width: '100%',
              borderRadius: 2.5,
              p: 2,
              backgroundColor: paymentBgColor,
              border: `1px solid ${paymentBorderColor}`,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} color={paymentTitleColor} gutterBottom>
              Estado de pago
            </Typography>

            {payment ? (
              isCanceled ? (
                <Stack spacing={0.75}>
                  <Typography variant="body2">
                    La reserva fue cancelada. Existe un pago registrado el{' '}
                    <strong>{dayjs(payment.createdAt).format('DD/MM/YYYY')}</strong>.
                  </Typography>
                  <Typography variant="body2">
                    Tarjeta <strong>{payment.brand}</strong> • ****{payment.last4}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    La gestión de reembolsos se realiza por fuera de este panel.
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={0.75}>
                  <Typography variant="body2">
                    Pago registrado el <strong>{dayjs(payment.createdAt).format('DD/MM/YYYY')}</strong>.
                  </Typography>
                  <Typography variant="body2">
                    Tarjeta <strong>{payment.brand}</strong> • ****{payment.last4}
                  </Typography>
                </Stack>
              )
            ) : isCanceled ? (
              <Stack spacing={0.75}>
                <Typography variant="body2">La reserva fue cancelada.</Typography>
              </Stack>
            ) : isVencida ? (
              <Stack spacing={0.75}>
                <Typography variant="body2">La reserva venció sin registrarse un pago en el sistema.</Typography>
                <Typography variant="caption" color="text.secondary">
                  No es posible registrar pagos sobre reservas vencidas.
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={0.75}>
                <Typography variant="body2">Esta reserva aún no tiene un pago asociado en el sistema.</Typography>
              </Stack>
            )}
          </Box>
        </Stack>
      </Paper>
    </Box>
  )
}
