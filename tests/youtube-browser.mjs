// Real admin forms and public iframe rendering, with D1 exclusively in memory.
// External YouTube requests are blocked here: this verifies embedding, not remote availability.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { localWorker } from "./helpers/local-worker.mjs";
const { chromium } = createRequire(import.meta.url)("playwright");
const h = localWorker(),
  id = "dQw4w9WgXcQ";
const admin = await h.account({ name: "Victor Velarian", role: "admin" });
h.setting(
  "topic_v2:0",
  JSON.stringify({
    index: 0,
    title: "Tópico QA existente",
    desc: "Descrição QA existente",
    level: "Avançado",
    icon: "✦",
  }),
);
const links = [
  `https://youtube.com/watch?v=${id}&t=30`,
  `https://youtu.be/${id}?si=share`,
  `https://m.youtube.com/shorts/${id}?feature=share`,
  `https://youtube.com/live/${id}?si=share`,
  `https://www.youtube.com/embed/${id}?start=25`,
  `youtube.com/watch?v=${id}`,
];
const browser = await chromium.launch({
  headless: true,
  ...(process.env.P1_CHROMIUM_PATH
    ? { executablePath: process.env.P1_CHROMIUM_PATH }
    : {}),
  args: ["--no-sandbox"],
});
const errors = [];
let checks = 0;
const pass = (name) => {
  checks++;
  console.log("PASS", name);
};
async function pageFor(account) {
  const c = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  if (account)
    await c.addCookies([
      { name: "av_session", value: account.token, url: "https://academy.test" },
    ]);
  await c.route("**/*", async (route) => {
    const q = route.request();
    if (!q.url().startsWith("https://academy.test/")) return route.abort();
    const response = await h.fetch(
      new Request(q.url(), {
        method: q.method(),
        headers: q.headers(),
        body: ["GET", "HEAD"].includes(q.method()) ? undefined : q.postData(),
      }),
    );
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: Buffer.from(await response.arrayBuffer()),
    });
  });
  const p = await c.newPage();
  p.on("pageerror", (e) => {
    errors.push(e.message);
    console.log("PAGEERROR", e.message);
  });
  return p;
}
function frameChecks(frame) {
  return frame.evaluate((node) => ({
    src: node.src,
    title: node.title,
    fullscreen: node.allowFullscreen,
    referrer: node.referrerPolicy,
    allow: node.allow,
  }));
}
async function assertFrame(frame) {
  await frame.waitFor();
  const d = await frameChecks(frame);
  assert.equal(d.src, "https://www.youtube-nocookie.com/embed/" + id);
  assert.ok(d.title);
  assert.equal(d.fullscreen, true);
  assert.equal(d.referrer, "strict-origin-when-cross-origin");
  assert.match(d.allow, /encrypted-media/);
}
async function screenshot(page, name) {
  if (!process.env.VIDEO_SCREENSHOTS) return;
  mkdirSync(process.env.VIDEO_SCREENSHOTS, { recursive: true });
  await page.screenshot({
    path: process.env.VIDEO_SCREENSHOTS + "/" + name + ".jpg",
    type: "jpeg",
    quality: 85,
    animations: "disabled",
  });
}
try {
  const editor = await pageFor(admin);
  await editor.goto("https://academy.test/admin#admin");
  await editor.locator("#admin").waitFor({ state: "visible" });
  await editor.locator("[data-tab=topics]").click();
  const topicForm = editor.locator(".original-lessons-admin form").filter({
    has: editor.getByRole("button", {
      name: "Salvar alterações do tópico",
      exact: true,
    }),
  });
  const topicVideo = topicForm.getByLabel(/VÍDEO DO TÓPICO/);
  await topicForm.locator("select").first().selectOption("0");
  await editor.waitForFunction(() =>
    [...document.querySelectorAll(".original-lessons-admin input")].some(
      (x) => x.value === "Tópico QA existente",
    ),
  );
  const before = h.db.prepare("SELECT * FROM settings ORDER BY key").all();
  await topicVideo.fill("https://youtube.com/watch?v=invalid");
  await topicForm
    .getByRole("button", { name: "Salvar alterações do tópico", exact: true })
    .click();
  await topicForm
    .getByRole("status")
    .filter({ hasText: /link válido do YouTube/ })
    .waitFor();
  assert.deepEqual(
    h.db.prepare("SELECT * FROM settings ORDER BY key").all(),
    before,
  );
  for (const link of links) {
    await topicVideo.fill(link);
    const r = editor.waitForResponse(
      (x) =>
        x.url().endsWith("/api/admin/topic") && x.request().method() === "POST",
    );
    await topicForm
      .getByRole("button", { name: "Salvar alterações do tópico", exact: true })
      .click();
    assert.equal((await r).status(), 200);
    await topicForm
      .getByRole("status")
      .filter({ hasText: "Tópico atualizado com sucesso." })
      .waitFor();
    const stored = JSON.parse(
      h.db.prepare("SELECT value FROM settings WHERE key='topic_v2:0'").get()
        .value,
    );
    assert.equal(stored.title, "Tópico QA existente");
    assert.equal(stored.desc, "Descrição QA existente");
    assert.equal(stored.level, "Avançado");
  }
  pass(
    "topic form saves/edits all formats, preserves title/description/level and rejects invalid URLs before writes",
  );
  const lessonForm = editor.locator(".original-lessons-admin form").filter({
    has: editor.getByRole("button", {
      name: "Salvar aula neste subtópico",
      exact: true,
    }),
  });
  const lessonVideo = lessonForm.getByLabel(/Vídeo desta aula/);
  for (const link of links) {
    await lessonForm.getByLabel(/Nome do subtópico/).fill("Aula de vídeo QA");
    await lessonVideo.fill(link);
    const r = editor.waitForResponse(
      (x) =>
        x.url().endsWith("/api/admin/lesson") &&
        x.request().method() === "POST",
    );
    await lessonForm
      .getByRole("button", { name: "Salvar aula neste subtópico", exact: true })
      .click();
    assert.equal((await r).status(), 200);
    await lessonForm
      .getByRole("status")
      .filter({ hasText: "Subtópico salvo e confirmado pelo servidor." })
      .waitFor();
  }
  await editor.reload();
  await editor.locator("[data-tab=topics]").click();
  await editor
    .locator(".original-lessons-admin form")
    .filter({
      has: editor.getByRole("button", {
        name: "Salvar aula neste subtópico",
        exact: true,
      }),
    })
    .getByLabel(/Vídeo desta aula/)
    .waitFor();
  assert.equal(
    await editor
      .locator(".original-lessons-admin form")
      .filter({
        has: editor.getByRole("button", {
          name: "Salvar aula neste subtópico",
          exact: true,
        }),
      })
      .getByLabel(/Vídeo desta aula/)
      .inputValue(),
    "https://youtube.com/watch?v=" + id,
  );
  pass("lesson form saves every format and restores the saved URL on reload");
  await editor.locator("[data-tab=guides]").click();
  const contentForm = editor.locator("#contentForm");
  await contentForm.locator("[name=title]").fill("Guia de vídeo QA");
  await contentForm.locator("[name=body]").fill("Texto original preservado");
  await contentForm.locator("[name=status]").selectOption("published");
  await contentForm
    .locator("[name=imageUrl]")
    .fill("/assets/cinco-pilares.webp");
  await contentForm.locator("[name=videoUrl]").fill(links[3]);
  const saved = editor.waitForResponse(
    (x) =>
      x.url().endsWith("/api/admin/content") && x.request().method() === "POST",
  );
  await contentForm.locator("[type=submit]").click();
  assert.equal((await saved).status(), 200);
  await editor
    .locator("#adminContentList .admin-list-item")
    .filter({ hasText: "Guia de vídeo QA" })
    .getByRole("button", { name: "Editar", exact: true })
    .click();
  assert.equal(
    await contentForm.locator("[name=videoUrl]").inputValue(),
    links[3],
  );
  await contentForm.locator("[name=videoUrl]").fill(links[2]);
  const edited = editor.waitForResponse(
    (x) =>
      x.url().endsWith("/api/admin/content") && x.request().method() === "POST",
  );
  await contentForm.locator("[type=submit]").click();
  assert.equal((await edited).status(), 200);
  pass(
    "published guide can be created, reopened and edited through the existing content form",
  );

  const page = await pageFor();
  await page.goto("https://academy.test/");
  await page.locator('.course [data-course="0"]').click();
  await assertFrame(page.locator("#topicVideoSlot iframe"));
  await page.locator(".lesson-read-button").first().click();
  await assertFrame(page.locator("#courseDetail iframe"));
  await page.locator("#closeDialog").click();
  const guideId = h.db
    .prepare("SELECT id FROM content WHERE title='Guia de vídeo QA'")
    .get().id;
  await page.goto("https://academy.test/?aula=" + guideId);
  await assertFrame(page.locator("#courseDetail iframe"));
  await page.locator("#closeDialog").click();
  for (const link of links) {
    await page.evaluate(
      (link) =>
        openPublished({
          title: "Prévia QA",
          body: "Mesmo conteúdo",
          videoUrl: link,
        }),
      link,
    );
    await assertFrame(page.locator("#courseDetail iframe"));
    await page.locator("#closeDialog").click();
  }
  pass(
    "topic, lesson and published-content players use the same privacy-enhanced embed and referrer policy",
  );

  for (const width of [320, 375, 768, 1440]) {
    await editor.setViewportSize({ width, height: width < 500 ? 900 : 1000 });
    await editor.evaluate(() => selectTab("topics"));
    assert.equal(
      await editor.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "admin " + width,
    );

    await page.setViewportSize({ width, height: width < 500 ? 900 : 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const box = await page.locator(".hero-art").evaluate((node) => {
      const r = node.getBoundingClientRect(),
        s = getComputedStyle(node);
      return {
        width: r.width,
        height: r.height,
        size: s.backgroundSize,
        position: s.backgroundPosition,
        repeat: s.backgroundRepeat,
      };
    });
    assert.equal(box.size, "contain");
    assert.equal(box.position, "50% 50%");
    assert.equal(box.repeat, "no-repeat");
    assert.ok(
      Math.abs(box.width / box.height - 846 / 400) < 0.02,
      JSON.stringify(box),
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await screenshot(page, "inicio-" + width);
    await page.evaluate(
      (link) =>
        openPublished({
          title: "Vídeo QA",
          body: "Conteúdo QA",
          videoUrl: link,
        }),
      links[2],
    );
    const video = await page.locator("#courseDetail iframe").boundingBox();
    assert.ok(video && Math.abs(video.width / video.height - 16 / 9) < 0.02);
    await screenshot(page, "video-" + width);
    await page.locator("#closeDialog").click();
  }
  pass(
    "banner fits its original panoramic ratio and embeds keep 16:9 at 320, 375, 768 and 1440px",
  );
  h.setting("heroImage", "/assets/brasao-velarian.webp");
  await page.reload();
  await page.waitForFunction(() =>
    document
      .querySelector(".hero-art")
      .style.backgroundImage.includes("brasao-velarian.webp"),
  );
  assert.equal(
    await page
      .locator(".hero-art")
      .evaluate((node) => getComputedStyle(node).backgroundSize),
    "contain",
  );
  pass("custom configured hero image is preserved and fitted without cropping");
  assert.deepEqual(errors, []);
  console.log(
    `${checks} video/image browser groups passed; external playback not exercised`,
  );
} finally {
  await browser.close();
  h.db.close();
}
