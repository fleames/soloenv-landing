import { FORM_URL, GA_MEASUREMENT_ID } from "./config.js";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* ---------- Nav scroll + mobile menu ---------- */
const nav = document.querySelector(".nav");
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

window.addEventListener(
  "scroll",
  () => {
    nav?.classList.toggle("scrolled", window.scrollY > 24);
  },
  { passive: true }
);

navToggle?.addEventListener("click", () => {
  const open = navMenu?.classList.toggle("open");
  navToggle.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", open ? "true" : "false");
});

navMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    navToggle?.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

/* ---------- Waitlist + analytics ---------- */
function trackWaitlistClick() {
  if (typeof window.gtag === "function" && GA_MEASUREMENT_ID) {
    window.gtag("event", "waitlist_click", {
      event_category: "engagement",
      event_label: "join_waitlist",
    });
  }
}

function openWaitlist() {
  if (!FORM_URL || FORM_URL.includes("YOUR_FORM_ID")) {
    alert(
      "Set FORM_URL in config.js to your published Google Form link before going live."
    );
    return;
  }
  trackWaitlistClick();
  window.open(FORM_URL, "_blank", "noopener,noreferrer");
}

document.querySelectorAll("[data-waitlist]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    openWaitlist();
  });
});

if (GA_MEASUREMENT_ID) {
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
}

/* ---------- Copy command ---------- */
const copyBtn = document.getElementById("copyBtn");
copyBtn?.addEventListener("click", async () => {
  const text = document.getElementById("copy-target")?.textContent?.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  const label = copyBtn.querySelector(".copy-label");
  const original = label?.textContent ?? "";
  copyBtn.classList.add("copied");
  if (label) label.textContent = "Copied";
  setTimeout(() => {
    copyBtn.classList.remove("copied");
    if (label) label.textContent = original || "Copy";
  }, 1600);
});

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll(".reveal");
if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealEls.forEach((el) => el.classList.add("in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = `${(i % 4) * 60}ms`;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => io.observe(el));
}

/* ---------- FAQ accordion ---------- */
document.querySelectorAll(".faq-item").forEach((item) => {
  item.addEventListener("toggle", () => {
    if (item.open) {
      document.querySelectorAll(".faq-item").forEach((other) => {
        if (other !== item) other.open = false;
      });
    }
  });
});

/* ---------- Terminal tilt (subtle) ---------- */
const terminal = document.querySelector(".terminal.tilt");
if (terminal && !prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
  terminal.addEventListener("mousemove", (e) => {
    const rect = terminal.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    terminal.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
  });
  terminal.addEventListener("mouseleave", () => {
    terminal.style.transform = "";
  });
}

/* ---------- Animated terminal ---------- */
const term = document.getElementById("term");
if (term) {
  const lines = [
    { html: `<span class="t-prompt">$</span> soloenv up --protect --ttl 4h` },
    { html: `<span class="t-dim">Starting compose project (compose.yaml)...</span>` },
    { html: `<span class="t-ok">&#10003;</span> <span class="t-dim">Container web started on :8088</span>` },
    { html: `<span class="t-dim">Opening Cloudflare tunnel...</span>` },
    { html: `` },
    { html: `<span class="t-label">  Your staging URL is live</span>` },
    { html: `<span class="t-url">  https://calm-river-1234.trycloudflare.com</span>` },
    { html: `<span class="t-warn">  Protected — user: solo  password: d3v-xQ7p</span>` },
    { html: `` },
    { html: `<span class="t-dim">  QR code · URL copied to clipboard</span>` },
    { html: `<span class="t-dim">  soloenv status · soloenv down</span>` },
  ];

  const cursor = '<span class="cursor"></span>';

  async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function run() {
    while (true) {
      term.innerHTML = "";
      const rendered = [];
      const cmd = "soloenv up --protect --ttl 4h";

      for (let i = 0; i <= cmd.length; i++) {
        term.innerHTML = `<span class="t-prompt">$</span> ${cmd.slice(0, i)}${cursor}`;
        await sleep(42);
      }
      rendered.push(lines[0].html);

      for (let i = 1; i < lines.length; i++) {
        rendered.push(lines[i].html);
        term.innerHTML = rendered.join("\n") + cursor;
        await sleep(lines[i].html === "" ? 100 : 320);
      }

      await sleep(5500);
    }
  }

  if (prefersReducedMotion) {
    term.innerHTML = lines.map((l) => l.html).join("\n");
  } else {
    run();
  }
}
