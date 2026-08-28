// ==========================================
// LUCIDIA SAAS - UNIFIED ADMIN DASHBOARD ENGINE (V3.0)
// ==========================================

const CONFIG = {
  WEBHOOK_URL: 'https://n8n.hellolucidagency.com/webhook/14cdad9c-e685-4a4b-aec9-76cd19544ee6',
  BASE_URL: 'https://app.hellolucidagency.com'
};

// حالة التطبيق
let currentClient = null;
let currentItems = [];
let uploadedImages = []; // قائمة الصور المرفوعة
let heroImageIndex = 0;  // مؤشر صورة الغلاف الأساسية

document.addEventListener('DOMContentLoaded', async () => {
  await initDashboard();
});

async function initDashboard() {
  console.log('🚀 Lucidia Dashboard Unified Controller Initialized...');
  
  // 1. قراءة بيانات العميل والقطاع
  loadClientData();
  
  // 2. تخصيص الواجهة بالكامل ومسمياتها حسب القطاع
  customizeSectorUI();
  
  // 3. تجهيز نظام رفع ومعاينة وتحديد صورة الـ Hero
  setupImageUploader();
  
  // 4. ربط مستمعي الأحداث
  setupEventListeners();
  
  // 5. جلب بيانات المنتجات/الخدمات من السيرفر
  await fetchClientItems();
}

// ==========================================
// 1. استرجاع بيانات العميل وتحديد القطاع
// ==========================================
function loadClientData() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientWhatsapp = urlParams.get('client') || localStorage.getItem('lucidia_whatsapp');
  const sectorParam = urlParams.get('sector');

  const savedData = localStorage.getItem('lucidia_client');
  if (savedData) {
    currentClient = JSON.parse(savedData);
  } else {
    currentClient = {
      id: localStorage.getItem('lucidia_client_id') || 'recDefaultClient123',
      company_name: localStorage.getItem('lucidia_company_name') || 'منصة لوسيديا',
      sector: sectorParam || 'Lucidia Clinics',
      whatsapp: clientWhatsapp || '01111197146'
    };
  }

  if (sectorParam) currentClient.sector = sectorParam;
  if (clientWhatsapp) currentClient.whatsapp = clientWhatsapp;

  // تحديث النصوص الأساسية في الصفحة
  const brandTitle = document.getElementById('client-brand-name');
  if (brandTitle) brandTitle.innerText = currentClient.company_name;

  const publicLink = document.getElementById('client-public-link');
  if (publicLink) {
    const slug = currentClient.whatsapp;
    publicLink.href = `${CONFIG.BASE_URL}/index.html?client=${slug}&sector=${encodeURIComponent(currentClient.sector)}`;
  }
}

// ==========================================
// 2. تخصيص الواجهة والمسميات حسب القطاع (عيادات / عقارات / محاماة)
// ==========================================
function customizeSectorUI() {
  const sector = currentClient?.sector || 'Lucidia Clinics';
  
  const platform1Label = document.getElementById('label-platform-1');
  const platform2Label = document.getElementById('label-platform-2');
  const platform1Input = document.getElementById('input-platform-1');
  const platform2Input = document.getElementById('input-platform-2');

  const itemTitleLabel = document.getElementById('label-item-title');
  const itemPriceLabel = document.getElementById('label-item-price');
  const itemCategoryLabel = document.getElementById('label-item-category');
  const itemImagesLabel = document.getElementById('label-item-images');
  const addItemBtnText = document.getElementById('btn-add-item-text');

  if (sector.includes('Clinics') || sector.includes('عيادات')) {
    if (platform1Label) platform1Label.innerText = '🩺 حساب منصة فيزيتا (Vezeeta)';
    if (platform2Label) platform2Label.innerText = '🏥 حساب كلينيدو / سينا (CliniDo / Seena)';
    if (platform1Input) platform1Input.placeholder = 'https://vezeeta.com/dr/...';
    if (platform2Input) platform2Input.placeholder = 'https://clinido.com/dr/...';

    if (itemTitleLabel) itemTitleLabel.innerText = 'اسم الخدمة الطبية / الحالة (قبل وبعد) *';
    if (itemPriceLabel) itemPriceLabel.innerText = 'سعر الكشف / تكلفة الإجراء (ج.م)';
    if (itemCategoryLabel) itemCategoryLabel.innerText = 'التخصص / القسم الطبي';
    if (itemImagesLabel) itemImagesLabel.innerText = 'صور الحالة الطبية (قبل / بعد / الفحوصات)';
    if (addItemBtnText) addItemBtnText.innerText = '➕ إضافة خدمة / حالة جديدة';
  } 
  else if (sector.includes('Estate') || sector.includes('عقارات')) {
    if (platform1Label) platform1Label.innerText = '🏢 معرض عقارماب (Aqarmap)';
    if (platform2Label) platform2Label.innerText = '🏠 حساب بروبرتي فايندر (Property Finder)';
    if (platform1Input) platform1Input.placeholder = 'https://aqarmap.com.eg/...';
    if (platform2Input) platform2Input.placeholder = 'https://propertyfinder.eg/...';

    if (itemTitleLabel) itemTitleLabel.innerText = 'عنوان العقار / الوحدة *';
    if (itemPriceLabel) itemPriceLabel.innerText = 'السعر الإجمالي / الإيجار (ج.م)';
    if (itemCategoryLabel) itemCategoryLabel.innerText = 'نوع العقار (شقة، فيلا، تجاري)';
    if (itemImagesLabel) itemImagesLabel.innerText = 'معرض صور العقار (الواجهة والتقسيم)';
    if (addItemBtnText) addItemBtnText.innerText = '➕ إضافة عقار جديد';
  } 
  else if (sector.includes('Pro') || sector.includes('محاماة')) {
    if (platform1Label) platform1Label.innerText = '⚖️ حساب منصة قانوني / استشاراتك';
    if (platform2Label) platform2Label.innerText = '💼 صفحة الشركة على LinkedIn';
    if (platform1Input) platform1Input.placeholder = 'https://qanoony.com/...';
    if (platform2Input) platform2Input.placeholder = 'https://linkedin.com/company/...';

    if (itemTitleLabel) itemTitleLabel.innerText = 'نوع الاستشارة / التخصص القضائي *';
    if (itemPriceLabel) itemPriceLabel.innerText = 'قيمة الاستشارة / الأتعاب التقديرية (ج.م)';
    if (itemCategoryLabel) itemCategoryLabel.innerText = 'الفرع القانوني (شركات، مدني، جنائي)';
    if (itemImagesLabel) itemImagesLabel.innerText = 'مستندات أو صور توضيحية للخدمة';
    if (addItemBtnText) addItemBtnText.innerText = '➕ إضافة خدمة استشارية';
  }
}

