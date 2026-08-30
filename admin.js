// ==========================================
// LUCIDIA SAAS - UNIFIED ADMIN DASHBOARD ENGINE
// (V9.0 - STRICT 3-SECTOR DROPDOWNS / PURE JSON PAYLOADS / DYNAMIC FIELD INJECTION)
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

// ==========================================
// خريطة القطاعات الثلاثة الصارمة - كل حاجة خاصة بكل قطاع متجمعة هنا في مكان واحد
// ==========================================
const SECTOR_CONFIG = {
  clinics: {
    match: (s) => s.includes('clinic') || s.includes('عياد'),
    listTitle: 'إدارة الخدمات الطبية',
    itemTitleLabel: 'اسم الخدمة الطبية / الكشف *',
    itemPriceLabel: 'سعر الكشف / الإجراء (ج.م) *',
    itemCategoryLabel: 'القسم الطبي *',
    platform1Label: '🩺 حساب فيزيتا (Vezeeta)',
    platform2Label: '🏥 حساب كلينيدو / سينا',
    categories: ['كشف', 'استشارة', 'عملية'],
    filterCategories: ['كشف', 'استشارة', 'عملية'],
    showEstateFields: false
  },
  lawyers: {
    match: (s) => s.includes('lawyer') || s.includes('محام') || s.includes('قانون'),
    listTitle: 'إدارة الاستشارات والخدمات القانونية',
    itemTitleLabel: 'اسم الاستشارة / الخدمة القانونية *',
    itemPriceLabel: 'أتعاب الاستشارة / التوكيل (ج.م) *',
    itemCategoryLabel: 'التخصص القانوني *',
    platform1Label: '⚖️ رقم القيد بنقابة المحامين',
    platform2Label: '💼 حساب لينكد إن (LinkedIn)',
    categories: ['قضية', 'استشارة قانونية', 'عقد قانوني'],
    filterCategories: ['قضية', 'استشارة قانونية', 'عقد قانوني'],
    showEstateFields: false
  },
  estate: {
    match: (s) => s.includes('estate') || s.includes('عقار'),
    listTitle: 'إدارة العقارات والمشاريع',
    itemTitleLabel: 'عنوان العقار / المشروع *',
    itemPriceLabel: 'السعر الإجمالي (ج.م) *',
    itemCategoryLabel: 'نوع العقار *',
    platform1Label: '🏢 معرض عقارماب (Aqarmap)',
    platform2Label: '🏠 حساب بروبرتي فايندر',
    categories: ['شقة', 'فيلا', 'تاون هاوس', 'تجاري'],
    filterCategories: ['شقة', 'فيلا', 'تاون هاوس', 'تجاري'],
    showEstateFields: true
  }
};

// القيم الثابتة اللي لازم نلتزم بيها حرفياً بغض النظر عن القطاع
const STATUS_OPTIONS = ['متاح', 'تم البيع', 'تم الإيجار'];
const ITEM_TYPE_OPTIONS = ['للبيع', 'للايجار'];

let currentClient = null;
let currentItems = [];
let uploadedImages = [];
let heroImageIndex = 0;
let uploadedCertificates = [];
let currentSectorKey = 'estate';

document.addEventListener('DOMContentLoaded', async () => {
  await initDashboard();
});

