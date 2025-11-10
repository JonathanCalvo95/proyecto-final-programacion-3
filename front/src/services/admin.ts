import api from './api'

export async function getMetrics(): Promise<any> {
  return await api.get('/admin/metrics')
}

export async function getTopSpaces(): Promise<any[]> {
  return await api.get('/admin/top-spaces')
}
