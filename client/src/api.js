import axios from 'axios'

// where the server is. on your laptop its localhost,
// when deployed put VITE_API_URL=https://your-server.com in client/.env
export const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: SERVER_URL + '/api'
})

// send token with every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = 'Bearer ' + token
  }
  return config
})

export default api
