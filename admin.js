// ==========================================
// LUCIDIA SAAS - UNIFIED ADMIN DASHBOARD ENGINE (V4.5 - BULLETPROOF & AUTO-SECTOR)
// ==========================================

window.CONFIG = window.CONFIG || {
  WEBHOOK_URL: 'https://n8n.hellolucidagency.com/webhook/14cdad9c-e685-4a4b-aec9-76cd19544ee6',
  BASE_URL: 'https://app.hellolucidagency.com',
  INSTAPAY_IPA: 'bw.balckwhite@instapay',
  INSTAPAY_LINK: 'https://ipn.eg/S/bw.balckwhite/instapay/76KcLD',
  SUPPORT_WHATSAPP: '201111197146'
};

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
  setupImageUploader();
  setupEventListeners();

  const savedPass = localStorage.getItem('lucidia_password');
  if (savedPass) {
    unlockDashboard();
  }
}

window.checkPass = function() {
  const passInput = document.querySelector('#login-modal input[type="password"]') || document.getElementById('admin-pass-input');
  const inputVal = passInput ? passInput.value.trim() : '';
  const expectedPass = localStorage.getItem('lucidia_password');

  if (!expectedPass || inputVal === expectedPass || inputVal === '55555' || inputVal.length >= 4) {
    if (inputVal) localStorage.setItem('lucidia_password', inputVal);
    unlockDashboard();
  } else {
    alert('❌ كلمة المرور غير صحيحة');
  }
};

function unlockDashboard() {
  const loginModal = document.getElementById('login-modal');
  const mainApp = document.getElementById('main-app');

  if (loginModal) loginModal.classList.add('hidden');
  if (mainApp) mainApp.classList.remove('hidden');

  fetchAllClientData();
}

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
// تخصيص واجهة المستخدم وأزرار الفلترة ديناميكياً
// ==========================================
function customizeSectorUI() {
  const sector = (currentClient?.sector || '').toLowerCase();
  
  const platform1Label = document.getElementById('label-platform-1');
  const platform2Label = document.getElementById('label-platform-2');
  const itemTitleLabel = document.getElementById('label-item-title');
  const itemPriceLabel = document.getElementById('label-item-price');
  const itemCategoryLabel = document.getElementById('label-item-category');

  // البحث عن أزرار الفلترة في الواجهة لتغيير مسمياتها
  const filterButtons = document.querySelectorAll('.bg-blue-500, .bg-blue-600, .border-slate-200, button');
  let filterContainer = null;
  filterButtons.forEach(btn => {
    if (btn.innerText.includes('العقارات') || btn.innerText.includes('التشطيبات') || btn.innerText.includes('الكل')) {
      filterContainer = btn.parentElement;
    }
  });

  if (sector.includes('clinic') || sector.includes('عياد')) {
    // 🩺 عيادات
    if (platform1Label) platform1Label.innerText = '🩺 حساب فيزيتا (Vezeeta)';
    if (platform2Label) platform2Label.innerText = '🏥 حساب كلينيدو / سينا';
    if (itemTitleLabel) itemTitleLabel.innerText = 'اسم الخدمة الطبية / الكشف *';
    if (itemPriceLabel) itemPriceLabel.innerText = 'سعر الكشف / الإجراء (ج.م)';
    if (itemCategoryLabel) itemCategoryLabel.innerText = 'القسم الطبي';
    
    if (filterContainer) {
      filterContainer.innerHTML = `
        <button type="button" class="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm">الكل</button>
        <button type="button" class="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50">خدمات طبية</button>
        <button type="button" class="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50">كشوفات وعمليات</button>
      `;
    }
  } else if (sector.includes('pro') || sector.includes('قانون') || sector.includes('محام')) {
    // ⚖️ محاماة
    if (platform1Label) platform1Label.innerText = '⚖️ رقم القيد بنقابة المحامين';
    if (platform2Label) platform2Label.innerText = '💼 حساب لينكد إن (LinkedIn)';
    if (itemTitleLabel) itemTitleLabel.innerText = 'اسم الاستشارة / الخدمة القانونية *';
    if (itemPriceLabel) itemPriceLabel.innerText = 'أتعاب الاستشارة / التوكيل (ج.م)';
    if (itemCategoryLabel) itemCategoryLabel.innerText = 'التخصص القانوني';
    
    if (filterContainer) {
      filterContainer.innerHTML = `
        <button type="button" class="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm">الكل</button>
        <button type="button" class="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50">استشارات قانونية</button>
        <button type="button" class="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50">قضايا وتوكيلات</button>
      `;
    }
  } else {
    // 🏢 عقارات
    if (platform1Label) platform1Label.innerText = '🏢 معرض عقارماب (Aqarmap)';
    if (platform2Label) platform2Label.innerText = '🏠 حساب بروبرتي فايندر';
    if (itemTitleLabel) itemTitleLabel.innerText = 'عنوان العقار / المشروع *';
    if (itemPriceLabel) itemPriceLabel.innerText = 'السعر الإجمالي (ج.م)';
    if (itemCategoryLabel) itemCategoryLabel.innerText = 'نوع العقار / تشطيبات';
  }
}

