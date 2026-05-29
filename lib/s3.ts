import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

const ENDPOINT = process.env.S3_ENDPOINT!
const BUCKET   = process.env.S3_BUCKET!
const REGION   = process.env.S3_REGION ?? 'us-east-1'

export const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId:     process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // обязательно для совместимых S3-хранилищ
})

/**
 * Загружает Buffer/Uint8Array в S3 и возвращает публичный URL.
 * @param body    — содержимое файла
 * @param mime    — MIME-тип (image/jpeg, image/png, image/webp …)
 * @param folder  — папка внутри бакета (menu, categories, banners …)
 */
export async function uploadToS3(
  body: Buffer | Uint8Array,
  mime: string,
  folder = 'uploads',
): Promise<string> {
  const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
  const key = `${folder}/${randomUUID()}.${ext}`

  await s3.send(
    new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      Body:        body,
      ContentType: mime,
      ACL:         'public-read',
    }),
  )

  return `${ENDPOINT}/${BUCKET}/${key}`
}

/**
 * Удаляет объект из S3 по его публичному URL.
 * Безопасно — не бросает ошибку если объект не найден.
 */
export async function deleteFromS3(url: string): Promise<void> {
  try {
    const prefix = `${ENDPOINT}/${BUCKET}/`
    if (!url.startsWith(prefix)) return
    const key = url.slice(prefix.length)
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  } catch {
    // best-effort
  }
}