// ==========================================
// 3. نظام رفع الصور التفاعلي + اختيار الغلاف الأساسي (Hero Image)
// ==========================================
function setupImageUploader() {
  const fileInput = document.getElementById('item-image-input');
  if (!fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        uploadedImages.push({
          file: file,
          url: event.target.result
        });
        renderImagesPreview();
      };
      reader.readAsDataURL(file);
    });
  });
}

function renderImagesPreview() {
  let previewContainer = document.getElementById('images-preview-container');
  if (!previewContainer) return;

  previewContainer.innerHTML = '';

  uploadedImages.forEach((imgObj, index) => {
    const isHero = index === heroImageIndex;
    const imgWrapper = document.createElement('div');
    imgWrapper.className = `relative group rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
      isHero ? 'border-blue-600 shadow-md ring-2 ring-blue-300' : 'border-slate-200 hover:border-slate-400'
    }`;
    imgWrapper.style.height = '90px';

    imgWrapper.innerHTML = `
      <img src="${imgObj.url}" class="w-full h-full object-cover">
      ${isHero ? `
        <span class="absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
          ⭐ الغلاف الرئيسي (Hero)
        </span>
      ` : `
        <span class="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          اجعلها الغلاف
        </span>
      `}
      <button type="button" class="btn-delete-img absolute bottom-1 left-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow" title="حذف الصورة">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    `;

    // تعيين الصورة كـ Hero عند الضغط عليها
    imgWrapper.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-img')) return;
      heroImageIndex = index;
      renderImagesPreview();
      showToast('⭐ تم تعيين الصورة كغلاف رئيسي (Hero)', 'info');
    });

    // حذف صورة
    imgWrapper.querySelector('.btn-delete-img').addEventListener('click', (e) => {
      e.stopPropagation();
      uploadedImages.splice(index, 1);
      if (heroImageIndex >= uploadedImages.length) heroImageIndex = 0;
      renderImagesPreview();
    });

    previewContainer.appendChild(imgWrapper);
  });
}

// ==========================================
// 4. حفظ عنصر جديد (إرسال للـ Webhook و Airtable)
// ==========================================
async function handleAddItem(e) {
  if (e) e.preventDefault();

  const titleInput = document.getElementById('item-title');
  const priceInput = document.getElementById('item-price');
  const categoryInput = document.getElementById('item-category');
  const descInput = document.getElementById('item-desc');

  if (!titleInput || !titleInput.value.trim()) {
    showToast('⚠️ يرجى إدخال العنوان / الاسم', 'warning');
    return;
  }

  showLoading(true);

  // ترتيب الصور بحيث تكون صورة الـ Hero أول صورة
  const sortedImages = [...uploadedImages];
  if (sortedImages.length > 0 && heroImageIndex < sortedImages.length) {
    const heroImg = sortedImages.splice(heroImageIndex, 1)[0];
    sortedImages.unshift(heroImg);
  }

  const payload = {
    action: 'add_item',
    type: 'create_item',
    client_whatsapp: currentClient?.whatsapp,
    sector: currentClient?.sector,
    title: titleInput.value.trim(),
    price: priceInput ? priceInput.value : 0,
    category: categoryInput ? categoryInput.value.trim() : 'عام',
    description: descInput ? descInput.value.trim() : '',
    hero_image_url: sortedImages[0]?.url || '',
    images_count: sortedImages.length
  };

  try {
    const response = await fetch(CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      showToast('🎉 تم إضافة العنصر بنجاح!', 'success');
      // تصفير الحقول
      titleInput.value = '';
      if (priceInput) priceInput.value = '';
      if (descInput) descInput.value = '';
      uploadedImages = [];
      heroImageIndex = 0;
      renderImagesPreview();
      await fetchClientItems();
    } else {
      throw new Error();
    }
  } catch (err) {
    showToast('❌ تعذر الحفظ، يرجى المحاولة ثانية', 'error');
  } finally {
    showLoading(false);
  }
}

