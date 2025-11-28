import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Stack,
  TextField,
  Typography,
  Button,
  Alert,
  Snackbar,
  Grid,
  Divider,
  CircularProgress,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import dayjs from 'dayjs'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getMyBookings } from '../../services/bookings'
import { createPayment } from '../../services/payments'
import type { Booking } from '../../types/booking.types'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

export default function PayBooking() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [cardNumber, setCardNumber] = useState('')
  const [brandHint, setBrandHint] = useState<'' | 'Visa' | 'Mastercard' | 'Amex'>('')
  const [cardHolder, setCardHolder] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [snack, setSnack] = useState<{ open: boolean; msg: string; error?: boolean }>({
    open: false,
    msg: '',
  })

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const list = await getMyBookings()
        const b = (Array.isArray(list) ? list : []).find((x) => x._id === bookingId)
        if (!b) {
          setError('Reserva no encontrada')
        } else {
          setBooking(b)
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Error cargando reserva')
      } finally {
        setLoading(false)
      }
    })()
  }, [bookingId])

  function attemptOpenConfirm() {
    if (!booking) return
    if (!/^.{3,}$/.test(cardHolder.trim())) {
      setSnack({ open: true, msg: 'Titular inválido', error: true })
      return
    }
    if (!/^([0-1][0-9])\/(\d{2})$/.test(expiry)) {
      setSnack({ open: true, msg: 'Expiración inválida (MM/YY)', error: true })
      return
    }
    if (!/^[0-9]{3,4}$/.test(cvv)) {
      setSnack({ open: true, msg: 'CVV inválido', error: true })
      return
    }
    setConfirmOpen(true)
  }

  async function pay() {
    if (!booking) return

    const digits = cardNumber.replace(/\D/g, '')

    if (!/^.{3,}$/.test(cardHolder.trim())) {
      setSnack({ open: true, msg: 'Titular inválido', error: true })
      return
    }
    if (!/^([0-1][0-9])\/(\d{2})$/.test(expiry)) {
      setSnack({ open: true, msg: 'Expiración inválida (MM/YY)', error: true })
      return
    }
    if (!/^[0-9]{3,4}$/.test(cvv)) {
      setSnack({ open: true, msg: 'CVV inválido', error: true })
      return
    }

    setSaving(true)
    try {
      await createPayment({
        bookingId: booking._id,
        cardNumber: digits,
        cardHolder: cardHolder.trim(),
        expiry,
        cvv,
      })
      setSnack({ open: true, msg: 'Pago registrado' })
      setTimeout(() => navigate('/bookings', { replace: true }), 800)
    } catch (e: any) {
      setSnack({
        open: true,
        msg: e?.response?.data?.message || 'Error al pagar',
        error: true,
      })
    } finally {
      setSaving(false)
    }
  }

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
          Cargando información de la reserva...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box
        sx={{
          maxWidth: 640,
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
          <Alert severity="error">{error}</Alert>
          <Box mt={2}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/bookings')} size="small">
              Volver a mis reservas
            </Button>
          </Box>
        </Paper>
      </Box>
    )
  }

  if (!booking) return null

  const start = dayjs(booking.start).format('DD/MM/YYYY')
  const end = dayjs(booking.end).subtract(1, 'day').format('DD/MM/YYYY')
  const amountFormatted = booking.amount.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  })

  return (
    <>
      <Box>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Pagar reserva
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Revisa el detalle y completa los datos de la tarjeta para marcar la reserva como pagada.
            </Typography>
          </Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/bookings')}
            size="small"
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Volver
          </Button>
        </Stack>

        <Grid container spacing={3} alignItems="flex-start">
          {/* Resumen de la reserva */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 3,
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.14
                )}, ${alpha(theme.palette.background.paper, 0.98)})`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                boxShadow: 3,
              }}
            >
              <Typography variant="overline" color="text.secondary">
                Detalle de la reserva
              </Typography>
              <Typography variant="h6" fontWeight={600} mt={0.5}>
                {typeof booking.space === 'object' ? (booking.space as any).name : `Reserva #${booking._id.slice(-6)}`}
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Stack spacing={1.2}>
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
                    {amountFormatted}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Formulario de pago */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: 3,
                borderColor: alpha(theme.palette.divider, 0.8),
                background: (t) => alpha(t.palette.background.paper, 0.96),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {brandHint ? (
                    <img
                      src={
                        brandHint === 'Visa'
                          ? 'https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat-rounded/visa.svg'
                          : brandHint === 'Mastercard'
                            ? 'https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat-rounded/mastercard.svg'
                            : 'https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat-rounded/amex.svg'
                      }
                      alt={brandHint}
                      width={48}
                      height={48}
                      style={{ borderRadius: 8, display: 'block' }}
                    />
                  ) : (
                    <CreditCardIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Datos de pago
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tus datos no se almacenan, se usan solo para validar el pago.
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2}>
                <TextField
                  label="Número de tarjeta"
                  value={cardNumber}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 19)
                    const grouped = raw.replace(/(.{4})/g, '$1 ').trim()
                    setCardNumber(grouped)
                    // Detectar marca básica por BIN/IIN
                    const digits = raw
                    const isVisa = /^4/.test(digits)
                    const isMaster = /^(5[1-5]|2[2-7])/.test(digits)
                    const isAmex = /^3[47]/.test(digits)
                    const brand = isVisa ? 'Visa' : isMaster ? 'Mastercard' : isAmex ? 'Amex' : ''
                    setBrandHint(brand)
                  }}
                  placeholder="4111 1111 1111 1111"
                  fullWidth
                  size="small"
                  inputProps={{ maxLength: 23 }}
                  helperText={`Entre 13 y 19 dígitos • Actual: ${cardNumber.replace(/\D/g, '').length}`}
                  error={(() => {
                    const len = cardNumber.replace(/\D/g, '').length
                    return len > 0 && (len < 13 || len > 19)
                  })()}
                />
                <TextField
                  label="Titular"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Nombre Apellido"
                  fullWidth
                  size="small"
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Expiración (MM/YY)"
                    value={expiry}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                      if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2)
                      setExpiry(v)
                    }}
                    placeholder="08/28"
                    fullWidth
                    size="small"
                    inputProps={{ maxLength: 5 }}
                    helperText="Formato MM/YY"
                    error={expiry.length === 5 && !/^([0-1][0-9])\/\d{2}$/.test(expiry)}
                  />
                  <TextField
                    label="CVV"
                    value={cvv}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setCvv(v)
                    }}
                    placeholder="123"
                    fullWidth
                    size="small"
                    inputProps={{ maxLength: 4 }}
                    helperText="3 o 4 dígitos"
                    error={cvv.length > 0 && (cvv.length < 3 || cvv.length > 4)}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mt={1} justifyContent="flex-end">
                  <Button
                    onClick={() => navigate('/bookings')}
                    disabled={saving}
                    variant="text"
                    startIcon={<ArrowBackIcon />}
                    sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={attemptOpenConfirm}
                    disabled={saving}
                    startIcon={!saving ? <CreditCardIcon /> : undefined}
                    sx={{
                      alignSelf: { xs: 'stretch', sm: 'center' },
                      minWidth: 160,
                    }}
                  >
                    {saving ? 'Procesando...' : 'Confirmar pago'}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>

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

      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar pago"
        confirmText="Confirmar pago"
        loading={saving}
        onClose={() => !saving && setConfirmOpen(false)}
        onConfirm={() => pay()}
        content={
          booking ? (
            <Stack spacing={1.5}>
              <Typography variant="body2">
                {typeof booking.space === 'object' ? (booking.space as any).name : `Reserva #${booking._id.slice(-6)}`}{' '}
                — Importe <strong>{amountFormatted}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tarjeta: **** **** **** {cardNumber.replace(/\D/g, '').slice(-4)} • Exp: {expiry} • Titular:{' '}
                {cardHolder || '—'}
              </Typography>
              <Alert severity="info" variant="outlined">
                Se marcará la reserva como pagada inmediatamente.
              </Alert>
            </Stack>
          ) : null
        }
      />
    </>
  )
}
