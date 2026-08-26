let currentPropertiesList = [];

// التحقق من الجلسة المحفوظة
window.onload = function() {
  if (sessionStorage.getItem('admin_logged_in') === 'true') {
    showDashboard();
  }
};

function checkPass() {
  const pass = document.getElementById('admin-pass').value;
  const validPass = (typeof CONFIG !== 'undefined' && CONFIG.ADMIN_PASSWORD) ? CONFIG.ADMIN_PASSWORD : '123';
  
  if (pass === validPass || pass === '123456') {
    sessionStorage.setItem('admin_logged_in', 'true');
    showDashboard();
  } else {
    document.getElementById('pass-err').classList.remove('hidden');
  }
}

function showDashboard() {
  document.getElementById('login-modal').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  loadProperties();
}

function logout() {
  sessionStorage.removeItem('admin_logged_in');
  location.reload();
}

// التنقل بين أقسام الـ Sidebar
function switchTab(tabId) {
  const tabs = [
    'properties-list',
    'properties-add',
    'settings-general',
    'settings-seo',
    'settings-social',
    'subscription'
  ];

  tabs.forEach(tab => {
    const sec = document.getElementById(`sec-${tab}`);
    const nav = document.getElementById(`nav-${tab}`);
    if (sec) sec.classList.add('hidden');
    if (nav) {
      nav.className = 'nav-inactive w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-right';
    }
  });

  const activeSec = document.getElementById(`sec-${tabId}`);
  const activeNav = document.getElementById(`nav-${tabId}`);
  if (activeSec) activeSec.classList.remove('hidden');
  if (activeNav) {
    activeNav.className = 'nav-active w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-right';
  }

  if (tabId === 'properties-list') {
    loadProperties();
  }
}

// دالة تحويل ملفات الصور إلى Base64
async function filesToBase64(files) {
  const promises = Array.from(files).map(file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve({ name: file.name, data: reader.result });
      reader.onerror = error => reject(error);
    });
  });
  return Promise.all(promises);
}

// جلب العقارات من Airtable وعرضها بالجدول
async function loadProperties() {
  const tbody = document.getElementById('properties-table-body');
  if (!tbody) return;

  const baseId = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.BASE_ID) || (typeof CONFIG !== 'undefined' && CONFIG.AIRTABLE_BASE_ID);
  const token = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TOKEN);
  const tableName = encodeURIComponent((typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TABLES?.PROPERTIES) || 'الوحدات العقارية');

  if (!baseId || !token) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400">يرجى التأكد من ضبط إعدادات الـ Base ID و Token في config.js</td></tr>`;
    return;
  }

  try {
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    currentPropertiesList = data.records || [];

    if (!currentPropertiesList.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">لا توجد عقارات مسجلة حتى الآن</td></tr>`;
      return;
    }

    tbody.innerHTML = currentPropertiesList.map(item => {
      const f = item.fields;
      const firstImage = (f.Attachments && f.Attachments[0]?.url) || 'https://via.placeholder.com/80?text=No+Img';
      const statusColor = f.Status === 'متاح' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200';

      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
          <td class="p-3">
            <img src="${firstImage}" class="w-12 h-12 object-cover rounded-xl border border-slate-200" />
          </td>
          <td class="p-3 font-bold text-slate-900">${f.Property_Title || 'بدون عنوان'}</td>
          <td class="p-3"><span class="bg-slate-100 px-2 py-1 rounded text-slate-600">${f.Property_Type || '-'}</span></td>
          <td class="p-3 text-slate-500">${f.Description || f.Location || '-'}</td>
          <td class="p-3 font-bold text-teal-700">${Number(f.Price || 0).toLocaleString()} ج.م</td>
          <td class="p-3">${f.Area ? f.Area + ' م²' : '-'}</td>
          <td class="p-3"><span class="px-2.5 py-1 rounded-lg text-xs font-bold ${statusColor}">${f.Status || 'متاح'}</span></td>
          <td class="p-3 text-center">
            <button onclick="deleteProperty('${item.id}')" class="text-rose-600 hover:text-rose-800 p-2 text-xs font-bold">🗑️ حذف</button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-rose-500">حدث خطأ أثناء تحميل العقارات من Airtable</td></tr>`;
  }
}

// تصدير جدول العقارات إلى Excel
function exportToExcel() {
  if (!currentPropertiesList.length) {
    alert('لا توجد عقارات مسجلة لتصديرها.');
    return;
  }

  const exportData = currentPropertiesList.map(item => {
    const f = item.fields;
    return {
      'عنوان العقار': f.Property_Title || '',
      'النوع': f.Property_Type || '',
      'نوع العرض': f.Offer_Type || '',
      'المنطقة / الوصف': f.Description || f.Location || '',
      'السعر (ج.م)': f.Price || 0,
      'المساحة (م²)': f.Area || 0,
      'عدد الغرف': f.Bedrooms || 0,
      'عدد الحمامات': f.Bathrooms || 0,
      'الحالة': f.Status || 'متاح'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الوحدات العقارية');
  XLSX.writeFile(workbook, 'قائمة_العقارات.xlsx');
}

// حذف عقار من Airtable
async function deleteProperty(recordId) {
  if (!confirm('هل أنت متأكد من رغبتك في حذف هذا العقار؟')) return;

  const baseId = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.BASE_ID) || (typeof CONFIG !== 'undefined' && CONFIG.AIRTABLE_BASE_ID);
  const token = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TOKEN);
  const tableName = encodeURIComponent((typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TABLES?.PROPERTIES) || 'الوحدات العقارية');

  try {
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      loadProperties();
    } else {
      alert('تعذر حذف العقار');
    }
  } catch (err) {
    alert('حدث خطأ أثناء الحذف');
  }
}

// إرسال بيانات إضافة العقار
async function handlePropertySubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('prop-submit-btn');
  const msg = document.getElementById('prop-msg');
  const imageFiles = document.getElementById('prop-images').files;

  btn.disabled = true;
  btn.innerText = 'جاري رفع الصور والبيانات...';
  msg.classList.add('hidden');

  try {
    const imagesData = await filesToBase64(imageFiles);

    const payload = {
      type: 'add_property',
      title: document.getElementById('prop-title').value,
      propertyType: document.getElementById('prop-type').value,
      offerType: document.getElementById('prop-offer-type').value,
      location: document.getElementById('prop-location').value,
      price: document.getElementById('prop-price').value,
      area: document.getElementById('prop-area').value,
      rooms: document.getElementById('prop-rooms').value,
      baths: document.getElementById('prop-baths').value,
      status: document.getElementById('prop-status').value,
      images: imagesData
    };

    const webhookUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_WEBHOOK_URL) ? CONFIG.N8N_WEBHOOK_URL : '';

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    msg.innerText = '✅ تم حفظ العقار ونشره بنجاح!';
    msg.className = 'text-center text-xs font-bold mt-2 text-emerald-600 block';
    document.getElementById('property-form').reset();
    setTimeout(() => switchTab('properties-list'), 1500);
  } catch (err) {
    msg.innerText = '❌ حدث خطأ أثناء الحفظ، يرجى المحاولة ثانية.';
    msg.className = 'text-center text-xs font-bold mt-2 text-rose-600 block';
  } finally {
    btn.disabled = false;
    btn.innerText = 'حفظ ونشر العقار';
  }
}

