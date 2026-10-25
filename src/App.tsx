import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { Icon, XMark } from "./icons";
import {
  posts,
  readSaved,
  selectPosts,
  snapshotLabel,
  SNAPSHOT_DATE,
  STORAGE_KEY,
  topics,
} from "./feed";
import type { Order, Post, Topic, View } from "./feed";

const topicIcons = {
  Building: "code",
  "AI agents": "spark",
  Community: "users",
} as const;
const count = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const dateFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
type Modal = { type: "about" } | { type: "share"; post: Post } | null;

function PostCard({
  post,
  saved,
  onSave,
  onShare,
  rank,
}: {
  post: Post;
  saved: boolean;
  onSave: (post: Post) => void;
  onShare: (post: Post) => void;
  rank: number;
}) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  return (
    <article
      className="tweet"
      data-post-id={post.id}
      aria-labelledby={`post-${post.id}`}
    >
      <div className="tweet-head">
        <a
          className="avatar-link"
          href={`https://x.com/${post.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${post.author} on X (opens in a new tab)`}
        >
          {avatarFailed ? (
            <span className="avatar-fallback">{post.author.slice(0, 2)}</span>
          ) : (
            <img
              className="avatar"
              src={post.avatar}
              alt=""
              width="44"
              height="44"
              loading="lazy"
              onError={() => setAvatarFailed(true)}
            />
          )}
        </a>
        <div className="author-info">
          <h3 id={`post-${post.id}`}>
            <a
              href={`https://x.com/${post.handle}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {post.author}
            </a>
          </h3>
          <div className="post-byline">
            <span>@{post.handle}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>
              {dateFormat.format(new Date(post.date))}
            </time>
          </div>
        </div>
        <span className="post-rank" aria-label={`Position ${rank}`}>
          {String(rank).padStart(2, "0")}
        </span>
        <a
          className="post-x icon-button"
          href={post.source}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${post.author}’s post on X (opens in a new tab)`}
        >
          <XMark />
        </a>
      </div>
      <div className="tweet-body">
        {post.kind === "excerpt" ? (
          <blockquote>{post.text}</blockquote>
        ) : (
          <p>{post.text}</p>
        )}
      </div>
      <div className="tweet-context">
        <span className="post-kind">
          {post.kind === "excerpt" ? "Post excerpt" : "Post summary"}
        </span>
        <span className="context-separator" aria-hidden="true">
          /
        </span>
        {post.topics.map((topic) => (
          <span key={topic} className="post-topic">
            {topic}
          </span>
        ))}
      </div>
      <div className="tweet-foot">
        <div
          className="post-stats"
          aria-label={`Engagement captured ${snapshotLabel}`}
        >
          <span
            title={
              post.replies === null
                ? "Reply count not captured"
                : `${post.replies} replies at capture`
            }
          >
            <Icon name="reply" size={17} />
            <span>
              {post.replies === null ? "–" : count.format(post.replies)}
            </span>
            <span className="sr-only">
              {post.replies === null ? " reply count not captured" : " replies"}
            </span>
          </span>
          <span
            title={
              post.reposts === null
                ? "Repost count not captured"
                : `${post.reposts} reposts at capture`
            }
          >
            <Icon name="repost" size={18} />
            <span>
              {post.reposts === null ? "–" : count.format(post.reposts)}
            </span>
            <span className="sr-only">
              {post.reposts === null
                ? " repost count not captured"
                : " reposts"}
            </span>
          </span>
          <span title={`${post.likes} likes at capture`}>
            <Icon name="heart" size={17} />
            <span>{count.format(post.likes)}</span>
            <span className="sr-only"> likes</span>
          </span>
        </div>
        <div className="post-actions">
          <button
            className={`icon-button save-button ${saved ? "is-saved" : ""}`}
            onClick={() => onSave(post)}
            aria-label={`${saved ? "Unsave" : "Save"} post by @${post.handle}`}
            aria-pressed={saved}
            title={saved ? "Remove from saved" : "Save on this device"}
          >
            <Icon name="bookmark" size={18} />
          </button>
          <button
            className="icon-button"
            onClick={() => onShare(post)}
            aria-label={`Copy link to post by @${post.handle}`}
            title="Copy post link"
          >
            <Icon name="share" size={18} />
          </button>
          <a
            className="read-post"
            href={post.source}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Read original post by @${post.handle} on X (opens in a new tab)`}
          >
            Read post
            <Icon name="arrow" size={14} />
          </a>
        </div>
      </div>
    </article>
  );
}

function AboutDialog({
  dialogRef,
  modal,
  onClose,
  onCopy,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  modal: Modal;
  onClose: () => void;
  onCopy: (post: Post) => void;
}) {
  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-content">
        <div className="dialog-heading">
          <h2 id="dialog-title">
            {modal?.type === "share"
              ? "Share this post"
              : "A little about the Swamp"}
          </h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
            autoFocus
          >
            <Icon name="close" />
          </button>
        </div>
        {modal?.type === "share" ? (
          <>
            <p>
              Automatic copying is unavailable. Select and copy the original
              post link below.
            </p>
            <label className="field-label" htmlFor="share-url">
              Post link
            </label>
            <input
              id="share-url"
              className="share-input"
              readOnly
              value={modal.post.source}
              onFocus={(event) => event.target.select()}
            />
            <div className="dialog-actions">
              <button
                className="button-primary"
                onClick={() => onCopy(modal.post)}
              >
                <Icon name="link" size={18} />
                Try copying again
              </button>
              <a
                className="button-secondary"
                href={modal.post.source}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on X<Icon name="arrow" size={16} />
              </a>
            </div>
          </>
        ) : (
          <>
            <p>
              Swamp is an independent reader for the identity.md conversation.
              Find a post, follow a builder, or save something for later.
            </p>
            <h3>A snapshot, not a livestream</h3>
            <p>
              These {posts.length} posts and their engagement counts were
              captured on {SNAPSHOT_DATE} from public X profile mirrors. “Top”
              ranks this collection by captured likes, reposts, or replies. A
              dash means a count was not captured; those posts sort last. It is
              not an exhaustive ranking of X.
            </p>
            <h3>Every post has a source</h3>
            <p>
              Cards are labeled as summaries or short excerpts. “Read post”
              opens the original on X, where counts may have changed. Summaries
              report what the author said; they do not independently verify
              project or financial claims.
            </p>
            <h3>Saved here, on this device</h3>
            <p>
              Bookmarks live in this browser’s local storage. No account,
              tracking, or wallet is needed. Clearing browser data clears saved
              posts.
            </p>
            <details className="source-details">
              <summary>View the {posts.length} post sources</summary>
              <ul>
                {posts.map((post) => (
                  <li key={post.id}>
                    <a
                      href={post.source}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @{post.handle} · {dateFormat.format(new Date(post.date))}
                      <Icon name="arrow" size={14} />
                    </a>
                    <a
                      className="mirror-link"
                      href={post.sourceProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Public mirror for post ${post.id}`}
                    >
                      Public mirror
                    </a>
                  </li>
                ))}
              </ul>
            </details>
            <p className="dialog-note">
              Made for the community. Not affiliated with X or the IdentityMD
              team.
            </p>
          </>
        )}
      </div>
    </dialog>
  );
}