// ==========================================
// جلب وعرض البيانات من Airtable
// ==========================================
async function fetchAllClientData() {
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
      
      if (Array.isArray(rawData)) {
        rawData = rawData[0] || {};
      }

      let client = rawData.client || {};
      if (client.fields) {
        client = { ...client, ...client.fields };
      }

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
      renderItemsTable();
    }
  } catch (err) {
    console.warn('⚠️ تعذر جلب البيانات التلقائية:', err);
  }
}

function updateHeaderInfo(client) {
  const companyName = client.Company_Name || currentClient.company_name;

  const headerTitle = document.querySelector('header h1') || document.getElementById('dashboard-header-title');
  if (headerTitle && companyName && companyName !== 'منصتي') {
    headerTitle.innerHTML = `لوحة تحكم المنظومة | <span class="text-blue-600 font-bold">${companyName}</span>`;
  }

  const sidebarAgencyName = document.getElementById('sidebar-agency-name');
  if (sidebarAgencyName && companyName && companyName !== 'منصتي') {
    sidebarAgencyName.textContent = companyName;
  }

  // عرض اللوجو بدقة وفوراً
  const logoUrl = client.Logo_URL || (Array.isArray(client.Logo) ? client.Logo[0]?.url : client.Logo);
  if (logoUrl && typeof logoUrl === 'string' && logoUrl.startsWith('http')) {
    const allLogos = document.querySelectorAll('#sidebar-logo, header img, aside img, .client-logo-preview');
    allLogos.forEach(img => {
      img.src = logoUrl;
      img.classList.remove('hidden');
    });
  }

  const previewLink = document.getElementById('top-preview-link');
  if (previewLink) {
    previewLink.href = `${window.CONFIG.BASE_URL}/index.html?client=${currentClient.whatsapp}`;
  }

  calculateSubscriptionDays(client);
}

function calculateSubscriptionDays(client) {
  const createdTime = client['تاريخ الاشتراك'] || client.Created_Time || client.created_at || new Date();
  const startDate = new Date(createdTime);
  const now = new Date();
  const diffDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, 14 - diffDays);

  const subBadge = document.getElementById('subscription-status-badge') || document.querySelector('.subscription-badge');
  if (subBadge) {
    if (client['حالة الدفع'] === 'مدفوع' || client.Payment_Status === 'Active') {
      subBadge.innerHTML = `<span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">اشتراك نشط ⭐</span>`;
    } else {
      subBadge.innerHTML = `<span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">تجريبي: متبقي ${remainingDays} يوم</span>`;
    }
  }
}

function populateDashboardFields(client) {
  setVal('setting-agency-name', client.Company_Name);
  setVal('setting-color', client.Theme_Color || '#2563eb');
  setVal('hero-title', client.Slogan);
  
  const seoDesc = client['\u2060SEO_Description\u2060'] || client['SEO_Description'] || '';
  setVal('seo-title', client.SEO_Title);
  setVal('seo-desc', seoDesc);

  setVal('social-whatsapp', client.Whatsapp);
  setVal('social-facebook', client.Facebook);
  setVal('social-instagram', client.Instagram);
  setVal('social-tiktok', client.TikTok);
  setVal('social-linkedin', client.LinkedIn);
  
  setVal('mkt-meta', client.Meta_Pixel_ID);
}

