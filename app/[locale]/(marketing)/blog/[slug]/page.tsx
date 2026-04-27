import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { hasLocale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"

import { PostBody } from "@/components/blog/post-body"
import { PostRecentList } from "@/components/blog/post-recent-list"
import { PostShare } from "@/components/blog/post-share"
import { PostSimilarGrid } from "@/components/blog/post-similar-grid"
import { Section } from "@/components/layout/section"
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { JsonLd } from "@/components/seo/json-ld"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Link } from "@/i18n/navigation"
import { routing, type Locale } from "@/i18n/routing"
import {
  getAllPublishedSlugs,
  getPostBySlug,
  getRecentPosts,
  getRelatedPosts,
} from "@/lib/blog/queries"
import { buildAlternates, localeUrl } from "@/lib/seo"
import { site } from "@/lib/site"
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data"

export const revalidate = 300

export async function generateStaticParams() {
  const posts = await getAllPublishedSlugs()
  return routing.locales.flatMap((locale) =>
    posts
      .filter((p) => p.available_locales.includes(locale))
      .map((p) => ({ locale, slug: p.slug })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const post = await getPostBySlug(locale as Locale, slug)
  if (!post) return {}

  const alternates = buildAlternates(
    locale as Locale,
    `/blog/${slug}`,
    post.available_locales,
  )

  return {
    title: `${post.title} — ${site.name}`,
    description: post.excerpt ?? undefined,
    alternates,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      url: alternates.canonical,
      type: "article",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  const post = await getPostBySlug(locale as Locale, slug)
  if (!post) notFound()

  const t = await getTranslations({ locale, namespace: "blog" })

  const [recentPosts, similarPosts] = await Promise.all([
    getRecentPosts(locale as Locale, slug, 4),
    getRelatedPosts(locale as Locale, slug, post.tags, 3),
  ])

  const longDateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const shortDateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const postUrl = localeUrl(locale as Locale, `/blog/${slug}`)
  const ogUrl = `${postUrl}/opengraph-image`

  const breadcrumbs = breadcrumbSchema([
    { name: site.name, url: localeUrl(locale as Locale) },
    { name: t("metaTitle"), url: localeUrl(locale as Locale, "/blog") },
    { name: post.title, url: postUrl },
  ])

  const article = articleSchema({
    url: postUrl,
    headline: post.title,
    description: post.excerpt ?? "",
    image: post.cover_image_url ?? ogUrl,
    inLanguage: locale as Locale,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    keywords: post.tags,
  })

  const primaryTag = post.tags[0]
  const authorInitial = site.name.charAt(0).toUpperCase()

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <JsonLd data={article} />

      <Section size="sm" className="scroll-mt-20 border-b-0 pb-0">
        <Reveal y={12}>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            {t("back")}
          </Link>
        </Reveal>
      </Section>

      <Section size="md" className="border-b-0">
        <RevealGroup
          className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16"
          delayChildren={0.08}
          stagger={0.08}
        >
          <div className="space-y-6">
            <RevealItem y={18}>
              <h1 className="font-heading text-3xl leading-tight text-foreground capitalize sm:text-4xl lg:text-[2.75rem] xl:text-5xl">
                {post.title}
              </h1>
            </RevealItem>
            {post.excerpt ? (
              <RevealItem y={18}>
                <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  {post.excerpt}
                </p>
              </RevealItem>
            ) : null}
            <RevealItem y={18}>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback>{authorInitial}</AvatarFallback>
                  </Avatar>
                  <span className="font-heading text-sm text-foreground uppercase tracking-wide">
                    {site.name}
                  </span>
                </div>
                {primaryTag ? (
                  <>
                    <span
                      aria-hidden
                      className="h-4 w-px bg-border"
                    />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {primaryTag}
                    </span>
                  </>
                ) : null}
                <span aria-hidden className="h-4 w-px bg-border" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {shortDateFormatter.format(new Date(post.published_at))}
                </span>
                <span aria-hidden className="h-4 w-px bg-border" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("readingTime", { minutes: post.reading_time_minutes })}
                </span>
              </div>
            </RevealItem>
          </div>
          <RevealItem y={24}>
            <div className="relative aspect-[16/9] overflow-hidden border border-border bg-muted">
              {post.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.cover_image_url}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-heading text-7xl text-muted-foreground/40 uppercase sm:text-8xl">
                    {authorInitial}
                  </span>
                </div>
              )}
            </div>
          </RevealItem>
        </RevealGroup>
      </Section>

      <Section size="md" className="border-b-0">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <Reveal y={18}>
              <PostBody markdown={post.body_md} />
            </Reveal>

            <Reveal y={12} className="mt-16">
              <p className="text-xs text-muted-foreground uppercase">
                {t("updatedOn", {
                  date: longDateFormatter.format(new Date(post.updated_at)),
                })}
              </p>
            </Reveal>

            <Reveal y={12} className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
                {post.tags.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <li key={tag}>
                        <span className="inline-flex items-center border border-border bg-card px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                          {tag}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span />
                )}
                <PostShare url={postUrl} title={post.title} />
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-4">
            <Reveal y={18} className="lg:sticky lg:top-24">
              <PostRecentList heading={t("recentPosts")} posts={recentPosts} />
            </Reveal>
          </div>
        </div>
      </Section>

      {similarPosts.length > 0 ? (
        <Section size="lg" className="border-b-0 bg-card/40">
          <Reveal y={18}>
            <PostSimilarGrid
              heading={t("similarPosts")}
              posts={similarPosts}
            />
          </Reveal>
        </Section>
      ) : null}
    </>
  )
}
