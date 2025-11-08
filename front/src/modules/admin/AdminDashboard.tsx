import { useEffect, useState } from 'react'
import { Grid, Paper, Typography } from '@mui/material'
import api from '../../services/api'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>({})
  const [top, setTop] = useState<any[]>([])
  useEffect(() => {
    api.get('/admin/metrics').then((r) => setMetrics(r.data))
    api.get('/admin/top-spaces').then((r) => setTop(r.data))
  }, [])
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">Espacios</Typography>
          <Typography variant="h4">{metrics.totalSpaces || 0}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">Reservas activas</Typography>
          <Typography variant="h4">{metrics.totalReservations || 0}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">Ocupación (30d)</Typography>
          <Typography variant="h4">{Math.round((metrics.occupancyRate || 0) * 100)}%</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Top espacios
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {top.map((t) => (
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
