import test from "node:test";
import assert from "node:assert/strict";
import "../public/youtube.js";
import { readFileSync } from "node:fs";
import { localWorker } from "./helpers/local-worker.mjs";
const youtube = globalThis.AcademiaYouTube;
const id = "dQw4w9WgXcQ";
export const validLinks = [
  `https://www.youtube.com/watch?v=${id}`,
  `https://youtube.com/watch?si=qa&v=${id}&t=30&list=PL_example`,
  `https://youtu.be/${id}?si=share&t=20`,
  `https://www.youtube.com/shorts/${id}?feature=share`,
  `https://youtube.com/live/${id}?si=share`,
  `https://www.youtube.com/embed/${id}?start=25&rel=0`,
  `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
  `https://youtube-nocookie.com/embed/${id}`,
  `https://m.youtube.com/watch?v=${id}&feature=youtu.be`,
  `https://music.youtube.com/watch?v=${id}`,
  `HTTP://WWW.YOUTUBE.COM/watch?v=${id}`,
  `youtube.com/shorts/${id}`,
  `youtu.be/${id}`,
  `//www.youtube.com/live/${id}/?si=share`,
  `  https://youtu.be/${id}\n`,
  `https://youtube.com/watch?v=${id}&si=${"x".repeat(1000)}`,
];
export const invalidLinks = [
  "https://youtube.com/watch?v=short",
  "https://youtube.com/watch?v=abcdefghijkl",
  "https://youtube.com/channel/dQw4w9WgXcQ",
  "https://youtube.com/playlist?list=PL_example",
  `https://youtube.com/watch?v=${id}&v=${id}`,
  `https://youtu.be/${id}/extra`,
  `https://youtube.com/shorts/${id}/extra`,
  `https://youtube.com.evil.test/watch?v=${id}`,
  `https://youtu.be.evil.test/${id}`,
  `https://youtube.com@evil.test/watch?v=${id}`,
  `https://user:password@youtube.com/watch?v=${id}`,
  `https://youtube.com:8443/watch?v=${id}`,
  `javascript:alert('${id}')`,
  `data:text/html,${id}`,
  `https://youtube.com/watch?v=<script>`,
  "not a link",
  null,
  {},
  false,
  23,
];

test("shared parser accepts supported formats, mobile hosts and parameters without truncating links", () => {
  for (const link of validLinks) {
    assert.equal(youtube.parse(link)?.id, id, link);
    assert.equal(youtube.validate(link), youtube.parse(link).url);
  }
  const legacy = `https://youtube.com/watch?v=${id}&tracking=${"x".repeat(9000)}`;
  assert.equal(
    youtube.parse(legacy)?.id,
    id,
    "Existing long links remain displayable",
  );
  assert.throws(() => youtube.validate(legacy), /8.192/);
});
test("shared parser rejects invalid IDs, unrelated hosts, credentials and unsafe protocols", () => {
  for (const link of invalidLinks) {
    assert.equal(youtube.parse(link), null, JSON.stringify(link));
    if (link !== null) assert.throws(() => youtube.validate(link), /YouTube/);
  }
  for (const empty of ["", null, undefined, " \n "])
    assert.equal(youtube.validate(empty), "");
});
test("every pre-existing approved lesson video remains displayable", () => {
  const { items } = JSON.parse(
    readFileSync(
      new URL("../public/approved-lessons.json", import.meta.url),
      "utf8",
    ),
  );
  for (const lesson of items)
    if (lesson.videoUrl)
      assert.ok(youtube.parse(lesson.videoUrl), lesson.videoUrl);
});

