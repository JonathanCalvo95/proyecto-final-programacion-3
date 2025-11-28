import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Snackbar,
  Rating as MuiRating,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Avatar,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import { alpha, useTheme } from '@mui/material/styles'
import { Star, StarHalf, Groups, MeetingRoom } from '@mui/icons-material'
import { getSpaces } from '../../services/spaces'
import { getMyBookings } from '../../services/bookings'
import { getRatings, saveRating } from '../../services/ratings'
import type { Space } from '../../types/space.types'
import type { Rating } from '../../types/rating.types'
import { useAuth } from '../../context/AuthContext'
import { USER_ROLE, type SpaceType } from '../../types/enums'
import { SPACE_TYPE_META } from '../../constants/spaceTypeMeta'

export default function Ratings() {
  const theme = useTheme()
  const { user } = useAuth()

  const [spaces, setSpaces] = useState<Space[]>([])
  const [bookedSpaceIds, setBookedSpaceIds] = useState<Set<string>>(new Set())
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form calificación
  const [spaceId, setSpaceId] = useState('')
  const [score, setScore] = useState<number | null>(3)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  // Filtros
  const [q, setQ] = useState('')
  const [scoreFilter, setScoreFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'recent' | 'high' | 'low'>('recent')

  const [snack, setSnack] = useState<{ open: boolean; msg: string; error?: boolean }>({
    open: false,
    msg: '',
  })

  useEffect(() => {
    ;(async () => {
      try {
        const [s, r, myB] = await Promise.all([getSpaces(), getRatings(), getMyBookings()])
        setSpaces(Array.isArray(s) ? s : [])
        setRatings(Array.isArray(r) ? r : [])
        const ids = new Set<string>()
        ;(Array.isArray(myB) ? myB : []).forEach((b) => {
          const sid = typeof b.space === 'string' ? b.space : (b.space as any)?._id
          if (sid) ids.add(String(sid))
        })
        setBookedSpaceIds(ids)
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Error cargando calificaciones')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const myRatings = useMemo(() => {
    if (!user) return [] as Rating[]
    const uid = user.id
    return ratings.filter((r) => {
      if (!r) return false
      const rid = typeof r.user === 'string' ? r.user : (r.user as any)?._id || (r.user as any)?.id
      return String(rid) === String(uid)
    })
  }, [ratings, user])

  const ratedMap = useMemo(() => {
    const m = new Map<string, Rating>()
    myRatings.forEach((r) => {
      if (!r || !r.space) return
      const sid = typeof r.space === 'string' ? r.space : (r.space as any)._id
      if (!sid) return
      m.set(String(sid), r)
    })
    return m
  }, [myRatings])

  useEffect(() => {
    if (!spaceId) {
      setScore(3)
      setComment('')
      return
    }
    const existing = ratedMap.get(String(spaceId))
    if (existing) {
      setScore(existing.score ?? 3)
      setComment(existing.comment ?? '')
    } else {
      setScore(3)
      setComment('')
    }
  }, [spaceId, ratedMap])

  const kpis = useMemo(() => {
    const total = ratings.length
    const avg = total ? ratings.reduce((acc, r) => acc + (r.score || 0), 0) / total : 0
    const uniqueSpaces = new Set(
      ratings.map((r) => String(typeof r.space === 'string' ? r.space : (r.space as any)?._id))
    ).size
    const uniqueUsers = new Set(ratings.map((r) => String(typeof r.user === 'string' ? r.user : (r.user as any)?._id)))
      .size
    return { total, avg: Number(avg.toFixed(2)), uniqueSpaces, uniqueUsers }
  }, [ratings])

  const filteredAll = useMemo(() => {
    const s = q.trim().toLowerCase()
    return ratings.filter((r) => {
      if (!r) return false
      const sp = typeof r.space === 'string' ? r.space : (r.space as any)?.name || ''
      const us = typeof r.user === 'string' ? r.user : (r.user as any)?.email || (r.user as any)?.firstName || ''
      if (s && !`${sp} ${us}`.toLowerCase().includes(s)) return false
      if (scoreFilter && String(r.score) !== scoreFilter) return false
      return true
    })
  }, [ratings, q, scoreFilter])

  function getDateTs(r: Rating) {
    const d = r.updatedAt || r.createdAt
    return d ? new Date(d).getTime() : 0
  }

  const sortedAll = useMemo(() => {
    const arr = [...filteredAll]
    arr.sort((a, b) => {
      if (sortBy === 'high') return (b.score || 0) - (a.score || 0) || getDateTs(b) - getDateTs(a)
      if (sortBy === 'low') return (a.score || 0) - (b.score || 0) || getDateTs(b) - getDateTs(a)
      return getDateTs(b) - getDateTs(a)
    })
    return arr
  }, [filteredAll, sortBy])

  const filteredMine = useMemo(() => {
    const myIds = new Set(myRatings.map((r) => r._id))
    return sortedAll.filter((r) => myIds.has(r._id))
  }, [sortedAll, myRatings])

  const filteredOthers = useMemo(() => {
    const myIds = new Set(myRatings.map((r) => r._id))
    return sortedAll.filter((r) => !myIds.has(r._id))
  }, [sortedAll, myRatings])

  function getScoreColor(score: number | null | undefined) {
    if (!score) return theme.palette.grey[500]
    if (score >= 4) return theme.palette.success.main
    if (score === 3) return theme.palette.warning.main
    return theme.palette.error.main
  }

  async function submit() {
    if (!spaceId || !score) {
      setSnack({ open: true, msg: 'Completá espacio y puntaje', error: true })
      return
    }

    setSaving(true)
    setError(null)

    try {
      const r = await saveRating({
        spaceId,
        score,
        comment: comment.trim() || undefined,
      })

      if (!r) {
        setSnack({ open: true, msg: 'La API no devolvió la calificación', error: true })
        return
      }

      const getUserId = (u: any) => (typeof u === 'string' ? String(u) : String(u?._id || u?.id || ''))
      const getSpaceId = (s: any) => (typeof s === 'string' ? String(s) : String(s?._id || ''))

      const newUserId = getUserId(r.user)
      const newSpaceId = getSpaceId(r.space) || String(spaceId)

      const next = ratings.filter((x) => {
        if (x._id && r._id && String(x._id) === String(r._id)) return false
        const isSameUser = getUserId(x.user) === newUserId
        const isSameSpace = getSpaceId(x.space) === newSpaceId
        if (isSameUser && isSameSpace) return false
        return true
      })

      setRatings([r, ...next])
      setSnack({ open: true, msg: 'Calificación guardada' })
      setSpaceId('')
      setComment('')
      setScore(3)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data || e?.message || 'Error al calificar'
      setSnack({ open: true, msg, error: true })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Calificaciones
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Revisá el feedback de los usuarios sobre los espacios y dejá tus propias opiniones.
        </Typography>
      </Box>

      {/* KPIs */}
      {user?.role !== USER_ROLE.CLIENT && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 18px 40px rgba(15,23,42,0.06)',
                background: (t) =>
                  `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.12)}, ${t.palette.background.paper})`,
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar
                    sx={(t) => ({
                      bgcolor: alpha(t.palette.primary.main, 0.16),
                      color: t.palette.primary.main,
                      width: 32,
                      height: 32,
                    })}
                  >
                    <Star />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total calificaciones
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {kpis.total}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 18px 40px rgba(15,23,42,0.06)',
                background: (t) =>
                  `linear-gradient(135deg, ${alpha(t.palette.warning.main, 0.16)}, ${t.palette.background.paper})`,
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar
                    sx={(t) => ({
                      bgcolor: alpha(t.palette.warning.main, 0.18),
                      color: t.palette.warning.main,
                      width: 32,
                      height: 32,
                    })}
                  >
                    <StarHalf />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Promedio global
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MuiRating value={kpis.avg} precision={0.1} readOnly max={5} size="small" />
                      <Typography variant="h6" fontWeight={700}>
                        {kpis.avg}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 18px 40px rgba(15,23,42,0.06)',
                background: (t) =>
                  `linear-gradient(135deg, ${alpha(t.palette.success.main, 0.12)}, ${t.palette.background.paper})`,
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar
                    sx={(t) => ({
                      bgcolor: alpha(t.palette.success.main, 0.18),
                      color: t.palette.success.main,
                      width: 32,
                      height: 32,
                    })}
                  >
                    <MeetingRoom />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Espacios calificados
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {kpis.uniqueSpaces}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 18px 40px rgba(15,23,42,0.06)',
                background: (t) =>
                  `linear-gradient(135deg, ${alpha(t.palette.info.main, 0.15)}, ${t.palette.background.paper})`,
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar
                    sx={(t) => ({
                      bgcolor: alpha(t.palette.info.main, 0.18),
                      color: t.palette.info.main,
                      width: 32,
                      height: 32,
                    })}
                  >
                    <Groups />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Usuarios que opinan
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {kpis.uniqueUsers}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Form de calificación solo para clientes */}
      {user?.role === USER_ROLE.CLIENT && (
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            mb: 2.5,
            borderRadius: 3,
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              label="Espacio"
              select
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
              sx={{ minWidth: 300 }}
              size="small"
              helperText="Solo se muestran espacios previamente reservados"
            >
              <MenuItem value="">Seleccionar</MenuItem>
              {spaces
                .filter((s) => bookedSpaceIds.has(String(s._id)))
                .map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.name}
                    {ratedMap.has(String(s._id)) && (
                      <Chip size="small" label="Ya calificado" color="primary" variant="outlined" sx={{ ml: 1 }} />
                    )}
                  </MenuItem>
                ))}
            </TextField>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Puntaje:
              </Typography>
              <MuiRating value={score} onChange={(_, v) => setScore(v)} precision={1} max={5} />
            </Stack>

            <TextField
              fullWidth
              label="Comentario (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              size="small"
            />

            <Button variant="contained" onClick={submit} disabled={saving} sx={{ whiteSpace: 'nowrap' }}>
              {saving ? 'Guardando...' : 'Calificar'}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Filtros de listado */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField
            label="Buscar"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            size="small"
            sx={{ minWidth: 240 }}
            placeholder="Espacio o usuario"
          />
          <TextField
            label="Puntaje"
            select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            size="small"
            sx={{ width: 160 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {[1, 2, 3, 4, 5].map((n) => (
              <MenuItem key={n} value={String(n)}>
                {n}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Ordenar por"
            select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            size="small"
            sx={{ width: 200 }}
          >
            <MenuItem value="recent">Más recientes</MenuItem>
            <MenuItem value="high">Más altas</MenuItem>
            <MenuItem value="low">Más bajas</MenuItem>
          </TextField>
          <Box flex={1} />
          <Chip label={`${filteredAll.length} total`} />
          {user && <Chip color="primary" variant="outlined" label={`${filteredMine.length} mías`} />}
          <Chip variant="outlined" label={`${filteredOthers.length} de otros`} />
        </Stack>
      </Paper>

      {/* Mis calificaciones */}
      {user && filteredMine.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Mis calificaciones
          </Typography>
          <Grid container spacing={2}>
            {filteredMine.map((r) => {
              if (!r) return null
              const s =
                typeof r.space === 'string' ? spaces.find((x) => x._id === r.space) : (r.space as Space | undefined)
              const color = getScoreColor(r.score)
              const meta = s ? SPACE_TYPE_META[s.type as SpaceType] : undefined
              const Icon = meta?.Icon

              return (
                <Grid key={r._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      border: `1.5px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                      boxShadow: '0 18px 40px rgba(15,23,42,0.10)',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.10)}, ${theme.palette.background.paper})`,
                      transition: '150ms',
                      '&:hover': {
                        borderColor: alpha(theme.palette.primary.main, 0.75),
                        boxShadow: '0 22px 55px rgba(15,23,42,0.18)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <CardHeader
                      avatar={
                        Icon ? (
                          <Avatar
                            sx={{
                              bgcolor: meta
                                ? alpha(theme.palette[meta.color].main, 0.16)
                                : alpha(theme.palette.primary.main, 0.12),
                              color: meta ? theme.palette[meta.color].main : theme.palette.primary.main,
                              width: 32,
                              height: 32,
                            }}
                          >
                            <Icon fontSize="small" />
                          </Avatar>
                        ) : undefined
                      }
                      title={s?.name || 'Espacio'}
                      sx={{ pb: 0.25 }}
                      titleTypographyProps={{ variant: 'subtitle1', sx: { fontWeight: 700 } }}
                      action={<Chip size="small" color="primary" label="Mi calificación" />}
                    />
                    <CardContent sx={{ pt: 0.25, pb: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <MuiRating value={r.score} readOnly max={5} size="small" />
                        <Chip
                          size="small"
                          label={`${r.score}/5`}
                          sx={{
                            bgcolor: alpha(color, 0.12),
                            color,
                            fontWeight: 600,
                          }}
                        />
                      </Stack>
                      {r.updatedAt || r.createdAt ? (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
                          {new Date(r.updatedAt || r.createdAt || Date.now()).toLocaleDateString('es-AR')}
                        </Typography>
                      ) : null}
                      {r.comment && (
                        <Typography variant="body2" sx={{ fontSize: 13 }}>
                          {r.comment}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </Box>
      )}

      {/* Calificaciones de otros */}
      <Box sx={{ mt: user && filteredMine.length ? 3 : 0 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          Calificaciones de otros usuarios
        </Typography>
        <Grid container spacing={2}>
          {filteredOthers.map((r) => {
            if (!r) return null

            const s =
              typeof r.space === 'string' ? spaces.find((x) => x._id === r.space) : (r.space as Space | undefined)
            let userLabel = 'Usuario'
            if (typeof r.user !== 'string' && r.user) {
              const fn = (r.user as any)?.firstName || ''
              const ln = (r.user as any)?.lastName || ''
              const full = `${fn} ${ln}`.trim()
              const email = (r.user as any)?.email || ''
              userLabel = full || email || 'Usuario'
            }
            const color = getScoreColor(r.score)
            const meta = s ? SPACE_TYPE_META[s.type as SpaceType] : undefined
            const Icon = meta?.Icon

            return (
              <Grid key={r._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: `1.5px solid ${alpha(color, 0.35)}`,
                    boxShadow: '0 18px 40px rgba(15,23,42,0.10)',
                    background: `linear-gradient(135deg, ${alpha(color, 0.10)}, ${theme.palette.background.paper})`,
                    transition: '150ms',
                    '&:hover': {
                      borderColor: alpha(color, 0.75),
                      boxShadow: '0 22px 55px rgba(15,23,42,0.18)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardHeader
                    avatar={
                      Icon ? (
                        <Avatar
                          sx={{
                            bgcolor: meta
                              ? alpha(theme.palette[meta.color].main, 0.16)
                              : alpha(theme.palette.primary.main, 0.12),
                            color: meta ? theme.palette[meta.color].main : theme.palette.primary.main,
                            width: 32,
                            height: 32,
                          }}
                        >
                          <Icon fontSize="small" />
                        </Avatar>
                      ) : undefined
                    }
                    title={s?.name || 'Espacio'}
                    subheader={userLabel}
                    titleTypographyProps={{ variant: 'subtitle1', sx: { fontWeight: 700 } }}
                    subheaderTypographyProps={{ variant: 'caption' }}
                    sx={{ pb: 0.25 }}
                  />
                  <CardContent sx={{ pt: 0.25, pb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <MuiRating value={r.score} readOnly max={5} size="small" />
                      <Chip
                        size="small"
                        label={`${r.score}/5`}
                        sx={{
                          bgcolor: alpha(color, 0.12),
                          color,
                          fontWeight: 600,
                        }}
                      />
                    </Stack>

                    {r.updatedAt || r.createdAt ? (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
                        {new Date(r.updatedAt || r.createdAt || Date.now()).toLocaleDateString('es-AR')}
                      </Typography>
                    ) : null}

                    {r.comment && (
                      <Typography variant="body2" sx={{ fontSize: 13 }}>
                        {r.comment}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ open: false, msg: '' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnack({ open: false, msg: '' })}
          severity={snack.error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  )
}
