import "server-only"

const GRAPH_BASE = "https://graph.instagram.com"

export type InstagramProfile = {
  id: string
  username: string
  account_type?: "BUSINESS" | "CREATOR" | "PERSONAL"
  media_count?: number
}

export type InstagramMediaItem = {
  id: string
  caption?: string
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"
  media_url?: string
  permalink?: string
  thumbnail_url?: string
  timestamp?: string
}

async function graphGet<T>(
  path: string,
  accessToken: string,
  params?: Record<string, string>,
): Promise<T> {
  const search = new URLSearchParams({ access_token: accessToken, ...params })
  const res = await fetch(`${GRAPH_BASE}${path}?${search.toString()}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Instagram Graph ${path} failed: ${res.status} ${text}`)
  }
  return (await res.json()) as T
}

export function getProfile(accessToken: string): Promise<InstagramProfile> {
  return graphGet<InstagramProfile>("/me", accessToken, {
    fields: "id,username,account_type,media_count",
  })
}

export async function listMedia(
  accessToken: string,
  limit = 25,
): Promise<InstagramMediaItem[]> {
  const data = await graphGet<{ data: InstagramMediaItem[] }>(
    "/me/media",
    accessToken,
    {
      fields:
        "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp",
      limit: String(limit),
    },
  )
  return data.data
}
