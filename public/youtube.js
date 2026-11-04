// Shared by the Worker and classic browser scripts; no network requests or API keys.
(function (root) {
  "use strict";
  const hosts = new Set([
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
    "www.youtu.be",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",
  ]);
  const error =
    "Informe um link válido do YouTube (watch, youtu.be, shorts, live ou embed), com ID de 11 caracteres e até 8.192 caracteres no endereço.";

  function parse(value) {
    if (typeof value !== "string") return null;
    let text = value.trim();
    if (!text) return null;
    if (text.startsWith("//")) text = "https:" + text;
    else if (!/^[a-z][a-z\d+.-]*:/i.test(text)) text = "https://" + text;
    try {
      const url = new URL(text);
      if (
        !["https:", "http:"].includes(url.protocol) ||
        !hosts.has(url.hostname) ||
        url.username ||
        url.password ||
        url.port
      )
        return null;
      const short = ["youtu.be", "www.youtu.be"].includes(url.hostname);
      const segments = url.pathname
        .split("/")
        .filter(Boolean)
        .map(decodeURIComponent);
      let id;
      if (short && segments.length === 1) id = segments[0];
      else if (
        !short &&
        /^\/watch\/?$/.test(url.pathname) &&
        url.searchParams.getAll("v").length === 1
      )
        id = url.searchParams.get("v");
      else if (
        !short &&
        segments.length === 2 &&
        ["shorts", "live", "embed"].includes(segments[0])
      )
        id = segments[1];
      return /^[A-Za-z0-9_-]{11}$/.test(id || "")
        ? { id, url: url.href }
        : null;
    } catch {
      return null;
    }
  }

  function validate(value) {
    if (value === undefined || value === null || value === "") return "";
    if (typeof value === "string" && !value.trim()) return "";
    if (typeof value === "string" && value.trim().length > 8192)
      throw new Error(error);
    const video = parse(value);
    if (!video || video.url.length > 8192) throw new Error(error);
    return video.url;
  }

  function prepareInput(input) {
    // Native type=url rejects scheme-less YouTube shares before our clear message.
    input.type = "text";
    input.inputMode = "url";
    input.spellcheck = false;
    input.placeholder = "YouTube: watch, youtu.be, shorts, live ou embed";
  }

  function createFrame(value, title = "Videoaula") {
    const video = parse(value);
    if (!video) return null;
    const frame = root.document.createElement("iframe");
    frame.src = "https://www.youtube-nocookie.com/embed/" + video.id;
    frame.className = "video-frame";
    frame.title = title;
    frame.loading = "lazy";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    return frame;
  }

  function append(container, value, title) {
    if (!value || !String(value).trim()) return null;
    const frame = createFrame(value, title);
    if (frame) container.append(frame);
    else {
      const message = root.document.createElement("p");
      message.className = "video-unavailable";
      message.setAttribute("role", "status");
      message.textContent =
        "Não foi possível carregar este vídeo. Avise a administração da Academia.";
      container.append(message);
    }
    return frame;
  }

  root.AcademiaYouTube = Object.freeze({
    parse,
    validate,
    prepareInput,
    createFrame,
    append,
    error,
  });
})(globalThis);
