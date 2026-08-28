// ==========================================
// LUCIDIA SAAS - ADMIN DASHBOARD CONTROL (V2.0)
// ==========================================

const CONFIG = {
  // رابط الـ Webhook بتاع n8n
  WEBHOOK_URL: 'https://n8n.hellolucidagency.com/webhook/14cdad9c-e685-4a4b-aec9-76cd19544ee6',
};

// حالة التطبيق الداخلية
let currentClient = null;
let currentItems = [];

document.addEventListener('DOMContentLoaded', async () => {
  initDashboard();
});

async function initDashboard() {
  console.log('🚀 Lucidia Dashboard Initialized...');
  
  // 1. قراءة بيانات العميل المسجل
  loadClientData();
  
  // 2. تخصيص الواجهة حسب القطاع (عيادات / عقارات / محاماة)
  customizeSectorUI();
  
  // 3. إعداد مستمعي الأحداث (Event Listeners) للأزرار
  setupEventListeners();
}

// ==========================================
// 1. تخصيص الواجهة حسب القطاع (Clinics / Estate / Pro)
// ==========================================
function customizeSectorUI() {
  const sector = currentClient?.sector || 'Lucidia Estate';
  
  const platform1Label = document.getElementById('label-platform-1');
  const platform2Label = document.getElementById('label-platform-2');
  const platform1Input = document.getElementById('input-platform-1');
  const platform2Input = document.getElementById('input-platform-2');

  if (sector === 'Lucidia Clinics' || sector === 'عيادات') {
    if (platform1Label) platform1Label.innerText = '🩺 رابط حسابك على منصة فيزيتا (Vezeeta)';
    if (platform2Label) platform2Label.innerText = '🏥 رابط حسابك على منصة كلينيدو أو سينا (CliniDo / Seena)';
    if (platform1Input) platform1Input.placeholder = 'https://vezeeta.com/dr/doctor-name';
    if (platform2Input) platform2Input.placeholder = 'https://clinido.com/dr/...';
  } 
  else if (sector === 'Lucidia Estate' || sector === 'عقارات') {
    if (platform1Label) platform1Label.innerText = '🏢 رابط معرضك على عقارماب (Aqarmap)';
    if (platform2Label) platform2Label.innerText = '🏠 رابط حسابك على بروبرتي فايندر (Property Finder)';
    if (platform1Input) platform1Input.placeholder = 'https://aqarmap.com.eg/ar/company/...';
    if (platform2Input) platform2Input.placeholder = 'https://propertyfinder.eg/...';
  } 
  else if (sector === 'Lucidia Pro' || sector === 'محاماة') {
    if (platform1Label) platform1Label.innerText = '⚖️ رابط ملفك على منصة قانوني / استشاراتك';
    if (platform2Label) platform2Label.innerText = '💼 رابط حساب الشركة الرسمي على LinkedIn';
    if (platform1Input) platform1Input.placeholder = 'https://qanoony.com/...';
    if (platform2Input) platform2Input.placeholder = 'https://linkedin.com/company/...';
  }
}

// ==========================================
// 2. إدارة الإعدادات والحفظ (Save Settings)
// ==========================================
async function saveSettings(event) {
  if (event) event.preventDefault();
  
  showLoading(true);
  
  const payload = {
    action: 'update_settings',
    client_record_id: currentClient?.id,
    company_name: document.getElementById('setting-company-name')?.value,
    whatsapp: document.getElementById('setting-whatsapp')?.value,
    logo_url: document.getElementById('setting-logo-url')?.value,
    theme_color: document.getElementById('setting-theme-color')?.value,
    meta_pixel_id: document.getElementById('setting-meta-pixel')?.value,
    specialized_platform_1: document.getElementById('input-platform-1')?.value,
    specialized_platform_2: document.getElementById('input-platform-2')?.value,
    facebook: document.getElementById('setting-facebook')?.value,
    instagram: document.getElementById('setting-instagram')?.value,
    tiktok: document.getElementById('setting-tiktok')?.value,
    seo_description: document.getElementById('setting-seo')?.value,
  };

  try {
    const response = await fetch(CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      showToast('✨ تم حفظ الإعدادات بنجاح!', 'success');
    } else {
      showToast('❌ حدث خطأ أثناء الحفظ، حاول مجدداً', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('⚠️ تعذر الاتصال بالسيرفر', 'error');
  } finally {
    showLoading(false);
  }
}

// ==========================================
// 3. ميزة تصدير البيانات (Export to CSV) 📊
// ==========================================
function exportToCSV() {
  if (!currentItems || currentItems.length === 0) {
    showToast('⚠️ لا توجد بيانات لتصديرها حالياً', 'warning');
    return;
  }

  const headers = ['ID', 'العنوان/الاسم', 'السعر', 'القسم', 'الوصف', 'الحالة'];
  const rows = currentItems.map(item => [
    item.id || '',
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
  link.setAttribute('download', `lucidia_data_export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('📥 تم تصدير البيانات بنجاح!', 'success');
}

// ==========================================
// 4. ميزة استيراد البيانات (Import from CSV) 📤
// ==========================================
function importFromCSV(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const text = e.target.result;
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length <= 1) {
      showToast('⚠️ الملف فارغ أو غير صالح', 'error');
      return;
    }

    showLoading(true);
    let importedCount = 0;

    // تجاوز السطر الأول (الترويسة)
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(col => col.replace(/^"|"$/g, '').trim());
      if (cols.length >= 2) {
        const itemPayload = {
          action: 'add_item',
          client_id: currentClient?.id,
          title: cols[1] || cols[0],
          price: cols[2] || 0,
          category: cols[3] || 'عام',
          description: cols[4] || ''
        };

        try {
          await fetch(CONFIG.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemPayload)
          });
          importedCount++;
        } catch (err) {
          console.error('Import error row ' + i, err);
        }
      }
    }

    showLoading(false);
    showToast(`🎉 تم استيراد ${importedCount} عنصر بنجاح!`, 'success');
    setTimeout(() => location.reload(), 1500);
  };

  reader.readAsText(file, 'UTF-8');
}

// ==========================================
// 5. أدوات واجهة المستخدم (Toast & Helpers)
// ==========================================
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed; bottom: 25px; left: 25px; z-index: 9999;
      display: flex; flex-direction: column; gap: 10px;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#F59E0B';
  
  toast.style.cssText = `
    background: ${bgColor}; color: #ffffff; padding: 14px 24px;
    border-radius: 12px; font-weight: 600; font-family: system-ui, sans-serif;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15); display: flex; align-items: center;
    gap: 10px; animation: slideIn 0.3s ease;
  `;
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

function loadClientData() {
  // جلب بيانات الحساب المفتوح من localStorage
  const savedData = localStorage.getItem('lucidia_client');
  if (savedData) {
    currentClient = JSON.parse(savedData);
  } else {
    // العميل الافتراضي للتجربة
    currentClient = {
      id: 'recDefaultClient123',
      company_name: 'شركة لوسيديا للحلول',
      sector: 'Lucidia Estate',
      whatsapp: '01110737888'
    };
  }
}

function setupEventListeners() {
  const formSettings = document.getElementById('form-settings');
  if (formSettings) formSettings.addEventListener('submit', saveSettings);

  const btnExport = document.getElementById('btn-export-csv');
  if (btnExport) btnExport.addEventListener('click', exportToCSV);

  const inputImport = document.getElementById('input-import-csv');
  if (inputImport) {
    inputImport.addEventListener('change', (e) => {
      if (e.target.files.length > 0) importFromCSV(e.target.files[0]);
    });
  }
}