// ==========================================
// 5. جلب وتحديث جدول المنتجات / الخدمات
// ==========================================
async function fetchClientItems() {
  try {
    const response = await fetch(CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_client_items',
        client_whatsapp: currentClient?.whatsapp
      })
    });

    if (response.ok) {
      const data = await response.json().catch(() => []);
      currentItems = Array.isArray(data) ? data : (data.items || []);
      renderItemsTable();
    }
  } catch (err) {
    console.warn('Items table fetch bypassed or offline');
  }
}

function renderItemsTable() {
  const tableBody = document.getElementById('items-table-body');
  if (!tableBody) return;

  if (currentItems.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-6 text-slate-400 text-sm">
          لا توجد عناصر مضافة حتى الآن. أضف أول عنصر من النموذج أعلاه ✨
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = currentItems.map((item, idx) => `
    <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm">
      <td class="py-3 px-4 font-bold text-slate-800">${item.title || 'بدون اسم'}</td>
      <td class="py-3 px-4 text-blue-600 font-semibold">${item.price ? item.price + ' ج.م' : 'مجاني/غير محدد'}</td>
      <td class="py-3 px-4"><span class="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-medium">${item.category || 'عام'}</span></td>
      <td class="py-3 px-4 text-slate-500 text-xs">${item.description ? item.description.slice(0, 30) + '...' : '-'}</td>
      <td class="py-3 px-4 text-center">
        <button onclick="deleteItem('${item.id || idx}')" class="text-red-500 hover:text-red-700 text-xs font-bold p-1 rounded hover:bg-red-50">حذف 🗑️</button>
      </td>
    </tr>
  `).join('');
}

// ==========================================
// 6. ميزة تصدير واستيراد البيانات (Export / Import CSV) 📊
// ==========================================
function exportToCSV() {
  if (!currentItems || currentItems.length === 0) {
    showToast('⚠️ لا توجد بيانات لتصديرها حالياً', 'warning');
    return;
  }

  const headers = ['العنوان/الاسم', 'السعر', 'القسم/التخصص', 'الوصف', 'الحالة'];
  const rows = currentItems.map(item => [
    `"${(item.title || '').replace(/"/g, '""')}"`,
    item.price || 0,
    `"${item.category || ''}"`,
    `"${(item.description || '').replace(/"/g, '""')}"`,
    item.status || 'نشط'
  ]);

  let csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `lucidia_${currentClient.sector}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('📥 تم تصدير البيانات بنجاح!', 'success');
}

function importFromCSV(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const lines = e.target.result.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) {
      showToast('⚠️ الملف فارغ أو غير متوافق', 'error');
      return;
    }

    showLoading(true);
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(col => col.replace(/^"|"$/g, '').trim());
      if (cols.length >= 1 && cols[0]) {
        try {
          await fetch(CONFIG.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'add_item',
              client_whatsapp: currentClient?.whatsapp,
              sector: currentClient?.sector,
              title: cols[0],
              price: cols[1] || 0,
              category: cols[2] || 'عام',
              description: cols[3] || ''
            })
          });
          count++;
        } catch (err) {}
      }
    }

    showLoading(false);
    showToast(`🎉 تم استيراد ${count} عنصر بنجاح!`, 'success');
    await fetchClientItems();
  };

  reader.readAsText(file, 'UTF-8');
}

// ==========================================
// 7. أدوات التنبيه ومستمعي الأحداث
// ==========================================
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = 'position: fixed; bottom: 25px; left: 25px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : type === 'info' ? '#3B82F6' : '#F59E0B';
  
  toast.style.cssText = `background: ${bgColor}; color: #fff; padding: 12px 20px; border-radius: 12px; font-weight: 600; font-size: 13px; font-family: 'Tajawal', sans-serif; box-shadow: 0 8px 20px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 8px;`;
  toast.innerText = message;

  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = '0.3s opacity';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function showLoading(state) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = state ? 'flex' : 'none';
}

function setupEventListeners() {
  const formItem = document.getElementById('form-add-item');
  if (formItem) formItem.addEventListener('submit', handleAddItem);

  const btnExport = document.getElementById('btn-export-csv');
  if (btnExport) btnExport.addEventListener('click', exportToCSV);

  const inputImport = document.getElementById('input-import-csv');
  if (inputImport) {
    inputImport.addEventListener('change', (e) => {
      if (e.target.files.length > 0) importFromCSV(e.target.files[0]);
    });
  }
}
