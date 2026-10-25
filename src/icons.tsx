import type { CSSProperties, ReactNode } from "react";

export type IconName =
  | "arrow"
  | "search"
  | "flame"
  | "clock"
  | "bookmark"
  | "close"
  | "heart"
  | "reply"
  | "repost"
  | "share"
  | "chevron"
  | "spark"
  | "code"
  | "users"
  | "info"
  | "check"
  | "link"
  | "sliders";
const paths: Record<IconName, ReactNode> = {
  arrow: (
    <>
      <path d="M5 19 19 5M5 5h14v14" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  flame: (
    <path d="M13 3c1 6-5 5-3 11-3-1-4-3-3-5-5 6-2 12 5 12 7 0 10-9 1-18Z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  heart: (
    <path d="M20.8 5.7a5.3 5.3 0 0 0-7.5 0L12 7l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 22l8.8-8.8a5.3 5.3 0 0 0 0-7.5Z" />
  ),
  reply: (
    <path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9 9 0 0 1-4-.8L3 21l1.8-5a9 9 0 0 1-.8-4.5 8.5 8.5 0 0 1 17 0Z" />
  ),
  repost: (
    <>
      <path d="m3 8 4-4 4 4M7 4v12h10M21 16l-4 4-4-4m4 4V8H7" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8" />
    </>
  ),
  chevron: <path d="m7 10 5 5 5-5" />,
  spark: (
    <>
      <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
    </>
  ),
  code: (
    <>
      <path d="m7 7-5 5 5 5m10-10 5 5-5 5m-3-13-4 20" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6m3 11v-4a6 6 0 0 0-2-4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-11v1" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  link: (
    <>
      <path d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h7m6 0h3M4 17h3m6 0h7" />
      <circle cx="14" cy="7" r="3" />
      <circle cx="10" cy="17" r="3" />
    </>
  ),
};
export function Icon({
  name,
  size = 20,
  className = "",
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}

export function XMark({ size = 17 }: { size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.8-8.9L.8 2h6.5l4.5 6.8L18.9 2ZM17.8 20h1.7L6.3 3.9H4.5L17.8 20Z" />
    </svg>
  );
}
