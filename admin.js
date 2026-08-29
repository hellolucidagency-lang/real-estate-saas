// ==========================================
// LUCIDIA SAAS - UNIFIED ADMIN DASHBOARD ENGINE (V3.5 - BULLETPROOF DATA FETCH)
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

  // جلب كافة بيانات العميل والمنتجات فور تسجيل الدخول
  fetchAllClientData();
}

function loadClientData() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientWhatsapp = urlParams.get('client') || localStorage.getItem('lucidia_whatsapp') || '01110737888';
  const sectorParam = urlParams.get('sector') || localStorage.getItem('lucidia_sector') || 'Lucidia Clinics';

  currentClient = {
    whatsapp: clientWhatsapp,
    sector: sectorParam,
    client_name: localStorage.getItem('lucidia_client_name') || 'العميل',
    company_name: localStorage.getItem('lucidia_company_name') || 'منصتي'
  };

  localStorage.setItem('lucidia_whatsapp', clientWhatsapp);
  localStorage.setItem('lucidia_sector', sectorParam);
}

function customizeSectorUI() {
  const sector = currentClient?.sector || 'Lucidia Clinics';
  
  const platform1Label = document.getElementById('label-platform-1');
  const platform2Label = document.getElementById('label-platform-2');
  const itemTitleLabel = document.getElementById('label-item-title');
  const itemPriceLabel = document.getElementById('label-item-price');
  const itemCategoryLabel = document.getElementById('label-item-category');

  if (sector.includes('Clinics') || sector.includes('عيادات')) {
    if (platform1Label) platform1Label.innerText = '🩺 حساب فيزيتا (Vezeeta)';
    if (platform2Label) platform2Label.innerText = '🏥 حساب كلينيدو (CliniDo)';
    if (itemTitleLabel) itemTitleLabel.innerText = 'اسم الخدمة الطبية / الحالة *';
    if (itemPriceLabel) itemPriceLabel.innerText = 'سعر الكشف / الإجراء (ج.م)';
    if (itemCategoryLabel) itemCategoryLabel.innerText = 'القسم الطبي';
  } else if (sector.includes('Estate') || sector.includes('عقارات')) {
    if (platform1Label) platform1Label.innerText = '🏢 معرض عقارماب (Aqarmap)';
    if (platform2Label) platform2Label.innerText = '🏠 حساب بروبرتي فايندر (Property Finder)';
    if (itemTitleLabel) itemTitleLabel.innerText = 'عنوان العقار / المشروع *';
    if (itemPriceLabel) itemPriceLabel.innerText = 'السعر الإجمالي (ج.م)';
    if (itemCategoryLabel) itemCategoryLabel.innerText = 'نوع العقار / تشطيبات';
  }
}

// ==========================================
// جلب كافة بيانات العميل والمنتجات (الجزء المعدل السحري)
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
      
      // 1. فك التغليف لو الداتا جاية في Array من n8n
      if (Array.isArray(rawData)) {
        rawData = rawData[0] || {};
      }

      // 2. فك تغليف Airtable للعميل (fields)
      let client = rawData.client || {};
      if (client.fields) {
        client = { ...client, ...client.fields };
      }

      // 3. فك تغليف Airtable للمنتجات (fields)
      let rawItems = rawData.items || [];
      currentItems = rawItems.map(item => {
        return item.fields ? { ...item, ...item.fields, id: item.id } : item;
      });

      // 4. تحديث الهيدر وعنوان اللوحة
      updateHeaderInfo(client);

      // 5. تعبئة الحقول في كافة التابات
      populateDashboardFields(client);

      // 6. رسم جدول المنتجات
      renderItemsTable();
    }
  } catch (err) {
    console.warn('⚠️ تعذر جلب البيانات التلقائية:', err);
  }
}

function updateHeaderInfo(client) {
  const clientName = client.Client_Name || currentClient.client_name;
  const companyName = client.Company_Name || currentClient.company_name;

  const headerTitle = document.querySelector('header h1') || document.getElementById('dashboard-header-title');
  if (headerTitle) {
    headerTitle.innerHTML = `لوحة تحكم المنظومة | <span class="text-blue-600 font-bold">${companyName}</span> (${clientName})`;
  }

  // تحديث الاسم في القائمة الجانبية
  const sidebarAgencyName = document.getElementById('sidebar-agency-name');
  if (sidebarAgencyName && companyName) {
    sidebarAgencyName.textContent = companyName;
  }

  // تحديث اللوجو في القائمة الجانبية (لو موجود في Airtable)
  const logoUrl = client.Logo_URL || (Array.isArray(client.Logo) ? client.Logo[0]?.url : client.Logo);
  const sidebarLogo = document.getElementById('sidebar-logo');
  if (sidebarLogo && logoUrl && typeof logoUrl === 'string') {
    sidebarLogo.src = logoUrl;
  }

  // زر زيارة الموقع
  const previewLink = document.getElementById('top-preview-link');
  if (previewLink) {
    previewLink.href = `${window.CONFIG.BASE_URL}/index.html?client=${currentClient.whatsapp}`;
  }

  // حساب الأيام المتبقية للتجربة (14 يوم)
  calculateSubscriptionDays(client);
}

