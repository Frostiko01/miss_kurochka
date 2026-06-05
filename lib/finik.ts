/**
 * Finik Pay — интеграция с платежной системой Кыргызстана.
 * Создаёт QR-платежи и верифицирует webhooks.
 */
import { Signer } from '@mancho.devs/authorizer'
import crypto from 'crypto'

let isInitialized = false

type Body = Record<string, unknown> | string | undefined

interface RequestData {
  httpMethod: string
  path: string
  headers: Record<string, string>
  queryStringParameters?: Record<string, string> | null
  body?: Body | null
}

function getFinikEnv(): 'prod' | 'beta' {
  return (process.env.FINIK_ENV || 'beta') as 'prod' | 'beta'
}

function getBaseUrl() {
  const env = getFinikEnv()
  return env === 'prod'
    ? 'https://api.acquiring.averspay.kg'
    : 'https://beta.api.acquiring.averspay.kg'
}

function getHost() {
  const env = getFinikEnv()
  return env === 'prod'
    ? 'api.acquiring.averspay.kg'
    : 'beta.api.acquiring.averspay.kg'
}

function getFinikApiKey() {
  return process.env.FINIK_API_KEY
}

function getFinikAccountId() {
  return process.env.FINIK_ACCOUNT_ID
}

function getFinikPrivateKey() {
  if (process.env.FINIK_PRIVATE_KEY) {
    const key = process.env.FINIK_PRIVATE_KEY.trim()
    
    // Проверка на заглушку/тестовый ключ
    const isPlaceholder = key.includes('4yF9wXbCq8vK8Z7yT2xR9zQ2wB6mX9zL')
    
    if (!isInitialized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✓ Using FINIK_PRIVATE_KEY from environment')
        console.log(`  Key length: ${key.length} characters`)
        
        if (isPlaceholder) {
          console.warn('⚠️ WARNING: FINIK_PRIVATE_KEY appears to be a placeholder!')
          console.warn('  Please replace it with your real private key.')
          console.warn('  Run: npx tsx scripts/test-finik-key.ts')
        } else if (key.length < 800) {
          console.warn('⚠️ WARNING: FINIK_PRIVATE_KEY seems too short!')
          console.warn(`  Expected: ~1700+ chars, Got: ${key.length} chars`)
        } else {
          console.log('  ✅ Key format looks valid')
        }
      }
      isInitialized = true
    }
    
    if (isPlaceholder) {
      console.error('❌ Cannot use placeholder FINIK_PRIVATE_KEY in production!')
      return undefined
    }
    
    return key
  }
  if (!isInitialized) {
    console.warn('⚠️ FINIK_PRIVATE_KEY not configured (требуется только для prod)')
    isInitialized = true
  }
  return undefined
}

const FINIK_PUBLIC_KEYS = {
  prod: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuF/PUmhMPPidcMxhZBPb
BSGJoSphmCI+h6ru8fG8guAlcPMVlhs+ThTjw2LHABvciwtpj51ebJ4EqhlySPyT
hqSfXI6Jp5dPGJNDguxfocohaz98wvT+WAF86DEglZ8dEsfoumojFUy5sTOBdHEu
g94B4BbrJvjmBa1YIx9Azse4HFlWhzZoYPgyQpArhokeHOHIN2QFzJqeriANO+wV
aUMta2AhRVZHbfyJ36XPhGO6A5FYQWgjzkI65cxZs5LaNFmRx6pjnhjIeVKKgF99
4OoYCzhuR9QmWkPl7tL4Kd68qa/xHLz0Psnuhm0CStWOYUu3J7ZpzRK8GoEXRcr8
tQIDAQAB
-----END PUBLIC KEY-----`,
  beta: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwlrlKz/8gLWd1ARWGA/8
o3a3Qy8G+hPifyqiPosiTY6nCHovANMIJXk6DH4qAqqZeLu8pLGxudkPbv8dSyG7
F9PZEAryMPzjoB/9P/F6g0W46K/FHDtwTM3YIVvstbEbL19m8yddv/xCT9JPPJTb
LsSTVZq5zCqvKzpupwlGS3Q3oPyLAYe+ZUn4Bx2J1WQrBu3b08fNaR3E8pAkCK27
JqFnP0eFfa817VCtyVKcFHb5ij/D0eUP519Qr/pgn+gsoG63W4pPHN/pKwQUUiAy
uLSHqL5S2yu1dffyMcMVi9E/Q2HCTcez5OvOllgOtkNYHSv9pnrMRuws3u87+hNT
ZwIDAQAB
-----END PUBLIC KEY-----`,
}

