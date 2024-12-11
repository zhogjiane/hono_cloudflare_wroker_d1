import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { HTTPException } from 'hono/http-exception'
import { createSupabaseClient } from './lib/supabase'
import { hashPassword } from './lib/crypto'
import type { Bindings, LoginRequest, RegisterRequest, User } from './types'
import { SignJWT } from 'jose'

const app = new Hono<{ Bindings: Bindings }>()

// JWT 中间件
app.use('/api/*', async (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET
  })
  return jwtMiddleware(c, next)
})

// 登录路由
app.post('/login', async (c) => {
  const { username, password } = await c.req.json<LoginRequest>()
  
  const supabase = createSupabaseClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_ANON_KEY
  )
  
  const hashedPassword = await hashPassword(password, c.env.PASSWORD_SALT)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .eq('password', hashedPassword)
    .single()
  
  if (error || !profile) {
    throw new HTTPException(401, { message: '用户名或密码错误' })
  }
  
  const payload = {
    id: profile.id,
    username: profile.username,
    role: profile.role
  }
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(new TextEncoder().encode(c.env.JWT_SECRET))
  
  return c.json({
    success: true,
    token,
    user: {
      id: profile.id,
      username: profile.username,
      role: profile.role
    }
  })
})

// 受保护的路由示例
app.get('/api/protected', async (c) => {
  const payload = c.get('jwtPayload')
  const supabase = createSupabaseClient(
    c.env.SUPABASE_URL as string,
    c.env.SUPABASE_ANON_KEY as string
  )
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', payload.id)
    .single()
    
  return c.json({
    message: '认证成功',
    user: profile
  })
})

// 健康检查路由
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// 注册路由
app.post('/register', async (c) => {
  const { username, password, role = 'user' } = await c.req.json<RegisterRequest>()
  
  const supabase = createSupabaseClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_ANON_KEY
  )
  
  const hashedPassword = await hashPassword(password, c.env.PASSWORD_SALT)
  const { data: newUser, error } = await supabase
    .from('profiles')
    .insert([
      {
        username,
        password: hashedPassword,
        role
      }
    ])
    .select()
    .single()
  
  if (error) {
    throw new HTTPException(500, { message: '创建用户失败' })
  }
  
  return c.json({
    success: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role
    }
  })
})

export default app 