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
import Autocomplete from '@mui/material/Autocomplete'
import Checkbox from '@mui/material/Checkbox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import { alpha, useTheme } from '@mui/material/styles'
import { getSpaces, createSpace, updateSpace, deleteSpace } from '../../services/spaces'
import type { Space } from '../../types/space.types'
import { SPACE_TYPE, type SpaceType, AMENITIES, type Amenity } from '../../types/enums'
import { SPACE_TYPE_META as TYPE_META } from '../../constants/spaceTypeMeta'

type SpaceForm = {
  name: string
  type: SpaceType
  capacity: string
  dailyRate: string
  content: string
  characteristicsInput: string
  amenities: Amenity[]
}

const EMPTY_FORM: SpaceForm = {
  name: '',
  type: SPACE_TYPE.MEETING_ROOM,
  capacity: '',
  dailyRate: '',
  content: '',
  characteristicsInput: '',
  amenities: [],
}

const money = (v: number) => v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export default function AdminSpaces() {
  const theme = useTheme()
  const [data, setData] = useState<Space[]>([])
  // filtros de listado
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<SpaceType | ''>('')
  const [filterAmenities, setFilterAmenities] = useState<Amenity[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Space | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<SpaceForm>(EMPTY_FORM)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Space | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [dialogError, setDialogError] = useState<string | null>(null)

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
    setFormErrors({})
    setDialogError(null)
    setOpen(true)
  }

  const filtered = data.filter((s) => {
    if (filterType && s.type !== filterType) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterAmenities.length > 0) {
      const ams = Array.isArray((s as any).amenities) ? (s as any).amenities : []
      if (!filterAmenities.every((a) => ams.includes(a))) return false
    }
    return true
  })

  function openEdit(s: Space) {
    setEditing(s)
    setForm({
      name: s.name ?? '',
      type: s.type as SpaceForm['type'],
      capacity: String(s.capacity || ''),
      dailyRate: String((s as any).dailyRate || ((s as any).hourlyRate ? (s as any).hourlyRate * 24 : '')),
      content: (s as any).content || '',
      characteristicsInput: Array.isArray((s as any).characteristics) ? (s as any).characteristics.join(', ') : '',
      amenities: Array.isArray((s as any).amenities)
        ? (s as any).amenities.filter((x: any) => AMENITIES.includes(x))
        : [],
    })
    setFormErrors({})
    setDialogError(null)
    setOpen(true)
  }

  async function submit() {
    setSaving(true)
    setError(null)
    setDialogError(null)
    // Validación local de campos requeridos
    const fe: Record<string, string> = {}
    if (!form.name.trim()) fe.name = 'Nombre requerido'
    if (!form.type) fe.type = 'Tipo requerido'
    const capNumber = Number(form.capacity)
    const rateNumber = Number(form.dailyRate)
    if (!form.capacity.trim() || isNaN(capNumber) || capNumber < 1) fe.capacity = 'Capacidad requerida'
    if (!form.dailyRate.trim() || isNaN(rateNumber) || rateNumber <= 0) fe.dailyRate = 'Tarifa requerida'
    if (Object.keys(fe).length) {
      setFormErrors(fe)
      setSaving(false)
      return
    }
    const payload = {
      name: form.name.trim(),
      type: form.type,
      capacity: capNumber || 0,
      dailyRate: rateNumber || 0,
      content: form.content?.trim() || '',
      characteristics: form.characteristicsInput
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      amenities: form.amenities,
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
      setDialogError(status ? `${status}: ${msg}` : msg)
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
        {/* Filtros de búsqueda */}
        <Grid size={{ xs: 12 }}>
          <Paper variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 3, overflow: 'visible' }}>
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={1.5}
              alignItems={{ lg: 'flex-start' }}
              flexWrap="wrap"
              useFlexGap
            >
              <Box sx={{ flexGrow: 1, minWidth: { xs: '100%', lg: 300 } }}>
                <TextField
                  label="Buscar por nombre"
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  fullWidth
                />
              </Box>
              <Box sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                <TextField
                  label="Tipo"
                  size="small"
                  select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as SpaceType | '')}
                  fullWidth
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value={SPACE_TYPE.MEETING_ROOM}>{TYPE_META.meeting_room.label}</MenuItem>
                  <MenuItem value={SPACE_TYPE.DESK}>{TYPE_META.desk.label}</MenuItem>
                  <MenuItem value={SPACE_TYPE.PRIVATE_OFFICE}>{TYPE_META.private_office.label}</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: { xs: '100%', md: 280 } }}>
                <Autocomplete
                  multiple
                  options={AMENITIES}
                  value={filterAmenities}
                  onChange={(_, v) => setFilterAmenities(v)}
                  size="small"
                  disableCloseOnSelect
                  renderInput={(params) => (
                    <TextField {...params} label="Amenities" placeholder="Seleccioná" fullWidth />
                  )}
                />
              </Box>
              {(search || filterType || filterAmenities.length > 0) && (
                <Button
                  onClick={() => {
                    setSearch('')
                    setFilterType('')
                    setFilterAmenities([])
                  }}
                  size="small"
                  sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                >
                  Limpiar filtros
                </Button>
              )}
            </Stack>
          </Paper>
        </Grid>
        {filtered.map((s) => {
          const meta = TYPE_META[s.type as SpaceType] ?? TYPE_META.meeting_room
          const Icon = meta.Icon
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={s._id}>
              <Card
                sx={{
                  borderRadius: 4,
                  height: '100%',
                  boxShadow: '0 2px 12px rgba(30, 41, 59, 0.08)',
                  background: (t) =>
                    `linear-gradient(120deg, ${alpha(t.palette[meta.color].main, 0.1)}, ${t.palette.background.paper} 80%)`,
                  border: `2px solid ${alpha(theme.palette[meta.color].main, 0.22)}`,
                  transition: 'box-shadow 180ms, border-color 180ms, transform 180ms',
                  '&:hover': {
                    boxShadow: '0 8px 32px rgba(30, 41, 59, 0.18)',
                    borderColor: alpha(theme.palette[meta.color].main, 0.38),
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar
                      sx={(t) => ({
                        bgcolor: alpha(t.palette[meta.color].main, 0.22),
                        color: t.palette[meta.color].dark,
                        width: 38,
                        height: 38,
                        boxShadow: `0 2px 8px ${alpha(t.palette[meta.color].main, 0.1)}`,
                        '& .MuiSvgIcon-root': { fontSize: 22 },
                      })}
                    >
                      <Icon />
                    </Avatar>
                  }
                  titleTypographyProps={{ variant: 'h6', fontWeight: 700, color: 'text.primary' }}
                  subheaderTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  title={s.name}
                  subheader={meta.label}
                  sx={{ pb: 1, '& .MuiCardHeader-title': { fontWeight: 700 } }}
                />
                <CardContent sx={{ pt: 0, pb: 1.5 }}>
                  <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                    <Chip
                      size="small"
                      label={`Capacidad: ${s.capacity}`}
                      sx={{
                        fontWeight: 500,
                        bgcolor: alpha(theme.palette.primary.main, 0.16),
                        color: theme.palette.primary.dark,
                        border: 'none',
                        px: 1.2,
                        fontSize: 15,
                      }}
                    />
                    <Chip
                      size="small"
                      label={`Tarifa: ${money((s as any).dailyRate || 0)}/día`}
                      sx={{
                        fontWeight: 500,
                        bgcolor: alpha(theme.palette.success.main, 0.16),
                        color: theme.palette.success.dark,
                        border: 'none',
                        px: 1.2,
                        fontSize: 15,
                      }}
                    />
                  </Stack>
                  {(s as any).content && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 0.5, fontSize: 15 }}>
                      {String((s as any).content).length > 140
                        ? `${String((s as any).content).slice(0, 140)}...`
                        : String((s as any).content)}
                    </Typography>
                  )}
                  <Divider sx={{ my: 1.2, borderColor: alpha(theme.palette.divider, 0.18) }} />
                  {/* Características */}
                  {Array.isArray((s as any).characteristics) && (s as any).characteristics.length > 0 && (
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                      {((s as any).characteristics as string[]).map((c, idx) => (
                        <Chip
                          key={idx}
                          size="small"
                          label={c}
                          sx={{
                            bgcolor: alpha(theme.palette.secondary.main, 0.16),
                            color: theme.palette.secondary.dark,
                            border: 'none',
                            px: 1.1,
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                  {/* Amenities */}
                  {Array.isArray((s as any).amenities) && (s as any).amenities.length > 0 && (
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                      {((s as any).amenities as string[]).slice(0, 3).map((a, idx) => (
                        <Chip
                          key={idx}
                          size="small"
                          label={a}
                          sx={{
                            bgcolor: alpha(theme.palette.info.main, 0.07),
                            color: theme.palette.info.dark,
                            border: 'none',
                            px: 1.1,
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                  <Stack direction="row" justifyContent="flex-end" spacing={1.2} sx={{ mt: 0.5 }}>
                    <Tooltip title="Editar">
                      <Button
                        size="small"
                        startIcon={<Edit fontSize="small" />}
                        onClick={() => openEdit(s)}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 500,
                          bgcolor: alpha(theme.palette.primary.main, 0.07),
                          color: theme.palette.primary.dark,
                          px: 2,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.16),
                          },
                        }}
                      >
                        Editar
                      </Button>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete fontSize="small" />}
                        onClick={() => askRemove(s)}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 500,
                          bgcolor: alpha(theme.palette.error.main, 0.07),
                          color: theme.palette.error.dark,
                          px: 2,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.error.main, 0.16),
                          },
                        }}
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
        {!loading && filtered.length === 0 && !error && (
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
                Sin resultados
              </Typography>
              <Typography variant="body2" sx={{ mb: 2.5 }}>
                Ajustá los filtros o crea un nuevo espacio.
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
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dialogError}
            </Alert>
          )}
          <TextField
            label="Nombre"
            fullWidth
            margin="normal"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            error={!!formErrors.name}
            helperText={formErrors.name}
          />
          <TextField
            label="Tipo"
            select
            fullWidth
            margin="normal"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as SpaceForm['type'] })}
            error={!!formErrors.type}
            helperText={formErrors.type}
          >
            <MenuItem value="meeting_room">{TYPE_META.meeting_room.label}</MenuItem>
            <MenuItem value="desk">{TYPE_META.desk.label}</MenuItem>
            <MenuItem value="private_office">{TYPE_META.private_office.label}</MenuItem>
          </TextField>
          <TextField
            label="Capacidad"
            fullWidth
            margin="normal"
            value={form.capacity}
            onChange={(e) => {
              const raw = e.target.value
              const digits = raw.replace(/\D+/g, '')
              const cleaned = digits.replace(/^0+(\d)/, '$1') // remover ceros iniciales
              setForm({ ...form, capacity: cleaned })
            }}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            error={!!formErrors.capacity}
            helperText={formErrors.capacity}
          />
          <TextField
            label="Tarifa por día"
            fullWidth
            margin="normal"
            value={form.dailyRate}
            onChange={(e) => {
              const raw = e.target.value
              const digits = raw.replace(/\D+/g, '')
              const cleaned = digits.replace(/^0+(\d)/, '$1')
              setForm({ ...form, dailyRate: cleaned })
            }}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            error={!!formErrors.dailyRate}
            helperText={formErrors.dailyRate}
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
          <Autocomplete
            multiple
            options={AMENITIES}
            value={form.amenities}
            onChange={(_, v) => setForm({ ...form, amenities: v })}
            disableCloseOnSelect
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option}>
                <Checkbox
                  icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                  checkedIcon={<CheckBoxIcon fontSize="small" />}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option}
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Amenities" placeholder="Seleccioná" margin="normal" />
            )}
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
