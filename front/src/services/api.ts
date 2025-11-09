import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API error:', error?.response || error)
    return Promise.reject(error)
  }
)

export default api
