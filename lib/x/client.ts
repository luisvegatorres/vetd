import "server-only"

const API_BASE = "https://api.x.com/2"

export type XProfile = {
  id: string
  name: string
  username: string
  profile_image_url?: string
}

export type XPostResult = {
  id: string
  text: string
}

export type XMediaUploadResult = {
  id: string
  media_key?: string
  expires_after_secs?: number
}

async function xFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`X API ${path} failed: ${res.status} ${text}`)
  }
  return (await res.json()) as T
}

export async function getProfile(accessToken: string): Promise<XProfile> {
  const params = new URLSearchParams({
    "user.fields": "profile_image_url",
  })
  const payload = await xFetch<{ data: XProfile }>(
    `/users/me?${params.toString()}`,
    accessToken
  )
  return payload.data
}

export async function uploadImage(
  accessToken: string,
  file: File
): Promise<XMediaUploadResult> {
  const body = new FormData()
  body.set("media", file)
  body.set("media_category", "tweet_image")
  body.set("media_type", file.type)

  const payload = await xFetch<{ data: XMediaUploadResult }>(
    "/media/upload",
    accessToken,
    {
      method: "POST",
      body,
    }
  )
  return payload.data
}

export async function createPost(
  accessToken: string,
  input: { text: string; mediaIds?: string[] }
): Promise<XPostResult> {
  const body: {
    text: string
    media?: { media_ids: string[] }
  } = { text: input.text }
  if (input.mediaIds?.length) {
    body.media = { media_ids: input.mediaIds }
  }

  const payload = await xFetch<{ data: XPostResult }>("/tweets", accessToken, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  return payload.data
}