/**
 * Валидация формата приватного ключа
 */
function validatePrivateKey(key: string): { valid: boolean; error?: string } {
  if (!key || key.length === 0) {
    return { valid: false, error: 'Private key is empty' }
  }

  // Проверка на заглушку
  if (key.includes('4yF9wXbCq8vK8Z7yT2xR9zQ2wB6mX9zL')) {
    return { valid: false, error: 'Private key is a placeholder, not a real key' }
  }

  // Проверка формата
  if (!key.includes('BEGIN') || !key.includes('PRIVATE KEY')) {
    return { valid: false, error: 'Invalid key format: missing BEGIN PRIVATE KEY header' }
  }

  if (!key.includes('END') || !key.includes('PRIVATE KEY')) {
    return { valid: false, error: 'Invalid key format: missing END PRIVATE KEY footer' }
  }

  // Проверка минимальной длины (RSA 2048 ключ обычно ~1700+ символов)
  if (key.length < 800) {
    return { valid: false, error: `Private key too short: ${key.length} chars (expected 1700+)` }
  }

  return { valid: true }
}

export interface CreatePaymentData {
  amount: number
  workId: string
  workTopic: string
  userId: string
}

export interface FinikWebhookData {
  id: string
  transactionId: string
  status: 'succeeded' | 'failed' | 'SUCCEEDED' | 'FAILED'
  amount: number
  transactionDate: number
  clientId: string
  fields: {
    transactionType?: string
    amount?: number
    webhook_url?: string
    paymentId?: string
    success_redirect_url?: string
    qrComment?: string
    name?: string
    qrTransactionId?: string
    url?: string
    [key: string]: unknown
  }
  data: {
    accountId?: string
    description?: string
    metadata?: string | Record<string, unknown>
    webhookUrl?: string
    merchantCategoryCode?: string
    name_en?: string
    [key: string]: unknown
  }
}

/**
 * Создаёт платёж в Finik Acquiring API. Возвращает URL платёжной страницы.
 */
