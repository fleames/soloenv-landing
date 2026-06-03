import { FORM_URL, GA_MEASUREMENT_ID } from "./config.js";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

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

/* ---------- Copy command button ---------- */
const copyBtn = document.getElementById("copyBtn");
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
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
    const original = label ? label.textContent : "";
    copyBtn.classList.add("copied");
    if (label) label.textContent = "Copied";
    setTimeout(() => {
      copyBtn.classList.remove("copied");
      if (label) label.textContent = original || "Copy";
    }, 1600);
  });
}

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll(".reveal");
if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealEls.forEach((el) => el.classList.add("in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => io.observe(el));
}

/* ---------- FAQ: only one open at a time ---------- */
const faqItems = document.querySelectorAll(".faq-item");
faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (item.open) {
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    }
  });
});

/* ---------- Animated terminal ---------- */
const term = document.getElementById("term");
if (term) {
  const lines = [
    { html: `<span class="t-prompt">$</span> soloenv up`, type: true },
    { html: `<span class="t-dim">Starting compose project (compose.yaml)...</span>` },
    { html: `<span class="t-ok">&#10003;</span> <span class="t-dim">Container web started</span>` },
    { html: `<span class="t-dim">Opening Cloudflare tunnel...</span>` },
    { html: `` },
    { html: `  <span class="t-label">Your staging URL is live:</span>` },
    { html: `  <span class="t-url">https://your-app.trycloudflare.com</span>` },
    { html: `<span class="t-dim">  Protected — user: solo  password: ••••••••</span>` },
    { html: `` },
    { html: `<span class="t-dim">Detached · expires in 4h · URL copied to clipboard</span>` },
    { html: `<span class="t-dim">soloenv open · soloenv logs · soloenv down</span>` },
    { html: `<span class="t-dim">Press Ctrl+C to tear it all down.</span>` },
  ];

  const cursor = '<span class="cursor"></span>';

  function renderInstant() {
    term.innerHTML = lines.map((l) => l.html).join("\n");
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function run() {
    while (true) {
      term.innerHTML = "";
      const rendered = [];

      // Type the first command line character by character.
      const cmd = "soloenv up";
      for (let i = 0; i <= cmd.length; i++) {
        const typed = `<span class="t-prompt">$</span> ${cmd.slice(0, i)}`;
        term.innerHTML = typed + cursor;
        await sleep(55);
      }
      rendered.push(lines[0].html);

      // Reveal remaining lines progressively.
      for (let i = 1; i < lines.length; i++) {
        rendered.push(lines[i].html);
        term.innerHTML = rendered.join("\n") + cursor;
        await sleep(lines[i].html === "" ? 120 : 360);
      }

      term.innerHTML = rendered.join("\n") + cursor;
      await sleep(6000);
    }
  }

  if (prefersReducedMotion) {
    renderInstant();
  } else {
    run();
  }
}
