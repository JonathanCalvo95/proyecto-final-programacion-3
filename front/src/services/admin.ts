import api from './api'

export async function getMetrics(): Promise<any> {
  const { data } = await api.get('/admin/metrics').catch(async () => await api.get('/api/admin/metrics'))
  return data
}

export async function getTopSpaces(): Promise<any[]> {
  const { data } = await api.get('/admin/top-spaces').catch(async () => await api.get('/api/admin/top-spaces'))
  return data
}