export async function createFinikPayment(data: CreatePaymentData): Promise<string> {
  const FINIK_ENV = getFinikEnv()
  const FINIK_API_KEY = getFinikApiKey()
  const FINIK_ACCOUNT_ID = getFinikAccountId()
  const FINIK_PRIVATE_KEY = getFinikPrivateKey()
  const BASE_URL = getBaseUrl()
  const HOST = getHost()

  if (!FINIK_API_KEY || !FINIK_ACCOUNT_ID) {
    throw new Error(
      'Finik credentials are not configured (FINIK_API_KEY and FINIK_ACCOUNT_ID required)',
    )
  }

  if (FINIK_ENV === 'prod' && !FINIK_PRIVATE_KEY) {
    throw new Error('FINIK_PRIVATE_KEY is required for production environment')
  }

  // Валидация формата ключа
  if (FINIK_ENV === 'prod' && FINIK_PRIVATE_KEY) {
    const validation = validatePrivateKey(FINIK_PRIVATE_KEY)
    if (!validation.valid) {
      console.error('❌ Invalid FINIK_PRIVATE_KEY:', validation.error)
      throw new Error(
        `Invalid FINIK_PRIVATE_KEY: ${validation.error}\n` +
        'Please run: npx tsx scripts/test-finik-key.ts\n' +
        'See FINIK_KEY_SETUP.md for detailed instructions'
      )
    }
  }

  const timestamp = Date.now().toString()
  const paymentId = crypto.randomUUID()

  const APP_URL = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')

  // Проверка на localhost в production
  if (FINIK_ENV === 'prod' && APP_URL.includes('localhost')) {
    console.warn('⚠️ WARNING: Using localhost URL in production Finik environment!')
    console.warn('  Finik will not be able to send webhooks to localhost.')
    console.warn('  Please set NEXTAUTH_URL or NEXT_PUBLIC_APP_URL to your public domain.')
  }

  console.log('🌐 Using APP_URL:', APP_URL)

  const body = {
    Amount: data.amount,
    CardType: 'FINIK_QR',
    PaymentId: paymentId,
    RedirectUrl: `${APP_URL}/orders/${data.workId}/receipt?payment=success`,
    CancelUrl: `${APP_URL}/cart`,
    Data: {
      accountId: FINIK_ACCOUNT_ID,
      merchantCategoryCode: '0742',
      name_en: 'MissKurochka',
      description: data.workTopic || 'Payment for Miss Kurochka order',
      webhookUrl: `${APP_URL}/api/finik/webhook`,
      metadata: JSON.stringify({
        userId: data.userId,
        workId: data.workId,
        paymentId,
      }),
    },
  }

  const requestData: RequestData = {
    httpMethod: 'POST',
    path: '/v1/payment',
    headers: {
      Host: HOST,
      'x-api-key': FINIK_API_KEY,
      'x-api-timestamp': timestamp,
    },
    queryStringParameters: undefined,
    body,
  }

  let signature = ''
  if (FINIK_ENV === 'prod' && FINIK_PRIVATE_KEY) {
    try {
      console.log('🔐 Generating Finik signature...')
      console.log('Private key length:', FINIK_PRIVATE_KEY.length)
      console.log('Private key starts with:', FINIK_PRIVATE_KEY.substring(0, 30))
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signature = await new Signer(requestData as any).sign(FINIK_PRIVATE_KEY)
      console.log('✅ Signature generated successfully')
    } catch (error) {
      console.error('❌ Finik signature error:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        privateKeyFormat: FINIK_PRIVATE_KEY.substring(0, 50) + '...',
      })
      throw new Error(`Failed to generate Finik signature: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const url = `${BASE_URL}${requestData.path}`
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-api-key': FINIK_API_KEY,
    'x-api-timestamp': timestamp,
  }
  if (signature) headers['signature'] = signature

  // Уникальный идентификатор для сквозного трейсинга платежа в логах
  const traceId = crypto.randomUUID().slice(0, 8)
  const bodyString = JSON.stringify(body)

  const log = (emoji: string, msg: string, extra?: Record<string, unknown>) => {
    const base = `[FINIK ${traceId}] ${emoji} ${msg}`
    if (extra) console.log(base, JSON.stringify(extra))
    else console.log(base)
  }

  log('🧾', 'Параметры платежа', {
    env: FINIK_ENV,
    url,
    amount: data.amount,
    workId: data.workId,
    paymentId,
    appUrl: APP_URL,
    accountId: FINIK_ACCOUNT_ID ? '***' + FINIK_ACCOUNT_ID.slice(-6) : 'missing',
    apiKey: FINIK_API_KEY ? '***' + FINIK_API_KEY.slice(-4) : 'missing',
    hasSignature: !!signature,
    timestamp,
    bodyBytes: bodyString.length,
  })

  // Полный body печатаем отдельно (без секретов) — поможет при разборе с Finik
  log('📦', 'Тело запроса', {
    Amount: body.Amount,
    CardType: body.CardType,
    PaymentId: body.PaymentId,
    RedirectUrl: body.RedirectUrl,
    CancelUrl: body.CancelUrl,
    Data: {
      ...body.Data,
      accountId: body.Data.accountId ? '***' + String(body.Data.accountId).slice(-6) : undefined,
    },
  })

  // Повтор при сбое шлюза Finik (502/503/504) или сетевой ошибке.
  // Их backend периодически падает с 502 — короткий retry часто спасает платёж.
  const MAX_ATTEMPTS = 3
  const RETRY_DELAY_MS = 1500
  const RETRYABLE_STATUSES = [502, 503, 504]
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  let response: Response | undefined
  let lastErrorText = ''

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const attemptStart = Date.now()
    log('📤', `Отправка запроса в Finik (попытка ${attempt}/${MAX_ATTEMPTS})...`)

    try {
      response = await fetch(url, {
        method: requestData.httpMethod,
        headers,
        body: bodyString,
        redirect: 'manual',
      })
    } catch (fetchError) {
      const ms = Date.now() - attemptStart
      log('❌', `Сетевая ошибка за ${ms}мс`, {
        message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        attempt,
      })
      if (attempt < MAX_ATTEMPTS) {
        log('⏳', `Повтор через ${RETRY_DELAY_MS}мс...`)
        await sleep(RETRY_DELAY_MS)
        continue
      }
      throw new Error(
        `Failed to connect to Finik API: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
      )
    }

    const ms = Date.now() - attemptStart
    log('📡', `Ответ Finik за ${ms}мс`, {
      status: response.status,
      statusText: response.statusText,
      location: response.headers.get('location')?.slice(0, 100) ?? null,
      contentType: response.headers.get('content-type'),
    })

    // Успешный редирект — платёжная страница готова
    if (response.status === 302 || response.status === 301) {
      const paymentUrl = response.headers.get('location')
      if (!paymentUrl) {
        log('❌', 'Редирект без Location — URL платежа не найден')
        throw new Error('Payment URL not found in Finik response')
      }
      if (paymentUrl.includes('status=failed')) {
        log('⚠️', 'URL платежа содержит status=failed', { paymentUrl })
      }
      log('✅', 'Платёж создан, получен URL платёжной страницы', { paymentUrl: paymentUrl.slice(0, 120) })
      return paymentUrl
    }

    // JSON-ответ с url (некоторые версии API)
    if (response.ok) {
      try {
        const json = await response.json()
        log('📦', 'JSON-ответ Finik', json)
        const possibleUrl = (json?.url ?? json?.paymentUrl ?? json?.location) as string | undefined
        if (possibleUrl) {
          log('✅', 'Платёж создан (URL из JSON)', { paymentUrl: possibleUrl.slice(0, 120) })
          return possibleUrl
        }
        log('⚠️', 'JSON-ответ без URL платежа')
      } catch {
        log('⚠️', 'Не удалось разобрать JSON-ответ')
      }
    }

    lastErrorText = await response.text().catch(() => '')
    log('❌', 'Finik вернул ошибку', {
      status: response.status,
      statusText: response.statusText,
      body: lastErrorText.slice(0, 300),
      attempt,
    })

    // Повторяем только при сбое шлюза
    if (RETRYABLE_STATUSES.includes(response.status) && attempt < MAX_ATTEMPTS) {
      log('⏳', `Сбой шлюза Finik (${response.status}), повтор через ${RETRY_DELAY_MS}мс...`)
      await sleep(RETRY_DELAY_MS)
      continue
    }
    break
  }

  if (!response) {
    throw new Error('Finik API: нет ответа после всех попыток')
  }

  log('🛑', `Платёж не создан после ${MAX_ATTEMPTS} попыток`, {
    finalStatus: response.status,
  })

  // 502/503/504 — сбой на стороне платёжного шлюза Finik (их backend упал),
  // запрос и подпись корректны. Сообщаем об этом отдельно, чтобы не путать
  // с ошибкой конфигурации на нашей стороне.
  if (RETRYABLE_STATUSES.includes(response.status)) {
    throw new Error(
      `Платёжный сервис Finik временно недоступен (HTTP ${response.status}). ` +
      `Это сбой на стороне Finik — повторите оплату позже или обратитесь в поддержку Finik.`,
    )
  }

  throw new Error(`Finik payment creation failed (${response.status}): ${lastErrorText}`)
}

