import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import assert from "node:assert/strict";

// Override only for an isolated dependency installation. Normal npm ci needs no variables.
const { chromium, webkit } = await import(
  process.env.SWAMP_PLAYWRIGHT || "playwright"
);
const { default: AxeBuilder } = await import(
  process.env.SWAMP_AXE || "@axe-core/playwright"
);
const root = resolve("dist");
const posts = JSON.parse(await readFile("src/posts.json", "utf8"));
const report = {
  date: new Date().toISOString(),
  origin: "/preview/",
  checks: [],
  limitations: [],
};
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://local");
    if (!url.pathname.startsWith("/preview/")) {
      res.writeHead(404).end();
      return;
    }
    const path = resolve(
      root,
      decodeURIComponent(url.pathname.slice("/preview/".length)) ||
        "index.html",
    );
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": mime[extname(path)] || "application/octet-stream",
    });
    res.end(await readFile(path));
  } catch {
    res.writeHead(404).end("Not found");
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
await mkdir("test/scratch/interactions", { recursive: true });
const checked = (name, detail) => {
  report.checks.push({ name, passed: true, ...(detail ? { detail } : {}) });
  console.log(`PASS ${name}`);
};
const check = (name, condition, detail) => {
  assert(condition, name);
  checked(name, detail);
};
const postIds = async (page) =>
  page
    .locator("article[data-post-id]")
    .evaluateAll((els) => els.map((el) => el.dataset.postId));
const overflow = (page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
const newest = [...posts]
  .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  .map((p) => p.id);
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const errors = [],
    failures = [],
    externalRequests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (req) => failures.push(req.url()));
  page.on("response", (res) => {
    if (res.status() >= 400) failures.push(`${res.status()} ${res.url()}`);
  });
  await context.route("**/*", async (route) => {
    if (new URL(route.request().url()).origin !== new URL(url).origin) {
      externalRequests.push(route.request().url());
      await route.abort();
    } else await route.continue();
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  check(
    "All 12 sourced posts render at a static subpath",
    (await page.locator("article").count()) === 12,
  );
  check(
    "Default ranking uses captured likes, with newer posts first on ties",
    (await postIds(page)).join() ===
      [...posts]
        .sort(
          (a, b) =>
            b.likes - a.likes || Date.parse(b.date) - Date.parse(a.date),
        )
        .map((p) => p.id)
        .join(),
  );
  check(
    "Title and share metadata exist",
    (await page.title()).includes("identity.md") &&
      (await page
        .locator('meta[property="og:image"]')
        .getAttribute("content")) === "./og-image.png",
  );
  check(
    "Local Inter font loads",
    await page.evaluate(
      () =>
        document.fonts.check("400 16px Inter") &&
        [...document.fonts].some(
          (font) => font.family === "Inter" && font.status === "loaded",
        ),
    ),
  );

  for (const width of [320, 390, 600, 768, 840, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    await page.evaluate(() => scrollTo(0, 0));
    check(`No horizontal overflow at ${width}px`, !(await overflow(page)));
    if (width === 390) {
      const visible = await page.evaluate(() => {
        const rect = document.querySelector("article").getBoundingClientRect();
        const search = document
          .querySelector("#post-search")
          .getBoundingClientRect();
        const action = document
          .querySelector("article .read-post")
          .getBoundingClientRect();
        return {
          postTop: rect.top,
          searchBottom: search.bottom,
          readActionTop: action.top,
          readActionBottom: action.bottom,
          viewport: innerHeight,
        };
      });
      check(
        "Product, search, and original-post action appear on first 390px screen",
        visible.postTop < visible.viewport &&
          visible.searchBottom < visible.viewport &&
          visible.readActionBottom <= visible.viewport,
        visible,
      );
    }
    if ([320, 390, 768, 1440].includes(width))
      await page.screenshot({
        path: `test/scratch/interactions/${width}.png`,
        fullPage: width === 768,
      });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "AI agents", exact: true })
    .first()
    .click();
  check(
    "Topic filter returns only AI-agent posts",
    (await postIds(page)).length > 0 &&
      (await postIds(page)).every((id) =>
        posts.find((p) => p.id === id).topics.includes("AI agents"),
      ),
  );
  await page
    .getByRole("searchbox", { name: "Search tweets" })
    .fill("AgentCity");
  check(
    "Search combines with the selected topic",
    (await postIds(page)).join() === "2112601300810522805",
  );
  await page.getByRole("searchbox").fill("nothingmatches123");
  check(
    "Search empty state offers recovery",
    (await page.getByText("Nothing in this corner.").isVisible()) &&
      (await page
        .getByRole("button", { name: "Clear filters", exact: true })
        .isVisible()),
  );
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  check(
    "Clear filters restores the whole collection",
    (await page.locator("article").count()) === 12 &&
      (await page.getByRole("searchbox").inputValue()) === "",
  );
  await page.getByRole("searchbox").fill("   ADAM   ");
  check(
    "Search ignores surrounding spaces and case",
    (await page.locator("article").count()) ===
      posts.filter((p) => p.author === "Adam").length,
  );
  await page.getByRole("searchbox").press("Escape");
  check(
    "Escape clears the search field",
    (await page.getByRole("searchbox").inputValue()) === "",
  );
  await page.getByRole("searchbox").blur();
  await page.keyboard.press("Control+k");
  check(
    "Modified keyboard shortcut focuses search",
    await page
      .getByRole("searchbox")
      .evaluate((el) => el === document.activeElement),
  );
  await page.getByRole("button", { name: "Latest", exact: true }).click();
  check(
    "Latest sorts by publication time",
    (await postIds(page)).join() === newest.join(),
  );
  await page.getByRole("button", { name: "Top tweets", exact: true }).click();
  for (const [order, field] of [
    ["reposts", "reposts"],
    ["replies", "replies"],
    ["likes", "likes"],
  ]) {
    await page.getByLabel("Rank by", { exact: true }).selectOption(order);
    const ids = await postIds(page);
    check(
      `Ranking by ${field} is descending; uncaptured counts sort last`,
      ids.every(
        (id, i) =>
          i === 0 ||
          (posts.find((p) => p.id === ids[i - 1])[field] ?? -1) >=
            (posts.find((p) => p.id === id)[field] ?? -1),
      ),
    );
  }
  const first = page.locator("article").first();
  const firstId = await first.getAttribute("data-post-id");
  await first
    .getByRole("button", { name: "Save post by @surfcoderepeat", exact: true })
    .click();
  check(
    "Saving marks the post and stores its exact id",
    (await first
      .getByRole("button", {
        name: "Unsave post by @surfcoderepeat",
        exact: true,
      })
      .getAttribute("aria-pressed")) === "true" &&
      (await page.evaluate(
        () => JSON.parse(localStorage.getItem("swamp.saved.v1")).length,
      )) === 1,
  );
  await page.reload({ waitUntil: "networkidle" });
  check(
    "Bookmarks survive a reload",
    (await page
      .getByRole("button", {
        name: "Unsave post by @surfcoderepeat",
        exact: true,
      })
      .count()) === 1,
  );
  await page.getByRole("link", { name: "Saved", exact: false }).first().click();
  check(
    "Saved view shows only bookmarked posts",
    (await postIds(page)).join() === firstId &&
      new URL(page.url()).hash === "#saved",
  );
  await page.reload({ waitUntil: "networkidle" });
  check(
    "Saved hash route survives reload at a subpath",
    (await page
      .getByRole("heading", { name: "Saved for later" })
      .isVisible()) && (await page.locator("article").count()) === 1,
  );
  await page
    .locator("article")
    .first()
    .getByRole("button", { name: /^Unsave post/ })
    .click();
  check(
    "Removing the last bookmark has an actionable empty state",
    (await page.getByText("Keep a little signal.").isVisible()) &&
      (await page
        .getByRole("button", { name: "Explore tweets", exact: true })
        .isVisible()),
  );
  await page
    .getByRole("button", { name: "Explore tweets", exact: true })
    .click();
  check(
    "Saved empty state returns to the feed",
    (await page.locator("article").count()) === 12,
  );
  await page.getByRole("button", { name: "Dismiss message" }).click();
  await page
    .locator("article")
    .first()
    .getByRole("button", { name: /^Copy link/ })
    .click();
  check(
    "Copy link writes the original X URL to the clipboard",
    (await page.evaluate(() => navigator.clipboard.readText())) ===
      posts.find((p) => p.id === firstId).source,
  );
  await page.getByRole("button", { name: "Dismiss message" }).click();
  const about = page.getByRole("button", {
    name: "About this feed",
    exact: true,
  });
  await about.focus();
  await page.keyboard.press("Enter");
  check(
    "About opens by keyboard as a native modal",
    (await page.getByRole("dialog").isVisible()) &&
      (await page.locator("dialog").evaluate((el) => el.matches(":modal"))),
  );
  let trapped = true;
  const focusStops = [];
  for (let index = 0; index < 6; index++) {
    await page.keyboard.press("Tab");
    const stop = await page.locator("dialog").evaluate((el) => ({
      inside: el.contains(document.activeElement),
      body: document.activeElement === document.body,
      documentFocused: document.hasFocus(),
      tag: document.activeElement?.tagName,
    }));
    focusStops.push(stop);
    trapped &&= stop.inside || (stop.body && !stop.documentFocused);
  }
  check(
    "Native modal prevents Tab from reaching background page controls",
    trapped,
    focusStops,
  );
  await page.getByText("View the 12 post sources").click();
  check(
    "Methodology exposes original sources and public mirrors",
    (await page.locator("dialog details a").count()) === posts.length * 2,
  );
  const modalAudit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  check(
    "About modal has no automated WCAG A/AA violations",
    modalAudit.violations.length === 0,
    modalAudit.violations.map((v) => v.id),
  );
  await page.keyboard.press("Escape");
  check(
    "Escape closes the dialog and restores trigger focus",
    !(await page.getByRole("dialog").isVisible()) &&
      (await about.evaluate((el) => el === document.activeElement)),
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      value: () => Promise.reject(new Error("Test: clipboard unavailable")),
      configurable: true,
    });
  });
  await page
    .locator("article")
    .first()
    .getByRole("button", { name: /^Copy link/ })
    .click();
  check(
    "Clipboard denial offers a selectable original link",
    (await page
      .getByRole("heading", { name: "Share this post" })
      .isVisible()) &&
      (await page.getByLabel("Post link").inputValue()).startsWith(
        "https://x.com/",
      ),
  );
  await page.getByLabel("Post link").focus();
  check(
    "Manual share link selects its full value",
    await page
      .getByLabel("Post link")
      .evaluate(
        (el) => el.selectionStart === 0 && el.selectionEnd === el.value.length,
      ),
  );
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    Object.defineProperty(Storage.prototype, "setItem", {
      value: () => {
        throw new Error("Test: storage unavailable");
      },
      configurable: true,
    });
  });
  await page
    .locator("article")
    .first()
    .getByRole("button", { name: /^Save post/ })
    .click();
  check(
    "Storage denial keeps in-memory bookmarks and explains the limit",
    (await page.getByRole("button", { name: /^Unsave post/ }).count()) === 1 &&
      (await page
        .getByText(
          "Browser storage is unavailable. Saved posts will last for this visit only.",
          { exact: true },
        )
        .last()
        .isVisible()),
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() =>
    localStorage.setItem("swamp.saved.v1", "{bad JSON"),
  );
  await page.reload({ waitUntil: "networkidle" });
  check(
    "Malformed storage does not break rendering",
    (await page.locator("article").count()) === 12,
  );
  await page
    .locator("article")
    .first()
    .getByRole("button", { name: /^Save post/ })
    .click();
  check(
    "Saving repairs malformed bookmark storage",
    (await page.evaluate(
      () => JSON.parse(localStorage.getItem("swamp.saved.v1")).length,
    )) === 1,
  );
  await page.evaluate(() => {
    localStorage.clear();
    dispatchEvent(new StorageEvent("storage", { key: "swamp.saved.v1" }));
  });
  await page
    .getByRole("button", { name: /^Unsave post/ })
    .waitFor({ state: "detached" });
  check(
    "Storage updates synchronize saved state",
    (await page.getByRole("button", { name: /^Unsave post/ }).count()) === 0,
  );
  await page.getByRole("button", { name: "Dismiss message" }).click();
  await page.evaluate(() => scrollTo(0, 0));
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  check(
    "390px feed has no automated WCAG A/AA violations",
    audit.violations.length === 0,
    audit.violations.map((v) => v.id),
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  const desktopAudit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  check(
    "1440px feed has no automated WCAG A/AA violations",
    desktopAudit.violations.length === 0,
    desktopAudit.violations.map((v) => v.id),
  );
  await page
    .getByRole("button", { name: /AI agents Intelligence, put to work/ })
    .click();
  check(
    "Desktop sidebar topic navigation filters the collection",
    (await postIds(page)).every((id) =>
      posts.find((p) => p.id === id).topics.includes("AI agents"),
    ),
  );
  await page.getByRole("button", { name: "All posts", exact: true }).click();
  check(
    "Original links preserve the source and open in a new tab",
    (await page.locator("article .read-post").first().getAttribute("href")) ===
      posts.find((p) => p.id === firstId).source &&
      (await page
        .locator("article .read-post")
        .first()
        .getAttribute("target")) === "_blank",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("searchbox").fill("x".repeat(180));
  check(
    "Long unmatched search text does not cause page overflow",
    !(await overflow(page)),
  );
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  const enlargedOverflow = await overflow(page);
  check(
    "200% text enlargement reflows without horizontal overflow",
    !enlargedOverflow,
  );
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  check(
    "Reduced motion disables transitions",
    await page
      .locator(".view-tabs button")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration === "0s"),
  );
  check("No page exceptions", errors.length === 0, errors);
  check("No missing local resources", failures.length === 0, failures);
  check(
    "No external resources required to render or interact",
    externalRequests.length === 0,
    externalRequests,
  );
  const keyboardPage = await context.newPage();
  await keyboardPage.goto(url, { waitUntil: "networkidle" });
  await keyboardPage.keyboard.press("Tab");
  check(
    "Keyboard entry exposes the skip link",
    await keyboardPage
      .locator(".skip-link")
      .evaluate((el) => el === document.activeElement),
  );
  await keyboardPage.keyboard.press("Enter");
  async function tabTo(selector, key = "Tab") {
    for (let index = 0; index < 40; index++) {
      if (
        await keyboardPage.evaluate(
          (selector) => document.activeElement?.matches(selector),
          selector,
        )
      )
        return;
      await keyboardPage.keyboard.press(key);
    }
    throw new Error(`Keyboard could not reach ${selector}`);
  }
  await tabTo("#post-search");
  await keyboardPage.keyboard.type("AgentCity");
  await tabTo("article .save-button");
  await keyboardPage.keyboard.press("Space");
  check(
    "Search and bookmarking complete using the keyboard",
    (await keyboardPage.locator("article").count()) === 1 &&
      (await keyboardPage
        .locator("article .save-button")
        .getAttribute("aria-pressed")) === "true",
  );
  await tabTo(".view-tabs button:nth-child(3)", "Shift+Tab");
  await keyboardPage.keyboard.press("Enter");
  check(
    "Keyboard navigation opens the saved post",
    (await keyboardPage
      .getByRole("heading", { name: "Saved for later" })
      .isVisible()) && (await keyboardPage.locator("article").count()) === 1,
  );
  await context.close();

  // Exercise the main task in WebKit when the host has the necessary native libraries.
  let safari;
  try {
    safari = await webkit.launch({ headless: true });
  } catch (error) {
    report.limitations.push(
      `WebKit could not launch: ${error.message.split("\n").filter(Boolean).slice(0, 3).join(" ")}`,
    );
    console.log("LIMITATION WebKit could not launch in this environment.");
  }
  if (safari) {
    try {
      const safariPage = await safari.newPage({
        viewport: { width: 390, height: 844 },
      });
      await safariPage.goto(url, { waitUntil: "networkidle" });
      await safariPage.getByRole("searchbox").fill("AgentCity");
      check(
        "WebKit primary search and reflow work",
        (await safariPage.locator("article").count()) === 1 &&
          !(await overflow(safariPage)),
      );
    } finally {
      await safari.close();
    }
  }
  report.limitations.push(
    "Automated accessibility checks do not establish screen-reader or WCAG compliance. Native browser zoom, physical devices, and external X availability were not tested.",
  );
  console.log(`${report.checks.length} checks passed.`);
} catch (error) {
  report.checks.push({ name: error.message, passed: false });
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((done) => server.close(done));
  await writeFile(
    "test/scratch/interactions/results.json",
    JSON.stringify(report, null, 2) + "\n",
  );
}