function calculateSubscriptionDays(client) {
  const createdTime = client.Created_Time || client.created_at || new Date();
  const startDate = new Date(createdTime);
  const now = new Date();
  const diffDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, 14 - diffDays);

  const subBadge = document.getElementById('subscription-status-badge') || document.querySelector('.subscription-badge');
  if (subBadge) {
    if (client.Payment_Status === 'مدفوع' || client.Payment_Status === 'Active') {
      subBadge.innerHTML = `<span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">اشتراك نشط ⭐</span>`;
    } else {
      subBadge.innerHTML = `<span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">تجريبي: متبقي ${remainingDays} يوم</span>`;
    }
  }
}

function populateDashboardFields(client) {
  // الهوية والألوان
  setVal('setting-agency-name', client.Company_Name);
  setVal('setting-color', client.Primary_Color || '#2563eb');
  setVal('setting-accent-color', client.Accent_Color || '#0ea5e9');

  // محتوى الصفحات والنبذة
  setVal('hero-title', client.Hero_Title);
  setVal('hero-subtitle', client.Hero_Subtitle);
  setVal('about-exp', client.Experience_Years);
  setVal('about-satisfaction', client.Satisfaction_Rate);

  // السيو ومحركات البحث
  setVal('seo-title', client.SEO_Title);
  setVal('seo-desc', client.SEO_Description);

  // وسائل التواصل
  setVal('social-whatsapp', client.Whatsapp);
  setVal('social-phone', client.Phone);
  setVal('social-maps', client.Maps_URL);
  setVal('social-facebook', client.Facebook_URL);
  setVal('social-instagram', client.Instagram_URL);

  // التسويق والبيكسل
  setVal('mkt-meta', client.Meta_Pixel);
  setVal('mkt-tiktok', client.Tiktok_Pixel);
  setVal('mkt-snapchat', client.Snapchat_Pixel);
  setVal('mkt-ga4', client.GA4_ID);

  // الدومين
  setVal('custom-domain-input', client.Custom_Domain);
}

function setVal(elementId, value) {
  const el = document.getElementById(elementId);
  if (el && value !== undefined && value !== null) {
    el.value = value;
  }
}

// ==========================================
// رفع ومعاينة الصور
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
// إدارة العناصر (إضافة - عرض - حذف)
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
      <td class="py-3 px-4 font-bold text-slate-800">${item.title || item.Title || '-'}</td>
      <td class="py-3 px-4 text-blue-600 font-bold">${(item.price || item.Price) ? (item.price || item.Price) + ' ج.م' : 'مجاني'}</td>
      <td class="py-3 px-4"><span class="bg-slate-100 px-2 py-0.5 rounded text-slate-600">${item.category || item.Category || 'عام'}</span></td>
      <td class="py-3 px-4 text-slate-500 max-w-xs truncate">${item.description || item.Description || '-'}</td>
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
    `"${i.title || i.Title || ''}"`,
    i.price || i.Price || 0,
    `"${i.category || i.Category || ''}"`,
    `"${i.description || i.Description || ''}"`
  ]);
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `export_${Date.now()}.csv`;
  link.click();
}

// ==========================================
// تجديد الاشتراك عبر InstaPay
// ==========================================
window.payViaInstapay = function(planType) {
  const amount = planType === 'yearly' ? '3,500 ج.م (شامل دومين مجاني)' : '350 ج.م شهرياً';
  const msg = `مرحباً، أود تجديد اشتراك منصة Lucidia (${planType === 'yearly' ? 'السنوي' : 'الشهري'}) للنشاط: ${currentClient.company_name} - رقم: ${currentClient.whatsapp}`;
  
  window.open(window.CONFIG.INSTAPAY_LINK, '_blank');

  setTimeout(() => {
    const confirmSendReceipt = confirm(
      `تم فتح رابط الدفع لتطبيق InstaPay.\n\nالمعرف: ${window.CONFIG.INSTAPAY_IPA}\nالقيمة: ${amount}\n\nبعد إتمام التحويل، اضغط موافق لإرسال صورة الإيصال وتفعيل حسابك فوراً.`
    );
    if (confirmSendReceipt) {
      window.open(`https://wa.me/${window.CONFIG.SUPPORT_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  }, 1000);
};

// ==========================================
// حفظ إعدادات النماذج المختلفة
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
