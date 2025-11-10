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
  CircularProgress,
  Alert,
  Stack,
  Box,
} from '@mui/material'
import { getSpaces, createSpace, updateSpace, deleteSpace } from '../../services/spaces'
import type { Space } from '../../types/space.types'
import { SPACE_TYPE, type SpaceType } from '../../types/enums'

type SpaceForm = {
  name: string
  type: SpaceType
  capacity: number
  hourlyRate: number
}

const EMPTY_FORM: SpaceForm = {
  name: '',
  type: SPACE_TYPE.MEETING_ROOM,
  capacity: 1,
  hourlyRate: 0,
}

export default function AdminSpaces() {
  const [data, setData] = useState<Space[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Space | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<SpaceForm>(EMPTY_FORM)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const list = await getSpaces()
      setData(Array.isArray(list) ? list : [])
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error cargando espacios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setOpen(true)
  }

  function openEdit(s: Space) {
    setEditing(s)
    setForm({
      name: s.name ?? '',
      type: s.type as SpaceForm['type'],
      capacity: s.capacity,
      hourlyRate: s.hourlyRate,
    })
    setOpen(true)
  }

  async function submit() {
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      type: form.type,
      capacity: Number(form.capacity) || 0,
      hourlyRate: Number(form.hourlyRate) || 0,
    }

    try {
      if (editing) {
        await updateSpace(editing._id, payload)
      } else {
        await createSpace(payload)
      }
      setOpen(false)
      await load()
    } catch (e: any) {
      const status = e?.response?.status
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error guardando'
      setError(status ? `${status}: ${msg}` : msg)
    } finally {
      setSaving(false)
    }
  }

  async function remove(s: Space) {
    if (!confirm('Eliminar espacio?')) return
    try {
      await deleteSpace(s._id)
      await load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error eliminando')
    }
  }

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={openNew}>
          Nuevo espacio
        </Button>
        <Button variant="outlined" onClick={load} disabled={loading}>
          Recargar
        </Button>
      </Stack>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {data.map((s) => (
          <Grid size={{ xs: 12, md: 6 }} key={s._id}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{s.name}</Typography>
              <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                {s.type}
              </Typography>
              <Typography>Capacidad: {s.capacity}</Typography>
              <Typography>Tarifa: ${s.hourlyRate}/h</Typography>
              <Stack direction="row" spacing={1} mt={1}>
                <Button size="small" onClick={() => openEdit(s)}>
                  Editar
                </Button>
                <Button size="small" color="error" onClick={() => remove(s)}>
                  Eliminar
                </Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
        {!loading && data.length === 0 && !error && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2">No hay espacios.</Typography>
          </Grid>
        )}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Editar espacio' : 'Nuevo espacio'}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            label="Nombre"
            fullWidth
            margin="normal"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <TextField
            label="Tipo"
            select
            fullWidth
            margin="normal"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as SpaceForm['type'] })}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={submit} disabled={saving}>
            {saving ? 'Guardando...' : editing ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
