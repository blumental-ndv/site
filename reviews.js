// Публичный вывод опубликованных отзывов из Supabase.
(() => {
  const SUPABASE_URL = "https://kdakrpgzeufyfjlzfzcn.supabase.co";
  const SUPABASE_KEY = "sb_publishable_XkFCo4UH2nsA0Ex1wCKjGA_1tclbctl";

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + "T00:00:00" : value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric", month: "long", year: "numeric"
    }).format(date);
  }

  function createReviewCard(payload) {
    const card = document.createElement("article");
    card.className = "review-card";
    const parsedDate = payload.date ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(payload.date) ? payload.date + "T00:00:00" : payload.date) : null;
    card.dataset.year = parsedDate && !Number.isNaN(parsedDate.getTime()) ? String(parsedDate.getFullYear()) : "Без даты";

    const content = document.createElement("div");
    const stars = document.createElement("div");
    stars.className = "review-stars";
    const rating = Math.max(1, Math.min(5, Number(payload.rating) || 5));
    stars.textContent = "★".repeat(rating) + "☆".repeat(5 - rating);

    const quote = document.createElement("p");
    quote.className = "review-text";
    quote.textContent = payload.text || "";
    content.append(stars, quote);

    const details = document.createElement("div");
    const author = document.createElement("strong");
    author.className = "review-author";
    author.textContent = payload.author || "Клиент";

    const meta = document.createElement("span");
    meta.className = "review-meta";
    const date = formatDate(payload.date);
    meta.textContent = [payload.source || "Клиент", date].filter(Boolean).join(", ");

    details.append(author, meta);
    if (payload.source_url) {
      try {
        const url = new URL(payload.source_url);
        if (url.protocol === "https:" || url.protocol === "http:") {
          const link = document.createElement("a");
          link.className = "review-link";
          link.href = url.href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = payload.source ? "Проверить на " + payload.source + " →" : "Источник отзыва →";
          details.append(link);
        }
      } catch (_) { /* Некорректную ссылку не выводим. */ }
    }

    card.append(content, details);
    return card;
  }


  function buildYearNavigation(fullList) {
    if (!fullList) return;
    const cards = [...fullList.querySelectorAll(".review-card")];
    if (!cards.length) return;

    cards.forEach(card => {
      if (!card.dataset.year) {
        const meta = card.querySelector(".review-meta")?.textContent || "";
        const match = meta.match(/\b(20\d{2})\b/);
        card.dataset.year = match ? match[1] : "Без даты";
      }
    });

    let yearNav = document.querySelector(".reviews-year-nav");
    if (!yearNav) {
      yearNav = document.createElement("nav");
      yearNav.className = "reviews-year-nav";
      yearNav.setAttribute("aria-label", "Навигация по годам отзывов");
      fullList.parentNode.insertBefore(yearNav, fullList);
    }

    const years = [...new Set(cards.map(card => card.dataset.year))].sort((a, b) => {
      if (a === "Без даты") return 1;
      if (b === "Без даты") return -1;
      return Number(b) - Number(a);
    });

    const filters = ["Все", ...years];
    yearNav.replaceChildren(...filters.map((year, index) => {
      const link = document.createElement("a");
      link.href = "#";
      link.className = "reviews-year-link" + (index === 0 ? " active" : "");
      link.textContent = year === "Все" ? "Все годы" : year;
      link.setAttribute("aria-current", index === 0 ? "true" : "false");
      link.addEventListener("click", event => {
        event.preventDefault();
        cards.forEach(card => {
          card.hidden = year !== "Все" && card.dataset.year !== year;
        });
        yearNav.querySelectorAll(".reviews-year-link").forEach(item => {
          const active = item === link;
          item.classList.toggle("active", active);
          item.setAttribute("aria-current", active ? "true" : "false");
        });
      });
      return link;
    }));
  }

  async function loadReviews() {
    const fullList = document.querySelector(".all-reviews-grid");
    const homeList = document.querySelector(".reviews-grid");
    if (!fullList && !homeList) return;
    if (fullList) buildYearNavigation(fullList);
    const loading = document.createElement('p'); loading.className = 'review-meta'; loading.textContent = 'Загружаем отзывы…';
    if (fullList) fullList.replaceChildren(loading.cloneNode(true));
    if (homeList) homeList.replaceChildren(loading.cloneNode(true));
    if (!window.supabase) {
      console.error("Supabase JS не загрузился; оставляем резервные отзывы из HTML.");
      buildYearNavigation(fullList);
      return;
    }

    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      let query = client.from("content_items")
        .select("payload")
        .eq("type", "review")
        .eq("status", "published");

      // Главной странице нужны только три отзыва; полный архив загружаем только на странице отзывов.
      if (!fullList && homeList) query = query.limit(3);

      const { data, error } = await query;
      if (error) throw error;

      const reviews = (data || [])
        .map(row => row.payload || {})
        .filter(item => item.text && item.author)
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

      if (fullList) {
        const cards = reviews.map(createReviewCard);
        fullList.replaceChildren(...cards);
        if (!reviews.length) {
          const empty = document.createElement("p");
          empty.className = "review-meta";
          empty.textContent = "Пока нет опубликованных отзывов.";
          fullList.append(empty);
        } else {
          buildYearNavigation(fullList);
        }
      }

      if (homeList) {
        const featured = reviews.slice(0, 3);
        if (featured.length) homeList.replaceChildren(...featured.map(createReviewCard));
      }
    } catch (error) {
      console.error("Не удалось загрузить отзывы из Supabase.", error);
      if (fullList) fullList.textContent = "Отзывы временно не удалось загрузить."; if (homeList) homeList.textContent = "Отзывы временно не удалось загрузить.";
      buildYearNavigation(fullList);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadReviews, { once: true });
  } else {
    loadReviews();
  }
})();
