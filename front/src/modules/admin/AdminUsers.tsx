import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { getUsers, createUser, updateUser } from '../../services/users'
import type { User } from '../../types/user.types'
import { USER_ROLE } from '../../types/enums'
import type { UserRole } from '../../types/enums'

type FormState = {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
}

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: USER_ROLE.CLIENT,
}

export default function AdminUsers() {
  const theme = useTheme()

  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')

  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const list = await getUsers()
      setData(Array.isArray(list) ? list : [])
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error cargando usuarios')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function handleOpenNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setOpenForm(true)
  }

  function handleOpenEdit(u: User) {
    setEditing(u)
    setForm({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email,
      password: '',
      role: u.role as UserRole,
    })
    setOpenForm(true)
  }

  function handleCloseForm() {
    if (saving) return
    setOpenForm(false)
  }

  async function handleSubmit() {
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await updateUser(editing.id || (editing as any)._id, {
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
          password: form.password || undefined,
        })
      } else {
        await createUser({
          firstName: form.firstName,
          lastName: form.lastName || undefined,
          email: form.email,
          password: form.password,
          role: form.role,
        })
      }
      setOpenForm(false)
      await load()
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data || e?.message || 'Error guardando usuario'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete(u: User) {
    setDeleteTarget(u)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await updateUser(deleteTarget.id || (deleteTarget as any)._id, { isActive: false })
      setDeleteTarget(null)
      await load()
    } finally {
      setDeleting(false)
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return data.filter((u) => {
      if (s && !`${u.firstName || ''} ${u.lastName || ''} ${u.email}`.toLowerCase().includes(s)) return false
      if (role && u.role !== role) return false
      return true
    })
  }, [data, q, role])

  const total = data.length
  const count = filtered.length

  const roleChipColor = (r: string) => (r === USER_ROLE.ADMIN ? 'primary' : ('default' as const))

  // Misma UX que AdminBookings: loading y error a pantalla completa
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && !openForm) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    )
  }

  return (
    <>
      {/* HEADER (similar a AdminBookings) */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Usuarios
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Administración de usuarios administradores y clientes.
        </Typography>
      </Box>

      {/* FILTROS (Paper con borde como en AdminBookings) */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <TextField
            label="Buscar"
            placeholder="Nombre o email"
            size="small"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ minWidth: 220 }}
          />

          <TextField
            label="Rol"
            select
            size="small"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole | '')}
            sx={{ width: 180 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value={USER_ROLE.CLIENT}>Cliente</MenuItem>
            <MenuItem value={USER_ROLE.ADMIN}>Admin</MenuItem>
          </TextField>

          <Chip label={total === count ? `${total} usuarios` : `${count} de ${total} usuarios`} variant="outlined" />

          <Box flex={1} />

          <Button variant="contained" onClick={handleOpenNew}>
            Nuevo usuario
          </Button>
        </Stack>
      </Paper>

      {/* TABLA (alineada a AdminBookings) */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={56} sx={{ fontWeight: 700 }} />
              <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Apellido</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Alert severity="info" sx={{ my: 2 }}>
                    No se encontraron usuarios que coincidan con los filtros.
                  </Alert>
                </TableCell>
              </TableRow>
            )}

            {filtered.map((u) => {
              const name = u.firstName || 'Usuario'
              const initial = (name || u.email || 'U')[0]?.toUpperCase()

              return (
                <TableRow key={u.id || (u as any)._id} hover sx={{ cursor: 'default' }}>
                  <TableCell>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{initial}</Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {u.lastName || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {u.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={u.role} color={roleChipColor(u.role)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => handleOpenEdit(u)}>
                        Editar
                      </Button>
                      <Button size="small" color="error" onClick={() => confirmDelete(u)}>
                        Desactivar
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DIALOG crear/editar (con Divider como en AdminBookings) */}
      <Dialog open={openForm} onClose={handleCloseForm} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Nombre"
            fullWidth
            margin="normal"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          />
          <TextField
            label="Apellido"
            fullWidth
            margin="normal"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          />
          {!editing && (
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          )}
          {editing && <TextField label="Email" type="email" fullWidth margin="normal" value={form.email} disabled />}
          <TextField
            label={editing ? 'Password (opcional)' : 'Password'}
            type="password"
            fullWidth
            margin="normal"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            helperText={editing ? 'Dejá vacío para mantener el password actual.' : ''}
          />
          <TextField
            label="Rol"
            select
            fullWidth
            margin="normal"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
          >
            <MenuItem value={USER_ROLE.CLIENT}>Cliente</MenuItem>
            <MenuItem value={USER_ROLE.ADMIN}>Admin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseForm} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG eliminar (también con Divider) */}
      <Dialog open={!!deleteTarget} onClose={() => (deleting ? null : setDeleteTarget(null))} maxWidth="xs" fullWidth>
        <DialogTitle>Desactivar usuario</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Typography>
            ¿Seguro que querés desactivar al usuario <strong>{deleteTarget?.firstName || deleteTarget?.email}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Desactivando...' : 'Desactivar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
