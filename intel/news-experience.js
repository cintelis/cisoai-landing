const NEWS_API = "https://news-worker.nick-598.workers.dev/api/news";
const EMAIL_API_URL = "/api/send";
const FROM_EMAIL = "hello@cisoai.au";
const ADMIN_INBOX = "hello@cisoai.au";

let allArticles = [];
let activeFilter = "all";

function $(id) {
  return document.getElementById(id);
}

function escHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeUrl(value) {
  try {
    const url = new URL(value, window.location.origin);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.href;
    }
  } catch (error) {
    return "#";
  }
  return "#";
}

function categoryClass(category) {
  if (!category) return "";
  if (category.includes("Gov") || category.includes("Advisory")) return "gov";
  if (category.includes("Research")) return "research";
  return "";
}

function formatDate(isoValue) {
  if (!isoValue) return "";
  try {
    return new Date(isoValue).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch (error) {
    return "";
  }
}

function formatRelativeTime(isoValue) {
  if (!isoValue) return "";
  const diff = Math.max(0, Date.now() - new Date(isoValue).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function showToast(message) {
  const toast = $("toast");
  const toastMessage = $("toastMessage");
  if (!toast || !toastMessage) return;
  toastMessage.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => toast.classList.remove("show"), 4200);
}

async function sendEmail(options) {
  const body = {
    to: options.to,
    subject: options.subject,
    message: options.message,
    contentType: options.contentType || "HTML"
  };

  if (options.fromEmail) {
    body.fromEmail = options.fromEmail;
  }

  const response = await fetch(EMAIL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data || !data.success) {
    throw new Error((data && data.error) || `Email service returned ${response.status}`);
  }

  return data;
}

function emailWrap(bodyContent) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#edf2f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf2f7;padding:28px 14px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.12);">
<tr><td style="padding:28px 32px;background:linear-gradient(135deg,#08111a 0%,#0f2230 100%);text-align:center;">
<div style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;background:linear-gradient(135deg,#00c8ff 0%,#0088bb 100%);clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);font:700 12px 'JetBrains Mono',monospace;letter-spacing:0.08em;color:#041219;">CA</div>
<h1 style="margin:14px 0 0;font:700 24px 'Barlow Condensed',Arial,sans-serif;letter-spacing:0.08em;text-transform:uppercase;color:#d7e3ef;">CISO <span style="color:#00c8ff;">AI</span></h1>
<p style="margin:6px 0 0;font:500 11px 'JetBrains Mono',monospace;letter-spacing:0.14em;text-transform:uppercase;color:#7f95ab;">Plain-language cyber intelligence</p>
</td></tr>
<tr><td style="padding:32px;">${bodyContent}</td></tr>
<tr><td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
<p style="margin:0;font:400 12px Arial,sans-serif;color:#64748b;">CISO AI Pty Ltd · Trusted source summaries for security teams and executives</p>
<p style="margin:6px 0 0;font:400 12px Arial,sans-serif;"><a href="https://cisoai.au/" style="color:#0088bb;text-decoration:none;">cisoai.au</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function renderFeaturedCard(article) {
  const safeArticleUrl = safeUrl(article.originalUrl);
  const tags = (article.tags || [])
    .slice(0, 3)
    .map((tag) => `<span class="tag">${escHtml(tag)}</span>`)
    .join("");

  return `
    <article class="featured-card reveal js-open-article" data-id="${escHtml(article.id)}" tabindex="0" role="button">
      <div class="card-category ${categoryClass(article.category)}">${escHtml(article.category || "Security")}</div>
      <h2>${escHtml(article.headline)}</h2>
      <p class="card-summary">${escHtml(article.summary)}</p>
      ${
        article.keyTakeaway
          ? `<div class="key-takeaway"><strong>Key Takeaway</strong>${escHtml(article.keyTakeaway)}</div>`
          : ""
      }
      <div class="card-footer">
        <span class="card-source">${escHtml(article.source)}</span>
        <span class="card-date">${formatDate(article.publishedAt)}</span>
        <div class="card-tags">${tags}</div>
      </div>
      <a class="read-more" href="${safeArticleUrl}" target="_blank" rel="noopener">Read original source -></a>
    </article>`;
}

function renderSidebarItem(article) {
  return `
    <article class="sidebar-item js-open-article" data-id="${escHtml(article.id)}" tabindex="0" role="button">
      <h3>${escHtml(article.headline)}</h3>
      <div class="sidebar-meta">
        <span class="sidebar-source">${escHtml(article.source)}</span>
        <span class="sidebar-date">${formatDate(article.publishedAt)}</span>
      </div>
    </article>`;
}

function renderArticleCard(article) {
  return `
    <article class="article-card reveal js-open-article" data-id="${escHtml(article.id)}" tabindex="0" role="button">
      <div class="card-category ${categoryClass(article.category)}">${escHtml(article.category || "Security")}</div>
      <h3>${escHtml(article.headline)}</h3>
      <p class="article-summary">${escHtml(article.summary)}</p>
      <div class="card-footer">
        <span class="card-source">${escHtml(article.source)}</span>
        <span class="card-date">${formatDate(article.publishedAt)}</span>
      </div>
    </article>`;
}

function renderNews(articles) {
  const filteredArticles =
    activeFilter === "all" ? articles : articles.filter((article) => article.category === activeFilter);

  const articleCount = $("articleCount");
  const topLayout = $("topLayout");
  const articlesGrid = $("articlesGrid");
  if (!articleCount || !topLayout || !articlesGrid) return;

  articleCount.textContent = `${filteredArticles.length} articles`;
  topLayout.innerHTML = "";

  const featured = filteredArticles[0];
  const sidebarArticles = filteredArticles.slice(1, 6);
  const gridArticles = filteredArticles.slice(6);

  if (featured) {
    topLayout.innerHTML = renderFeaturedCard(featured);
  }

  if (sidebarArticles.length > 0) {
    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";
    sidebar.innerHTML =
      '<div class="sidebar-header">// Latest source summaries</div>' +
      sidebarArticles.map(renderSidebarItem).join("");
    topLayout.appendChild(sidebar);
  }

  articlesGrid.innerHTML = gridArticles.map(renderArticleCard).join("");
  revealElements();
}

function openModal(articleId) {
  const article = allArticles.find((entry) => String(entry.id) === String(articleId));
  if (!article) return;

  $("modalCategory").textContent = article.category || "";
  $("modalCategory").className = `card-category ${categoryClass(article.category)}`;
  $("modalTitle").textContent = article.headline || "";
  $("modalSource").textContent = `${article.source || ""} · ${formatDate(article.publishedAt)}`;
  $("modalBody").textContent = article.body || "";
  $("modalDate").textContent = formatDate(article.publishedAt);
  $("modalTags").innerHTML = (article.tags || [])
    .map((tag) => `<span class="tag">${escHtml(tag)}</span>`)
    .join("");

  const takeaway = $("modalTakeaway");
  if (article.keyTakeaway) {
    $("modalTakeawayText").textContent = article.keyTakeaway;
    takeaway.style.display = "block";
  } else {
    takeaway.style.display = "none";
  }

  $("modalSourceLink").href = safeUrl(article.originalUrl);
  $("modalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal(event) {
  const overlay = $("modalOverlay");
  if (!overlay) return;
  if (event && event.target !== overlay && event.currentTarget === overlay) return;
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}

async function loadNews() {
  const loadingState = $("loadingState");
  const newsContent = $("newsContent");
  const emptyState = $("emptyState");

  if (loadingState) loadingState.style.display = "flex";
  if (newsContent) newsContent.style.display = "none";
  if (emptyState) emptyState.style.display = "none";

  try {
    const response = await fetch(`${NEWS_API}?limit=50`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    allArticles = data.articles || [];

    if (allArticles.length === 0) {
      if (loadingState) loadingState.style.display = "none";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    const lastUpdated = $("lastUpdated");
    if (lastUpdated && allArticles[0] && allArticles[0].createdAt) {
      lastUpdated.textContent = `Updated ${formatRelativeTime(allArticles[0].createdAt)}`;
    }

    renderNews(allArticles);
    if (loadingState) loadingState.style.display = "none";
    if (newsContent) newsContent.style.display = "block";
  } catch (error) {
    console.error("Failed to load news:", error);
    if (loadingState) loadingState.style.display = "none";
    if (emptyState) emptyState.style.display = "block";
  }
}

function revealElements() {
  window.requestAnimationFrame(() => {
    document.querySelectorAll(".reveal:not(.visible)").forEach((element, index) => {
      window.setTimeout(() => element.classList.add("visible"), index * 55);
    });
  });
}

async function handleBriefingSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const submitButton = $("briefingSubmit");
  const emailField = $("briefingEmail");
  if (!submitButton || !emailField) return;

  const originalText = submitButton.textContent;
  const email = emailField.value.trim();
  if (!email) return;

  submitButton.disabled = true;
  submitButton.textContent = "Submitting";

  const now = new Date().toLocaleString("en-AU", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Australia/Brisbane"
  });

  try {
    await sendEmail({
      to: ADMIN_INBOX,
      fromEmail: FROM_EMAIL,
      subject: `New Intelligence Briefing Subscriber: ${email}`,
      contentType: "HTML",
      message: emailWrap(`
        <h2 style="margin:0 0 6px;font:700 22px 'Barlow Condensed',Arial,sans-serif;letter-spacing:0.04em;text-transform:uppercase;color:#0f172a;">New briefing subscription</h2>
        <p style="margin:0 0 24px;font:400 13px Arial,sans-serif;color:#64748b;">${escHtml(now)}</p>
        <div style="padding:18px 20px;border:1px solid #bae6fd;background:#f0f9ff;">
          <p style="margin:0 0 4px;font:600 12px 'JetBrains Mono',monospace;letter-spacing:0.08em;text-transform:uppercase;color:#0369a1;">Subscriber email</p>
          <p style="margin:0;font:600 17px Arial,sans-serif;color:#0f172a;"><a href="mailto:${escHtml(email)}" style="color:#0369a1;text-decoration:none;">${escHtml(email)}</a></p>
        </div>
        <p style="margin:18px 0 0;font:400 14px Arial,sans-serif;line-height:1.6;color:#475569;">Source page: <a href="https://cisoai.au/" style="color:#0369a1;text-decoration:none;">https://cisoai.au/</a></p>
      `)
    });

    await sendEmail({
      to: email,
      fromEmail: FROM_EMAIL,
      subject: "You are subscribed to CISO AI Intelligence Briefings",
      contentType: "HTML",
      message: emailWrap(`
        <h2 style="margin:0 0 14px;font:700 22px 'Barlow Condensed',Arial,sans-serif;letter-spacing:0.04em;text-transform:uppercase;color:#0f172a;">Subscription confirmed</h2>
        <p style="margin:0 0 14px;font:400 15px Arial,sans-serif;line-height:1.7;color:#334155;">
          You will now receive <strong>plain-language cyber intelligence briefings</strong> built from trusted public, vendor, and government sources.
        </p>
        <div style="margin:20px 0;padding:18px 20px;background:#f8fafc;border-left:4px solid #00c8ff;">
          <p style="margin:0 0 8px;font:600 12px 'JetBrains Mono',monospace;letter-spacing:0.08em;text-transform:uppercase;color:#0369a1;">What to expect</p>
          <ul style="margin:0;padding-left:18px;font:400 14px Arial,sans-serif;line-height:1.8;color:#334155;">
            <li>Trusted source summaries without jargon.</li>
            <li>Clear takeaways for security teams, executives, and operators.</li>
            <li>Fast visibility into major advisories, campaigns, and research.</li>
          </ul>
        </div>
        <p style="margin:0 0 24px;font:400 15px Arial,sans-serif;line-height:1.7;color:#334155;">
          When a source matters, we focus on what changed, why it matters, and what is worth watching next.
        </p>
        <div style="text-align:center;">
          <a href="https://cisoai.au/" style="display:inline-block;padding:14px 28px;background:#0369a1;color:#ffffff;text-decoration:none;font:600 14px Arial,sans-serif;">Open the latest briefings</a>
        </div>
      `)
    });

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "ao_event",
      ao: {
        version: "1.0",
        event_name: "lead_briefing_subscribe",
        event_id:
          window.crypto && window.crypto.randomUUID
            ? window.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        event_time: Math.floor(Date.now() / 1000),
        page: {
          url: location.href,
          path: location.pathname,
          referrer: document.referrer || ""
        }
      }
    });

    showToast("Subscribed. Check your inbox for the briefing welcome message.");
    form.reset();
  } catch (error) {
    console.error("Briefing subscription error:", error);
    showToast("Subscription failed. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

function bindEvents() {
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((entry) => entry.classList.remove("active"));
      button.classList.add("active");
      activeFilter = button.dataset.filter || "all";
      renderNews(allArticles);
    });
  });

  const refreshButton = $("refreshBtn");
  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      refreshButton.classList.add("spinning");
      loadNews().finally(() => refreshButton.classList.remove("spinning"));
    });
  }

  const retryButton = $("retryLoad");
  if (retryButton) {
    retryButton.addEventListener("click", loadNews);
  }

  document.addEventListener("click", (event) => {
    const readMoreLink = event.target.closest(".read-more");
    if (readMoreLink) {
      event.stopPropagation();
      return;
    }

    const trigger = event.target.closest(".js-open-article");
    if (trigger) {
      openModal(trigger.dataset.id);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      return;
    }

    const trigger = event.target.closest(".js-open-article");
    if (trigger && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openModal(trigger.dataset.id);
    }
  });

  const modalOverlay = $("modalOverlay");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (event) => {
      if (event.target === modalOverlay) {
        closeModal();
      }
    });
  }

  const modalClose = $("modalClose");
  if (modalClose) {
    modalClose.addEventListener("click", () => closeModal());
  }

  const briefingForm = $("briefingForm");
  if (briefingForm) {
    briefingForm.addEventListener("submit", handleBriefingSubmit);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  revealElements();
  loadNews();
});
