import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const DEFAULT_REGION = "us-east-1"

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return v.trim()
}

let cachedClient: S3Client | null = null
let ensuredBucketName: string | null = null

function isBucketMissingError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false
  const x = e as {
    name?: string
    Code?: string
    $metadata?: { httpStatusCode?: number }
    message?: string
  }
  const code = x.name ?? x.Code
  if (code === "NotFound" || code === "NoSuchBucket") return true
  if (x.$metadata?.httpStatusCode === 404) return true
  if (typeof x.message === "string" && /does not exist/i.test(x.message)) {
    return true
  }
  return false
}

export async function ensureMinioDocumentsBucket(): Promise<void> {
  const Bucket = getMinioDocumentsBucketName()
  if (ensuredBucketName === Bucket) return
  const client = getMinioS3Client()
  try {
    await client.send(new HeadBucketCommand({ Bucket }))
  } catch (e: unknown) {
    if (!isBucketMissingError(e)) throw e
    try {
      await client.send(new CreateBucketCommand({ Bucket }))
    } catch (createErr: unknown) {
      const c = createErr as { name?: string; Code?: string }
      const n = c.name ?? c.Code
      if (
        n !== "BucketAlreadyExists" &&
        n !== "BucketAlreadyOwnedByYou" &&
        n !== "OperationAborted"
      ) {
        throw createErr
      }
    }
  }
  ensuredBucketName = Bucket
}

export function isMinioConfigured(): boolean {
  return Boolean(
    process.env.MINIO_URL?.trim() &&
      process.env.MINIO_ACCESS_KEY?.trim() &&
      process.env.MINIO_SECRET_KEY?.trim() &&
      process.env.MINIO_BUCKET_DOCUMENTS?.trim(),
  )
}

export function getMinioS3Client(): S3Client {
  if (cachedClient) {
    return cachedClient
  }
  const endpoint = requireEnv("MINIO_URL").replace(/\/$/, "")
  cachedClient = new S3Client({
    endpoint,
    region: process.env.MINIO_REGION?.trim() || DEFAULT_REGION,
    credentials: {
      accessKeyId: requireEnv("MINIO_ACCESS_KEY"),
      secretAccessKey: requireEnv("MINIO_SECRET_KEY"),
    },
    forcePathStyle: true,
  })
  return cachedClient
}

export function getMinioDocumentsBucketName(): string {
  return requireEnv("MINIO_BUCKET_DOCUMENTS")
}

export async function getDocumentObjectBuffer(key: string): Promise<Buffer> {
  await ensureMinioDocumentsBucket()
  const client = getMinioS3Client()
  const Bucket = getMinioDocumentsBucketName()
  const out = await client.send(new GetObjectCommand({ Bucket, Key: key }))
  if (!out.Body) {
    throw new Error("Objeto vazio no storage")
  }
  const bytes = await out.Body.transformToByteArray()
  return Buffer.from(bytes)
}

export async function putDocumentObject(
  key: string,
  body: PutObjectCommandInput["Body"],
  contentType?: string,
): Promise<void> {
  await ensureMinioDocumentsBucket()
  const client = getMinioS3Client()
  const Bucket = getMinioDocumentsBucketName()
  await client.send(
    new PutObjectCommand({
      Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

export async function getPresignedDocumentGetUrl(
  key: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const client = getMinioS3Client()
  const Bucket = getMinioDocumentsBucketName()
  const command = new GetObjectCommand({ Bucket, Key: key })
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}

export async function getPresignedDocumentPutUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 600,
): Promise<string> {
  const client = getMinioS3Client()
  const Bucket = getMinioDocumentsBucketName()
  const command = new PutObjectCommand({
    Bucket,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}
