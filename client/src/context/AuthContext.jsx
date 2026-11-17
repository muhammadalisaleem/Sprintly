import { createContext, useContext, useState } from 'react'
import api from '../api'
import { users, getUser } from '../mockData'

const AuthContext = createContext(null)

// get the saved user when the page loads
function loadUser() {
  const saved = localStorage.getItem('user')
  if (saved) {
    return JSON.parse(saved)
  }
  return null
}

// TEMP: projects, tasks etc are still mock data and use ids like 'u1'
// so we use the mock user with the same email for now
// remove this when those pages get data from the server
function fixMockId(u) {
  const mock = users.find((m) => m.email === u.email)
  if (mock) {
    localStorage.setItem('mockUserId', mock._id)
    return { ...u, _id: mock._id }
  }
  return u
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  function saveUser(token, u) {
    const appUser = fixMockId(u)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(appUser))
    setUser(appUser)
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

  // only changes it in the browser for now
  // todo: send it to the server (PUT /api/users/me)
  function updateProfile(data) {
    const newUser = { ...user, ...data }
    // also change the mock user so the public profile shows it
    const mock = getUser(user._id)
    if (mock) Object.assign(mock, data)
    localStorage.setItem('user', JSON.stringify(newUser))
    setUser(newUser)
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