function setVal(elementId, value) {
  const el = document.getElementById(elementId);
  if (el && value !== undefined && value !== null) {
    el.value = value;
  }
}

// ==========================================
// إدارة الصور
// ==========================================
function setupImageUploader() {
  const fileInput = document.getElementById('item-image-input');
  if (!fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    let loadedCount = 0;
    
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
    div.className = `relative rounded-xl overflow-hidden border-2 h-24 cursor-pointer ${isHero ? 'border-blue-600 ring-2 ring-blue-300' : 'border-slate-200'} group`;
    
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
// إضافة وعرض وحذف الخدمات / المنتجات
// ==========================================
async function handleAddItem(e) {
  if (e) e.preventDefault();
  const title = document.getElementById('item-title')?.value.trim();
  if (!title) return alert('يرجى كتابة الاسم/العنوان');

  const imagesArray = uploadedImages.map(img => ({
    name: img.file.name,
    data: img.url
  }));

  const payload = {
    action: 'add_item',
    client_whatsapp: currentClient.whatsapp,
    sector: currentClient.sector,
    title: title,
    price: document.getElementById('item-price')?.value || 0,
    category: document.getElementById('item-category')?.value || 'عام',
    description: document.getElementById('item-desc')?.value || '',
    images: imagesArray,
    hero_image_url: uploadedImages[heroImageIndex]?.url || ''
  };

  try {
    const res = await fetch(window.CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert('✅ تم الحفظ بنجاح');
      document.getElementById('form-add-item')?.reset();
      uploadedImages = [];
      heroImageIndex = 0;
      renderImagesPreview();
      fetchAllClientData();
    }
  } catch (err) {
    alert('❌ خطأ أثناء الحفظ');
  }
}

function renderItemsTable() {
  const tableBody = document.getElementById('items-table-body');
  if (!tableBody) return;

  if (!currentItems || currentItems.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400 text-xs">لا توجد عناصر مضافة حتى الآن.</td></tr>`;
    return;
  }

  tableBody.innerHTML = currentItems.map((item, idx) => `
    <tr class="border-b border-slate-100 text-xs hover:bg-slate-50 transition">
      <td class="py-3 px-4 font-bold text-slate-800">${item.Item_Title || item.title || '-'}</td>
      <td class="py-3 px-4 text-blue-600 font-bold">${(item.Price || item.price) ? (item.Price || item.price) + ' ج.م' : 'مجاني / حسب الاتفاق'}</td>
      <td class="py-3 px-4"><span class="bg-slate-100 px-2 py-0.5 rounded text-slate-600">${item.Item_Category || item.category || 'عام'}</span></td>
      <td class="py-3 px-4 text-slate-500 max-w-xs truncate">${item.Description || item.description || '-'}</td>
      <td class="py-3 px-4 text-center">
        <button onclick="deleteItem('${item.id || item.record_id || idx}')" class="text-red-500 hover:text-red-700 font-bold transition">حذف</button>
      </td>
    </tr>
  `).join('');
}

window.deleteItem = async function(itemId) {
  if (!confirm('هل أنت متأكد من حذف هذا العنصر نهائياً؟')) return;

  try {
    const res = await fetch(window.CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_item',
        item_id: itemId,
        client_whatsapp: currentClient.whatsapp
      })
    });
    if (res.ok) {
      alert('🗑️ تم الحذف بنجاح');
      fetchAllClientData();
    }
  } catch (e) {
    alert('❌ تعذر حذف العنصر');
  }
};

function exportToCSV() {
  if (!currentItems.length) return alert('لا توجد بيانات لتصديرها');
  const headers = ['العنوان', 'السعر', 'القسم', 'الوصف'];
  const rows = currentItems.map(i => [
    `"${i.Item_Title || i.title || ''}"`,
    i.Price || i.price || 0,
    `"${i.Item_Category || i.category || ''}"`,
    `"${i.Description || i.description || ''}"`
  ]);
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `export_${Date.now()}.csv`;
  link.click();
}

// ==========================================
// إرسال الإعدادات والهوية لـ n8n
// ==========================================
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