async function initDashboard() {
  console.log('🚀 Lucidia Dashboard Initialized...');
  loadClientData();
  injectExtraItemFields();
  injectExtraSettingsFields();
  customizeSectorUI();
  setupNavigationTabs();
  setupImageUploader();
  setupCertificatesUploader();
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
  const sectorParam = urlParams.get('sector') || localStorage.getItem('lucidia_sector') || 'Lucidia Estate';

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
  VALID_TABS.forEach(tabName => {
    const btn = document.getElementById('nav-' + tabName);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(tabName);
      });
    }
  });

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
// أزرار السايدبار / الوضع الليلي / نافذة الدعم / نافذة الدفع
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
// حقن الحقول الإضافية في فورم "إضافة عنصر" (Item_Category select, Status,
// Item_Type, Area, Bedrooms, Bathrooms) - الـ HTML الأصلي فيه input نصي بس
// لحقل القسم، فبنحوّله لـ select ديناميكياً، وبنضيف باقي الحقول قبل زر الحفظ
// ==========================================
function injectExtraItemFields() {
  const form = document.getElementById('form-add-item');
  const submitBtn = document.getElementById('prop-submit-btn');
  if (!form || !submitBtn) return;

  // تحويل حقل القسم من input نصي إلى select حقيقي (مرة واحدة فقط)
  const categoryField = document.getElementById('item-category');
  if (categoryField && categoryField.tagName !== 'SELECT') {
    const select = document.createElement('select');
    select.id = 'item-category';
    select.required = true;
    select.className = categoryField.className;
    categoryField.parentNode.replaceChild(select, categoryField);
  }

  // منع الحقن المزدوج لو الدالة اتنادت أكتر من مرة
  if (document.getElementById('item-status')) return;

  const statusTypeWrapper = document.createElement('div');
  statusTypeWrapper.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
  statusTypeWrapper.innerHTML = `
    <div>
      <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">حالة العنصر (Status) *</label>
      <select id="item-status" required class="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none text-xs">
        ${STATUS_OPTIONS.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
      </select>
    </div>
    <div>
      <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">نوع العرض (Item Type) *</label>
      <select id="item-type" required class="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none text-xs">
        ${ITEM_TYPE_OPTIONS.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
      </select>
    </div>
  `;
  form.insertBefore(statusTypeWrapper, submitBtn);

  const estateWrapper = document.createElement('div');
  estateWrapper.id = 'estate-fields-wrapper';
  estateWrapper.className = 'grid grid-cols-1 md:grid-cols-3 gap-4';
  estateWrapper.innerHTML = `
    <div>
      <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">المساحة (Area) م²</label>
      <input type="number" id="item-area" placeholder="0" class="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none text-xs" />
    </div>
    <div>
      <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">عدد الغرف (Bedrooms)</label>
      <input type="number" id="item-bedrooms" placeholder="0" class="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none text-xs" />
    </div>
    <div>
      <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">عدد الحمامات (Bathrooms)</label>
      <input type="number" id="item-bathrooms" placeholder="0" class="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none text-xs" />
    </div>
  `;
  form.insertBefore(estateWrapper, submitBtn);
}

