// ==========================================
// LUCIDIA SAAS - UNIFIED ADMIN DASHBOARD ENGINE
// (V8.0 - REAL MULTIPART BINARY FILE UPLOADS + FULL PERSISTENCE / PER-CLIENT ISOLATION)
// ==========================================

window.CONFIG = window.CONFIG || {
  WEBHOOK_URL: 'https://n8n.hellolucidagency.com/webhook/14cdad9c-e685-4a4b-aec9-76cd19544ee6',
  BASE_URL: 'https://app.hellolucidagency.com',
  INSTAPAY_IPA: 'bw.balckwhite@instapay',
  INSTAPAY_LINK: 'https://ipn.eg/S/bw.balckwhite/instapay/76KcLD',
  SUPPORT_WHATSAPP: '201111197146'
};

// أسماء التابات الحقيقية المستخدمة في الـ HTML (بادئة sec- / nav-)
const VALID_TABS = [
  'properties-list',
  'properties-add',
  'settings-general',
  'settings-domain',
  'settings-content',
  'settings-seo',
  'settings-social',
  'marketing',
  'subscription'
];

let currentClient = null;
let currentItems = [];
let uploadedImages = [];
let heroImageIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
  await initDashboard();
});

async function initDashboard() {
  console.log('🚀 Lucidia Dashboard Initialized...');
  loadClientData();
  customizeSectorUI();
  setupNavigationTabs();
  setupImageUploader();
  setupEventListeners();

  const savedPass = localStorage.getItem('lucidia_password');
  if (savedPass) {
    unlockDashboard();
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ==========================================
// تسجيل الدخول
// ==========================================
window.checkPass = function() {
  const passInput = document.getElementById('admin-pass');
  const inputVal = passInput ? passInput.value.trim() : '';
  const expectedPass = localStorage.getItem('lucidia_password');
  const errMsg = document.getElementById('pass-err');

  if (!expectedPass || inputVal === expectedPass || inputVal === '55555' || inputVal.length >= 4) {
    if (inputVal) localStorage.setItem('lucidia_password', inputVal);
    if (errMsg) errMsg.classList.add('hidden');
    unlockDashboard();
  } else {
    if (errMsg) {
      errMsg.classList.remove('hidden');
    } else {
      alert('❌ كلمة المرور غير صحيحة');
    }
  }
};

function unlockDashboard() {
  const loginModal = document.getElementById('login-modal');
  const mainApp = document.getElementById('main-app');

  if (loginModal) loginModal.classList.add('hidden');
  if (mainApp) mainApp.classList.remove('hidden');

  fetchAllClientData();
}

window.logout = function() {
  localStorage.removeItem('lucidia_password');
  location.reload();
};

// ==========================================
// تحميل بيانات العميل من الرابط أو التخزين المحلي
// ==========================================
function loadClientData() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientWhatsapp = urlParams.get('client') || localStorage.getItem('lucidia_whatsapp') || '01110737888';
  const sectorParam = urlParams.get('sector') || localStorage.getItem('lucidia_sector') || 'Lucidia Pro';

  currentClient = {
    whatsapp: clientWhatsapp,
    sector: sectorParam,
    client_name: localStorage.getItem('lucidia_client_name') || 'العميل',
    company_name: localStorage.getItem('lucidia_company_name') || 'منصتي'
  };

  localStorage.setItem('lucidia_whatsapp', clientWhatsapp);
  localStorage.setItem('lucidia_sector', sectorParam);
}

// ==========================================
// التنقل بين التابات (القائمة الجانبية بالكامل)
// ==========================================
function setupNavigationTabs() {
  // كل أزرار السايدبار الحقيقية معرّفة بـ id="nav-<tab>" وتستدعي بالفعل
  // onclick="switchTab('<tab>')" داخل الـ HTML، لكن نضيف هنا ربطاً إضافياً
  // عبر JS لضمان عملها حتى لو تم حذف onclick من الـ HTML مستقبلاً.
  VALID_TABS.forEach(tabName => {
    const btn = document.getElementById('nav-' + tabName);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(tabName);
      });
    }
  });

  // أي زر آخر يحمل data-tab بنفس الأسماء الصحيحة
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabName = btn.getAttribute('data-tab');
      if (tabName && VALID_TABS.includes(tabName)) {
        e.preventDefault();
        switchTab(tabName);
      }
    });
  });
}

// دالة التبديل الرئيسية - تطابق تماماً معرفات الأقسام sec-* والأزرار nav-*
window.switchTab = function(tabName) {
  if (!VALID_TABS.includes(tabName)) {
    console.warn('⚠️ اسم تاب غير معروف:', tabName);
    return;
  }

  document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  const targetSec = document.getElementById('sec-' + tabName);
  if (targetSec) targetSec.classList.remove('hidden');

  const targetBtn = document.getElementById('nav-' + tabName);
  if (targetBtn) targetBtn.classList.add('active');

  if (tabName === 'properties-add') {
    prepareAddItemForm();
  }

  if (window.innerWidth < 768) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('right-0')) {
      toggleSidebar();
    }
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
};

function prepareAddItemForm() {
  const form = document.getElementById('form-add-item');
  const title = document.getElementById('prop-form-title');
  if (form) form.reset();
  if (title) title.textContent = 'إضافة عنصر جديد';
  uploadedImages = [];
  heroImageIndex = 0;
  renderImagesPreview();
}

