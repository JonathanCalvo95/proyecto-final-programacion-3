import { useEffect, useMemo, useState } from 'react'
import Grid from '@mui/material/Grid'
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Divider,
  TextField,
  MenuItem,
  Snackbar,
  Paper,
} from '@mui/material'
import { MeetingRoom, Desk, Apartment, AccessTime, People, MonetizationOn } from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { DateTimePicker } from '@mui/x-date-pickers'
import { getSpaces } from '../../services/spaces'
import { createBooking } from '../../services/bookings'
import type { Space } from '../../types/space.types'
import type { SpaceType } from '../../types/enums'

dayjs.locale('es')

const asArray = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : [])
const TYPE_META: Record<SpaceType, { label: string; Icon: any; color: 'primary' | 'success' | 'warning' }> = {
  meeting_room: { label: 'Sala de reunión', Icon: MeetingRoom, color: 'primary' },
  desk: { label: 'Escritorio', Icon: Desk, color: 'success' },
  private_office: { label: 'Oficina privada', Icon: Apartment, color: 'warning' },
}
const money = (v: number) => v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export default function Spaces() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [start, setStart] = useState<dayjs.Dayjs | null>(null)
  const [end, setEnd] = useState<dayjs.Dayjs | null>(null)
  const [type, setType] = useState<SpaceType | ''>('')
  const [minCap, setMinCap] = useState<number | ''>('')
  const [snack, setSnack] = useState<{ open: boolean; msg: string; error?: boolean }>({ open: false, msg: '' })

  useEffect(() => {
    ;(async () => {
      try {
        const list = await getSpaces()
        setSpaces(asArray(list))
      } catch (e: any) {
        setError(e?.response?.data?.message ?? e?.message ?? 'Error cargando espacios')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const now = dayjs()

  const hours = useMemo(() => {
    if (!start || !end) return 0
    const diff = end.toDate().getTime() - start.toDate().getTime()
    return diff > 0 ? diff / 3600000 : 0
  }, [start, end])

  const filtered = useMemo(() => {
    const list = asArray(spaces)
    return list.filter((s) => {
      if (type && s.type !== type) return false
      if (typeof minCap === 'number' && s.capacity < minCap) return false
      return true
    })
  }, [spaces, type, minCap])

  const startError = !!start && start.isBefore(now)
  const endError = !!start && !!end && (end.isBefore(start) || end.isSame(start))

  async function book(spaceId: string) {
    if (!start || !end) {
      setSnack({ open: true, msg: 'Seleccione inicio y fin', error: true })
      return
    }
    if (startError || endError || hours <= 0) {
      setSnack({ open: true, msg: 'Rango de fechas inválido', error: true })
      return
    }
    try {
      await createBooking(spaceId, start.toISOString(), end.toISOString())
      setSnack({ open: true, msg: 'Reserva creada' })
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data || e?.message || 'Error al reservar'
      setSnack({ open: true, msg, error: true })
    }
  }

  if (loading) {
    return (
      <Grid container justifyContent="center" sx={{ p: 3 }}>
        <CircularProgress />
      </Grid>
    )
  }

  if (error) {
    return (
      <Grid container sx={{ p: 2 }}>
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Grid>
    )
  }

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
            <Stack spacing={2}>
              <DateTimePicker
                label="Inicio"
                value={start}
                onChange={setStart}
                ampm={false}
                disablePast
                minutesStep={15}
                format="DD/MM/YYYY HH:mm"
                shouldDisableDate={(date) => {
                  const d = date.day()
                  return d === 0 || d === 6 // domingo(0) y sábado(6)
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    variant: 'outlined',
                    placeholder: 'DD/MM/AAAA HH:mm',
                  },
                  actionBar: { actions: ['clear', 'accept'] },
                }}
              />
              <DateTimePicker
                label="Fin"
                value={end}
                onChange={setEnd}
                ampm={false}
                minutesStep={15}
                minDateTime={start && start.isAfter(now) ? start : now}
                format="DD/MM/YYYY HH:mm"
                shouldDisableDate={(date) => {
                  const d = date.day()
                  return d === 0 || d === 6
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    variant: 'outlined',
                    placeholder: 'DD/MM/AAAA HH:mm',
                  },
                  actionBar: { actions: ['clear', 'accept'] },
                }}
              />
              {startError && <Alert severity="warning">El inicio debe ser futuro</Alert>}
              {endError && <Alert severity="warning">El fin debe ser posterior al inicio</Alert>}
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <TextField
              label="Tipo"
              select
              value={type}
              onChange={(e) => setType(e.target.value as SpaceType | '')}
              sx={{ minWidth: 200 }}
              size="small"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="meeting_room">Sala de reunión</MenuItem>
              <MenuItem value="desk">Escritorio</MenuItem>
              <MenuItem value="private_office">Oficina privada</MenuItem>
            </TextField>
            <TextField
              label="Capacidad mínima"
              type="number"
              value={minCap}
              onChange={(e) => setMinCap(e.target.value === '' ? '' : Number(e.target.value))}
              sx={{ width: 200 }}
              size="small"
            />
            <Chip icon={<AccessTime fontSize="small" />} label={`${hours.toFixed(1)} h`} variant="outlined" />
          </Stack>
        </Grid>

        {filtered.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="info">No hay espacios disponibles con esos filtros.</Alert>
          </Grid>
        )}

        {filtered.map((s) => {
          const meta = TYPE_META[s.type]
          const Icon = meta.Icon
          const estimate = hours > 0 ? s.hourlyRate * hours : 0
          return (
            <Grid size={{ xs: 12, md: 6 }} key={s._id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: 1,
                  height: '100%',
                  transition: 'all .2s ease',
                  '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                  outline: '1px solid',
                  outlineColor: (t) => alpha(t.palette.divider, 0.6),
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar
                      sx={(t) => ({
                        bgcolor: alpha(t.palette[meta.color].main, 0.15),
                        color: t.palette[meta.color].main,
                      })}
                    >
                      <Icon />
                    </Avatar>
                  }
                  titleTypographyProps={{ variant: 'h6' }}
                  subheaderTypographyProps={{ variant: 'caption' }}
                  title={s.name}
                  subheader={meta.label}
                  sx={{ pb: 1, '& .MuiCardHeader-title': { fontWeight: 600 } }}
                />
                <CardContent sx={{ pt: 0 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip size="small" icon={<People />} label={`Capacidad: ${s.capacity}`} variant="outlined" />
                    <Chip
                      size="small"
                      icon={<MonetizationOn />}
                      label={`${money(s.hourlyRate)}/h`}
                      variant="outlined"
                    />
                    {hours > 0 && (
                      <Chip size="small" color="primary" variant="outlined" label={`Estimado: ${money(estimate)}`} />
                    )}
                  </Stack>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                  <Button
                    variant="contained"
                    disabled={!start || !end || hours <= 0 || startError || endError}
                    onClick={() => book(s._id)}
                  >
                    Reservar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )
        })}
      </Grid>
      <Snackbar
        open={snack.open}
        onClose={() => setSnack({ open: false, msg: '' })}
        autoHideDuration={3000}
        message={snack.msg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        color={snack.error ? 'error' : (undefined as any)}
      />
    </>
  )
}