/**
 * Верифицирует подпись webhook от Finik.
 */
export async function verifyFinikWebhook(
  signature: string,
  timestamp: string,
  body: Record<string, unknown>,
  headers: Record<string, string>,
  webhookPath: string = '/api/finik/webhook',
): Promise<boolean> {
  try {
    const FINIK_ENV = getFinikEnv()
    const env: 'prod' | 'beta' = FINIK_ENV === 'prod' ? 'prod' : 'beta'
    const publicKey = FINIK_PUBLIC_KEYS[env]
    if (!publicKey) {
      console.error('Finik public key is not configured for environment:', env)
      return false
    }

    const requestData = {
      httpMethod: 'POST',
      path: webhookPath,
      headers: {
        Host: headers['host'] || headers['Host'] || '',
        'x-api-timestamp': timestamp,
      },
      queryStringParameters: undefined,
      body,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isValid = await new Signer(requestData as any).verify(publicKey, signature)
    return isValid
  } catch (error) {
    console.error('Error verifying Finik webhook:', error)
    return false
  }
}

/**
 * Проверяет что timestamp не слишком старый — защита от replay-атак.
 */
export function isTimestampValid(timestamp: string, maxAgeMinutes = 5): boolean {
  try {
    const requestTime = parseInt(timestamp, 10)
    const currentTime = Date.now()
    const diffMinutes = (currentTime - requestTime) / 1000 / 60
    return Math.abs(diffMinutes) <= maxAgeMinutes
  } catch {
    return false
  }
}
