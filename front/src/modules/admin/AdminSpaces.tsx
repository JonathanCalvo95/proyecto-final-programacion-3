import { useEffect, useState } from 'react'
import {
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material'
import api from '../../services/api'
import type { Space } from '../../types'

export default function AdminSpaces() {
  const [data, setData] = useState<Space[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Space | null>(null)
  const [form, setForm] = useState<any>({
    title: '',
    type: 'meeting_room',
    capacity: 1,
    hourlyRate: 0,
    amenities: [],
    description: '',
  })

  const load = () => api.get('/spaces').then((r) => setData(r.data))
  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setEditing(null)
    setForm({ title: '', type: 'meeting_room', capacity: 1, hourlyRate: 0, amenities: [], description: '' })
    setOpen(true)
  }
  function openEdit(s: Space) {
    setEditing(s)
    setForm({ ...s, amenities: s.amenities || [] })
    setOpen(true)
  }

  async function submit() {
    const payload = {
      ...form,
      amenities: (form.amenities || '')
        .split(',')
        .map((x: string) => x.trim())
        .filter(Boolean),
    }
    try {
      if (editing) {
        await api.put(`/spaces/${editing._id}`, payload)
      } else {
        await api.post('/spaces', payload)
      }
      setOpen(false)
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error')
    }
  }

  async function remove(s: Space) {
    if (!confirm('Eliminar espacio?')) return
    await api.delete(`/spaces/${s._id}`)
    load()
  }

  return (
    <>
      <Button variant="contained" sx={{ mb: 2 }} onClick={openNew}>
        Nuevo espacio
      </Button>
      <Grid container spacing={2}>
        {data.map((s) => (
          <Grid item xs={12} md={6} key={s._id}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{s.title}</Typography>
              <Typography variant="caption">{s.type}</Typography>
              <Typography>Capacidad: {s.capacity}</Typography>
              <Typography>Tarifa: ${s.hourlyRate}/h</Typography>
              <Typography>Amenidades: {s.amenities?.join(', ') || '-'}</Typography>
              <Button size="small" onClick={() => openEdit(s)}>
                Editar
              </Button>
              <Button size="small" color="error" onClick={() => remove(s)}>
                Eliminar
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Editar espacio' : 'Nuevo espacio'}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            label="Título"
            fullWidth
            margin="normal"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <TextField
            label="Tipo"
            select
            fullWidth
            margin="normal"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <MenuItem value="meeting_room">Sala de reunión</MenuItem>
            <MenuItem value="desk">Escritorio</MenuItem>
            <MenuItem value="private_office">Oficina privada</MenuItem>
          </TextField>
          <TextField
            label="Capacidad"
            type="number"
            fullWidth
            margin="normal"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
          />
          <TextField
            label="Tarifa por hora"
            type="number"
            fullWidth
            margin="normal"
            value={form.hourlyRate}
            onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
          />
          <TextField
            label="Amenidades (coma)"
            fullWidth
            margin="normal"
            value={form.amenities}
            onChange={(e) => setForm({ ...form, amenities: e.target.value })}
          />
          <TextField
            label="Descripción"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={submit}>
            {editing ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
