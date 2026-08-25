/**
 * ==========================================================
 *  المنطق الرئيسي — لا حاجة لتعديل هذا الملف عادةً
 *  كل الإعدادات موجودة في config.js
 * ==========================================================
 */

const { BASE_ID, TOKEN, TABLES, FIELDS } = AIRTABLE_CONFIG;
const AIRTABLE_API = "https://api.airtable.com/v0";

// عناصر الصفحة
const els = {
  loading: document.getElementById("loading-screen"),
  error: document.getElementById("error-screen"),
  errorMessage: document.getElementById("error-message"),
  app: document.getElementById("app"),
  clientLogo: document.getElementById("client-logo"),
  clientName: document.getElementById("client-name"),
  heroClientName: document.getElementById("hero-client-name"),
  footerClientName: document.getElementById("footer-client-name"),
  headerWhatsapp: document.getElementById("header-whatsapp"),
  floatingWhatsapp: document.getElementById("floating-whatsapp"),
  propertiesGrid: document.getElementById("properties-grid"),
  propertiesCount: document.getElementById("properties-count"),
  emptyProperties: document.getElementById("empty-properties"),
  cardTemplate: document.getElementById("property-card-template"),
};

init();

async function init() {
  try {
    // 1) قراءة اسم العميل من الرابط، مثال: ?client=ahmed-estate
    const params = new URLSearchParams(window.location.search);
    const clientSlug = params.get("client");

    if (!clientSlug) {
      showError("الرابط غير مكتمل. الرجاء إضافة ?client=اسم-الشركة إلى الرابط.");
      return;
    }

    // 2) جلب بيانات العميل من جدول Clients
    const client = await fetchClient(clientSlug);
    if (!client) {
      showError(`لا يوجد حساب باسم "${clientSlug}".`);
      return;
    }

    // 3) تطبيق هوية العميل (الألوان، اللوجو، الفافيكون، Open Graph)
    applyClientBranding(client);

    // 4) جلب العقارات الخاصة بهذا العميل فقط
    const properties = await fetchProperties(clientSlug);

    // 5) عرضها في الصفحة
    renderProperties(properties);

    els.loading.style.opacity = "0";
    setTimeout(() => els.loading.classList.add("hidden"), 400);
    els.app.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    showError("حدث خطأ أثناء تحميل البيانات. الرجاء المحاولة لاحقاً.");
  }
}

/* ==========================================================
 *  Airtable Requests
 * ========================================================== */

async function fetchClient(slug) {
  const formula = encodeURIComponent(`{${FIELDS.CLIENT_SLUG}} = "${slug}"`);
  const url = `${AIRTABLE_API}/${BASE_ID}/${encodeURIComponent(TABLES.CLIENTS)}?filterByFormula=${formula}&maxRecords=1`;

  const res = await airtableFetch(url);
  const record = res.records?.[0];
  return record ? record.fields : null;
}

async function fetchProperties(slug) {
  const formula = encodeURIComponent(`{${FIELDS.PROPERTY_CLIENT_SLUG}} = "${slug}"`);
  let url = `${AIRTABLE_API}/${BASE_ID}/${encodeURIComponent(TABLES.PROPERTIES)}?filterByFormula=${formula}`;

  // Airtable يرجع 100 سجل كحد أقصى في كل طلب، هذا الجزء يجلب كل الصفحات تلقائياً
  let allRecords = [];
  let offset = null;

  do {
    const pageUrl = offset ? `${url}&offset=${offset}` : url;
    const res = await airtableFetch(pageUrl);
    allRecords = allRecords.concat(res.records || []);
    offset = res.offset;
  } while (offset);

  return allRecords.map((r) => r.fields);
}

