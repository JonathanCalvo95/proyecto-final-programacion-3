import { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'
import { Paper, Typography } from '@mui/material'
import { getMetrics, getTopSpaces } from '../../services/admin'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>({})
  const [top, setTop] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      const [m, t] = await Promise.all([getMetrics(), getTopSpaces()])
      setMetrics(m || {})
      setTop(Array.isArray(t) ? t : [])
    })()
  }, [])

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">Espacios</Typography>
          <Typography variant="h4">{metrics.totalSpaces || 0}</Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">Reservas activas</Typography>
          <Typography variant="h4">{metrics.totalBookings || 0}</Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">Ocupación (30d)</Typography>
          <Typography variant="h4">{Math.round((metrics.occupancyRate || 0) * 100)}%</Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Top espacios
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {(top || []).map((t) => (
              <li key={t._id}>
                {t._id} - {t.count}
              </li>
            ))}
          </ul>
        </Paper>
      </Grid>
    </Grid>
  )
}