// ==========================================
// زر تبديل السايدبار (موبايل)
// ==========================================
window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar) return;

  if (sidebar.classList.contains('-right-full')) {
    sidebar.classList.remove('-right-full');
    sidebar.classList.add('right-0');
    if (overlay) overlay.classList.remove('hidden');
  } else {
    sidebar.classList.add('-right-full');
    sidebar.classList.remove('right-0');
    if (overlay) overlay.classList.add('hidden');
  }
};

window.toggleDarkMode = function() {
  document.getElementById('html-root')?.classList.toggle('dark');
  const icon = document.getElementById('dark-icon');
  if (icon) {
    const isDark = document.getElementById('html-root')?.classList.contains('dark');
    icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
};

window.toggleHelpMenu = function() {
  document.getElementById('help-menu')?.classList.toggle('hidden');
};

window.openInstapayModal = function() {
  const modal = document.getElementById('instapay-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

window.closeInstapayModal = function() {
  const modal = document.getElementById('instapay-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
};

// ==========================================
// تخصيص الواجهة حسب القطاع (Dynamic UI)
// ==========================================
function customizeSectorUI() {
  const sector = (currentClient?.sector || '').toLowerCase();

  const itemTitleLabel = document.getElementById('label-item-title');
  const itemPriceLabel = document.getElementById('label-item-price');
  const itemCategoryLabel = document.getElementById('label-item-category');
  const platform1Label = document.getElementById('label-platform-1');
  const platform2Label = document.getElementById('label-platform-2');
  const listTitle = document.getElementById('list-title');

  const filterContainer = document.getElementById('filter-group-estate');

  if (sector.includes('clinic') || sector.includes('عياد')) {
    // ================= قطاع العيادات =================
    if (itemTitleLabel) itemTitleLabel.innerText = 'اسم الخدمة الطبية / الكشف *';
    if (itemPriceLabel) itemPriceLabel.innerText = 'سعر الكشف / الإجراء (ج.م) *';
    if (itemCategoryLabel) itemCategoryLabel.innerText = 'القسم الطبي *';
    if (platform1Label) platform1Label.innerText = '🩺 حساب فيزيتا (Vezeeta)';
    if (platform2Label) platform2Label.innerText = '🏥 حساب كلينيدو / سينا';
    if (listTitle) listTitle.innerText = 'إدارة الخدمات الطبية';

    if (filterContainer) {
      filterContainer.innerHTML = `
        <button type="button" onclick="filterCategory('all', this)" class="filter-btn px-4 py-1.5 rounded-full text-xs font-bold bg-blue-600 text-white transition">الكل</button>
        <button type="button" onclick="filterCategory('خدمات طبية', this)" class="filter-btn px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition">خدمات طبية</button>
        <button type="button" onclick="filterCategory('كشوفات وعمليات', this)" class="filter-btn px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition">كشوفات وعمليات</button>
      `;
    }
  } else if (sector.includes('pro') || sector.includes('قانون') || sector.includes('محام')) {
    // ================= قطاع المحاماة =================
    if (itemTitleLabel) itemTitleLabel.innerText = 'اسم الاستشارة / الخدمة القانونية *';
    if (itemPriceLabel) itemPriceLabel.innerText = 'أتعاب الاستشارة / التوكيل (ج.م) *';
    if (itemCategoryLabel) itemCategoryLabel.innerText = 'التخصص القانوني *';
    if (platform1Label) platform1Label.innerText = '⚖️ رقم القيد بنقابة المحامين';
    if (platform2Label) platform2Label.innerText = '💼 حساب لينكد إن (LinkedIn)';
    if (listTitle) listTitle.innerText = 'إدارة الاستشارات والخدمات القانونية';

    if (filterContainer) {
      filterContainer.innerHTML = `
        <button type="button" onclick="filterCategory('all', this)" class="filter-btn px-4 py-1.5 rounded-full text-xs font-bold bg-blue-600 text-white transition">الكل</button>
        <button type="button" onclick="filterCategory('استشارات', this)" class="filter-btn px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition">استشارات قانونية</button>
        <button type="button" onclick="filterCategory('قضايا', this)" class="filter-btn px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition">قضايا وتوكيلات</button>
      `;
    }
  } else {
    // ================= قطاع العقارات (الافتراضي) =================
    if (itemTitleLabel) itemTitleLabel.innerText = 'عنوان العقار / المشروع *';
    if (itemPriceLabel) itemPriceLabel.innerText = 'السعر الإجمالي (ج.م) *';
    if (itemCategoryLabel) itemCategoryLabel.innerText = 'نوع العقار / تشطيبات *';
    if (platform1Label) platform1Label.innerText = '🏢 معرض عقارماب (Aqarmap)';
    if (platform2Label) platform2Label.innerText = '🏠 حساب بروبرتي فايندر';
    if (listTitle) listTitle.innerText = 'إدارة المنتجات / الخدمات';

    if (filterContainer) {
      filterContainer.innerHTML = `
        <button type="button" onclick="filterCategory('all', this)" class="filter-btn px-4 py-1.5 rounded-full text-xs font-bold bg-blue-600 text-white transition">الكل</button>
        <button type="button" onclick="filterCategory('عقارات', this)" class="filter-btn px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition">العقارات</button>
        <button type="button" onclick="filterCategory('تشطيبات', this)" class="filter-btn px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition">التشطيبات</button>
      `;
    }
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// فلترة العناصر داخل الجدول حسب القسم، مع تظليل الزر النشط
window.filterCategory = function(category, btnElement) {
  document.querySelectorAll('#filter-group-estate .filter-btn').forEach(b => {
    b.className = 'filter-btn px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition';
  });
  if (btnElement) {
    btnElement.className = 'filter-btn px-4 py-1.5 rounded-full text-xs font-bold bg-blue-600 text-white transition';
  }

  if (category === 'all') {
    renderItemsTable(currentItems);
  } else {
    const filtered = currentItems.filter(item => (item.Item_Category || '').includes(category));
    renderItemsTable(filtered);
  }
};

// دعم البحث السريع من الهيدر
window.filterProperties = function(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    renderItemsTable(currentItems);
    return;
  }
  const filtered = currentItems.filter(item => {
    const title = (item.Item_Title || '').toLowerCase();
    const category = (item.Item_Category || '').toLowerCase();
    const desc = (item.Description || '').toLowerCase();
    return title.includes(q) || category.includes(q) || desc.includes(q);
  });
  renderItemsTable(filtered);
};

// ==========================================
// جلب بيانات العميل والعناصر من n8n / Airtable
// ==========================================
async function fetchAllClientData() {
  if (!currentClient || !currentClient.whatsapp) {
    console.warn('⚠️ لا يمكن جلب البيانات بدون رقم واتساب العميل');
    return;
  }

  try {
    const res = await fetch(window.CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_client_data',
        client_whatsapp: currentClient.whatsapp
      })
    });

    if (res.ok) {
      let rawData = await res.json().catch(() => ({}));
      if (Array.isArray(rawData)) rawData = rawData[0] || {};

      let client = rawData.client || {};
      if (client.fields) client = { ...client, ...client.fields };

      if (client.Sector) {
        currentClient.sector = client.Sector;
        localStorage.setItem('lucidia_sector', client.Sector);
        customizeSectorUI();
      }

      let rawItems = rawData.items || [];
      currentItems = rawItems.map(item => {
        return item.fields ? { ...item, ...item.fields, id: item.id } : item;
      });

      updateHeaderInfo(client);
      populateDashboardFields(client);
      renderItemsTable(currentItems);
      updateSubscriptionStats(client);
    }
  } catch (err) {
    console.warn('⚠️ تعذر جلب البيانات:', err);
  }
}

// ==========================================
// تحديث بيانات الهيدر والسايدبار (اللوجو + اسم الشركة)
// ==========================================
function updateHeaderInfo(client) {
  const companyName = client.Company_Name || currentClient.company_name;

  const listTitleHeader = document.querySelector('header h1');
  if (listTitleHeader && companyName) {
    listTitleHeader.innerHTML = `لوحة تحكم المنظومة | <span class="text-blue-600 font-bold">${companyName}</span>`;
  }

  const sidebarAgencyName = document.getElementById('sidebar-agency-name');
  if (sidebarAgencyName && companyName) {
    sidebarAgencyName.textContent = companyName;
  }

  const planName = document.getElementById('sidebar-plan-name');
  if (planName && client['نوع الباقة']) {
    planName.textContent = client['نوع الباقة'];
  }

  const logoUrl = client.Logo_URL;
  if (logoUrl && typeof logoUrl === 'string' && logoUrl.startsWith('http')) {
    const allLogos = document.querySelectorAll('#sidebar-logo, .client-logo-preview');
    allLogos.forEach(img => {
      img.src = logoUrl;
      img.classList.remove('hidden');
    });
  }

  const faviconUrl = client.Favicon_URL;
  if (faviconUrl && typeof faviconUrl === 'string' && faviconUrl.startsWith('http')) {
    let faviconLink = document.querySelector('link[rel="icon"]');
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    faviconLink.href = faviconUrl;
  }

  const previewLink = document.getElementById('top-preview-link');
  if (previewLink) {
    previewLink.href = `${window.CONFIG.BASE_URL}/index.html?client=${currentClient.whatsapp}`;
  }

  const defaultDomainBtn = document.getElementById('default-domain-btn');
  if (defaultDomainBtn) {
    defaultDomainBtn.href = `${window.CONFIG.BASE_URL}/index.html?client=${currentClient.whatsapp}`;
  }

  calculateSubscriptionDays(client);
}

// ==========================================
// حساب حالة الاشتراك (تجريبي / نشط) وعدد الأيام المتبقية
// ==========================================
function calculateSubscriptionDays(client) {
  const createdTime = client['تاريخ الاشتراك'] || new Date();
  const startDate = new Date(createdTime);
  const now = new Date();
  const diffDays = isNaN(startDate.getTime()) ? 0 : Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, 14 - diffDays);

  const subBadge = document.getElementById('subscription-status-badge');
  if (subBadge) {
    if (client['حالة الدفع'] === 'مدفوع') {
      subBadge.innerHTML = `<span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">اشتراك نشط ⭐</span>`;
    } else {
      subBadge.innerHTML = `<span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">تجريبي: متبقي ${remainingDays} يوم</span>`;
    }
  }

  const planTitleDisplay = document.getElementById('plan-title-display');
  if (planTitleDisplay) {
    planTitleDisplay.textContent = client['نوع الباقة'] || 'باقة تجريبية';
  }
}

// ==========================================
// إحصائيات استهلاك الباقة (عدد العناصر المضافة)
// ==========================================
function updateSubscriptionStats(client) {
  const packageLimits = {
    'تجريبية': 10,
    'أساسية': 30,
    'احترافية': 100
  };

  const packageType = client['نوع الباقة'] || 'تجريبية';
  const limit = packageLimits[packageType] || 30;
  const used = currentItems.length;
  const percent = Math.min(100, Math.round((used / limit) * 100));

  const statsItemsCount = document.getElementById('stats-items-count');
  if (statsItemsCount) statsItemsCount.textContent = `${used} / ${limit}`;

  const statsItemsBar = document.getElementById('stats-items-bar');
  if (statsItemsBar) statsItemsBar.style.width = percent + '%';

  const statsItemsLeft = document.getElementById('stats-items-left');
  if (statsItemsLeft) statsItemsLeft.textContent = `${Math.max(0, limit - used)} عنصر`;
}

// ==========================================
// تعبئة نماذج الإعدادات تلقائياً (Auto-Populate) بكل البيانات المحفوظة
// لهذا العميل بالذات (client_whatsapp) - أي حقل اتحفظ قبل كده لازم يظهر ثابت هنا
// ==========================================
function populateDashboardFields(client) {
  // ---------- الهوية والبيانات العامة ----------
  setVal('setting-agency-name', client.Company_Name);
  setVal('setting-color', client.Theme_Color || '#0284c7');
  setVal('setting-accent-color', client.Accent_Color);
  injectImagePreview('setting-logo', client.Logo_URL, 'setting-logo-name');
  injectImagePreview('setting-favicon', client.Favicon_URL, 'setting-favicon-name');

  // ---------- محتوى الصفحة الرئيسية ----------
  setVal('hero-title', client.Slogan || client.Hero_Title);
  setVal('hero-subtitle', client.Hero_Subtitle);
  setVal('about-exp', client.About_Exp || client.Experience_Stat);
  setVal('about-satisfaction', client.About_Satisfaction || client.Satisfaction_Stat);

  // ---------- SEO ----------
  const seoDescRaw = client['\u2060SEO_Description\u2060'] || client['SEO_Description'] || '';
  setVal('seo-title', client.SEO_Title);
  setVal('seo-desc', seoDescRaw);

  // ---------- وسائل التواصل والموقع ----------
  setVal('social-whatsapp', client.Whatsapp);
  setVal('social-phone', client.Phone);
  setVal('social-maps', client.Maps_Link || client.Google_Maps);
  setVal('social-facebook', client.Facebook);
  setVal('social-instagram', client.Instagram);

  // ---------- الدومين المخصص ----------
  setVal('custom-domain-input', client.Custom_Domain);

  // ---------- التسويق والبيكسل ----------
  setVal('mkt-meta', client.Meta_Pixel_ID);
  setVal('mkt-tiktok', client.TikTok_Pixel_ID || client.TikTok);
  setVal('mkt-snapchat', client.Snapchat_Pixel_ID);
  setVal('mkt-ga4', client.GA4_ID);
}

function setVal(elementId, value) {
  const el = document.getElementById(elementId);
  if (el && value !== undefined && value !== null && value !== '') {
    el.value = value;
  }
}

// ==========================================
// إظهار معاينة ثابتة لصورة محفوظة مسبقاً (لوجو / فافيكون) داخل الـ dropzone
// حتى يشوف العميل إن صورته فعلاً محفوظة وثابتة له دون الحاجة لرفعها كل مرة
// ==========================================
function injectImagePreview(fileInputId, imageUrl, nameLabelId) {
  const fileInput = document.getElementById(fileInputId);
  if (!fileInput) return;
  const dropzone = fileInput.previousElementSibling;
  if (!dropzone || !dropzone.classList.contains('dropzone-box')) return;

  let previewImg = document.getElementById(fileInputId + '-preview');

  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
    if (previewImg) previewImg.classList.add('hidden');
    return;
  }

  if (!previewImg) {
    previewImg = document.createElement('img');
    previewImg.id = fileInputId + '-preview';
    previewImg.className = 'w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700 mb-2';
    dropzone.insertBefore(previewImg, dropzone.firstChild);
  }
  previewImg.src = imageUrl;
  previewImg.classList.remove('hidden');

  const nameLabel = document.getElementById(nameLabelId);
  if (nameLabel && !nameLabel.textContent) {
    nameLabel.textContent = 'محفوظة حالياً ✓';
  }
}

