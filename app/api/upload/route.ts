import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadToS3 } from '@/lib/s3'

export const dynamic = 'force-dynamic'

// Разрешённые MIME-типы
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/avif',
]
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

// Папка по умолчанию — можно передать ?folder=categories
const DEFAULT_FOLDER = 'menu'

export async function POST(request: NextRequest) {
  try {
    // Только авторизованные пользователи с ролью admin или branch
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const role = (session.user as any).role
    if (role !== 'admin' && role !== 'branch') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const folder = request.nextUrl.searchParams.get('folder') ?? DEFAULT_FOLDER

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Файл не передан' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Недопустимый тип файла. Разрешены: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Файл слишком большой. Максимум 10 МБ' },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadToS3(buffer, file.type, folder)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('[/api/upload] Error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки файла' }, { status: 500 })
  }
}