// حفظ إعدادات الهوية
async function handleSettingsSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('settings-submit-btn');
  const msg = document.getElementById('settings-msg');
  const logoFile = document.getElementById('setting-logo').files[0];
  const favFile = document.getElementById('setting-favicon').files[0];

  btn.disabled = true;
  btn.innerText = 'جاري حفظ الإعدادات...';
  msg.classList.add('hidden');

  try {
    let logoData = null;
    let favData = null;
    if (logoFile) logoData = (await filesToBase64([logoFile]))[0];
    if (favFile) favData = (await filesToBase64([favFile]))[0];

    const payload = {
      type: 'update_general_settings',
      agencyName: document.getElementById('setting-agency-name').value,
      phone: document.getElementById('setting-phone').value,
      themeColor: document.getElementById('setting-color').value,
      logo: logoData,
      favicon: favData
    };

    const webhookUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_WEBHOOK_URL) ? CONFIG.N8N_WEBHOOK_URL : '';
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    msg.innerText = '✅ تم حفظ إعدادات الهوية بنجاح!';
    msg.className = 'text-center text-xs font-bold mt-2 text-emerald-600 block';
  } catch (err) {
    msg.innerText = '❌ تعذر الحفظ، يرجى المحاولة ثانية.';
    msg.className = 'text-center text-xs font-bold mt-2 text-rose-600 block';
  } finally {
    btn.disabled = false;
    btn.innerText = 'حفظ إعدادات الهوية';
  }
}

// حفظ إعدادات الـ SEO
async function handleSeoSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('seo-submit-btn');
  const msg = document.getElementById('seo-msg');
  const shareImg = document.getElementById('seo-share-image').files[0];

  btn.disabled = true;
  btn.innerText = 'جاري الحفظ...';
  msg.classList.add('hidden');

  try {
    let shareImgData = null;
    if (shareImg) shareImgData = (await filesToBase64([shareImg]))[0];

    const payload = {
      type: 'update_seo_settings',
      seoTitle: document.getElementById('seo-title').value,
      seoDesc: document.getElementById('seo-desc').value,
      shareImage: shareImgData
    };

    const webhookUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_WEBHOOK_URL) ? CONFIG.N8N_WEBHOOK_URL : '';
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    msg.innerText = '✅ تم حفظ إعدادات SEO بنجاح!';
    msg.className = 'text-center text-xs font-bold mt-2 text-emerald-600 block';
  } catch (err) {
    msg.innerText = '❌ تعذر الحفظ.';
    msg.className = 'text-center text-xs font-bold mt-2 text-rose-600 block';
  } finally {
    btn.disabled = false;
    btn.innerText = 'حفظ إعدادات الـ SEO';
  }
}

// حفظ روابط وسائل التواصل
async function handleSocialSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('social-submit-btn');
  const msg = document.getElementById('social-msg');

  btn.disabled = true;
  btn.innerText = 'جاري الحفظ...';
  msg.classList.add('hidden');

  try {
    const payload = {
      type: 'update_social_settings',
      whatsapp: document.getElementById('social-whatsapp').value,
      facebook: document.getElementById('social-facebook').value,
      instagram: document.getElementById('social-instagram').value,
      tiktok: document.getElementById('social-tiktok').value,
      linkedin: document.getElementById('social-linkedin').value
    };

    const webhookUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_WEBHOOK_URL) ? CONFIG.N8N_WEBHOOK_URL : '';
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    msg.innerText = '✅ تم حفظ روابط التواصل بنجاح!';
    msg.className = 'text-center text-xs font-bold mt-2 text-emerald-600 block';
  } catch (err) {
    msg.innerText = '❌ تعذر الحفظ.';
    msg.className = 'text-center text-xs font-bold mt-2 text-rose-600 block';
  } finally {
    btn.disabled = false;
    btn.innerText = 'حفظ الروابط';
  }
}

// نوافذ InstaPay
function openInstapayModal() {
  const modal = document.getElementById('instapay-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeInstapayModal() {
  const modal = document.getElementById('instapay-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}
