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
  Card,
  CardHeader,
  CardContent,
  Chip,
  Divider,
  Avatar,
  Tooltip,
} from '@mui/material'
import { MeetingRoom, Desk, Apartment, Edit, Delete } from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
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

const TYPE_META: Record<SpaceType, { label: string; Icon: any; color: 'primary' | 'success' | 'warning' }> = {
  meeting_room: { label: 'Sala de reunión', Icon: MeetingRoom, color: 'primary' },
  desk: { label: 'Escritorio', Icon: Desk, color: 'success' },
  private_office: { label: 'Oficina privada', Icon: Apartment, color: 'warning' },
}

const money = (v: number) => v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export default function AdminSpaces() {
  const [data, setData] = useState<Space[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Space | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<SpaceForm>(EMPTY_FORM)
  // Modal de eliminación
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Space | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  // Abrir modal de eliminación
  function askRemove(s: Space) {
    setToDelete(s)
    setDeleteOpen(true)
  }

  // Confirmar eliminación
  async function confirmRemove() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteSpace(toDelete._id)
      setDeleteOpen(false)
      setToDelete(null)
      await load()
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Error eliminando'
      setError(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={openNew}>
          Nuevo espacio
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
        {data.map((s) => {
          const meta = TYPE_META[s.type as SpaceType] ?? TYPE_META.meeting_room
          const Icon = meta.Icon
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
                    <Chip size="small" label={`Capacidad: ${s.capacity}`} color={meta.color} variant="outlined" />
                    <Chip size="small" label={`Tarifa: ${money(s.hourlyRate)}/h`} variant="outlined" />
                  </Stack>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Tooltip title="Editar">
                      <Button size="small" startIcon={<Edit />} onClick={() => openEdit(s)}>
                        Editar
                      </Button>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <Button size="small" color="error" startIcon={<Delete />} onClick={() => askRemove(s)}>
                        Eliminar
                      </Button>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
        {!loading && data.length === 0 && !error && (
          <Grid size={{ xs: 12 }}>
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3, color: 'text.secondary' }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                No hay espacios
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Creá tu primer espacio para empezar a reservar.
              </Typography>
              <Button variant="contained" onClick={openNew}>
                Nuevo espacio
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Modal Crear/Editar */}
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

      {/* Modal Confirmar Eliminar */}
      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Eliminar espacio</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            ¿Seguro que deseas eliminar el espacio?
          </Typography>
          <Typography variant="subtitle1" fontWeight={700}>
            {toDelete?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={confirmRemove} disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
