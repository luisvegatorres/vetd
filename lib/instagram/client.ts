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

async function graphPost<T>(
  path: string,
  accessToken: string,
  params: Record<string, string>,
): Promise<T> {
  // Instagram's publish endpoints accept params as either form-urlencoded
  // body or query string. Query string is simplest and what their docs
  // examples use. access_token goes in the query alongside everything else.
  const search = new URLSearchParams({ access_token: accessToken, ...params })
  const res = await fetch(`${GRAPH_BASE}${path}?${search.toString()}`, {
    method: "POST",
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Instagram Graph POST ${path} failed: ${res.status} ${text}`)
  }
  return (await res.json()) as T
}

export type ContainerCreateResult = { id: string }
export type PublishResult = { id: string }

export function createImageContainer(
  accessToken: string,
  input: { imageUrl: string; caption?: string },
): Promise<ContainerCreateResult> {
  // Instagram Graph API: creates an unpublished media container. The
  // container has a 24h TTL but we publish within seconds so that's moot.
  // Caption supports up to 2200 chars, 30 hashtags, 20 mentions.
  const params: Record<string, string> = {
    image_url: input.imageUrl,
    media_type: "IMAGE",
  }
  if (input.caption) params.caption = input.caption
  return graphPost<ContainerCreateResult>("/me/media", accessToken, params)
}

export function publishContainer(
  accessToken: string,
  creationId: string,
): Promise<PublishResult> {
  return graphPost<PublishResult>("/me/media_publish", accessToken, {
    creation_id: creationId,
  })
}

export type MediaDetails = {
  id: string
  permalink: string
  media_type?: string
  timestamp?: string
}

export function getMediaDetails(
  accessToken: string,
  mediaId: string,
): Promise<MediaDetails> {
  return graphGet<MediaDetails>(`/${mediaId}`, accessToken, {
    fields: "id,permalink,media_type,timestamp",
  })
}
