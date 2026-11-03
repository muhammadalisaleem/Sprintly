import { createContext, useContext, useState } from 'react'
import { users, getUser } from '../mockData'

const AuthContext = createContext(null)

// same key getCurrentUser() in mockData reads, so every page sees the same user
const KEY = 'mockUserId'

function loadUser() {
  try {
    const id = localStorage.getItem(KEY)
    return id ? getUser(id) || null : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  // fake login: find the user by email, any password works
  // week 3: this becomes a call to POST /api/auth/login
  function login(email) {
    const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!found) return false

    try {
      localStorage.setItem(KEY, found._id)
    } catch {
      // storage blocked, user stays logged in until refresh
    }
    setUser(found)
    return true
  }

  function logout() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      // storage blocked, nothing to remove
    }
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