export default function App() {
  const [view, setView] = useState<View>(() =>
    location.hash === "#saved" ? "saved" : "top",
  );
  const [topic, setTopic] = useState<Topic>("All posts");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<Order>("likes");
  const [savedState, setSavedState] = useState(readSaved);
  const [notice, setNotice] = useState<{
    message: string;
    kind: "success" | "info";
  } | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const filtered = selectPosts({
    query,
    topic,
    view,
    order,
    saved: savedState.ids,
  });

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const element = event.target as HTMLElement;
      if (
        event.key.toLowerCase() === "k" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName) &&
        !element.isContentEditable &&
        !dialogRef.current?.open &&
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    function hashchange() {
      setView(location.hash === "#saved" ? "saved" : "top");
    }
    function storage(event: StorageEvent) {
      if (event.key === STORAGE_KEY || event.key === null)
        setSavedState(readSaved());
    }
    addEventListener("keydown", keydown);
    addEventListener("hashchange", hashchange);
    addEventListener("storage", storage);
    return () => {
      removeEventListener("keydown", keydown);
      removeEventListener("hashchange", hashchange);
      removeEventListener("storage", storage);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (modal && dialog && !dialog.open) dialog.showModal();
    if (!modal && dialog?.open) dialog.close();
    if (!modal) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [modal]);

  function switchView(next: View, reset = false) {
    setView(next);
    if (reset) {
      setTopic("All posts");
      setQuery("");
      setOrder("likes");
    }
    history.replaceState(null, "", next === "saved" ? "#saved" : "#feed");
  }
  function navigateFeed(next: View) {
    switchView(next, true);
    feedRef.current?.scrollIntoView({ block: "start" });
  }
  function resetFilters() {
    setQuery("");
    setTopic("All posts");
  }
  function toggleSaved(post: Post) {
    const alreadySaved = savedState.ids.includes(post.id);
    const next = alreadySaved
      ? savedState.ids.filter((id) => id !== post.id)
      : [...savedState.ids, post.id];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSavedState({ ids: next, unavailable: false });
      setNotice({
        message: alreadySaved
          ? "Post removed from saved."
          : "Post saved on this device.",
        kind: "success",
      });
    } catch {
      setSavedState({ ids: next, unavailable: true });
      setNotice({
        message:
          "Browser storage is unavailable. Saved posts will last for this visit only.",
        kind: "info",
      });
    }
  }
  async function copyPost(post: Post) {
    try {
      await navigator.clipboard.writeText(post.source);
      setNotice({ message: "Original post link copied.", kind: "success" });
      if (modal?.type === "share") setModal(null);
    } catch {
      setModal({ type: "share", post });
    }
  }

  return (
    <>
      <a className="skip-link" href="#feed">
        Skip to tweets
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a
            className="brand"
            href="#feed"
            onClick={() => switchView("top", true)}
            aria-label="Swamp home"
          >
            <img src="./favicon.svg" alt="" width="36" height="36" />
            <span>
              swamp<span className="brand-dot">.</span>
            </span>
          </a>
          <nav className="main-nav" aria-label="Main navigation">
            <a
              href="#feed"
              className={view !== "saved" ? "active" : ""}
              aria-current={view !== "saved" ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                navigateFeed("top");
              }}
            >
              The feed
            </a>
            <a
              href="#saved"
              className={view === "saved" ? "active" : ""}
              aria-current={view === "saved" ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                navigateFeed("saved");
              }}
            >
              Saved
              {savedState.ids.length > 0 && (
                <span className="nav-count">{savedState.ids.length}</span>
              )}
            </a>
            <button onClick={() => setModal({ type: "about" })}>About</button>
          </nav>
          <a
            className="network-link"
            href="https://imd.fun/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore identity.md
            <Icon name="arrow" size={16} />
          </a>
          <button
            className="mobile-about icon-button"
            aria-label="About this feed"
            onClick={() => setModal({ type: "about" })}
          >
            <Icon name="info" />
          </button>
        </div>
      </header>

      <main className="page-shell">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              The swamp
              <br />
              is <span>talking.</span>
            </h1>
            <p>Top tweets from the identity.md universe.</p>
            <div className="hero-bottom">
              <span className="hero-line" aria-hidden="true"></span>
              <span>Human voices. Agent energy.</span>
            </div>
          </div>
          <img
            className="hero-art"
            src="./art/ai-pepe-squad.webp"
            width="1536"
            height="1024"
            alt="Three tactical Pepes equipped with a neural-powered device, a laptop, and an AI drone."
            fetchPriority="high"
          />
          <div className="hero-caption" aria-hidden="true">
            <Icon name="spark" size={15} />
            <span>Armed with intelligence.</span>
          </div>
        </section>

        <div className="content-layout">
          <section
            className="feed-section"
            id="feed"
            ref={feedRef}
            aria-label="Tweet collection"
            tabIndex={-1}
          >
            <div className="feed-topline">
              <h2>{view === "saved" ? "Saved for later" : "From the swamp"}</h2>
              <button
                className="snapshot-button"
                onClick={() => setModal({ type: "about" })}
              >
                <span className="snapshot-dot" aria-hidden="true"></span>
                <span>{snapshotLabel} snapshot</span>
                <Icon name="info" size={14} />
              </button>
            </div>
            <div className="feed-toolbar">
              <div className="view-tabs" role="group" aria-label="Feed view">
                <button
                  className={view === "top" ? "selected" : ""}
                  aria-pressed={view === "top"}
                  onClick={() => switchView("top")}
                >
                  <Icon name="flame" size={18} />
                  Top tweets
                </button>
                <button
                  className={view === "latest" ? "selected" : ""}
                  aria-pressed={view === "latest"}
                  onClick={() => switchView("latest")}
                >
                  <Icon name="clock" size={18} />
                  Latest
                </button>
                <button
                  className={view === "saved" ? "selected" : ""}
                  aria-pressed={view === "saved"}
                  onClick={() => switchView("saved")}
                >
                  <Icon name="bookmark" size={18} />
                  Saved
                  <span className="tab-count">{savedState.ids.length}</span>
                </button>
              </div>
              <div className="search-box">
                <label className="search-label" htmlFor="post-search">
                  <Icon name="search" size={18} />
                  <span className="sr-only">Search tweets</span>
                </label>
                <input
                  id="post-search"
                  aria-keyshortcuts="Control+K Meta+K"
                  type="search"
                  name="search"
                  autoComplete="off"
                  placeholder="Search the swamp"
                  value={query}
                  ref={searchRef}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setQuery("");
                  }}
                />
                {query ? (
                  <button
                    className="clear-search icon-button"
                    aria-label="Clear search"
                    onClick={() => {
                      setQuery("");
                      searchRef.current?.focus();
                    }}
                  >
                    <Icon name="close" size={16} />
                  </button>
                ) : (
                  <kbd aria-hidden="true">Ctrl K</kbd>
                )}
              </div>
            </div>
            <div className="filter-row">
              <div
                className="topic-filters"
                role="group"
                aria-label="Filter by topic"
              >
                {topics.map((item) => (
                  <button
                    key={item}
                    className={`topic-filter ${topic === item ? "selected" : ""}`}
                    aria-pressed={topic === item}
                    onClick={() => setTopic(item)}
                  >
                    {item !== "All posts" && (
                      <Icon name={topicIcons[item]} size={15} />
                    )}
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="feed-meta">
              <span role="status" aria-live="polite" aria-atomic="true">
                {filtered.length} {filtered.length === 1 ? "post" : "posts"}
                {query || topic !== "All posts"
                  ? " found"
                  : " in this collection"}
              </span>
              <div className="sort-control">
                {view === "latest" ? (
                  <span className="latest-order">
                    Newest first
                    <Icon name="clock" size={14} />
                  </span>
                ) : (
                  <>
                    <label htmlFor="sort-posts">Rank by</label>
                    <div className="select-wrap">
                      <select
                        id="sort-posts"
                        value={order}
                        onChange={(event) =>
                          setOrder(event.target.value as Order)
                        }
                      >
                        <option value="likes">Likes</option>
                        <option value="reposts">Reposts</option>
                        <option value="replies">Replies</option>
                      </select>
                      <Icon name="chevron" size={14} />
                    </div>
                  </>
                )}
              </div>
            </div>
            {view === "saved" && (
              <p className="saved-note">
                <Icon name="info" size={15} />
                {savedState.unavailable
                  ? "Saved for this visit only. Browser storage is unavailable."
                  : "Saved in this browser, on this device."}
              </p>
            )}
            <div className="tweet-list">
              {filtered.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  rank={index + 1}
                  saved={savedState.ids.includes(post.id)}
                  onSave={toggleSaved}
                  onShare={copyPost}
                />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  <Icon
                    name={
                      view === "saved" && !query && topic === "All posts"
                        ? "bookmark"
                        : "search"
                    }
                    size={28}
                  />
                </div>
                <h3>
                  {view === "saved" && !query && topic === "All posts"
                    ? "Keep a little signal."
                    : "Nothing in this corner."}
                </h3>
                <p>
                  {view === "saved" && !query && topic === "All posts"
                    ? "Save a post with the bookmark icon. It’ll be waiting here when you come back."
                    : query
                      ? `No posts match “${query}”${topic !== "All posts" ? ` in ${topic}` : ""}. Try another search or clear your filters.`
                      : `No saved posts in ${topic}. Try another topic or explore the feed.`}
                </p>
                <button
                  className="button-primary"
                  onClick={() => {
                    resetFilters();
                    if (view === "saved") switchView("top");
                  }}
                >
                  {view === "saved" ? "Explore tweets" : "Clear filters"}
                  <Icon name="arrow" size={16} />
                </button>
              </div>
            )}
            {filtered.length > 0 && (
              <div className="end-of-feed">
                <img src="./favicon.svg" width="30" height="30" alt="" />
                <p>You’re all caught up.</p>
                <span>There’s always more in the swamp.</span>
                <a
                  href="https://x.com/search?q=identitymd%20OR%20%22identity.md%22&f=top"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Continue on X<Icon name="arrow" size={14} />
                </a>
              </div>
            )}
          </section>

          <aside className="sidebar" aria-label="About the community">
            <section className="briefing">
              <div className="sidebar-heading">
                <Icon name="spark" size={20} />
                <h2>The bigger picture</h2>
              </div>
              <p>People. Pepes. A swarm of AI agents building in public.</p>
              <p className="secondary-copy">
                identity.md brings independent agents together to turn ideas
                into working code, research, and more.
              </p>
              <a
                className="sidebar-link"
                href="https://imd.fun/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Meet identity.md
                <Icon name="arrow" size={16} />
              </a>
              <div className="briefing-footer">
                <span className="status-mark">
                  <Icon name="code" size={16} />
                </span>
                <span>Built around the builders.</span>
              </div>
            </section>
            <section className="conversation">
              <h2>In the conversation</h2>
              <div className="conversation-topics">
                {(["AI agents", "Building", "Community"] as const).map(
                  (item, index) => (
                    <button
                      className={topic === item ? "is-active" : ""}
                      key={item}
                      onClick={() => {
                        setTopic(item);
                        setQuery("");
                        if (view === "saved") switchView("top");
                        feedRef.current?.scrollIntoView({ block: "start" });
                      }}
                    >
                      <span className="topic-number">0{index + 1}</span>
                      <span className="topic-description">
                        <strong>{item}</strong>
                        <span>
                          {item === "AI agents"
                            ? "Intelligence, put to work"
                            : item === "Building"
                              ? "From prompts to products"
                              : "The people behind the posts"}
                        </span>
                      </span>
                      <Icon name="arrow" size={15} />
                    </button>
                  ),
                )}
              </div>
            </section>
            <section className="source-note">
              <div className="source-note-title">
                <Icon name="info" size={18} />
                <h2>Good signal needs context.</h2>
              </div>
              <p>
                A sourced snapshot, not a live feed. Counts are captured, and
                summaries link back to the original posts.
              </p>
              <button onClick={() => setModal({ type: "about" })}>
                How this feed works
                <Icon name="arrow" size={14} />
              </button>
            </section>
            <div className="sidebar-signoff">
              <img src="./favicon.svg" width="26" height="26" alt="" />
              <span>
                A little weird.
                <br />
                Very much the internet.
              </span>
            </div>
          </aside>
        </div>
        <footer className="site-footer">
          <a
            className="footer-brand"
            href="#feed"
            onClick={() => switchView("top", true)}
          >
            swamp.
          </a>
          <p>An independent corner of the identity.md community.</p>
          <button onClick={() => setModal({ type: "about" })}>
            Sources & about
            <Icon name="arrow" size={14} />
          </button>
        </footer>
      </main>
      <div className="sr-only" role="status" aria-live="polite">
        {notice?.message}
      </div>
      {notice && (
        <div className="toast">
          <Icon name={notice.kind === "success" ? "check" : "info"} size={18} />
          <p>{notice.message}</p>
          <button
            className="icon-button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss message"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <AboutDialog
        dialogRef={dialogRef}
        modal={modal}
        onClose={() => setModal(null)}
        onCopy={copyPost}
      />
    </>
  );
}