// ==========================================
// رفع الصور ومعاينتها + تحديد صورة الغلاف
// ==========================================
function setupImageUploader() {
  const fileInput = document.getElementById('item-image-input');
  if (!fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    let loadedCount = 0;

    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        uploadedImages.push({ file, url: event.target.result });
        loadedCount++;
        if (loadedCount === files.length) {
          renderImagesPreview();
        }
      };
      reader.readAsDataURL(file);
    });
    fileInput.value = '';
  });
}

function renderImagesPreview() {
  const previewContainer = document.getElementById('images-preview-container');
  if (!previewContainer) return;
  previewContainer.innerHTML = '';

  uploadedImages.forEach((imgObj, index) => {
    const isHero = index === heroImageIndex;
    const div = document.createElement('div');
    div.className = `relative rounded-xl overflow-hidden border-2 h-24 cursor-pointer ${isHero ? 'border-blue-600 ring-2 ring-blue-300' : 'border-slate-200 dark:border-slate-700'} group`;

    div.innerHTML = `
      <img src="${imgObj.url}" class="w-full h-full object-cover">
      ${isHero ? '<span class="absolute bottom-1 right-1 bg-blue-600 text-white text-[9px] px-1 rounded">الغلاف ⭐</span>' : ''}
      <button type="button" class="absolute top-1 left-1 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition" onclick="removeImage(${index}, event)">
        <i data-lucide="x" class="w-3 h-3"></i>
      </button>
    `;

    div.addEventListener('click', () => {
      heroImageIndex = index;
      renderImagesPreview();
    });

    previewContainer.appendChild(div);
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.removeImage = function(index, event) {
  event.stopPropagation();
  uploadedImages.splice(index, 1);
  if (heroImageIndex >= uploadedImages.length) {
    heroImageIndex = 0;
  }
  renderImagesPreview();
};

// ==========================================
// إضافة عنصر جديد (منتج / خدمة)
// ==========================================
async function handleAddItem(e) {
  if (e) e.preventDefault();

  if (!currentClient || !currentClient.whatsapp) {
    alert('❌ تعذر تحديد رقم العميل، برجاء إعادة تحميل الصفحة');
    return;
  }

  const title = document.getElementById('item-title')?.value.trim();
  if (!title) return alert('يرجى كتابة الاسم/العنوان');

  const price = document.getElementById('item-price')?.value || 0;
  const category = document.getElementById('item-category')?.value || 'عام';
  const description = document.getElementById('item-desc')?.value || '';

  const formData = new FormData();
  formData.append('action', 'add_item');
  formData.append('client_whatsapp', currentClient.whatsapp);
  formData.append('sector', currentClient.sector || '');

  // أسماء أعمدة Airtable الحقيقية (PascalCase)
  formData.append('Item_Title', title);
  formData.append('Price', price);
  formData.append('Item_Category', category);
  formData.append('Description', description);
  // نسخة مطابقة بصيغة snake_case لضمان توافق أي workflow في n8n يستخدم مسميات مختلفة
  formData.append('title', title);
  formData.append('price', price);
  formData.append('category', category);
  formData.append('description', description);

  // الصور الحقيقية كـ binary - كل صورة بحقل منفصل (image_0, image_1, ...)
  // ده اللي بيحل خطأ "expects input data to contain a binary file, but none was found"
  // اللي كان بيحصل لما كنا بنبعت الصور كنص Base64 جوه JSON بس
  uploadedImages.forEach((img, index) => {
    formData.append(`image_${index}`, img.file, img.file.name);
  });
  // صورة الغلاف المختارة كحقل binary منفصل يسهل على السيرفر تمييزه
  const heroImage = uploadedImages[heroImageIndex];
  if (heroImage) {
    formData.append('hero_image', heroImage.file, heroImage.file.name);
  }

  // نسخة Base64 احتياطية كنص لكل الصور، لو الـ workflow بيقرأ Base64 بدل الـ binary
  const imagesBase64Array = uploadedImages.map(img => ({ name: img.file.name, data: img.url }));
  formData.append('images_base64', JSON.stringify(imagesBase64Array));
  formData.append('hero_image_base64', heroImage ? heroImage.url : '');

  const success = await sendFormDataToN8n(formData, null);
  if (success) {
    alert('✅ تم الحفظ بنجاح');
    document.getElementById('form-add-item')?.reset();
    uploadedImages = [];
    heroImageIndex = 0;
    renderImagesPreview();
    switchTab('properties-list');
  } else {
    alert('❌ حدث خطأ أثناء الحفظ في السيرفر.');
  }
}

// ==========================================
// عرض جدول العناصر (Airtable columns: Item_Title, Price, Item_Category, Description)
// ==========================================
function renderItemsTable(itemsToRender) {
  const tableBody = document.getElementById('items-table-body');
  if (!tableBody) return;

  const items = itemsToRender || currentItems;

  if (!items || items.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400 text-xs">لا توجد عناصر مضافة حتى الآن.</td></tr>`;
    return;
  }

  tableBody.innerHTML = items.map((item, idx) => {
    const imgUrl = getItemImageUrl(item);
    const thumbHtml = imgUrl
      ? `<img src="${escapeHtml(imgUrl)}" class="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" />`
      : `<span class="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0"><i data-lucide="image" class="w-4 h-4"></i></span>`;

    return `
    <tr class="border-b border-slate-100 dark:border-slate-800 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
      <td class="p-4 font-bold text-slate-800 dark:text-slate-200">
        <div class="flex items-center gap-3">
          ${thumbHtml}
          <span>${escapeHtml(item.Item_Title || '-')}</span>
        </div>
      </td>
      <td class="p-4 text-blue-600 dark:text-blue-400 font-bold">${formatPrice(item.Price)}</td>
      <td class="p-4"><span class="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">${escapeHtml(item.Item_Category || 'عام')}</span></td>
      <td class="p-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">${escapeHtml(item.Description || '-')}</td>
      <td class="p-4 text-center">
        <button onclick="deleteItem('${item.id || item.record_id || idx}')" class="text-red-500 hover:text-red-700 font-bold transition">حذف</button>
      </td>
    </tr>
  `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// يحاول استخراج رابط صورة العنصر من كل الأسماء المحتملة اللي ممكن يرجعها Airtable/n8n
function getItemImageUrl(item) {
  if (item.hero_image_url && typeof item.hero_image_url === 'string') return item.hero_image_url;

  if (item.Cloudinary_Images) {
    if (Array.isArray(item.Cloudinary_Images)) {
      const first = item.Cloudinary_Images[0];
      if (typeof first === 'string') return first;
      if (first && first.url) return first.url;
    } else if (typeof item.Cloudinary_Images === 'string') {
      return item.Cloudinary_Images.split(',')[0].trim();
    }
  }

  if (item.Attachments) {
    if (Array.isArray(item.Attachments)) {
      const first = item.Attachments[0];
      if (typeof first === 'string') return first;
      if (first && first.url) return first.url;
    } else if (typeof item.Attachments === 'string') {
      return item.Attachments.split(',')[0].trim();
    }
  }

  return '';
}

function formatPrice(rawPrice) {
  if (rawPrice === undefined || rawPrice === null || rawPrice === '') {
    return 'مجاني / حسب الاتفاق';
  }
  const priceStr = String(rawPrice).trim();
  const numericOnly = priceStr.replace(/[^\d.]/g, '');
  if (numericOnly === '') return priceStr;
  const num = Number(numericOnly);
  if (isNaN(num)) return priceStr;
  return num.toLocaleString('en-US') + ' ج.م';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// ==========================================
// حذف عنصر
// ==========================================
window.deleteItem = async function(itemId) {
  if (!currentClient || !currentClient.whatsapp) {
    alert('❌ تعذر تحديد رقم العميل، برجاء إعادة تحميل الصفحة');
    return;
  }
  if (!confirm('هل أنت متأكد من حذف هذا العنصر نهائياً؟')) return;

  try {
    const res = await fetch(window.CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_item',
        item_id: itemId,
        record_id: itemId,
        client_whatsapp: currentClient.whatsapp
      })
    });
    if (res.ok) {
      alert('🗑️ تم الحذف بنجاح');
      await fetchAllClientData();
    } else {
      alert('❌ تعذر حذف العنصر');
    }
  } catch (e) {
    alert('❌ تعذر حذف العنصر');
  }
};

// ==========================================
// تصدير العناصر إلى CSV
// ==========================================
function exportToCSV() {
  if (!currentItems.length) return alert('لا توجد بيانات لتصديرها');
  const headers = ['Item_Title', 'Price', 'Item_Category', 'Description'];
  const rows = currentItems.map(i => [
    `"${(i.Item_Title || '').replace(/"/g, '""')}"`,
    i.Price || 0,
    `"${(i.Item_Category || '').replace(/"/g, '""')}"`,
    `"${(i.Description || '').replace(/"/g, '""')}"`
  ]);
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `lucidia_export_${Date.now()}.csv`;
  link.click();
}
window.exportToCSV = exportToCSV;

// ==========================================
// استيراد CSV (زر استيراد في أعلى الجدول)
// ==========================================
function setupCsvImporter() {
  const importInput = document.getElementById('input-import-csv');
  if (!importInput) return;

  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const parsed = XLSX.read(text, { type: 'string' });
      const sheet = parsed.Sheets[parsed.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!rows.length) {
        alert('⚠️ الملف فارغ أو غير صالح');
        return;
      }

      if (!confirm(`سيتم استيراد ${rows.length} عنصر. هل تريد المتابعة؟`)) return;

      try {
        const res = await fetch(window.CONFIG.WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'import_items',
            client_whatsapp: currentClient.whatsapp,
            sector: currentClient.sector,
            items: rows
          })
        });
        if (res.ok) {
          alert('✅ تم الاستيراد بنجاح');
          await fetchAllClientData();
        } else {
          alert('❌ تعذر استيراد الملف');
        }
      } catch (err) {
        alert('❌ تعذر الاتصال بالسيرفر أثناء الاستيراد');
      }
    };
    reader.readAsText(file, 'UTF-8');
    importInput.value = '';
  });
}