test("lesson, content and topic-video endpoints save/read/edit every supported format using the same validator", async () => {
  const h = localWorker();
  const admin = await h.account({
    name: "Video QA",
    role: "admin",
    permissions: { content: true },
  });
  const request = (path, data) =>
    h.request(path, { cookie: admin.cookie, method: "POST", data });
  let contentId;
  for (const link of validLinks) {
    const expected = youtube.validate(link);
    assert.equal(
      (
        await request("/api/admin/lesson", {
          topic: 0,
          index: 0,
          title: "Video QA",
          body: "Preserved body",
          videoUrl: link,
          imageUrl: "/assets/brasao-velarian.webp",
        })
      ).status,
      200,
      link,
    );
    const lessons = await (await h.request("/api/lessons")).json();
    assert.equal(
      lessons.items.find((x) => x.topic === 0 && x.index === 0).videoUrl,
      expected,
    );
    assert.equal(
      (await request("/api/admin/topic-video", { topic: 0, videoUrl: link }))
        .status,
      200,
      link,
    );
    const topics = await (await h.request("/api/topic-videos")).json();
    assert.equal(topics.items.find((x) => x.topic === 0).videoUrl, expected);
    const response = await request("/api/admin/content", {
      id: contentId,
      kind: "guide",
      title: "QA published video",
      body: "Preserved guide",
      status: "published",
      videoUrl: link,
    });
    assert.equal(response.status, 200, link);
    contentId = (await response.json()).id;
    const published = await (await h.request("/api/public")).json();
    assert.equal(
      published.content.find((x) => x.id === contentId).videoUrl,
      expected,
    );
  }
  for (const empty of ["", "  "]) {
    assert.equal(
      (
        await request("/api/admin/lesson", {
          topic: 0,
          index: 0,
          title: "Video QA",
          body: "Preserved body",
          videoUrl: empty,
        })
      ).status,
      200,
    );
    assert.equal(
      (await request("/api/admin/topic-video", { topic: 0, videoUrl: empty }))
        .status,
      200,
    );
    assert.equal(
      (
        await request("/api/admin/content", {
          id: contentId,
          kind: "guide",
          title: "Video QA",
          body: "Preserved guide",
          videoUrl: empty,
        })
      ).status,
      200,
    );
  }
});
test("invalid video writes preserve lesson, topic, published content and content history", async () => {
  const h = localWorker();
  const admin = await h.account({
    name: "Video QA",
    role: "admin",
    permissions: { content: true },
  });
  const request = (path, data, cookie = admin.cookie) =>
    h.request(path, { cookie, method: "POST", data });
  await request("/api/admin/lesson", {
    topic: 0,
    index: 0,
    title: "Original lesson",
    body: "Do not change",
    videoUrl: validLinks[0],
  });
  await request("/api/admin/topic", {
    index: 0,
    title: "Original topic",
    desc: "Do not change",
    level: "Avançado",
    videoUrl: validLinks[0],
  });
  const c = await (
    await request("/api/admin/content", {
      kind: "guide",
      title: "Original guide",
      body: "Do not change",
      status: "published",
      videoUrl: validLinks[0],
    })
  ).json();
  const endpoints = [
    [
      "/api/admin/lesson",
      { topic: 0, index: 0, title: "Changed", body: "Changed" },
    ],
    ["/api/admin/topic-video", { topic: 0 }],
    ["/api/admin/topic", { index: 0, title: "Changed", level: "Iniciante" }],
    [
      "/api/admin/content",
      {
        id: c.id,
        kind: "guide",
        title: "Changed",
        body: "Changed",
        status: "published",
      },
    ],
  ];
  for (const link of invalidLinks.filter((x) => x !== null))
    for (const [path, data] of endpoints) {
      const before = {
        settings: h.db.prepare("SELECT * FROM settings ORDER BY key").all(),
        content: h.db.prepare("SELECT * FROM content ORDER BY id").all(),
      };
      const response = await request(path, { ...data, videoUrl: link });
      assert.equal(response.status, 400, path + " " + JSON.stringify(link));
      assert.match((await response.json()).error, /YouTube/);
      assert.deepEqual(
        {
          settings: h.db.prepare("SELECT * FROM settings ORDER BY key").all(),
          content: h.db.prepare("SELECT * FROM content ORDER BY id").all(),
        },
        before,
      );
    }
  const student = await h.account(),
    limited = await h.account({
      name: "No content QA",
      role: "admin",
      permissions: { students: true },
    });
  for (const [path, data] of endpoints)
    for (const cookie of ["", student.cookie, limited.cookie])
      assert.equal(
        (await request(path, { ...data, videoUrl: validLinks[0] }, cookie))
          .status,
        403,
      );
});
test("topic + video save is atomic and legacy topic edits preserve existing video", async () => {
  const h = localWorker();
  const admin = await h.account({
    name: "Video QA",
    role: "admin",
    permissions: { content: true },
  });
  const request = (data) =>
    h.request("/api/admin/topic", {
      cookie: admin.cookie,
      method: "POST",
      data,
    });
  assert.equal(
    (
      await request({
        index: 0,
        title: "Topic QA",
        level: "Avançado",
        videoUrl: validLinks[2],
      })
    ).status,
    200,
  );
  const read = (key) =>
    JSON.parse(
      h.db.prepare("SELECT value FROM settings WHERE key=?").get(key).value,
    );
  assert.equal(read("topic_v2:0").level, "Avançado");
  assert.equal(read("topic_video:0"), youtube.validate(validLinks[2]));
  await request({ index: 0, title: "Edited topic" });
  assert.equal(read("topic_v2:0").level, "Avançado");
  assert.equal(read("topic_video:0"), youtube.validate(validLinks[2]));
  const first = h.db.prepare("SELECT * FROM settings ORDER BY key").all();
  const original = h.env.DB.batch;
  h.env.DB.batch = async (statements) => {
    await h.env.DB.prepare("SELECT 1").first();
    h.db.exec("BEGIN");
    try {
      await statements[0].run();
      throw Error("test rollback");
    } catch (error) {
      h.db.exec("ROLLBACK");
      throw error;
    }
  };
  const log = console.error;
  console.error = () => {};
  try {
    assert.equal(
      (
        await request({
          index: 0,
          title: "Must roll back",
          level: "Iniciante",
          videoUrl: validLinks[3],
        })
      ).status,
      500,
    );
  } finally {
    console.error = log;
    h.env.DB.batch = original;
  }
  assert.deepEqual(
    h.db.prepare("SELECT * FROM settings ORDER BY key").all(),
    first,
  );
});
