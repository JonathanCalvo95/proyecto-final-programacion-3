import { useEffect, useState } from 'react'
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
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import dayjs from 'dayjs'
import { getMyBookings, cancelBooking } from '../../services/bookings'
import api from '../../services/api'
import type { Booking } from '../../types/booking.types'

export default function MyBookings() {
  const [data, setData] = useState<Booking[]>([])
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Booking | null>(null)
  const [start, setStart] = useState<dayjs.Dayjs | null>(null)
  const [end, setEnd] = useState<dayjs.Dayjs | null>(null)

  const load = async () => setData(await getMyBookings())
  useEffect(() => {
    load()
  }, [])

  async function cancel(id: string) {
    try {
      await cancelBooking(id)
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error al cancelar')
    }
  }

  async function reschedule() {
    if (!current || !start || !end) return
    try {
      await api.patch(`/bookings/${current._id}/reschedule`, {
        start: start.toISOString(),
        end: end.toISOString(),
      })
      setOpen(false)
      setCurrent(null)
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error al reprogramar')
    }
  }

  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Espacio</TableCell>
              <TableCell>Inicio</TableCell>
              <TableCell>Fin</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((r) => (
              <TableRow key={r._id}>
                <TableCell>{typeof r.space === 'string' ? r.space : r.space.name}</TableCell>
                <TableCell>{dayjs(r.start).format('YYYY-MM-DD HH:mm')}</TableCell>
                <TableCell>{dayjs(r.end).format('YYYY-MM-DD HH:mm')}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    onClick={() => {
                      setCurrent(r)
                      setStart(dayjs(r.start))
                      setEnd(dayjs(r.end))
                      setOpen(true)
                    }}
                  >
                    Reprogramar
                  </Button>
                  <Button size="small" color="error" onClick={() => cancel(r._id)}>
                    Cancelar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Reprogramar</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <DateTimePicker label="Inicio" value={start} onChange={setStart} />
          <DateTimePicker label="Fin" value={end} onChange={setEnd} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cerrar</Button>
          <Button onClick={reschedule} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
