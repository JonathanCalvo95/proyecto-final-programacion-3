import { useEffect, useState } from 'react'
import { Grid, Card, CardContent, Typography, Button, Stack } from '@mui/material'
import api from '../../services/api'
import type { Space } from '../../types'
import dayjs from 'dayjs'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'

export default function Spaces() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [start, setStart] = useState<dayjs.Dayjs | null>(null)
  const [end, setEnd] = useState<dayjs.Dayjs | null>(null)

  useEffect(() => {
    api.get('/spaces').then((r) => setSpaces(r.data))
  }, [])

  async function reserve(spaceId: string) {
    if (!start || !end) return alert('Seleccione rango')
    try {
      await api.post('/reservations', { spaceId, start: start.toISOString(), end: end.toISOString() })
      alert('Reserva creada')
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error al reservar')
    }
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Stack spacing={2} mb={2}>
          <DateTimePicker label="Inicio" value={start} onChange={setStart} />
          <DateTimePicker label="Fin" value={end} onChange={setEnd} />
        </Stack>
      </Grid>
      {spaces.map((s) => (
        <Grid item xs={12} md={6} key={s._id}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                {s.title} - ${s.hourlyRate}/h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {s.type}
              </Typography>
              <Typography>Capacidad: {s.capacity}</Typography>
              <Typography>Amenidades: {s.amenities?.join(', ') || '-'}</Typography>
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
