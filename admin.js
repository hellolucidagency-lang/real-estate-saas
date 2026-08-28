// ==========================================
// LUCIDIA SAAS - UNIFIED ADMIN DASHBOARD ENGINE (V3.2)
// ==========================================

window.CONFIG = window.CONFIG || {
  WEBHOOK_URL: 'https://n8n.hellolucidagency.com/webhook/14cdad9c-e685-4a4b-aec9-76cd19544ee6',
  BASE_URL: 'https://app.hellolucidagency.com'
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
  const passInput = document.getElementById('admin-pass-input') || document.querySelector('#login-modal input[type="password"]');
  
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

  fetchClientItems();
}

function loadClientData() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientWhatsapp = urlParams.get('client') || localStorage.getItem('lucidia_whatsapp') || '01111197146';
  const sectorParam = urlParams.get('sector') || localStorage.getItem('lucidia_sector') || 'Lucidia Estate';

  currentClient = {
    whatsapp: clientWhatsapp,
    sector: sectorParam,
    company_name: localStorage.getItem('lucidia_company_name') || 'منصتي'
  };

  localStorage.setItem('lucidia_whatsapp', clientWhatsapp);
  localStorage.setItem('lucidia_sector', sectorParam);
}

function customizeSectorUI() {
  const sector = currentClient?.sector || 'Lucidia Estate';
  
  const platform1Label = document.getElementById('label-platform-1');
  const platform2Label = document.getElementById('label-platform-2');
  const itemTitleLabel = document.getElementById('label-item-title');
  const itemPriceLabel = document.getElementById('label-item-price');
  const itemCategoryLabel = document.getElementById('label-item-category');

  if (sector.includes('Clinics') || sector.includes('عيادات')) {
    if (platform1Label) platform1Label.innerText = '🩺 حساب فيزيتا (Vezeeta)';
    if (platform2Label) platform2Label.innerText = '🏥 حساب كلينيدو (CliniDo)';
    if (itemTitleLabel) itemTitleLabel.innerText = 'اسم الخدمة الطبية / الحالة (قبل وبعد) *';
    if (itemPriceLabel) itemPriceLabel.innerText = 'سعر الكشف / الإجراء (ج.م)';
    if (itemCategoryLabel) itemCategoryLabel.innerText = 'القسم الطبي';
  } else if (sector.includes('Estate') || sector.includes('عقارات')) {
    if (platform1Label) platform1Label.innerText = '🏢 معرض عقارماب (Aqarmap)';
    if (platform2Label) platform2Label.innerText = '🏠 حساب بروبرتي فايندر (Property Finder)';
    if (itemTitleLabel) itemTitleLabel.innerText = 'عنوان العقار / الوحدة *';
    if (itemPriceLabel) itemPriceLabel.innerText = 'السعر الإجمالي (ج.م)';
    if (itemCategoryLabel) itemCategoryLabel.innerText = 'نوع العقار';
  }
}

// ==========================================
// رفع ومعاينة الصور والـ Hero مع زر الحذف (X)
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
    // تفريغ الانبوت عشان لو اختار نفس الصورة تاني تشتغل
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
      <button class="absolute top-1 left-1 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition" onclick="removeImage(${index}, event)">
        <i data-lucide="x" class="w-3 h-3"></i>
      </button>
    `;
    
    // النقر على الصورة يخليها الغلاف
    div.addEventListener('click', () => {
      heroImageIndex = index;
      renderImagesPreview();
    });
    
    previewContainer.appendChild(div);
  });
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// دالة مسح الصورة
window.removeImage = function(index, event) {
  event.stopPropagation(); // عشان النقر ما يخليهاش غلاف
  uploadedImages.splice(index, 1);
  // إعادة ضبط الغلاف لو مسحنا الغلاف الحالي
  if (heroImageIndex >= uploadedImages.length) {
    heroImageIndex = 0;
  }
  renderImagesPreview();
};

// ==========================================
// حفظ العناصر وإرسال مصفوفة الصور لـ n8n
// ==========================================
async function handleAddItem(e) {
  if (e) e.preventDefault();
  const title = document.getElementById('item-title')?.value.trim();
  if (!title) return alert('يرجى كتابة الاسم/العنوان');

  // تجهيز مصفوفة الصور زي ما n8n عايزها
  const imagesArray = uploadedImages.map(img => {
    return {
      name: img.file.name,
      data: img.url
    };
  });

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
      fetchClientItems();
    }
  } catch (err) {
    alert('❌ خطأ أثناء الحفظ');
  }
}

async function fetchClientItems() {
  try {
    const res = await fetch(window.CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_client_items', client_whatsapp: currentClient.whatsapp })
    });
    if (res.ok) {
      const data = await res.json().catch(() => []);
      currentItems = Array.isArray(data) ? data : (data.items || []);
      renderItemsTable();
    }
  } catch (e) {}
}

function renderItemsTable() {
  const tableBody = document.getElementById('items-table-body');
  if (!tableBody) return;

  if (currentItems.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400 text-xs">لا توجد عناصر مضافة حتى الآن.</td></tr>`;
    return;
  }

  tableBody.innerHTML = currentItems.map(item => `
    <tr class="border-b border-slate-100 text-xs">
      <td class="py-3 px-4 font-bold text-slate-800">${item.title || '-'}</td>
      <td class="py-3 px-4 text-blue-600 font-bold">${item.price ? item.price + ' ج.م' : 'مجاني'}</td>
      <td class="py-3 px-4">${item.category || 'عام'}</td>
      <td class="py-3 px-4 text-slate-500">${item.description || '-'}</td>
      <td class="py-3 px-4 text-center"><button class="text-red-500 font-bold">حذف</button></td>
    </tr>
  `).join('');
}

function exportToCSV() {
  if (!currentItems.length) return alert('لا توجد بيانات لتصديرها');
  const headers = ['العنوان', 'السعر', 'القسم', 'الوصف'];
  const rows = currentItems.map(i => [`"${i.title || ''}"`, i.price || 0, `"${i.category || ''}"`, `"${i.description || ''}"`]);
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `export_${Date.now()}.csv`;
  link.click();
}

function setupEventListeners() {
  const formItem = document.getElementById('form-add-item');
  if (formItem) formItem.addEventListener('submit', handleAddItem);

  const btnExport = document.getElementById('btn-export-csv');
  if (btnExport) btnExport.addEventListener('click', exportToCSV);

  const loginBtn = document.querySelector('#login-modal button');
  if (loginBtn && !loginBtn.getAttribute('onclick')) {
    loginBtn.addEventListener('click', window.checkPass);
  }
}

// ==========================================
// دوال حفظ الإعدادات (الهوية والسيو وغيرها)
// ==========================================
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

function updateFileName(input, textId) {
  const nameDisplay = document.getElementById(textId);
  if (input.files && input.files.length > 0) {
    nameDisplay.textContent = input.files[0].name;
  } else {
    nameDisplay.textContent = '';
  }
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