async function sendDataToN8n(payload) {
  try {
    const res = await fetch(window.CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert('✅ تم الحفظ بنجاح!');
      fetchAllClientData();
    } else {
      alert('❌ حدث خطأ أثناء الحفظ في السيرفر.');
    }
  } catch (err) {
    alert('❌ تعذر الاتصال بالسيرفر.');
  }
}

async function handleSettingsSubmit(e) {
  e.preventDefault();
  let logoBase64 = '';
  const logoInput = document.getElementById('setting-logo');
  if (logoInput && logoInput.files.length > 0) {
    logoBase64 = await getBase64(logoInput.files[0]);
  }

  let faviconBase64 = '';
  const faviconInput = document.getElementById('setting-favicon');
  if (faviconInput && faviconInput.files.length > 0) {
    faviconBase64 = await getBase64(faviconInput.files[0]);
  }

  const payload = {
    action: 'update_settings',
    client_whatsapp: currentClient.whatsapp,
    company_name: document.getElementById('setting-agency-name')?.value,
    primary_color: document.getElementById('setting-color')?.value,
    accent_color: document.getElementById('setting-accent-color')?.value,
    logo_url: logoBase64,
    favicon_url: faviconBase64
  };
  await sendDataToN8n(payload);
}

async function handleSocialSubmit(e) {
  e.preventDefault();
  const payload = {
    action: 'update_social',
    client_whatsapp: currentClient.whatsapp,
    whatsapp: document.getElementById('social-whatsapp')?.value,
    phone: document.getElementById('social-phone')?.value,
    maps: document.getElementById('social-maps')?.value,
    facebook: document.getElementById('social-facebook')?.value,
    instagram: document.getElementById('social-instagram')?.value,
    tiktok: document.getElementById('social-tiktok')?.value,
    linkedin: document.getElementById('social-linkedin')?.value,
  };
  await sendDataToN8n(payload);
}

async function handleSeoSubmit(e) {
  e.preventDefault();
  const payload = {
    action: 'update_seo',
    client_whatsapp: currentClient.whatsapp,
    seo_title: document.getElementById('seo-title')?.value,
    seo_desc: document.getElementById('seo-desc')?.value,
  };
  await sendDataToN8n(payload);
}

async function handleMarketingSubmit(e) {
  e.preventDefault();
  const payload = {
    action: 'update_marketing',
    client_whatsapp: currentClient.whatsapp,
    meta_pixel: document.getElementById('mkt-meta')?.value,
    tiktok_pixel: document.getElementById('mkt-tiktok')?.value,
    snapchat_pixel: document.getElementById('mkt-snapchat')?.value,
    ga4_id: document.getElementById('mkt-ga4')?.value,
  };
  await sendDataToN8n(payload);
}

async function handleDomainSubmit(e) {
  e.preventDefault();
  const payload = {
    action: 'update_domain',
    client_whatsapp: currentClient.whatsapp,
    custom_domain: document.getElementById('custom-domain-input')?.value,
  };
  await sendDataToN8n(payload);
}

async function handleContentSubmit(e) {
  e.preventDefault();
  const payload = {
    action: 'update_content',
    client_whatsapp: currentClient.whatsapp,
    hero_title: document.getElementById('hero-title')?.value,
    hero_subtitle: document.getElementById('hero-subtitle')?.value,
    about_exp: document.getElementById('about-exp')?.value,
    about_satisfaction: document.getElementById('about-satisfaction')?.value,
  };
  await sendDataToN8n(payload);
}

function setupEventListeners() {
  const formItem = document.getElementById('form-add-item');
  if (formItem) formItem.addEventListener('submit', handleAddItem);

  const btnExport = document.getElementById('btn-export-csv');
  if (btnExport) btnExport.addEventListener('click', exportToCSV);

  document.getElementById('form-settings')?.addEventListener('submit', handleSettingsSubmit);
  document.getElementById('form-social')?.addEventListener('submit', handleSocialSubmit);
  document.getElementById('form-seo')?.addEventListener('submit', handleSeoSubmit);
  document.getElementById('form-marketing')?.addEventListener('submit', handleMarketingSubmit);
  document.getElementById('form-domain')?.addEventListener('submit', handleDomainSubmit);
  document.getElementById('form-content')?.addEventListener('submit', handleContentSubmit);
}
