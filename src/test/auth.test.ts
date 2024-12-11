import { describe, it, expect } from 'vitest'
import app from '../index'
import { createSupabaseClient } from '../lib/supabase'

describe('Auth API Tests', () => {
  const testUser = {
    username: 'testuser',
    password: 'testpass123'
  }

  it('should register a new user', async () => {
    const res = await app.request('/register', {
      method: 'POST',
      body: JSON.stringify(testUser)
    })
    
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.user.username).toBe(testUser.username)
  })

  it('should login with correct credentials', async () => {
    const res = await app.request('/login', {
      method: 'POST',
      body: JSON.stringify(testUser)
    })
    
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.token).toBeDefined()
  })
}) 