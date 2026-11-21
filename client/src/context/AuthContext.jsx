import { createContext, useContext, useState } from 'react'
import api from '../api'
import { users } from '../mockData'

const AuthContext = createContext(null)

// get the saved user when the page loads
function loadUser() {
  const saved = localStorage.getItem('user')
  if (saved) {
    const u = JSON.parse(saved)
    // old saved users had mock ids like u1, make them login again
    if (u._id.length === 24) return u
  }
  return null
}

// TEMP: some pages still use mockData and getCurrentUser() reads mockUserId,
// so save the mock id of the same email for them. user._id stays the real id
// remove this when all pages get data from the server
function saveMockId(u) {
  const mock = users.find((m) => m.email === u.email)
  if (mock) {
    localStorage.setItem('mockUserId', mock._id)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  function saveUser(token, u) {
    saveMockId(u)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    saveUser(res.data.token, res.data.user)
  }

  async function register(form) {
    const res = await api.post('/auth/register', {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role
    })
    saveUser(res.data.token, res.data.user)
  }

  // save on the server, then keep the new user in the browser too
  async function updateProfile(data) {
    const res = await api.put('/users/me', data)
    localStorage.setItem('user', JSON.stringify(res.data))
    setUser(res.data)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('mockUserId')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, register, updateProfile, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