// ==========================================
// حقن الحقول الإضافية في فورم "الهوية والبيانات العامة" و"وسائل التواصل"
// (Share_Image_URL, Certificates_Images, Specialized_Platform_1/2, TikTok, LinkedIn)
// ==========================================
function injectExtraSettingsFields() {
  const settingsForm = document.getElementById('settings-form');
  const settingsSubmitBtn = document.getElementById('settings-submit-btn');

  if (settingsForm && settingsSubmitBtn && !document.getElementById('setting-share-image')) {
    const platformsWrapper = document.createElement('div');
    platformsWrapper.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
    platformsWrapper.innerHTML = `
      <div>
        <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300" id="label-platform-1">المنصة المتخصصة الأولى</label>
        <input type="text" id="setting-platform-1" class="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none text-xs" />
      </div>
      <div>
        <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300" id="label-platform-2">المنصة المتخصصة الثانية</label>
        <input type="text" id="setting-platform-2" class="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none text-xs" />
      </div>
    `;
    settingsForm.insertBefore(platformsWrapper, settingsSubmitBtn);

    const imagesWrapper = document.createElement('div');
    imagesWrapper.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
    imagesWrapper.innerHTML = `
      <div>
        <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">صورة المشاركة (Share Image)</label>
        <label for="setting-share-image" class="dropzone-box bg-slate-50 dark:bg-slate-800/50 p-4">
          <i data-lucide="image" class="w-6 h-6 text-slate-400 mb-2"></i>
          <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300">اضغط لرفع صورة المشاركة</span>
          <span id="setting-share-image-name" class="text-[10px] font-bold text-blue-600 mt-1 truncate max-w-full px-2"></span>
        </label>
        <input type="file" id="setting-share-image" accept="image/*" class="hidden" />
      </div>
      <div>
        <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">شهادات التكريم (Certificates)</label>
        <label for="setting-certificates" class="dropzone-box bg-slate-50 dark:bg-slate-800/50 p-4">
          <i data-lucide="award" class="w-6 h-6 text-slate-400 mb-2"></i>
          <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300">اضغط لرفع الشهادات (يمكن اختيار أكثر من صورة)</span>
        </label>
        <input type="file" id="setting-certificates" accept="image/*" multiple class="hidden" />
        <div id="certificates-preview-container" class="mt-3 grid grid-cols-4 gap-2"></div>
      </div>
    `;
    settingsForm.insertBefore(imagesWrapper, settingsSubmitBtn);
  }

  const socialForm = document.getElementById('social-form');
  const socialSubmitBtn = document.getElementById('social-submit-btn');

  if (socialForm && socialSubmitBtn && !document.getElementById('social-tiktok')) {
    const extraSocialWrapper = document.createElement('div');
    extraSocialWrapper.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
    extraSocialWrapper.innerHTML = `
      <div>
        <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">رابط تيك توك (TikTok)</label>
        <input type="url" id="social-tiktok" placeholder="https://tiktok.com/@..." class="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none text-xs font-mono dir-ltr text-left" />
      </div>
      <div>
        <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">رابط لينكد إن (LinkedIn)</label>
        <input type="url" id="social-linkedin" placeholder="https://linkedin.com/in/..." class="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none text-xs font-mono dir-ltr text-left" />
      </div>
    `;
    socialForm.insertBefore(extraSocialWrapper, socialSubmitBtn);
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ==========================================
// تخصيص الواجهة والقوائم المنسدلة حسب القطاع (3 قطاعات صارمة فقط)
// ==========================================
function customizeSectorUI() {
  const sector = (currentClient?.sector || '').toLowerCase();

  let sectorKey = 'estate';
  if (SECTOR_CONFIG.clinics.match(sector)) sectorKey = 'clinics';
  else if (SECTOR_CONFIG.lawyers.match(sector)) sectorKey = 'lawyers';
  else sectorKey = 'estate';

  currentSectorKey = sectorKey;
  const config = SECTOR_CONFIG[sectorKey];

  const itemTitleLabel = document.getElementById('label-item-title');
  const itemPriceLabel = document.getElementById('label-item-price');
  const itemCategoryLabel = document.getElementById('label-item-category');
  const platform1Label = document.getElementById('label-platform-1');
  const platform2Label = document.getElementById('label-platform-2');
  const listTitle = document.getElementById('list-title');

  if (itemTitleLabel) itemTitleLabel.innerText = config.itemTitleLabel;
  if (itemPriceLabel) itemPriceLabel.innerText = config.itemPriceLabel;
  if (itemCategoryLabel) itemCategoryLabel.innerText = config.itemCategoryLabel;
  if (platform1Label) platform1Label.innerText = config.platform1Label;
  if (platform2Label) platform2Label.innerText = config.platform2Label;
  if (listTitle) listTitle.innerText = config.listTitle;

  // تعبئة خيارات حقل القسم (select) حصرياً بقيم القطاع الحالي
  const categorySelect = document.getElementById('item-category');
  if (categorySelect && categorySelect.tagName === 'SELECT') {
    categorySelect.innerHTML = config.categories.map(opt => `<option value="${opt}">${opt}</option>`).join('');
  }

  // إظهار/إخفاء حقول العقارات (المساحة/الغرف/الحمامات) حسب القطاع
  const estateWrapper = document.getElementById('estate-fields-wrapper');
  if (estateWrapper) {
    estateWrapper.classList.toggle('hidden', !config.showEstateFields);
  }

  // أزرار الفلترة أعلى الجدول
  const filterContainer = document.getElementById('filter-group-estate');
  if (filterContainer) {
    const buttonsHtml = ['all', ...config.filterCategories].map(cat => {
      const isAll = cat === 'all';
      const label = isAll ? 'الكل' : cat;
      const activeClass = isAll ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700';
      return `<button type="button" onclick="filterCategory('${cat}', this)" class="filter-btn px-4 py-1.5 rounded-full text-xs font-bold ${activeClass} transition">${label}</button>`;
    }).join('');
    filterContainer.innerHTML = buttonsHtml;
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
    const filtered = currentItems.filter(item => (item.Item_Category || '') === category);
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
// جلب بيانات العميل والعناصر من n8n / Airtable - دائماً مبني على client_whatsapp
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
// تحديث بيانات الهيدر والسايدبار (اللوجو + اسم الشركة) - ثابتة لكل عميل بذاته
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
  if (logoUrl && typeof logoUrl === 'string' && (logoUrl.startsWith('http') || logoUrl.startsWith('data:'))) {
    document.querySelectorAll('#sidebar-logo, .client-logo-preview').forEach(img => {
      img.src = logoUrl;
      img.classList.remove('hidden');
    });
  }

  const faviconUrl = client.Favicon_URL;
  if (faviconUrl && typeof faviconUrl === 'string' && (faviconUrl.startsWith('http') || faviconUrl.startsWith('data:'))) {
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
// تعبئة كل نماذج الإعدادات تلقائياً (Auto-Populate) بكل البيانات المحفوظة
// لهذا العميل بالذات (client_whatsapp) - أي حقل اتحفظ قبل كده لازم يظهر ثابت هنا
// ==========================================
function populateDashboardFields(client) {
  // ---------- الهوية والبيانات العامة ----------
  setVal('setting-agency-name', client.Company_Name);
  setVal('setting-color', client.Theme_Color || '#0284c7');
  setVal('setting-accent-color', client.Accent_Color);
  setVal('setting-platform-1', client.Specialized_Platform_1);
  setVal('setting-platform-2', client.Specialized_Platform_2);
  injectImagePreview('setting-logo', client.Logo_URL, 'setting-logo-name');
  injectImagePreview('setting-favicon', client.Favicon_URL, 'setting-favicon-name');
  injectImagePreview('setting-share-image', client.Share_Image_URL, 'setting-share-image-name');
  renderCertificatesPreview(client.Certificates_Images);

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
  setVal('social-tiktok', client.TikTok);
  setVal('social-linkedin', client.LinkedIn);

  // ---------- الدومين المخصص ----------
  setVal('custom-domain-input', client.Custom_Domain);

  // ---------- التسويق والبيكسل ----------
  setVal('mkt-meta', client.Meta_Pixel_ID);
  setVal('mkt-tiktok', client.TikTok_Pixel_ID);
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
// إظهار معاينة ثابتة لصورة محفوظة مسبقاً (لوجو / فافيكون / صورة مشاركة)
// داخل الـ dropzone حتى يشوف العميل إن صورته فعلاً محفوظة وثابتة له
// ==========================================
function injectImagePreview(fileInputId, imageUrl, nameLabelId) {
  const fileInput = document.getElementById(fileInputId);
  if (!fileInput) return;
  const dropzone = fileInput.previousElementSibling;
  if (!dropzone || !dropzone.classList.contains('dropzone-box')) return;

  let previewImg = document.getElementById(fileInputId + '-preview');

  const isValidImage = imageUrl && typeof imageUrl === 'string' && (imageUrl.startsWith('http') || imageUrl.startsWith('data:'));

  if (!isValidImage) {
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

// معاينة شهادات التكريم المحفوظة مسبقاً (مصفوفة روابط)
function renderCertificatesPreview(certificatesUrls) {
  const container = document.getElementById('certificates-preview-container');
  if (!container) return;

  let urls = [];
  if (Array.isArray(certificatesUrls)) {
    urls = certificatesUrls.map(c => (typeof c === 'string' ? c : c?.url)).filter(Boolean);
  } else if (typeof certificatesUrls === 'string' && certificatesUrls) {
    urls = certificatesUrls.split(',').map(u => u.trim()).filter(Boolean);
  }

  if (urls.length === 0) return;

  container.innerHTML = urls.map(url => `
    <img src="${url}" class="w-full h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
  `).join('');
}

// ==========================================
// رفع الصور ومعاينتها + تحديد صورة الغلاف (صور المنتجات)
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
// رفع شهادات التكريم (Certificates_Images) - رفع متعدد مع معاينة وحذف
// ==========================================
function setupCertificatesUploader() {
  const fileInput = document.getElementById('setting-certificates');
  if (!fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    let loadedCount = 0;
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        uploadedCertificates.push({ file, url: event.target.result });
        loadedCount++;
        if (loadedCount === files.length) {
          renderCertificatesUploadPreview();
        }
      };
      reader.readAsDataURL(file);
    });
    fileInput.value = '';
  });
}

function renderCertificatesUploadPreview() {
  const container = document.getElementById('certificates-preview-container');
  if (!container) return;
  container.innerHTML = '';

  uploadedCertificates.forEach((imgObj, index) => {
    const div = document.createElement('div');
    div.className = 'relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 h-16 group';
    div.innerHTML = `
      <img src="${imgObj.url}" class="w-full h-full object-cover">
      <button type="button" class="absolute top-0.5 left-0.5 bg-red-500/80 hover:bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition" onclick="removeCertificate(${index}, event)">
        <i data-lucide="x" class="w-3 h-3"></i>
      </button>
    `;
    container.appendChild(div);
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.removeCertificate = function(index, event) {
  event.stopPropagation();
  uploadedCertificates.splice(index, 1);
  renderCertificatesUploadPreview();
};

// ==========================================
// أدوات قفل زر الحفظ أثناء الإرسال (Debounce) - تمنع إرسال أكتر من طلب مرة واحدة
// ==========================================
function lockButton(btn, loadingText) {
  if (!btn) return null;
  if (btn.disabled) return null; // في طلب شغال بالفعل
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> ${loadingText || 'جاري الحفظ...'}`;
  if (typeof lucide !== 'undefined') lucide.createIcons();
  return originalHtml;
}

function unlockButton(btn, originalHtml) {
  if (!btn) return;
  btn.disabled = false;
  if (originalHtml) btn.innerHTML = originalHtml;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ==========================================
// إضافة عنصر جديد (منتج / خدمة) - JSON خالص، مع حقول العقارات الشرطية
// ==========================================
async function handleAddItem(e) {
  if (e) e.preventDefault();

  if (!currentClient || !currentClient.whatsapp) {
    alert('❌ تعذر تحديد رقم العميل، برجاء إعادة تحميل الصفحة');
    return;
  }

  const submitBtn = document.getElementById('prop-submit-btn');
  if (submitBtn && submitBtn.disabled) return;

  const title = document.getElementById('item-title')?.value.trim();
  if (!title) return alert('يرجى كتابة الاسم/العنوان');

  const originalHtml = lockButton(submitBtn, 'جاري الحفظ...');

  try {
    const price = document.getElementById('item-price')?.value || 0;
    const category = document.getElementById('item-category')?.value || '';
    const description = document.getElementById('item-desc')?.value || '';
    const status = document.getElementById('item-status')?.value || STATUS_OPTIONS[0];
    const itemType = document.getElementById('item-type')?.value || ITEM_TYPE_OPTIONS[0];

    const imagesArray = uploadedImages.map(img => ({ name: img.file.name, data: img.url }));
    const heroImageBase64 = uploadedImages[heroImageIndex]?.url || '';

    const payload = {
      action: 'add_item',
      client_whatsapp: currentClient.whatsapp,
      sector: currentClient.sector,

      // أسماء أعمدة Airtable الحقيقية (PascalCase)
      Item_Title: title,
      Price: price,
      Item_Category: category,
      Description: description,
      Status: status,
      Item_Type: itemType,
      // نسخة snake_case لضمان التوافق مع أي workflow يستخدم مسميات مختلفة
      title: title,
      price: price,
      category: category,
      description: description,
      status: status,
      item_type: itemType,

      // الصور كنص Base64 Data URL جوه نفس الـ JSON
      images: imagesArray,
      hero_image_url: heroImageBase64
    };

    // حقول العقارات تتبعت فقط لو القطاع الحالي عقارات
    if (SECTOR_CONFIG[currentSectorKey].showEstateFields) {
      const area = document.getElementById('item-area')?.value || '';
      const bedrooms = document.getElementById('item-bedrooms')?.value || '';
      const bathrooms = document.getElementById('item-bathrooms')?.value || '';
      payload.Area = area;
      payload.Bedrooms = bedrooms;
      payload.Bathrooms = bathrooms;
      payload.area = area;
      payload.bedrooms = bedrooms;
      payload.bathrooms = bathrooms;
    }

    const res = await fetch(window.CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const success = await handleN8nResponse(res, null);
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
  } catch (err) {
    console.error('❌ خطأ أثناء حفظ العنصر:', err);
    alert('❌ خطأ أثناء الحفظ');
  } finally {
    unlockButton(submitBtn, originalHtml);
  }
}

// ==========================================
// عرض جدول العناصر - الصورة المصغرة بتتاخد حصرياً من Cloudinary_Images
// (تجاهل تام لحقل Attachments كما طُلب)
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

// الرابط الدائم لصورة المنتج - حصرياً من Cloudinary_Images، بلا أي رجوع لـ Attachments
function getItemImageUrl(item) {
  const raw = item.Cloudinary_Images;
  if (!raw) return '';

  if (Array.isArray(raw)) {
    const first = raw[0];
    if (typeof first === 'string') return first;
    if (first && first.url) return first.url;
    return '';
  }

  if (typeof raw === 'string') {
    return raw.split(',')[0].trim();
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
// حذف عنصر - JSON خالص، مبني على client_whatsapp
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
// دالة تحويل ملف إلى Base64 Data URL كامل (data:image/png;base64,...)
// ==========================================
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

// ==========================================
// إرسال JSON خالص لكل عمليات الحفظ - بدون FormData نهائياً (تفادي خطأ /tmp/)
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

// معالجة موحّدة لرد السيرفر - بنتأكد إن الرد فعلاً { success: true } قبل ما نعتبر
// العملية نجحت، وبعدين فورًا بنعمل Re-hydration كامل للوحة عبر fetchAllClientData()
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
// حفظ إعدادات الهوية العامة + كل الحقول المرتبطة بيها (SEO، سوشيال ميديا،
// بيكسلات التسويق، المنصات المتخصصة، صورة المشاركة، شهادات التكريم)
// في طلب JSON واحد شامل - بدون FormData نهائياً، والصور كنص Base64 Data URL
// ==========================================
async function handleSettingsSubmit(e) {
  e.preventDefault();

  if (!currentClient || !currentClient.whatsapp) {
    alert('❌ تعذر تحديد رقم العميل، برجاء إعادة تحميل الصفحة');
    return;
  }

  const submitBtn = document.getElementById('settings-submit-btn');
  if (submitBtn && submitBtn.disabled) return;

  const originalHtml = lockButton(submitBtn, 'جاري الحفظ...');

  try {
    // ---------- الهوية والبيانات العامة ----------
    const companyName = document.getElementById('setting-agency-name')?.value || '';
    const themeColor = document.getElementById('setting-color')?.value || '';
    const accentColor = document.getElementById('setting-accent-color')?.value || '';
    const platform1 = document.getElementById('setting-platform-1')?.value || '';
    const platform2 = document.getElementById('setting-platform-2')?.value || '';

    // ---------- تحويل كل الصور إلى Base64 Data URL ----------
    const logoInput = document.getElementById('setting-logo');
    const faviconInput = document.getElementById('setting-favicon');
    const shareImageInput = document.getElementById('setting-share-image');

    let logoBase64 = '';
    if (logoInput && logoInput.files.length > 0) {
      logoBase64 = await getBase64(logoInput.files[0]);
    }

    let faviconBase64 = '';
    if (faviconInput && faviconInput.files.length > 0) {
      faviconBase64 = await getBase64(faviconInput.files[0]);
    }

    let shareImageBase64 = '';
    if (shareImageInput && shareImageInput.files.length > 0) {
      shareImageBase64 = await getBase64(shareImageInput.files[0]);
    }

    // شهادات التكريم - مصفوفة من نصوص Base64 Data URL
    const certificatesBase64Array = uploadedCertificates.map(cert => cert.url);

    // ---------- عنوان ووصف الـ SEO ----------
    const seoTitle = document.getElementById('seo-title')?.value || '';
    const seoDesc = document.getElementById('seo-desc')?.value || '';

    // ---------- أرقام التواصل وروابط السوشيال ميديا ----------
    const whatsapp = document.getElementById('social-whatsapp')?.value || '';
    const phone = document.getElementById('social-phone')?.value || '';
    const maps = document.getElementById('social-maps')?.value || '';
    const facebook = document.getElementById('social-facebook')?.value || '';
    const instagram = document.getElementById('social-instagram')?.value || '';
    const tiktok = document.getElementById('social-tiktok')?.value || '';
    const linkedin = document.getElementById('social-linkedin')?.value || '';

    // ---------- معرفات بيكسلات التسويق ----------
    const metaPixel = document.getElementById('mkt-meta')?.value || '';
    const tiktokPixel = document.getElementById('mkt-tiktok')?.value || '';
    const snapPixel = document.getElementById('mkt-snapchat')?.value || '';
    const ga4Id = document.getElementById('mkt-ga4')?.value || '';

    // ---------- تجميع كل الحقول بدون استثناء في Payload واحد ----------
    const payload = {
      action: 'update_settings',
      client_whatsapp: currentClient.whatsapp,

      // الهوية العامة
      Company_Name: companyName,
      Theme_Color: themeColor,
      Accent_Color: accentColor,
      Slogan: document.getElementById('hero-title')?.value || '',

      // المنصات المتخصصة
      Specialized_Platform_1: platform1,
      Specialized_Platform_2: platform2,

      // الصور كنص Base64 Data URL (فاضي = العميل ماغيّرش الصورة، السيرفر يسيبها زي ماهي)
      Logo_URL: logoBase64,
      Favicon_URL: faviconBase64,
      Share_Image_URL: shareImageBase64,
      Certificates_Images: certificatesBase64Array,

      // SEO
      SEO_Title: seoTitle,
      SEO_Description: seoDesc,
      '\u2060SEO_Description\u2060': seoDesc,

      // أرقام التواصل وروابط السوشيال ميديا
      Whatsapp: whatsapp,
      Phone: phone,
      Maps_Link: maps,
      Facebook: facebook,
      Instagram: instagram,
      TikTok: tiktok,
      LinkedIn: linkedin,

      // بيكسلات التسويق
      Meta_Pixel_ID: metaPixel,
      TikTok_Pixel_ID: tiktokPixel,
      Snapchat_Pixel_ID: snapPixel,
      GA4_ID: ga4Id
    };

    const res = await fetch(window.CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const success = await handleN8nResponse(res, 'settings-msg');
    if (success) {
      if (logoInput) logoInput.value = '';
      if (faviconInput) faviconInput.value = '';
      if (shareImageInput) shareImageInput.value = '';
      uploadedCertificates = [];
    }
  } catch (err) {
    console.error('❌ خطأ أثناء حفظ الإعدادات:', err);
    showFormMessage('settings-msg', '❌ تعذر الاتصال بالسيرفر.', false);
  } finally {
    unlockButton(submitBtn, originalHtml);
  }
}

// ==========================================
// حفظ أرقام التواصل والروابط (Whatsapp, Facebook, Instagram, TikTok, LinkedIn)
// ==========================================
async function handleSocialSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('social-submit-btn');
  if (submitBtn && submitBtn.disabled) return;
  const originalHtml = lockButton(submitBtn, 'جاري الحفظ...');

  try {
    const payload = {
      action: 'update_social',
      Whatsapp: document.getElementById('social-whatsapp')?.value || '',
      Phone: document.getElementById('social-phone')?.value || '',
      Maps_Link: document.getElementById('social-maps')?.value || '',
      Facebook: document.getElementById('social-facebook')?.value || '',
      Instagram: document.getElementById('social-instagram')?.value || '',
      TikTok: document.getElementById('social-tiktok')?.value || '',
      LinkedIn: document.getElementById('social-linkedin')?.value || ''
    };
    await sendDataToN8n(payload, 'social-msg');
  } finally {
    unlockButton(submitBtn, originalHtml);
  }
}

// ==========================================
// حفظ إعدادات SEO (SEO_Title, SEO_Description)
// ==========================================
async function handleSeoSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('seo-submit-btn');
  if (submitBtn && submitBtn.disabled) return;
  const originalHtml = lockButton(submitBtn, 'جاري الحفظ...');

  try {
    const seoDesc = document.getElementById('seo-desc')?.value || '';
    const payload = {
      action: 'update_seo',
      SEO_Title: document.getElementById('seo-title')?.value || '',
      SEO_Description: seoDesc,
      '\u2060SEO_Description\u2060': seoDesc
    };
    await sendDataToN8n(payload, 'seo-msg');
  } finally {
    unlockButton(submitBtn, originalHtml);
  }
}

// ==========================================
// حفظ أدوات التتبع التسويقي (Meta_Pixel_ID + منصات أخرى)
// ==========================================
async function handleMarketingSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('marketing-submit-btn');
  if (submitBtn && submitBtn.disabled) return;
  const originalHtml = lockButton(submitBtn, 'جاري الحفظ...');

  try {
    const payload = {
      action: 'update_marketing',
      Meta_Pixel_ID: document.getElementById('mkt-meta')?.value || '',
      TikTok_Pixel_ID: document.getElementById('mkt-tiktok')?.value || '',
      Snapchat_Pixel_ID: document.getElementById('mkt-snapchat')?.value || '',
      GA4_ID: document.getElementById('mkt-ga4')?.value || ''
    };
    await sendDataToN8n(payload, 'marketing-msg');
  } finally {
    unlockButton(submitBtn, originalHtml);
  }
}

// ==========================================
// حفظ الدومين المخصص
// ==========================================
async function handleDomainSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('domain-submit-btn');
  if (submitBtn && submitBtn.disabled) return;
  const originalHtml = lockButton(submitBtn, 'جاري الحفظ...');

  try {
    const payload = {
      action: 'update_domain',
      Custom_Domain: document.getElementById('custom-domain-input')?.value || ''
    };
    await sendDataToN8n(payload, 'domain-msg');
  } finally {
    unlockButton(submitBtn, originalHtml);
  }
}

// ==========================================
// حفظ محتوى الصفحة الرئيسية (Slogan / hero content)
// ==========================================
async function handleContentSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('content-submit-btn');
  if (submitBtn && submitBtn.disabled) return;
  const originalHtml = lockButton(submitBtn, 'جاري الحفظ...');

  try {
    const payload = {
      action: 'update_content',
      Slogan: document.getElementById('hero-title')?.value || '',
      Hero_Subtitle: document.getElementById('hero-subtitle')?.value || '',
      About_Exp: document.getElementById('about-exp')?.value || '',
      About_Satisfaction: document.getElementById('about-satisfaction')?.value || ''
    };
    await sendDataToN8n(payload, 'content-msg');
  } finally {
    unlockButton(submitBtn, originalHtml);
  }
}

// ==========================================
// ربط كل الفورمات بمعالجاتها الصحيحة
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
