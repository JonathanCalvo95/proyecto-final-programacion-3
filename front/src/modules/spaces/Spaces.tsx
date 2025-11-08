import { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'
import { Card, CardContent, Typography, Button, Stack, Alert, CircularProgress } from '@mui/material'
import dayjs from 'dayjs'
import { DateTimePicker } from '@mui/x-date-pickers'
import api from '../../services/api'
import type { Space } from '../../types'

const asArray = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : [])

export default function Spaces() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [start, setStart] = useState<dayjs.Dayjs | null>(null)
  const [end, setEnd] = useState<dayjs.Dayjs | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await api.get('/spaces')
        // Soporta tanto {data: []} como []
        const list = Array.isArray(r.data) ? r.data : r.data?.data
        setSpaces(asArray(list))
      } catch (e: any) {
        setError(e?.response?.data?.message ?? e?.message ?? 'Error cargando espacios')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function reserve(spaceId: string) {
    if (!start || !end) {
      alert('Seleccione rango')
      return
    }
    try {
      await api.post('/reservations', {
        spaceId,
        start: start.toISOString(),
        end: end.toISOString(),
      })
      alert('Reserva creada')
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error al reservar')
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
        <Alert severity="error">{error}</Alert>
      </Grid>
    )
  }

  const list = asArray(spaces)

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Stack spacing={2} mb={2}>
          <DateTimePicker label="Inicio" value={start} onChange={setStart} />
          <DateTimePicker label="Fin" value={end} onChange={setEnd} />
        </Stack>
      </Grid>

      {list.length === 0 && (
        <Grid size={{ xs: 12 }}>
          <Typography color="text.secondary" sx={{ p: 2 }}>
            No hay espacios disponibles.
          </Typography>
        </Grid>
      )}

      {list.map((s) => (
        <Grid size={{ xs: 12, md: 6 }} key={s._id}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                {s.title} - ${s.hourlyRate}/h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {s.type}
              </Typography>
              <Typography>Capacidad: {s.capacity}</Typography>
              <Typography>Amenidades: {asArray(s.amenities).join(', ') || '-'}</Typography>
              <Button sx={{ mt: 1 }} variant="contained" onClick={() => reserve(s._id)}>
                Reservar
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
