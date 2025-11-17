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
import { MeetingRoom, Edit, Delete, Add } from '@mui/icons-material'
import { alpha, useTheme } from '@mui/material/styles'
import { getSpaces, createSpace, updateSpace, deleteSpace } from '../../services/spaces'
import type { Space } from '../../types/space.types'
import { SPACE_TYPE, type SpaceType } from '../../types/enums'
import { SPACE_TYPE_META as TYPE_META } from '../../constants/spaceTypeMeta'

type SpaceForm = {
  name: string
  type: SpaceType
  capacity: number
  dailyRate: number
  content: string
  characteristicsInput: string
  amenitiesInput: string
}

const EMPTY_FORM: SpaceForm = {
  name: '',
  type: SPACE_TYPE.MEETING_ROOM,
  capacity: 1,
  dailyRate: 0,
  content: '',
  characteristicsInput: '',
  amenitiesInput: '',
}

// Centralizado en constants/spaceTypeMeta.ts

const money = (v: number) => v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export default function AdminSpaces() {
  const theme = useTheme()
  const [data, setData] = useState<Space[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Space | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<SpaceForm>(EMPTY_FORM)
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
      dailyRate: (s as any).dailyRate || ((s as any).hourlyRate ? (s as any).hourlyRate * 24 : 0),
      content: (s as any).content || '',
      characteristicsInput: Array.isArray((s as any).characteristics) ? (s as any).characteristics.join(', ') : '',
      amenitiesInput: Array.isArray((s as any).amenities) ? (s as any).amenities.join(', ') : '',
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
      dailyRate: Number(form.dailyRate) || 0,
      content: form.content?.trim() || '',
      characteristics: form.characteristicsInput
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      amenities: form.amenitiesInput
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
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

  function askRemove(s: Space) {
    setToDelete(s)
    setDeleteOpen(true)
  }

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
      <Box sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Gestionar espacios
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configurá espacios disponibles para reservas.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openNew}
            sx={{
              borderRadius: 999,
              px: 3,
              py: 1,
              fontWeight: 600,
            }}
          >
            Nuevo espacio
          </Button>
        </Stack>
      </Box>

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
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={s._id}>
              <Card
                sx={{
                  borderRadius: 3,
                  height: '100%',
                  outline: '1px solid',
                  outlineColor: alpha(theme.palette.divider, 0.7),
                  boxShadow: '0 18px 40px rgba(15,23,42,0.06)',
                  background: (t) =>
                    `linear-gradient(135deg, ${alpha(t.palette[meta.color].main, 0.06)}, ${
                      t.palette.background.paper
                    })`,
                  transition: 'border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease',
                  '&:hover': {
                    outlineColor: alpha(theme.palette[meta.color].main, 0.7),
                    boxShadow: '0 22px 55px rgba(15,23,42,0.12)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar
                      sx={(t) => ({
                        bgcolor: alpha(t.palette[meta.color].main, 0.15),
                        color: t.palette[meta.color].main,
                        width: 32,
                        height: 32,
                        '& .MuiSvgIcon-root': { fontSize: 18 },
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
                <CardContent sx={{ pt: 0, pb: 1.5 }}>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      label={`Capacidad: ${s.capacity}`}
                      color={meta.color}
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                    <Chip
                      size="small"
                      label={`Tarifa: ${money((s as any).dailyRate || 0)}/día`}
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                  </Stack>
                  {(s as any).content && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {String((s as any).content).length > 140
                        ? `${String((s as any).content).slice(0, 140)}...`
                        : String((s as any).content)}
                    </Typography>
                  )}
                  <Divider sx={{ my: 1.2 }} />
                  {Array.isArray((s as any).amenities) && (s as any).amenities.length > 0 && (
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                      {((s as any).amenities as string[]).slice(0, 3).map((a, idx) => (
                        <Chip key={idx} size="small" label={a} variant="outlined" />
                      ))}
                    </Stack>
                  )}
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Tooltip title="Editar">
                      <Button size="small" startIcon={<Edit fontSize="small" />} onClick={() => openEdit(s)}>
                        Editar
                      </Button>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete fontSize="small" />}
                        onClick={() => askRemove(s)}
                      >
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
            <Paper
              variant="outlined"
              sx={{
                p: 5,
                textAlign: 'center',
                borderRadius: 4,
                color: 'text.secondary',
                maxWidth: 520,
                mx: 'auto',
              }}
            >
              <Avatar
                sx={(t) => ({
                  width: 56,
                  height: 56,
                  mb: 2,
                  mx: 'auto',
                  bgcolor: alpha(t.palette.primary.main, 0.1),
                  color: t.palette.primary.main,
                })}
              >
                <MeetingRoom />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                No hay espacios configurados
              </Typography>
              <Typography variant="body2" sx={{ mb: 2.5 }}>
                Creá tu primer espacio para empezar a recibir reservas.
              </Typography>
              <Button variant="contained" onClick={openNew}>
                Nuevo espacio
              </Button>
            </Paper>
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
            <MenuItem value="meeting_room">{TYPE_META.meeting_room.label}</MenuItem>
            <MenuItem value="desk">{TYPE_META.desk.label}</MenuItem>
            <MenuItem value="private_office">{TYPE_META.private_office.label}</MenuItem>
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
            label="Tarifa por día"
            type="number"
            fullWidth
            margin="normal"
            value={form.dailyRate}
            onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) })}
          />
          <TextField
            label="Descripción / contenido"
            fullWidth
            margin="normal"
            multiline
            minRows={3}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <TextField
            label="Características (separadas por coma)"
            fullWidth
            margin="normal"
            placeholder="Ej: Luminosa, Acústica, Ventana"
            value={form.characteristicsInput}
            onChange={(e) => setForm({ ...form, characteristicsInput: e.target.value })}
          />
          <TextField
            label="Amenities (separados por coma)"
            fullWidth
            margin="normal"
            placeholder="Ej: WiFi, Proyector, Pizarrón"
            value={form.amenitiesInput}
            onChange={(e) => setForm({ ...form, amenitiesInput: e.target.value })}
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
