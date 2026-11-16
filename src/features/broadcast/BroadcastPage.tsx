import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Heart, Megaphone, RefreshCw, X } from "lucide-react";
import { http } from "@/lib/http";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/shared/Skeleton";

type BroadcastPost = {
  id: number;
  text: string;
  audience: "all" | "vip" | "team_leaders";
  published_at: string;
  like_count: number;
  view_count: number;
  liked_by_me: boolean;
  viewed_by_me: boolean;
  images: string[];
};

type BroadcastPageData = { results: BroadcastPost[]; next_offset: number | null };

function BroadcastCard({ post, onLike, onView, liking }: {
  post: BroadcastPost;
  onLike: (post: BroadcastPost) => void;
  onView: (post: BroadcastPost, viewCount: number) => void;
  liking: boolean;
}) {
  const t = useT();
  const { language } = useI18n();
  const cardRef = useRef<HTMLElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const viewSent = useRef(post.viewed_by_me);

  useEffect(() => {
    if (post.viewed_by_me) viewSent.current = true;
    if (viewSent.current || !cardRef.current || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !viewSent.current) {
        timer = setTimeout(() => {
          if (viewSent.current) return;
          viewSent.current = true;
          void http.post<{ view_count: number }>(`/api/messaging/broadcast/${post.id}/view/`)
            .then(({ view_count }) => onView(post, view_count))
            .catch(() => { viewSent.current = false; });
        }, 700);
      } else if (timer) {
        clearTimeout(timer);
      }
    }, { threshold: [0.01] });
    observer.observe(cardRef.current);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [onView, post]);

  useEffect(() => {
    if (!image) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setImage(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [image]);

  const date = new Intl.DateTimeFormat(language === "ar" ? "ar" : "en", {
    dateStyle: "medium", timeStyle: "short",
  }).format(new Date(post.published_at));

  return (
    <>
      <article ref={cardRef} className="rounded-card border border-app bg-app-surface p-4">
        <header className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-accent-soft text-app-accent">
            <Megaphone className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-title-md text-app-primary">{t("broadcast.support")}</h2>
              {post.audience === "team_leaders" && <span className="rounded-chip bg-app-accent-soft px-2 py-1 text-label text-app-accent">{t("broadcast.teamLeaders")}</span>}
              {post.audience === "vip" && <span className="rounded-chip bg-app-accent-soft px-2 py-1 text-label text-app-accent">{t("broadcast.vip")}</span>}
            </div>
            <time className="text-label text-app-secondary" dateTime={post.published_at}>{date}</time>
          </div>
        </header>

        {post.text && <p className="whitespace-pre-wrap break-words text-body text-app-primary">{post.text}</p>}
        {post.images.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {post.images.map((src, index) => (
              <button key={`${post.id}-${src}`} type="button" onClick={() => setImage(src)} className="overflow-hidden rounded-card bg-app-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-accent" aria-label={t("broadcast.openImage")}>
                <img src={src} alt={t("broadcast.imageAlt", { number: String(index + 1) })} loading="lazy" className="max-h-80 w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <footer className="mt-4 flex items-center gap-5 border-t border-app pt-3">
          <button type="button" onClick={() => onLike(post)} disabled={liking} aria-pressed={post.liked_by_me} aria-label={t("broadcast.like")} className={`inline-flex min-h-10 items-center gap-2 rounded-chip px-2 text-body transition-colors disabled:opacity-50 ${post.liked_by_me ? "text-app-accent" : "text-app-secondary hover:text-app-primary"}`}>
            <Heart className={`h-5 w-5 ${post.liked_by_me ? "fill-current" : ""}`} />
            <span>{post.like_count}</span>
          </button>
          <span className="inline-flex items-center gap-2 text-body text-app-secondary" aria-label={t("broadcast.views")}>
            <Eye className="h-5 w-5" /> {post.view_count}
          </span>
        </footer>
      </article>

      {image && (
        <div role="dialog" aria-modal="true" aria-label={t("broadcast.imagePreview")} className="fixed inset-0 z-50 flex items-center justify-center bg-app-background/95 p-4" onClick={() => setImage(null)}>
          <button type="button" onClick={() => setImage(null)} aria-label={t("common.close")} className="absolute right-4 top-4 z-10 rounded-full bg-app-surface-soft p-3 text-app-primary">
            <X className="h-6 w-6" />
          </button>
          <img src={image} alt={t("broadcast.imagePreview")} className="max-h-[90vh] max-w-full object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </>
  );
}

export function BroadcastPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const { data: unread } = useQuery({
    queryKey: ["broadcast", "unread"],
    queryFn: () => http.get<{ unread_count: number }>("/api/messaging/broadcast/unread/"),
  });
  const feed = useInfiniteQuery({
    queryKey: ["broadcast", "feed"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => http.get<BroadcastPageData>("/api/messaging/broadcast/", { offset: pageParam }),
    getNextPageParam: (page) => page.next_offset ?? undefined,
  });
  const likeMutation = useMutation({
    mutationFn: (post: BroadcastPost) => http.post<{ liked: boolean; like_count: number }>(`/api/messaging/broadcast/${post.id}/like/`),
    onSuccess: (result, post) => {
      queryClient.setQueryData<typeof feed.data>(["broadcast", "feed"], (current) => current && ({
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          results: page.results.map((item) => item.id === post.id ? { ...item, liked_by_me: result.liked, like_count: result.like_count } : item),
        })),
      }));
    },
  });

  const updateViewed = (post: BroadcastPost, viewCount: number) => {
    queryClient.setQueryData<typeof feed.data>(["broadcast", "feed"], (current) => current && ({
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        results: page.results.map((item) => item.id === post.id ? { ...item, viewed_by_me: true, view_count: viewCount } : item),
      })),
    }));
    queryClient.invalidateQueries({ queryKey: ["broadcast", "unread"] });
  };

  const posts = feed.data?.pages.flatMap((page) => page.results) ?? [];
  return (
    <div>
      <TopBar title={t("broadcast.title")} action={
        <button type="button" onClick={() => { void feed.refetch(); void queryClient.invalidateQueries({ queryKey: ["broadcast", "unread"] }); }} aria-label={t("broadcast.refresh")} className="rounded-chip p-2 text-app-secondary hover:bg-app-surface-soft hover:text-app-primary">
          <RefreshCw className={`h-5 w-5 ${feed.isRefetching ? "animate-spin" : ""}`} />
        </button>
      } />
      <main className="px-4 pb-6">
        <div className="mb-3 flex gap-2 border-b border-app pb-3 text-body font-semibold"><Link to="/messages" className="px-3 pb-3 text-app-secondary">{t("chat.chats")}</Link><span className="border-b-2 border-app-accent pb-3 text-app-primary">{t("chat.updates")}</span></div>
        <section className="mb-4 flex items-center justify-between gap-3 rounded-card border border-app bg-app-surface-soft p-4">
          <div>
            <p className="text-title-md text-app-primary">{t("broadcast.subtitle")}</p>
            <p className="mt-1 text-body text-app-secondary">{t("broadcast.newPosts", { count: String(unread?.unread_count ?? 0) })}</p>
          </div>
          <Megaphone className="h-6 w-6 shrink-0 text-app-accent" aria-hidden="true" />
        </section>

        {feed.isPending && <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-48 w-full rounded-card" />)}</div>}
        {feed.isError && <ErrorState onRetry={() => void feed.refetch()} />}
        {!feed.isPending && !feed.isError && posts.length === 0 && <EmptyState message={t("broadcast.empty")} />}
        <div className="flex flex-col gap-3">
          {posts.map((post) => <BroadcastCard key={post.id} post={post} onLike={(item) => likeMutation.mutate(item)} onView={updateViewed} liking={likeMutation.isPending && likeMutation.variables?.id === post.id} />)}
        </div>
        {likeMutation.isError && <p role="alert" className="pt-3 text-body text-app-danger">{t("broadcast.likeError")}</p>}
        {feed.hasNextPage && <Button variant="ghost" fullWidth className="mt-4" onClick={() => void feed.fetchNextPage()} loading={feed.isFetchingNextPage}>{t("broadcast.loadMore")}</Button>}
      </main>
    </div>
  );
}