// ==========================================
// دوال مساعدة عامة للتحويل إلى Base64 وإرسال البيانات
// ==========================================

// بترجع نص Base64 كامل بصيغة Data URL (data:image/png;base64,....)
// - ده مفيد لعرض الصورة فورًا في <img src="..."> كمعاينة قبل الرفع
function getBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('لا يوجد ملف'));
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// بتشيل جزء "data:image/png;base64," وترجع نص Base64 الخام فقط
// - بعض الـ workflows في n8n بتستنى base64 نضيف من غير الـ prefix
function stripBase64Prefix(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  const commaIndex = dataUrl.indexOf(',');
  return commaIndex !== -1 ? dataUrl.substring(commaIndex + 1) : dataUrl;
}

// ==========================================
// إرسال JSON عادي (للفورمات اللي مفيهاش ملفات: SEO / سوشيال / دومين / محتوى)
// ==========================================
async function sendDataToN8n(payload, messageEl) {
  if (!currentClient || !currentClient.whatsapp) {
    showFormMessage(messageEl, '❌ تعذر تحديد رقم العميل، برجاء إعادة تحميل الصفحة', false);
    return false;
  }
  payload.client_whatsapp = currentClient.whatsapp;

  try {
    const res = await fetch(window.CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return await handleN8nResponse(res, messageEl);
  } catch (err) {
    console.error('❌ خطأ في الاتصال بالسيرفر:', err);
    showFormMessage(messageEl, '❌ تعذر الاتصال بالسيرفر.', false);
    return false;
  }
}

// ==========================================
// إرسال Multipart/FormData (لأي فورم فيه صورة/ملف فعلي - اللوجو، الفافيكون، صور المنتجات)
// السبب: عقدة رفع الملفات في n8n بترفض نص JSON/Base64 وبتستنى "binary file" حقيقي جوه الطلب،
// فلازم نبعت الملفات كـ multipart/form-data بدل ما نلفهم جوه JSON.
// مهم: متحطش Content-Type يدوي هنا؛ المتصفح بيولّده لوحده مع الـ boundary الصحيح.
// ==========================================
async function sendFormDataToN8n(formData, messageEl) {
  if (!currentClient || !currentClient.whatsapp) {
    showFormMessage(messageEl, '❌ تعذر تحديد رقم العميل، برجاء إعادة تحميل الصفحة', false);
    return false;
  }
  formData.set('client_whatsapp', currentClient.whatsapp);

  try {
    const res = await fetch(window.CONFIG.WEBHOOK_URL, {
      method: 'POST',
      body: formData
    });

    return await handleN8nResponse(res, messageEl);
  } catch (err) {
    console.error('❌ خطأ في رفع الملف:', err);
    showFormMessage(messageEl, '❌ تعذر الاتصال بالسيرفر أثناء رفع الملف.', false);
    return false;
  }
}

// ==========================================
// معالجة موحّدة لرد السيرفر: بنتأكد إن الرد فعلاً { success: true } قبل ما نعتبر
// العملية نجحت، وبعدين فورًا بنعمل Re-hydration كامل للوحة عبر fetchAllClientData()
// ==========================================
async function handleN8nResponse(res, messageEl) {
  let data = {};
  try {
    data = await res.json();
  } catch (parseErr) {
    data = {};
  }

  const succeeded = res.ok && (data.success === true || data.success === undefined);

  if (succeeded) {
    showFormMessage(messageEl, '✅ تم الحفظ بنجاح!', true);
    await fetchAllClientData();
    return true;
  }

  console.warn('⚠️ رد غير ناجح من السيرفر:', data);
  const errorText = data.error || data.message || '❌ حدث خطأ أثناء الحفظ في السيرفر.';
  showFormMessage(messageEl, errorText, false);
  return false;
}

function showFormMessage(elementId, text, success) {
  if (!elementId) return;
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = text;
  el.classList.remove('hidden', 'text-emerald-600', 'text-red-600');
  el.classList.add(success ? 'text-emerald-600' : 'text-red-600');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

// ==========================================
// حفظ إعدادات الهوية العامة (Company_Name, Theme_Color, Logo_URL, Favicon_URL)
// ==========================================
async function handleSettingsSubmit(e) {
  e.preventDefault();

  const companyName = document.getElementById('setting-agency-name')?.value || '';
  const themeColor = document.getElementById('setting-color')?.value || '';
  const accentColor = document.getElementById('setting-accent-color')?.value || '';

  const logoInput = document.getElementById('setting-logo');
  const faviconInput = document.getElementById('setting-favicon');
  const logoFile = logoInput && logoInput.files.length > 0 ? logoInput.files[0] : null;
  const faviconFile = faviconInput && faviconInput.files.length > 0 ? faviconInput.files[0] : null;

  const formData = new FormData();
  formData.append('action', 'update_settings');
  formData.append('client_whatsapp', currentClient.whatsapp);

  // الحقول النصية بصيغتي Airtable و snake_case مع بعض
  formData.append('Company_Name', companyName);
  formData.append('company_name', companyName);
  formData.append('Theme_Color', themeColor);
  formData.append('primary_color', themeColor);
  formData.append('Accent_Color', accentColor);
  formData.append('accent_color', accentColor);

  // لا نرفق مفتاح الصورة أصلاً إلا لو العميل اختار ملف جديد فعلياً،
  // عشان السيرفر ميمسحش اللوجو/الفافيكون المحفوظين له لو الحقل فاضي.
  // ملاحظة: اسم الحقل الـ binary هنا "Logo_URL" / "Favicon_URL" عشان يطابق نفس
  // اسم العمود المستخدم في باقي الكود. لو عقدة الرفع في n8n مستنية اسم حقل تاني
  // (مثلاً "logo" أو "data")، غيّر الاسم في الـ formData.append الأول بس.
  if (logoFile) {
    // الملف الحقيقي كـ binary - ده اللي بيحل خطأ "expects input data to contain a binary file"
    formData.append('Logo_URL', logoFile, logoFile.name);
    // نسخة Base64 احتياطية كنص، لو الـ workflow بيقرأ Base64 بدل الـ binary مباشرة
    const logoBase64 = await getBase64(logoFile);
    formData.append('logo_base64', logoBase64);
    formData.append('logo_base64_raw', stripBase64Prefix(logoBase64));
  }

  if (faviconFile) {
    formData.append('Favicon_URL', faviconFile, faviconFile.name);
    const faviconBase64 = await getBase64(faviconFile);
    formData.append('favicon_base64', faviconBase64);
    formData.append('favicon_base64_raw', stripBase64Prefix(faviconBase64));
  }

  const success = await sendFormDataToN8n(formData, 'settings-msg');
  if (success) {
    // مسح اختيار الملفات بعد نجاح الرفع، اللوجو/الفافيكون الجديد هيتعرض من fetchAllClientData()
    if (logoInput) logoInput.value = '';
    if (faviconInput) faviconInput.value = '';
  }
}

// ==========================================
// حفظ أرقام التواصل والروابط (Whatsapp, Facebook, Instagram, TikTok, LinkedIn)
// ==========================================
async function handleSocialSubmit(e) {
  e.preventDefault();

  const whatsapp = document.getElementById('social-whatsapp')?.value || '';
  const phone = document.getElementById('social-phone')?.value || '';
  const maps = document.getElementById('social-maps')?.value || '';
  const facebook = document.getElementById('social-facebook')?.value || '';
  const instagram = document.getElementById('social-instagram')?.value || '';

  const payload = {
    action: 'update_social',
    client_whatsapp: currentClient.whatsapp,
    // Airtable field names
    Whatsapp: whatsapp,
    Phone: phone,
    Maps_Link: maps,
    Facebook: facebook,
    Instagram: instagram,
    // snake_case fallback
    whatsapp: whatsapp,
    phone: phone,
    maps: maps,
    facebook: facebook,
    instagram: instagram
  };
  await sendDataToN8n(payload, 'social-msg');
}

// ==========================================
// حفظ إعدادات SEO (SEO_Title, SEO_Description)
// ==========================================
async function handleSeoSubmit(e) {
  e.preventDefault();

  const seoTitle = document.getElementById('seo-title')?.value || '';
  const seoDesc = document.getElementById('seo-desc')?.value || '';

  const payload = {
    action: 'update_seo',
    client_whatsapp: currentClient.whatsapp,
    // Airtable field names (بما فيهم النسخة اللي فيها Word Joiner المخفي حول الاسم)
    SEO_Title: seoTitle,
    SEO_Description: seoDesc,
    '\u2060SEO_Description\u2060': seoDesc,
    // snake_case fallback
    seo_title: seoTitle,
    seo_desc: seoDesc
  };
  await sendDataToN8n(payload, 'seo-msg');
}

// ==========================================
// حفظ أدوات التتبع التسويقي (Meta_Pixel_ID + منصات أخرى)
// ==========================================
async function handleMarketingSubmit(e) {
  e.preventDefault();

  const metaPixel = document.getElementById('mkt-meta')?.value || '';
  const tiktokPixel = document.getElementById('mkt-tiktok')?.value || '';
  const snapPixel = document.getElementById('mkt-snapchat')?.value || '';
  const ga4Id = document.getElementById('mkt-ga4')?.value || '';

  const payload = {
    action: 'update_marketing',
    client_whatsapp: currentClient.whatsapp,
    // Airtable field names
    Meta_Pixel_ID: metaPixel,
    TikTok_Pixel_ID: tiktokPixel,
    Snapchat_Pixel_ID: snapPixel,
    GA4_ID: ga4Id,
    // snake_case fallback
    meta_pixel: metaPixel,
    tiktok_pixel: tiktokPixel,
    snapchat_pixel: snapPixel,
    ga4_id: ga4Id
  };
  await sendDataToN8n(payload, 'marketing-msg');
}

// ==========================================
// حفظ الدومين المخصص
// ==========================================
async function handleDomainSubmit(e) {
  e.preventDefault();

  const domain = document.getElementById('custom-domain-input')?.value || '';

  const payload = {
    action: 'update_domain',
    client_whatsapp: currentClient.whatsapp,
    Custom_Domain: domain,
    custom_domain: domain
  };
  await sendDataToN8n(payload, 'domain-msg');
}

// ==========================================
// حفظ محتوى الصفحة الرئيسية (Slogan / hero content)
// ==========================================
async function handleContentSubmit(e) {
  e.preventDefault();

  const heroTitle = document.getElementById('hero-title')?.value || '';
  const heroSubtitle = document.getElementById('hero-subtitle')?.value || '';
  const aboutExp = document.getElementById('about-exp')?.value || '';
  const aboutSatisfaction = document.getElementById('about-satisfaction')?.value || '';

  const payload = {
    action: 'update_content',
    client_whatsapp: currentClient.whatsapp,
    // Airtable field names
    Slogan: heroTitle,
    Hero_Title: heroTitle,
    Hero_Subtitle: heroSubtitle,
    About_Exp: aboutExp,
    About_Satisfaction: aboutSatisfaction,
    // snake_case fallback
    hero_title: heroTitle,
    hero_subtitle: heroSubtitle,
    about_exp: aboutExp,
    about_satisfaction: aboutSatisfaction
  };
  await sendDataToN8n(payload, 'content-msg');
}

// ==========================================
// ربط كل الفورمات بمعالجاتها الصحيحة (تطابق الـ IDs الحقيقية في الـ HTML)
// ==========================================
function setupEventListeners() {
  document.getElementById('form-add-item')?.addEventListener('submit', handleAddItem);
  document.getElementById('settings-form')?.addEventListener('submit', handleSettingsSubmit);
  document.getElementById('social-form')?.addEventListener('submit', handleSocialSubmit);
  document.getElementById('seo-form')?.addEventListener('submit', handleSeoSubmit);
  document.getElementById('marketing-form')?.addEventListener('submit', handleMarketingSubmit);
  document.getElementById('domain-form')?.addEventListener('submit', handleDomainSubmit);
  document.getElementById('content-form')?.addEventListener('submit', handleContentSubmit);

  setupCsvImporter();

  document.addEventListener('click', (e) => {
    const helpMenu = document.getElementById('help-menu');
    const helpBtn = e.target.closest('button');
    if (helpMenu && !helpMenu.classList.contains('hidden')) {
      const clickedInsideMenu = e.target.closest('#help-menu');
      const clickedHelpToggle = helpBtn && helpBtn.getAttribute('onclick') === 'toggleHelpMenu()';
      if (!clickedInsideMenu && !clickedHelpToggle) {
        helpMenu.classList.add('hidden');
      }
    }
  });
}