async function airtableFetch(url) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable request failed (${res.status}): ${body}`);
  }

  return res.json();
}

/* ==========================================================
 *  تطبيق هوية العميل على الصفحة
 * ========================================================== */

function applyClientBranding(client) {
  const name = client[FIELDS.COMPANY_NAME] || "منصة العقارات";
  const color = client[FIELDS.THEME_COLOR] || "#16302B";
  const logo = client[FIELDS.LOGO_URL];
  const favicon = client[FIELDS.FAVICON_URL];
  const shareImage = client[FIELDS.SHARE_IMAGE_URL];
  const whatsapp = client[FIELDS.WHATSAPP];

  // اللون الأساسي (CSS Variable)
  document.documentElement.style.setProperty("--theme-color", color);

  // اسم الشركة في كل الأماكن
  document.title = name;
  els.clientName.textContent = name;
  els.heroClientName.textContent = name;
  els.footerClientName.textContent = name;

  // اللوجو
  if (logo) {
    els.clientLogo.src = logo;
    els.clientLogo.classList.remove("hidden");
  }

  // الفافيكون
  if (favicon) {
    document.getElementById("favicon").href = favicon;
  }

  // Open Graph / meta tags
  document.getElementById("meta-description").content = `تصفح عقارات ${name}`;
  document.getElementById("og-title").content = name;
  document.getElementById("og-description").content = `تصفح عقارات ${name}`;
  if (shareImage) {
    document.getElementById("og-image").content = shareImage;
  }

  // روابط واتساب (الهيدر + الزر العائم)
  if (whatsapp) {
    const link = buildWhatsappLink(whatsapp, `مرحباً، أرغب بالاستفسار عن عقاراتكم لدى ${name}`);
    els.headerWhatsapp.href = link;
    els.floatingWhatsapp.href = link;
    els.floatingWhatsapp.classList.remove("hidden");
    els.floatingWhatsapp.classList.add("flex");
  } else {
    els.headerWhatsapp.classList.add("hidden");
  }
}

function buildWhatsappLink(number, message) {
  const cleanNumber = String(number).replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/* ==========================================================
 *  عرض العقارات
 * ========================================================== */

function renderProperties(properties) {
  els.propertiesCount.textContent =
    properties.length > 0
      ? `${properties.length} عقار متاح حالياً`
      : "لا توجد عقارات متاحة حالياً";

  if (properties.length === 0) {
    els.emptyProperties.classList.remove("hidden");
    return;
  }

  const fragment = document.createDocumentFragment();
  properties.forEach((property) => {
    fragment.appendChild(buildPropertyCard(property));
  });
  els.propertiesGrid.appendChild(fragment);
}

function buildPropertyCard(property) {
  const node = els.cardTemplate.content.cloneNode(true);

  const title = property[FIELDS.PROPERTY_TITLE] || "عقار بدون عنوان";
  const location = property[FIELDS.PROPERTY_LOCATION] || "";
  const price = property[FIELDS.PROPERTY_PRICE];
  const bedrooms = property[FIELDS.PROPERTY_BEDROOMS];
  const bathrooms = property[FIELDS.PROPERTY_BATHROOMS];
  const area = property[FIELDS.PROPERTY_AREA];
  const imagesRaw = property[FIELDS.PROPERTY_IMAGES] || "";

  // تحويل النص المفصول بفاصلة إلى مصفوفة روابط صور نظيفة
  const images = imagesRaw
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  // الصور (Scroll أفقي بسيط)
  const scrollContainer = node.querySelector(".image-scroll");
  const dotsContainer = node.querySelector(".dots");
  const finalImages = images.length > 0 ? images : ["https://placehold.co/600x400?text=No+Image"];

  finalImages.forEach((src, i) => {
    const slide = document.createElement("div");
    slide.className = "w-full h-56 flex-shrink-0";
    slide.innerHTML = `<img src="${src}" loading="lazy" class="w-full h-full object-cover" alt="${title}" />`;
    scrollContainer.appendChild(slide);

    if (finalImages.length > 1) {
      const dot = document.createElement("span");
      dot.className = "w-1.5 h-1.5 rounded-full bg-white/70";
      dot.dataset.index = i;
      dotsContainer.appendChild(dot);
    }
  });

  // ربط النقاط بموضع التمرير (اختياري لكن يعطي لمسة أنيقة)
  if (finalImages.length > 1) {
    scrollContainer.addEventListener("scroll", () => {
      const index = Math.round(scrollContainer.scrollLeft / scrollContainer.clientWidth);
      [...dotsContainer.children].forEach((dot, i) => {
        dot.classList.toggle("bg-white", i === index);
        dot.classList.toggle("bg-white/70", i !== index);
      });
    });
  }

  // شارة السعر
  const priceBadge = node.querySelector(".price-badge");
  if (price) {
    priceBadge.textContent = formatPrice(price);
  } else {
    priceBadge.remove();
  }

  // العنوان والموقع
  node.querySelector(".title").textContent = title;
  node.querySelector(".location").textContent = location;

  // التفاصيل (غرف / حمامات / مساحة)
  const meta = node.querySelector(".meta");
  const metaItems = [];
  if (bedrooms) metaItems.push(`${bedrooms} غرف`);
  if (bathrooms) metaItems.push(`${bathrooms} حمام`);
  if (area) metaItems.push(`${area} م²`);
  meta.textContent = metaItems.join(" · ");

  // زر واتساب داخل الكرت
  const cardWhatsapp = node.querySelector(".card-whatsapp");
  const clientWhatsapp = document.getElementById("header-whatsapp").href;
  if (clientWhatsapp && clientWhatsapp !== "#" && !clientWhatsapp.endsWith("#")) {
    const message = `مرحباً، أرغب بالاستفسار عن هذا العقار: ${title}`;
    // نعيد استخدام نفس رقم واتساب الخاص بالعميل مع رسالة مخصصة لهذا العقار
    const number = new URL(clientWhatsapp).pathname.split("/").pop();
    cardWhatsapp.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  } else {
    cardWhatsapp.remove();
  }

  return node;
}

function formatPrice(price) {
  const number = Number(price);
  if (Number.isNaN(number)) return price;
  return `${number.toLocaleString("en-US")} جنيه`;
}

function showError(message) {
  els.errorMessage.textContent = message;
  els.loading.classList.add("hidden");
  els.error.classList.remove("hidden");
}
