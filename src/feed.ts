import collection from "./posts.json";

export type Topic = "All posts" | "Building" | "AI agents" | "Community";
export type View = "top" | "latest" | "saved";
export type Order = "likes" | "reposts" | "replies";
export interface Post {
  id: string;
  author: string;
  handle: string;
  date: string;
  text: string;
  kind: "summary" | "excerpt";
  topics: Exclude<Topic, "All posts">[];
  likes: number;
  reposts: number | null;
  replies: number | null;
  source: string;
  sourceProfile: string;
  avatar: string;
}
export const posts = collection as Post[];
export const topics: Topic[] = [
  "All posts",
  "Building",
  "AI agents",
  "Community",
];
export const SNAPSHOT_DATE = "October 25, 2026";
export const snapshotLabel = "Oct 25, 2026";
export const STORAGE_KEY = "swamp.saved.v1";

export function selectPosts({
  query,
  topic,
  view,
  order,
  saved,
}: {
  query: string;
  topic: Topic;
  view: View;
  order: Order;
  saved: string[];
}) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return posts
    .filter((post) => {
      const haystack =
        `${post.author} ${post.handle} ${post.text} ${post.topics.join(" ")} identity.md identitymd $IMD`.toLocaleLowerCase();
      return (
        (view !== "saved" || saved.includes(post.id)) &&
        (topic === "All posts" || post.topics.includes(topic)) &&
        terms.every((term) => haystack.includes(term))
      );
    })
    .sort((a, b) =>
      view === "latest"
        ? Date.parse(b.date) - Date.parse(a.date)
        : (b[order] ?? -1) - (a[order] ?? -1) ||
          Date.parse(b.date) - Date.parse(a.date),
    );
}

export function readSaved(): { ids: string[]; unavailable: boolean } {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]",
    );
    return {
      ids: Array.isArray(stored)
        ? [
            ...new Set(
              stored.filter(
                (id): id is string =>
                  typeof id === "string" &&
                  posts.some((post) => post.id === id),
              ),
            ),
          ]
        : [],
      unavailable: false,
    };
  } catch {
    return { ids: [], unavailable: true };
  }
}
