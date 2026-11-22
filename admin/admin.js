// Заполнить после создания проекта Supabase. Используются только публичные значения.
const SUPABASE_URL = "https://kdakrpgzeufyfjlzfzcn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_XkFCo4UH2nsA0Ex1wCKjGA_1tclbctl";

const TYPES = {
  review: "Отзывы", object: "ЖК и объекты", case: "Кейсы",
  article: "Статьи", page: "Страницы и SEO"
};
const configured = SUPABASE_URL.startsWith("https://") && !SUPABASE_ANON_KEY.startsWith("ВСТАВЬТЕ");
const $ = (id) => document.getElementById(id);
let supabaseClient = null;
let currentType = "review";
let currentItems = [];
let selectedId = null;

function show(id, visible) { $(id).hidden = !visible; }
function message(id, value, error = false) {
  $(id).textContent = value;
  $(id).style.color = error ? "#f18c8c" : "#6bd5a2";
}
function slugify(value) {
  const map = {а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"i",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya"};
  return value.toLowerCase().trim().split("").map(c => map[c] ?? c)
    .join("").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function statusName(status) { return status === "published" ? "Опубликован" : status === "archived" ? "Архив" : "Черновик"; }

async function boot() {
  if (!configured || !window.supabase) {
    show("setup-notice", true);
    show("login-view", false);
    show("app-view", false);
    return;
  }
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { session } } = await supabaseClient.auth.getSession();
  await applySession(session);
  supabaseClient.auth.onAuthStateChange((_event, session) => applySession(session));
}

async function applySession(session) {
  const signedIn = Boolean(session);
  show("login-view", !signedIn);
  show("app-view", signedIn);
  show("logout", signedIn);
  $("user-label").textContent = signedIn ? session.user.email : "";
  if (signedIn) await loadItems();
}

async function loadItems() {
  $("items-list").innerHTML = '<div class="empty">Загружаем…</div>';
  const { data, error } = await supabaseClient.from("content_items")
    .select("id,type,slug,title,status,updated_at").eq("type", currentType)
    .order("updated_at", { ascending: false });
  if (error) {
    $("items-list").innerHTML = '<div class="empty">Не удалось загрузить данные. Проверь SQL-схему и права доступа.</div>';
    console.error(error);
    return;
  }
  currentItems = data || [];
  $("list-title").textContent = TYPES[currentType];
  $("item-count").textContent = currentItems.length;
  $("items-list").innerHTML = currentItems.length ? currentItems.map(item =>
    '<button class="item-row '+(item.id === selectedId ? "selected" : "")+'" data-id="'+item.id+'">'+
    '<span class="item-state">'+escapeHtml(statusName(item.status))+'</span>'+
    '<strong>'+escapeHtml(item.title)+'</strong><small>'+escapeHtml(item.slug)+'</small></button>'
  ).join("") : '<div class="empty">Пока нет материалов. Нажми «Добавить материал».</div>';
  $("items-list").querySelectorAll("[data-id]").forEach(button =>
    button.addEventListener("click", () => openItem(button.dataset.id)));
}

async function openItem(id) {
  const { data, error } = await supabaseClient.from("content_items").select("*").eq("id", id).single();
  if (error) return message("save-message", error.message, true);
  selectedId = data.id;
  $("item-id").value = data.id;
  $("item-slug").dataset.touched = "1";
  $("item-title").value = data.title;
  $("item-slug").value = data.slug;
  $("item-status").value = data.status;
  $("item-payload").value = JSON.stringify(data.payload || {}, null, 2);
  configureEditor(data.payload || {}, data.title);
  $("editor-title").textContent = "Редактирование";
  $("status-pill").textContent = statusName(data.status);
  show("editor-empty", false); show("editor-form", true); show("delete-item", true);
  message("save-message", "");
  await loadItems();
}

function newItem() {
  selectedId = null;
  $("item-id").value = "";
  $("item-title").value = "";
  $("item-slug").value = "";
  $("item-slug").dataset.touched = "";
  $("item-status").value = "draft";
  const payload = defaultPayload(currentType);
  $("item-payload").value = JSON.stringify(payload, null, 2);
  configureEditor(payload, "");
  $("editor-title").textContent = "Новый материал";
  $("status-pill").textContent = "Черновик";
  show("editor-empty", false); show("editor-form", true); show("delete-item", false);
  message("save-message", "");
}
function defaultPayload(type) {
  const examples = {
    review: { text: "", author: "", date: "", source_url: "", rating: 5, page_ids: [], object_ids: [], case_ids: [] },
    object: { name: "", city: "", developer: "", address: "", description: "", images: [], page_ids: [] },
    case: { object_id: null, property_type: "", area_m2: null, deal_date: "", price: null, payment_terms: "", description: "", images: [], review_ids: [] },
    article: { excerpt: "", body: "", cover_image: "", seo_title: "", seo_description: "", page_ids: [] },
    page: { seo_title: "", seo_description: "", canonical_url: "", og_image: "", content: {} }
  };
  return examples[type] || {};
}

async function configureEditor(payload = {}, fallbackTitle = "") {
  const isObject = currentType === "object";
  show("object-fields", isObject);
  show("payload-json-field", !isObject);
  if (!isObject) return;

  const casesSelect = $("object-cases");
  casesSelect.innerHTML = '<option disabled>Загружаем кейсы…</option>';
  const { data: cases, error: casesError } = await supabaseClient.from("content_items")
    .select("id,title,status").eq("type", "case").order("title");
  if (casesError) {
    casesSelect.innerHTML = '<option disabled>Не удалось загрузить кейсы</option>';
    console.error(casesError);
  } else {
    casesSelect.innerHTML = (cases || []).map(item =>
      '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.title) + ' — ' + escapeHtml(statusName(item.status)) + '</option>'
    ).join("");
    const objectId = $("item-id").value;
    if (objectId) {
      const { data: links, error: linksError } = await supabaseClient.from("content_relations")
        .select("target_id").eq("source_id", objectId).eq("relation_type", "object_case");
      if (linksError) console.error(linksError);
      const linkedIds = new Set((links || []).map(link => link.target_id));
      [...casesSelect.options].forEach(option => { option.selected = linkedIds.has(option.value); });
    }
  }

  $("object-name").value = payload.name || fallbackTitle || "";
  $("object-city").value = payload.city || "";
  $("object-developer").value = payload.developer || "";
  $("object-address").value = payload.address || "";
  $("object-description").value = payload.description || "";
  $("object-images").value = Array.isArray(payload.images) ? payload.images.join("\n") : "";
}
function readPayload() {
  let payload;
  try {
    payload = JSON.parse($("item-payload").value || "{}");
  } catch (error) {
    throw new Error("Ошибка JSON: " + error.message);
  }
  if (currentType === "object") {
    payload = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
    payload.name = $("object-name").value.trim() || $("item-title").value.trim();
    payload.city = $("object-city").value.trim();
    payload.developer = $("object-developer").value.trim();
    payload.address = $("object-address").value.trim();
    payload.description = $("object-description").value.trim();
    payload.images = $("object-images").value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  }
  return payload;
}

$("object-name").addEventListener("input", () => {
  const name = $("object-name").value;
  $("item-title").value = name;
  if (!$("item-slug").dataset.touched) $("item-slug").value = slugify(name);
});

$("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  message("login-message", "Отправляем ссылку…");
  const { error } = await supabaseClient.auth.signInWithOtp({
    email: $("email").value.trim(),
    options: { emailRedirectTo: window.location.href }
  });
  message("login-message", error ? error.message : "Проверь почту — отправили ссылку для входа.", Boolean(error));
});
$("logout").addEventListener("click", async () => { await supabaseClient.auth.signOut(); });
$("type-tabs").addEventListener("click", async (event) => {
  const tab = event.target.closest("[data-type]");
  if (!tab) return;
  currentType = tab.dataset.type;
  selectedId = null;
  document.querySelectorAll(".tab").forEach(node => node.classList.toggle("active", node === tab));
  show("editor-form", false); show("delete-item", false); show("editor-empty", true);
  await loadItems();
});
$("new-item").addEventListener("click", newItem);
$("cancel-edit").addEventListener("click", () => {
  selectedId = null; show("editor-form", false); show("editor-empty", true); loadItems();
});
$("item-title").addEventListener("input", () => {
  if (!$("item-id").value || !$("item-slug").dataset.touched) $("item-slug").value = slugify($("item-title").value);
});
$("item-slug").addEventListener("input", () => { $("item-slug").dataset.touched = "1"; });
$("editor-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  let payload;
  try { payload = readPayload(); }
  catch (error) { return message("save-message", error.message, true); }
  const record = {
    type: currentType, title: $("item-title").value.trim(),
    slug: $("item-slug").value.trim(), status: $("item-status").value,
    payload
  };
  if (!record.title || !record.slug) return message("save-message", "Заполни заголовок и адрес.", true);
  const query = selectedId
    ? supabaseClient.from("content_items").update(record).eq("id", selectedId)
    : supabaseClient.from("content_items").insert({
        ...record, created_by: (await supabaseClient.auth.getUser()).data.user?.id
      });
  const { data, error } = await query.select("id").single();
  if (error) return message("save-message", error.message, true);
  selectedId = data.id;
  if (currentType === "object") {
    const selectedCaseIds = [...$("object-cases").selectedOptions].map(option => option.value);
    const { error: deleteRelationsError } = await supabaseClient.from("content_relations")
      .delete().eq("source_id", selectedId).eq("relation_type", "object_case");
    if (deleteRelationsError) return message("save-message", "Объект сохранён, но старые связи не удалось обновить: " + deleteRelationsError.message, true);
    if (selectedCaseIds.length) {
      const rows = selectedCaseIds.map(target_id => ({source_id:selectedId,target_id,relation_type:"object_case"}));
      const { error: insertRelationsError } = await supabaseClient.from("content_relations").insert(rows);
      if (insertRelationsError) return message("save-message", "Объект сохранён, но кейсы не связаны: " + insertRelationsError.message, true);
    }
  }
  message("save-message", "Сохранено.");
  await openItem(selectedId);
});
$("delete-item").addEventListener("click", async () => {
  if (!selectedId || !confirm("Удалить материал без возможности восстановления?")) return;
  const { error } = await supabaseClient.from("content_items").delete().eq("id", selectedId);
  if (error) return message("save-message", error.message, true);
  selectedId = null; show("editor-form", false); show("editor-empty", true); await loadItems();
});
boot();