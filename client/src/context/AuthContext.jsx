import { createContext, useContext, useState } from 'react'
import { users, getUser, newId } from '../mockData'

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

function findByEmail(email) {
  return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  function saveUser(u) {
    try {
      localStorage.setItem(KEY, u._id)
    } catch {
      // storage blocked, user stays logged in until refresh
    }
    setUser(u)
  }

  // fake login: find the user by email, any password works
  // week 3: this becomes a call to POST /api/auth/login
  function login(email) {
    const found = findByEmail(email)
    if (!found) return false

    saveUser(found)
    return true
  }

  // fake sign up: adds the user to mockData and logs them in
  // (they disappear on page refresh until the backend is ready)
  // week 3: this becomes a call to POST /api/auth/register
  function register({ name, email, role }) {
    if (findByEmail(email)) return false

    const newUser = {
      _id: newId('u'),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      bio: '',
      skills: [],
      hourlyRate: 0,
      ratingAvg: 0,
    }
    users.push(newUser)
    saveUser(newUser)
    return true
  }

  // save profile changes (name, bio, skills, hourly rate)
  // week 3: this becomes PUT /api/users/me
  function updateProfile(data) {
    const saved = getUser(user._id)
    Object.assign(saved, data)
    setUser({ ...saved }) // new object so the navbar shows the new name
  }

  function logout() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      // storage blocked, nothing to remove
    }
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, register, updateProfile, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
