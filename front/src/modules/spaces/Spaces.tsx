import { useEffect, useMemo, useState } from 'react'
import Grid from '@mui/material/Grid'
import {
  Paper,
  Box,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  Chip,
  Autocomplete,
  Alert,
  CircularProgress,
  Snackbar,
  Slider,
  Tooltip,
  Avatar,
  Divider,
} from '@mui/material'
import { MeetingRoom, AccessTime, MonetizationOn, Star, FilterAlt, Today, Event } from '@mui/icons-material'
import { alpha, useTheme } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { getSpaces, getSpacesAvailability } from '../../services/spaces'
import { getRatingsSummary } from '../../services/ratings'
import { createBooking } from '../../services/bookings'
import type { Space } from '../../types/space.types'
import type { SpaceType } from '../../types/enums'
import { SPACE_TYPES } from '../../types/enums'
import { SPACE_TYPE_META } from '../../constants/spaceTypeMeta'

dayjs.locale('es')

type SpaceWithRate = Space & {
  dailyRate?: number
}

const asArray = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : [])

const TYPE_META = SPACE_TYPE_META

const money = (v: number) =>
  v.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  })

export default function Spaces() {
  const theme = useTheme()

  const [spaces, setSpaces] = useState<SpaceWithRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // filtros
  const [start, setStart] = useState<dayjs.Dayjs | null>(null)
  const [end, setEnd] = useState<dayjs.Dayjs | null>(null)
  const [type, setType] = useState<SpaceType | ''>('')
  const [minCap, setMinCap] = useState<number>(1)
  const [charFilters, setCharFilters] = useState<string[]>([])
  const [amenityFilters, setAmenityFilters] = useState<string[]>([])

  // availability
  const [availableIds, setAvailableIds] = useState<Set<string>>(new Set())
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [availabilityFetched, setAvailabilityFetched] = useState(false)

  const [snack, setSnack] = useState<{ open: boolean; msg: string; error?: boolean }>({
    open: false,
    msg: '',
  })

  // carga inicial de espacios + ratings
  useEffect(() => {
    ;(async () => {
      try {
        const [list, sums] = await Promise.all([getSpaces(), getRatingsSummary()])
        const merged = asArray(list).map((s: any) => {
          const r = Array.isArray(sums) ? sums.find((x: any) => x.spaceId === s._id) : undefined
          return { ...s, __avg: r?.avg ?? 0, __count: r?.count ?? 0 }
        })
        setSpaces(merged as SpaceWithRate[])
      } catch (e: any) {
        setError(e?.response?.data?.message ?? e?.message ?? 'Error cargando espacios')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const today = dayjs().startOf('day')

  const days = useMemo(() => {
    if (!start || !end) return 0
    const diff = end.startOf('day').diff(start.startOf('day'), 'day') + 1
    return diff > 0 ? diff : 0
  }, [start, end])

  const startError = !!start && start.startOf('day').isBefore(today)
  const endError = !!start && !!end && end.startOf('day').isBefore(start.startOf('day'))
  const disableReserve = !start || !end || days <= 0 || startError || endError

  // ordenar espacios por nombre
  const orderedSpaces = useMemo(
    () =>
      asArray(spaces)
        .slice()
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es')),
    [spaces]
  )

  // características y amenities disponibles
  const { allCharacteristics, allAmenities } = useMemo(() => {
    const charSet = new Set<string>()
    const amenSet = new Set<string>()

    asArray(orderedSpaces).forEach((s: any) => {
      asArray<string>(s.characteristics).forEach((c) => c && charSet.add(c))
      asArray<string>(s.amenities).forEach((a) => a && amenSet.add(a))
    })

    const chars = Array.from(charSet).sort((a, b) => a.localeCompare(b, 'es'))
    const amens = Array.from(amenSet).sort((a, b) => a.localeCompare(b, 'es'))
    return { allCharacteristics: chars, allAmenities: amens }
  }, [orderedSpaces])

  // aplicar filtros de tipo/capacidad/características/amenities
  const filtered = useMemo(() => {
    return orderedSpaces.filter((s) => {
      if (type && s.type !== type) return false
      if (s.capacity < minCap) return false
      if (charFilters.length > 0) {
        const ch = asArray<string>((s as any).characteristics)
        if (!charFilters.every((c) => ch.includes(c))) return false
      }
      if (amenityFilters.length > 0) {
        const am = asArray<string>((s as any).amenities)
        if (!amenityFilters.every((a) => am.includes(a))) return false
      }
      return true
    })
  }, [orderedSpaces, type, minCap, charFilters, amenityFilters])

  // disponibilidad según rango de fechas
  useEffect(() => {
    // cuando no hay rango o es inválido, limpiamos availability
    if (!start || !end || disableReserve) {
      setAvailableIds(new Set())
      setAvailabilityError(null)
      setAvailabilityLoading(false)
      setAvailabilityFetched(false)
      return
    }

    const startStr = start.startOf('day').format('YYYY-MM-DD')
    const endStr = end.startOf('day').format('YYYY-MM-DD')

    setAvailabilityLoading(true)
    setAvailabilityError(null)
    setAvailabilityFetched(false)

    getSpacesAvailability(startStr.toString(), endStr.toString())
      .then((ids) => {
        console.log('ids availability', ids)

        setAvailableIds(new Set(ids.map(String)))
      })
      .catch((e: any) => {
        const msg = e?.response?.data?.message || e?.response?.data || e?.message || 'Error consultando disponibilidad'
        setAvailabilityError(msg)
        setAvailableIds(new Set())
      })
      .finally(() => {
        setAvailabilityLoading(false)
        setAvailabilityFetched(true)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, disableReserve])

  // cantidad “real” de espacios disponibles (para el chip de arriba)
  const availableCount = useMemo(() => {
    if (!start || !end || !availabilityFetched || disableReserve) return filtered.length
    if (availableIds.size === 0) return 0
    return filtered.filter((s) => availableIds.has(String(s._id))).length
  }, [filtered, start, end, availabilityFetched, disableReserve, availableIds])

  const activeFilters =
    (type ? 1 : 0) + (minCap > 1 ? 1 : 0) + charFilters.length + amenityFilters.length + (start && end ? 1 : 0)

  function quickRange(daysCount: number) {
    const base = dayjs().add(1, 'day').startOf('day')
    setStart(base)
    setEnd(base.add(daysCount - 1, 'day'))
  }

  function clearAll() {
    setStart(null)
    setEnd(null)
    setType('')
    setMinCap(1)
    setCharFilters([])
    setAmenityFilters([])
    setAvailableIds(new Set())
    setAvailabilityError(null)
    setAvailabilityFetched(false)
  }

  async function book(spaceId: string) {
    if (!start || !end) {
      setSnack({ open: true, msg: 'Seleccioná inicio y fin', error: true })
      return
    }
    if (disableReserve) {
      setSnack({ open: true, msg: 'Rango de fechas inválido', error: true })
      return
    }

    try {
      await createBooking(spaceId, start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'))
      setSnack({ open: true, msg: 'Reserva creada' })
      // Bloquear inmediatamente el espacio para el rango actual
      setAvailableIds((prev) => {
        const next = new Set<string>(prev)
        next.delete(String(spaceId))
        return next
      })
      setAvailabilityFetched(true)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data || e?.message || 'Error al reservar'
      setSnack({ open: true, msg, error: true })
    }
  }

  if (loading) {
    return (
      <Box minHeight="60vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    )
  }

  return (
    <>
      {/* HEADER */}
      <Box sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Reservar espacio
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configurá tu rango de fechas, ajustá filtros y elegí el espacio que mejor se adapte a tu equipo.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
            <Chip
              icon={<AccessTime sx={{ fontSize: 18 }} />}
              label={days > 0 ? `${days} día(s)` : 'Sin rango'}
              variant="outlined"
              sx={{ borderRadius: 999, height: 30, fontSize: 12 }}
            />
            <Chip
              icon={<FilterAlt sx={{ fontSize: 18 }} />}
              label={activeFilters ? `${activeFilters} filtro(s)` : 'Sin filtros'}
              variant={activeFilters ? 'filled' : 'outlined'}
              color={activeFilters ? 'primary' : 'default'}
              sx={{ borderRadius: 999, height: 30, fontSize: 12 }}
            />
            <Chip
              icon={<MeetingRoom sx={{ fontSize: 18 }} />}
              label={`${availableCount} espacio(s)`}
              variant="outlined"
              sx={{ borderRadius: 999, height: 30, fontSize: 12 }}
            />
          </Stack>
        </Stack>
      </Box>

      {/* mensajes de disponibilidad */}
      {availabilityError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {availabilityError}
        </Alert>
      )}
      {start && end && !disableReserve && availabilityFetched && availableCount === 0 && !availabilityError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No hay espacios disponibles para el rango seleccionado. Probá cambiar las fechas.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* PANEL IZQUIERDO */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2.5}>
            {/* Fechas */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: alpha(theme.palette.background.paper, 0.8),
                borderColor: alpha(theme.palette.divider, 0.4),
                backdropFilter: 'blur(6px)',
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" color="text.secondary">
                    Fechas de reserva
                  </Typography>
                  <Button onClick={() => clearAll()} size="small">
                    Limpiar
                  </Button>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <DatePicker
                    label="Inicio"
                    value={start}
                    onChange={setStart}
                    disablePast
                    format="DD/MM/YYYY"
                    shouldDisableDate={(date) => {
                      const d = date.day()
                      return d === 0 || d === 6
                    }}
                    slotProps={{
                      textField: { size: 'small', fullWidth: true },
                      actionBar: { actions: ['clear', 'accept'] },
                    }}
                  />
                  <DatePicker
                    label="Fin"
                    value={end}
                    onChange={setEnd}
                    minDate={start || undefined}
                    format="DD/MM/YYYY"
                    shouldDisableDate={(date) => {
                      const d = date.day()
                      return d === 0 || d === 6
                    }}
                    slotProps={{
                      textField: { size: 'small', fullWidth: true },
                      actionBar: { actions: ['clear', 'accept'] },
                    }}
                  />
                </Stack>

                {startError && <Alert severity="warning">El inicio debe ser futuro.</Alert>}
                {endError && <Alert severity="warning">El fin debe ser posterior o igual al inicio.</Alert>}

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    icon={<Today sx={{ fontSize: 16 }} />}
                    label="Mañana"
                    onClick={() => quickRange(1)}
                    size="small"
                    sx={{ borderRadius: 999 }}
                  />
                  <Chip
                    icon={<Event sx={{ fontSize: 16 }} />}
                    label="2 días"
                    onClick={() => quickRange(2)}
                    size="small"
                    sx={{ borderRadius: 999 }}
                  />
                  <Chip
                    icon={<Event sx={{ fontSize: 16 }} />}
                    label="Semana completa"
                    onClick={() => quickRange(5)}
                    size="small"
                    sx={{ borderRadius: 999 }}
                  />
                </Stack>
              </Stack>
            </Paper>

            {/* Requisitos básicos */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: alpha(theme.palette.background.paper, 0.9),
                borderColor: alpha(theme.palette.divider, 0.4),
              }}
            >
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Requisitos básicos
                </Typography>

                <TextField
                  label="Tipo de espacio"
                  select
                  value={type}
                  onChange={(e) => setType(e.target.value as SpaceType | '')}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="">Cualquiera</MenuItem>
                  {SPACE_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {TYPE_META[t].label}
                    </MenuItem>
                  ))}
                </TextField>

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Capacidad mínima</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {minCap} personas
                    </Typography>
                  </Stack>
                  <Slider
                    value={minCap}
                    min={1}
                    max={20}
                    step={1}
                    onChange={(_, v) => setMinCap(v as number)}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Stack>
            </Paper>

            {/* Filtros avanzados */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: alpha(theme.palette.background.paper, 0.9),
                borderColor: alpha(theme.palette.divider, 0.4),
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FilterAlt fontSize="small" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Filtros avanzados
                  </Typography>
                </Stack>

                <Autocomplete
                  multiple
                  options={allCharacteristics}
                  value={charFilters}
                  onChange={(_, v) => setCharFilters(v)}
                  disableCloseOnSelect
                  size="small"
                  renderInput={(params) => <TextField {...params} label="Características" placeholder="Seleccioná" />}
                />

                <Autocomplete
                  multiple
                  options={allAmenities}
                  value={amenityFilters}
                  onChange={(_, v) => setAmenityFilters(v)}
                  disableCloseOnSelect
                  size="small"
                  renderInput={(params) => <TextField {...params} label="Amenities" placeholder="Seleccioná" />}
                />

                {(charFilters.length > 0 || amenityFilters.length > 0) && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {charFilters.map((c) => (
                        <Chip
                          key={`c-${c}`}
                          size="small"
                          label={c}
                          onDelete={() => setCharFilters((xs) => xs.filter((x) => x !== c))}
                          sx={{ borderRadius: 999, fontSize: 11 }}
                        />
                      ))}
                      {amenityFilters.map((a) => (
                        <Chip
                          key={`a-${a}`}
                          size="small"
                          color="primary"
                          label={a}
                          onDelete={() => setAmenityFilters((xs) => xs.filter((x) => x !== a))}
                          sx={{ borderRadius: 999, fontSize: 11 }}
                        />
                      ))}
                    </Stack>
                  </>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* PANEL DERECHO: LISTADO */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2.5}>
            {filtered.length === 0 && (
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  borderRadius: 3,
                  textAlign: 'center',
                  color: 'text.secondary',
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  No encontramos espacios con esa búsqueda
                </Typography>
                <Typography variant="body2">
                  Ajustá fechas, tipo de espacio o filtros avanzados para ver más resultados.
                </Typography>
              </Paper>
            )}

            {filtered.map((s) => {
              const meta = TYPE_META[s.type as SpaceType]
              const Icon = meta.Icon
              const dailyRate = s.dailyRate ?? (s as any).dailyRate ?? 0
              const estimate = days > 0 ? dailyRate * days : 0
              const avg = Number((s as any).__avg || 0)
              const count = Number((s as any).__count || 0)

              const amenities = asArray<string>((s as any).amenities)
              const characteristics = asArray<string>((s as any).characteristics)

              const showAmenities = amenities.slice(0, 3)
              const extraAmenities = amenities.length - showAmenities.length
              const showChars = characteristics.slice(0, 3)
              const extraChars = characteristics.length - showChars.length

              const hasRange = !!start && !!end && !disableReserve
              const isAvailable = !hasRange || !availabilityFetched ? true : availableIds.has(String(s._id))
              const buttonDisabled =
                disableReserve || availabilityLoading || (hasRange && availabilityFetched && !isAvailable)

              return (
                <Paper
                  key={s._id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    borderColor: alpha(theme.palette.divider, 0.5),
                    background: alpha(theme.palette.background.paper, 0.95),
                    boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                    transition: 'all .22s ease',
                    '&:hover': {
                      borderColor: alpha(theme.palette[isAvailable ? meta.color : 'error'].main, 0.8),
                      boxShadow: '0 16px 40px rgba(15,23,42,0.12)',
                      transform: 'translateY(-2px)',
                    },
                    opacity: hasRange && availabilityFetched && !isAvailable ? 0.6 : 1,
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                  >
                    {/* Col 1 */}
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 230 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette[isAvailable ? meta.color : 'error'].main, 0.15),
                          color: theme.palette[isAvailable ? meta.color : 'error'].main,
                          width: 40,
                          height: 40,
                          '& .MuiSvgIcon-root': { fontSize: 22 },
                        }}
                      >
                        <Icon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {s.name}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {meta.label}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            • Capacidad {s.capacity}
                          </Typography>
                        </Stack>
                        {s.content && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: 0.5,
                              fontSize: 12,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {s.content}
                          </Typography>
                        )}
                        {count > 0 && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Star sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                            <Typography variant="caption" fontWeight={600}>
                              {avg.toFixed(1)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({count})
                            </Typography>
                          </Stack>
                        )}
                      </Box>
                    </Stack>

                    {/* Col 2 */}
                    <Box flex={1}>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {showAmenities.map((a) => (
                          <Chip
                            key={`amen-${s._id}-${a}`}
                            size="small"
                            label={a}
                            sx={{
                              borderRadius: 999,
                              fontSize: 11,
                              height: 24,
                              px: 1,
                              bgcolor: alpha(theme.palette[meta.color].main, 0.05),
                              borderColor: alpha(theme.palette[meta.color].main, 0.2),
                            }}
                            variant="outlined"
                          />
                        ))}
                        {extraAmenities > 0 && (
                          <Tooltip title={amenities.join(', ')}>
                            <Chip
                              size="small"
                              label={`+${extraAmenities} amenities`}
                              variant="outlined"
                              sx={{ borderRadius: 999, fontSize: 11, height: 24 }}
                            />
                          </Tooltip>
                        )}

                        {showChars.map((c) => (
                          <Chip
                            key={`char-${s._id}-${c}`}
                            size="small"
                            label={c}
                            variant="outlined"
                            sx={{
                              borderRadius: 999,
                              fontSize: 11,
                              height: 24,
                              px: 1,
                              bgcolor: alpha(theme.palette.grey[600], 0.04),
                              borderColor: alpha(theme.palette.grey[600], 0.2),
                            }}
                          />
                        ))}
                        {extraChars > 0 && (
                          <Tooltip title={characteristics.join(', ')}>
                            <Chip
                              size="small"
                              label={`+${extraChars} detalles`}
                              variant="outlined"
                              sx={{ borderRadius: 999, fontSize: 11, height: 24 }}
                            />
                          </Tooltip>
                        )}
                      </Stack>
                    </Box>

                    {/* Col 3 */}
                    <Stack spacing={0.75} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} sx={{ minWidth: 190 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <MonetizationOn sx={{ fontSize: 18, color: theme.palette.success.main }} />
                        <Typography variant="body2" fontWeight={600}>
                          {money(dailyRate)}/día
                        </Typography>
                      </Stack>
                      {days > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Estimado por {days} día(s):{' '}
                          <Box component="span" fontWeight={600} color="primary.main">
                            {money(estimate)}
                          </Box>
                        </Typography>
                      )}

                      {hasRange && availabilityFetched && !isAvailable && (
                        <Chip
                          size="small"
                          color="error"
                          variant="outlined"
                          label="No disponible en este rango"
                          sx={{ borderRadius: 999 }}
                        />
                      )}

                      <Button
                        variant="contained"
                        onClick={() => book(s._id)}
                        disabled={buttonDisabled}
                        sx={{
                          mt: 0.5,
                          borderRadius: 999,
                          px: 3,
                          py: 0.7,
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: 14,
                          boxShadow: buttonDisabled ? 'none' : '0 6px 18px rgba(0,0,0,0.18)',
                          '&:hover': {
                            boxShadow: buttonDisabled ? 'none' : '0 8px 24px rgba(0,0,0,0.24)',
                          },
                        }}
                      >
                        {availabilityLoading && hasRange
                          ? 'Verificando...'
                          : hasRange && availabilityFetched && !isAvailable
                            ? 'No disponible'
                            : 'Reservar'}
                      </Button>

                      {disableReserve && (
                        <Typography variant="caption" color="text.secondary">
                          Seleccioná un rango de fechas válido para habilitar la reserva.
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              )
            })}
          </Stack>
        </Grid>
      </Grid>

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
