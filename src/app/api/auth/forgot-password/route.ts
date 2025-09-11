import { NextRequest, NextResponse } from 'next/server'
import { accessPool, testConnection } from '@/lib/mysql'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validar se o email foi fornecido
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar conexão com o banco
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { success: false, error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      )
    }

    // Verificar se o email existe no banco
    const [userRows] = await accessPool.execute(
      'SELECT login, nome, email FROM usuarios WHERE email = ? AND status = ? LIMIT 1',
      [email, 'Ativo']
    )

    const users = userRows as { login: string; nome: string; email: string }[]

    if (users.length === 0) {
      // Por segurança, não revelar se o email existe ou não
      return NextResponse.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá um link de redefinição de senha.'
      })
    }

    const user = users[0]

    // Gerar token de redefinição de senha
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hora

    // Salvar o token no banco de dados (você pode criar uma tabela para isso)
    // Por enquanto, vamos simular o envio do email
    console.log('🔐 Token de redefinição gerado:', {
      email: user.email,
      token: resetToken,
      expiry: resetTokenExpiry,
      resetLink: `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
    })

    // TODO: Implementar envio real de email
    // Aqui você integraria com um serviço de email como:
    // - SendGrid
    // - Amazon SES
    // - Nodemailer
    // - Resend

    return NextResponse.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá um link de redefinição de senha.',
      // Em desenvolvimento, retornar o token para teste
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          token: resetToken,
          resetLink: `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
        }
      })
    })

  } catch (error) {
    console.error('Erro no forgot password:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}