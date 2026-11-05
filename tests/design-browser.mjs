// Visual and interaction regression suite. All Worker requests use in-memory D1.
// Optional: DESIGN_SCREENSHOTS=/path and AXE_CORE_PATH=/path/to/axe.min.js.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { localWorker } from "./helpers/local-worker.mjs";
const { chromium } = createRequire(import.meta.url)("playwright");
const h = localWorker();
const admin = await h.account({ name: "Victor Velarian", role: "admin" });
const student = await h.account({ name: "Marina Velarian" });
const curriculum = await (await h.request("/api/curriculum")).json();
for (const key of curriculum.keys.slice(0, 12))
  h.db
    .prepare("INSERT INTO student_progress VALUES(?,?,?)")
    .run(student.id, key, Date.now());
const browser = await chromium.launch({
  headless: true,
  ...(process.env.P1_CHROMIUM_PATH
    ? { executablePath: process.env.P1_CHROMIUM_PATH }
    : {}),
  args: ["--no-sandbox"],
});
let checks = 0;
let audits = 0;
function pass(name) {
  checks++;
  console.log("PASS", name);
}
const errors = [];
async function pageFor(account) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  if (account)
    await context.addCookies([
      {
        name: account === admin ? "av_session" : "av_student",
        value: account.token,
        url: "https://academy.test",
      },
    ]);
  await context.route("**/*", async (route) => {
    const q = route.request();
    if (!q.url().startsWith("https://academy.test/")) return route.abort();
    const r = await h.fetch(
      new Request(q.url(), {
        method: q.method(),
        headers: q.headers(),
        body: ["GET", "HEAD"].includes(q.method()) ? undefined : q.postData(),
      }),
    );
    await route.fulfill({
      status: r.status,
      headers: Object.fromEntries(r.headers),
      body: Buffer.from(await r.arrayBuffer()),
    });
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  return page;
}
async function audit(page, name) {
  audits++;
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    name + " horizontal overflow",
  );
  if (process.env.AXE_CORE_PATH) {
    await page.addScriptTag({ path: process.env.AXE_CORE_PATH });
    const result = await page.evaluate(async () => {
      const r = await axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      });
      return r.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      }));
    });
    assert.deepEqual(result, [], name + " accessibility");
  }
}
async function screenshot(page, name) {
  if (!process.env.DESIGN_SCREENSHOTS) return;
  mkdirSync(process.env.DESIGN_SCREENSHOTS, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: process.env.DESIGN_SCREENSHOTS + "/" + name + ".jpg",
    type: "jpeg",
    quality: 82,
    animations: "disabled",
  });
}
try {
  const home = await pageFor();
  await home.goto("https://academy.test/");
  await home.locator(".course button").first().waitFor();
  for (const [name, width] of [
    ["desktop", 1440],
    ["tablet", 768],
    ["mobile", 390],
    ["small", 320],
  ]) {
    await home.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await audit(home, "home " + name);
    if (name === "desktop" || name === "mobile")
      await screenshot(home, "academia-" + name);
  }
  await home.locator("#menu").click();
  assert.equal(
    await home.locator("#menu").getAttribute("aria-expanded"),
    "true",
  );
  await home.keyboard.press("Escape");
  assert.equal(
    await home.locator("#menu").getAttribute("aria-expanded"),
    "false",
  );
  await home.locator(".course button").first().click();
  await home.locator("#courseDialog").waitFor({ state: "visible" });
  await home.locator(".lesson-read-button").first().click();
  await home.locator(".article-body").waitFor();
  assert.equal(await home.locator("#courseTitle").count(), 1);
  await audit(home, "lesson modal");
  await home.locator("#closeDialog").click();
  pass(
    "public learning navigation, named lesson dialog, mobile menu and responsive layouts",
  );

  const studentPage = await pageFor(student);
  await studentPage.goto("https://academy.test/#minha-academia");
  await studentPage.locator("#studentDashboard").waitFor({ state: "visible" });
  await studentPage.locator("[data-student-view=trade]").click();
  await studentPage
    .locator("#studentViewTrade #studentTradeProducts .student-trade-product")
    .first()
    .waitFor({ state: "visible" });
  assert.equal(
    await studentPage
      .locator("#studentViewTrade #studentTradeProducts .student-trade-product")
      .count(),
    6,
  );
  assert.equal(
    await studentPage.locator("details.student-trade-disclosure").count(),
    0,
  );
  assert.match(
    await studentPage.locator("#studentTradeProducts").innerText(),
    /Premium/,
  );
  assert.match(
    await studentPage.locator("#studentTradeProducts").innerText(),
    /diamantes/,
  );
  for (const width of [1440, 768, 390, 320]) {
    await studentPage.setViewportSize({
      width,
      height: width < 500 ? 844 : 1000,
    });
    for (const name of [
      "study",
      "certificate",
      "community",
      "trade",
      "account",
    ]) {
      await studentPage.locator("[data-student-view=" + name + "]").click();
      await audit(studentPage, "student " + name + " " + width);
      if (name === "trade" && [1440, 390].includes(width))
        await screenshot(
          studentPage,
          "premium-" + (width === 1440 ? "desktop" : "mobile"),
        );
    }
  }
  await studentPage.locator("[data-student-view=study]").click();
  await studentPage.locator("[data-student-view=study]").focus();
  await studentPage.keyboard.press("ArrowRight");
  assert.equal(
    await studentPage
      .locator("[data-student-view=certificate]")
      .getAttribute("aria-selected"),
    "true",
  );
  assert.equal(
    await studentPage.locator("#studentHubCertificate").isVisible(),
    false,
  );
  await studentPage.locator("[data-student-view=study]").click();
  const before = h.db
    .prepare("SELECT COUNT(*) n FROM student_progress WHERE user_id=?")
    .get(student.id).n;
  const response = studentPage.waitForResponse(
    (r) =>
      r.url().endsWith("/api/student/progress") &&
      r.request().method() === "POST",
  );
  await studentPage.locator(".student-lesson input").first().uncheck();
  assert.equal((await response).status(), 200);
  await studentPage.waitForFunction(
    (n) =>
      document.getElementById("studentDoneCount").textContent === String(n),
    before - 1,
  );
  assert.equal(
    h.db
      .prepare("SELECT COUNT(*) n FROM student_progress WHERE user_id=?")
      .get(student.id).n,
    before - 1,
  );
  assert.notEqual(
    await studentPage.locator(".student-track").getAttribute("aria-valuenow"),
    "0",
  );
  for (const [name, width] of [
    ["desktop", 1440],
    ["mobile", 390],
  ]) {
    await studentPage.setViewportSize({
      width,
      height: width < 500 ? 844 : 1000,
    });
    await screenshot(studentPage, "aluno-" + name);
  }
  pass(
    "five student tabs, keyboard selection, single certificate action and persisted progress",
  );

  const calculators = await pageFor();
  await calculators.goto("https://academy.test/ferramentas");
  await calculators.locator(".calc-tool").first().waitFor();
  for (let index = 0; index < 8; index++) {
    await calculators.locator(".calc-tool").nth(index).click();
    await calculators
      .getByRole("button", { name: "Calcular resultado", exact: true })
      .click();
    assert.equal(await calculators.locator(".calc-error").innerText(), "");
    assert.ok((await calculators.locator(".calc-results dd").count()) > 0);
    await calculators
      .getByRole("button", { name: "Limpar", exact: true })
      .click();
    assert.equal(await calculators.locator(".calc-results dd").count(), 0);
  }
  await calculators.locator(".calc-tool").first().click();
  await calculators.locator(".calc-tool").first().focus();
  await calculators.keyboard.press("End");
  assert.equal(
    await calculators
      .locator(".calc-tool")
      .last()
      .evaluate((node) => node === document.activeElement),
    true,
  );
  await calculators.keyboard.press("Enter");
  await calculators
    .getByRole("searchbox", { name: "Buscar calculadora" })
    .fill("exercito");
  assert.equal(await calculators.locator(".calc-tool").count(), 1);
  assert.match(
    await calculators.locator(".calc-form h3").innerText(),
    /exército/,
  );
  await calculators
    .getByRole("searchbox", { name: "Buscar calculadora" })
    .fill("sem-resultados-qa");
  assert.equal(await calculators.locator(".calc-tool").count(), 0);
  await calculators
    .getByRole("searchbox", { name: "Buscar calculadora" })
    .fill("");
  for (const width of [1440, 768, 390, 320]) {
    await calculators.setViewportSize({
      width,
      height: width < 500 ? 844 : 1000,
    });
    await audit(calculators, "calculators " + width);
    if (width === 390) {
      await calculators.locator(".calc-toggle").click();
      await calculators.locator(".calc-tool").nth(1).click();
      assert.equal(
        await calculators.locator(".calc-toggle").getAttribute("aria-expanded"),
        "false",
      );
    }
  }
  await calculators.setViewportSize({ width: 1440, height: 1000 });
  await calculators.locator(".calc-tool").first().click();
  await calculators
    .getByRole("button", { name: "Calcular resultado", exact: true })
    .click();
  for (const [name, width] of [
    ["desktop", 1440],
    ["mobile", 390],
  ]) {
    await calculators.setViewportSize({
      width,
      height: width < 500 ? 844 : 1000,
    });
    await screenshot(calculators, "calculadoras-" + name);
  }
  pass(
    "eight calculators calculate/reset, accent-insensitive search, empty state and keyboard/mobile selection",
  );

  const adminPage = await pageFor(admin);
  await adminPage.goto("https://academy.test/admin#admin");
  await adminPage.locator("#admin").waitFor({ state: "visible" });
  assert.equal(
    await adminPage.locator("[data-tab=certificateTemplate]").count(),
    0,
  );
  assert.equal(await adminPage.locator(".admin-nav-group").count(), 5);
  for (const tab of [
    "overview",
    "pages",
    "topics",
    "students",
    "comments",
    "notices",
    "suggestions",
    "trade",
    "media",
    "sponsors",
    "reports",
    "history",
    "general",
  ]) {
    await adminPage.locator(".admin-sidebar [data-tab=" + tab + "]").click();
    await adminPage.waitForTimeout(30);
    await audit(adminPage, "admin " + tab);
    if (["pages", "reports"].includes(tab)) {
      await adminPage.evaluate(() => window.scrollTo(0, 0));
      await screenshot(adminPage, "admin-" + tab + "-desktop");
    }
  }
  for (const width of [768, 390, 320]) {
    await adminPage.setViewportSize({ width, height: 900 });
    for (const tab of [
      "overview",
      "pages",
      "topics",
      "students",
      "comments",
      "notices",
      "suggestions",
      "trade",
      "media",
      "sponsors",
      "reports",
      "history",
      "general",
    ]) {
      await adminPage.locator("#adminMobileMenu").click();
      await adminPage
        .locator('.admin-sidebar [data-tab="' + tab + '"]')
        .click();
      await adminPage.waitForTimeout(30);
      await audit(adminPage, "admin " + tab + " " + width);
    }
  }
  await adminPage.setViewportSize({ width: 1440, height: 1000 });
  await adminPage.locator("#manageAdministratorsTab").click();
  await adminPage.locator("#adminAdministrators").waitFor({ state: "visible" });
  await audit(adminPage, "admin permissions");
  await adminPage.locator("[data-tab=overview]").click();
  for (const [name, width] of [
    ["desktop", 1440],
    ["tablet", 768],
    ["mobile", 390],
    ["small", 320],
  ]) {
    await adminPage.setViewportSize({
      width,
      height: width < 500 ? 844 : 1000,
    });
    await audit(adminPage, "admin " + name);
    if (name === "desktop" || name === "mobile")
      await screenshot(adminPage, "admin-" + name);
  }
  await adminPage.locator("#adminMobileMenu").click();
  assert.equal(
    await adminPage.locator("#adminMobileMenu").getAttribute("aria-expanded"),
    "true",
  );
  assert.equal(
    await adminPage
      .locator("#adminNavClose")
      .evaluate((node) => node === document.activeElement),
    true,
  );
  await adminPage.keyboard.press("Shift+Tab");
  assert.equal(
    await adminPage
      .locator(".admin-sidebar-foot button")
      .evaluate((node) => node === document.activeElement),
    true,
  );
  await adminPage.keyboard.press("Escape");
  assert.equal(
    await adminPage.locator("#adminMobileMenu").getAttribute("aria-expanded"),
    "false",
  );
  await adminPage.locator("#adminMobileMenu").click();
  await adminPage.locator("[data-tab=reports]").click();
  assert.equal(
    await adminPage.locator("#adminMobileMenu").getAttribute("aria-expanded"),
    "false",
  );
  assert.equal(await adminPage.locator("#adminHub").isVisible(), true);
  pass(
    "served administrative HTML, all grouped tools, reports, responsive drawer and keyboard focus trap",
  );
  assert.deepEqual(errors, []);
  pass("no uncaught JavaScript errors across the three applications");
  console.log(
    `${checks} design browser groups passed; ${audits} responsive/accessibility states checked`,
  );
} finally {
  await browser.close();
  h.db.close();
}
