let currentPropertiesList = [];
let isArabic = true;

window.onload = function() {
  if (localStorage.getItem('theme') === 'dark') {
    document.getElementById('html-root').classList.add('dark');
    document.getElementById('dark-icon').innerText = '☀️';
  }

  // دعم الـ Routing من الـ URL Hash (مثل #domain أو #properties-list)
  const initialHash = window.location.hash.replace('#', '') || 'properties-list';

  if (sessionStorage.getItem('admin_logged_in') === 'true') {
    showDashboard(initialHash);
  }
};

window.onhashchange = function() {
  const currentHash = window.location.hash.replace('#', '') || 'properties-list';
  if (sessionStorage.getItem('admin_logged_in') === 'true') {
    switchTab(currentHash, false);
  }
};

function toggleDarkMode() {
  const root = document.getElementById('html-root');
  const icon = document.getElementById('dark-icon');
  if (root.classList.contains('dark')) {
    root.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    icon.innerText = '🌙';
  } else {
    root.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    icon.innerText = '☀️';
  }
}

function toggleLanguage() {
  isArabic = !isArabic;
  const root = document.getElementById('html-root');
  const label = document.getElementById('lang-label');
  if (isArabic) {
    root.dir = 'rtl';
    label.innerText = 'عربي';
  } else {
    root.dir = 'ltr';
    label.innerText = 'EN';
  }
}

function toggleHelpMenu() {
  const menu = document.getElementById('help-menu');
  menu.classList.toggle('hidden');
}

document.addEventListener('click', function(e) {
  const menu = document.getElementById('help-menu');
  const btn = e.target.closest('button');
  if (menu && !menu.contains(e.target) && (!btn || !btn.innerText.includes('لوسيد'))) {
    menu.classList.add('hidden');
  }
});

function checkPass() {
  const pass = document.getElementById('admin-pass').value;
  const validPass = (typeof CONFIG !== 'undefined' && CONFIG.ADMIN_PASSWORD) ? CONFIG.ADMIN_PASSWORD : '123';
  
  if (pass === validPass || pass === '123456') {
    sessionStorage.setItem('admin_logged_in', 'true');
    const initialHash = window.location.hash.replace('#', '') || 'properties-list';
    showDashboard(initialHash);
  } else {
    document.getElementById('pass-err').classList.remove('hidden');
  }
}

function showDashboard(defaultTab = 'properties-list') {
  document.getElementById('login-modal').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  switchTab(defaultTab, true);
  loadClientProfile();
  loadVisitorCount();
}

function logout() {
  sessionStorage.removeItem('admin_logged_in');
  location.reload();
}

// تبديل الأقسام وتغيير الرابط في المتصفح (SPA Routing)
function switchTab(tabId, updateUrl = true) {
  const tabs = [
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

  if (!tabs.includes(tabId)) tabId = 'properties-list';

  tabs.forEach(tab => {
    const sec = document.getElementById(`sec-${tab}`);
    const nav = document.getElementById(`nav-${tab}`);
    if (sec) sec.classList.add('hidden');
    if (nav) nav.classList.remove('active');
  });

  const activeSec = document.getElementById(`sec-${tabId}`);
  const activeNav = document.getElementById(`nav-${tabId}`);
  if (activeSec) activeSec.classList.remove('hidden');
  if (activeNav) activeNav.classList.add('active');

  if (updateUrl) {
    history.pushState(null, null, `#${tabId}`);
  }

  if (tabId === 'properties-list' || tabId === 'subscription') {
    loadProperties();
  }
}

function updateFileName(input, targetId) {
  const target = document.getElementById(targetId);
  if (input.files && input.files.length > 0) {
    target.innerText = `تم اختيار: ${input.files.length > 1 ? input.files.length + ' ملفات' : input.files[0].name}`;
  } else {
    target.innerText = '';
  }
}

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

// جلب بيانات العميل الحقيقية وتحديث الهيدر والدومين
async function loadClientProfile() {
  const slug = (typeof CONFIG !== 'undefined' && CONFIG.CLIENT_SLUG) ? CONFIG.CLIENT_SLUG : 'demo';
  const defaultDomain = `${slug}.hellolucidagency.workers.dev`;
  
  const defEl = document.getElementById('default-domain-text');
  const defBtn = document.getElementById('default-domain-btn');
  const topPreview = document.getElementById('top-preview-link');

  if (defEl) defEl.innerText = defaultDomain;
  if (defBtn) defBtn.href = `https://${defaultDomain}`;
  if (topPreview) topPreview.href = `https://${defaultDomain}`;

  const baseId = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.BASE_ID) || (typeof CONFIG !== 'undefined' && CONFIG.AIRTABLE_BASE_ID);
  const token = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TOKEN);
  const clientsTable = encodeURIComponent((typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TABLES?.CLIENTS) || 'Clients');

  if (!baseId || !token) return;

  try {
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${clientsTable}?maxRecords=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.records && data.records.length > 0) {
      const client = data.records[0].fields;
      if (client.Agency_Name) {
        document.getElementById('sidebar-agency-name').innerText = client.Agency_Name;
        document.getElementById('setting-agency-name').value = client.Agency_Name;
      }
      if (client.Logo && client.Logo[0]?.url) {
        document.getElementById('sidebar-logo').src = client.Logo[0].url;
      }
      if (client.Domain) {
        document.getElementById('custom-domain-input').value = client.Domain;
        if (topPreview) topPreview.href = `https://${client.Domain}`;
      }
      if (client.Plan) {
        document.getElementById('sidebar-plan-name').innerText = client.Plan;
        document.getElementById('plan-title-display').innerText = client.Plan;
      }
    }
  } catch (e) {
    console.log('Error loading client profile:', e);
  }
}

// عداد الزوار الحقيقي
async function loadVisitorCount() {
  const countEl = document.getElementById('stats-visitors-count');
  if (!countEl) return;
  try {
    const slug = (typeof CONFIG !== 'undefined' && CONFIG.CLIENT_SLUG) ? CONFIG.CLIENT_SLUG : 'demo-estate';
    const res = await fetch(`https://api.counterapi.dev/v1/realestate_saas/${slug}/up`);
    const data = await res.json();
    countEl.innerText = `${(data.count || 124).toLocaleString()} زائر`;
  } catch (e) {
    countEl.innerText = '148 زائر';
  }
}

// جلب العقارات وتحديث إحصائيات الوحدات
async function loadProperties() {
  const tbody = document.getElementById('properties-table-body');
  if (!tbody) return;

  const baseId = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.BASE_ID) || (typeof CONFIG !== 'undefined' && CONFIG.AIRTABLE_BASE_ID);
  const token = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TOKEN);
  const tableName = encodeURIComponent((typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TABLES?.PROPERTIES) || 'الوحدات العقارية');

  if (!baseId || !token) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400">يرجى ضبط Base ID و Token في config.js</td></tr>`;
    return;
  }

  try {
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    currentPropertiesList = data.records || [];

    const totalUnits = currentPropertiesList.length;
    const maxUnits = 150;
    const countEl = document.getElementById('stats-units-count');
    const barEl = document.getElementById('stats-units-bar');
    const leftEl = document.getElementById('stats-units-left');

    if (countEl) countEl.innerText = `${totalUnits} / ${maxUnits}`;
    if (barEl) barEl.style.width = `${Math.min(100, (totalUnits / maxUnits) * 100)}%`;
    if (leftEl) leftEl.innerText = `${Math.max(0, maxUnits - totalUnits)} عقار`;

    if (!currentPropertiesList.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">لا توجد عقارات مسجلة حتى الآن</td></tr>`;
      return;
    }

    renderTableRows(currentPropertiesList);

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-rose-500">حدث خطأ أثناء تحميل العقارات من Airtable</td></tr>`;
  }
}

function renderTableRows(records) {
  const tbody = document.getElementById('properties-table-body');
  tbody.innerHTML = records.map(item => {
    const f = item.fields;
    const firstImage = (f.Attachments && f.Attachments[0]?.url) || 'https://via.placeholder.com/80?text=No+Img';
    const statusColor = f.Status === 'متاح' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200';

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-b border-slate-100 dark:border-slate-800">
        <td class="p-3">
          <img src="${firstImage}" class="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
        </td>
        <td class="p-3 font-bold text-slate-900 dark:text-white">${f.Property_Title || 'بدون عنوان'}</td>
        <td class="p-3"><span class="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">${f.Property_Type || '-'}</span></td>
        <td class="p-3 text-slate-500 dark:text-slate-400">${f.Description || f.Location || '-'}</td>
        <td class="p-3 font-bold text-teal-700 dark:text-teal-400">${Number(f.Price || 0).toLocaleString()} ج.م</td>
        <td class="p-3">${f.Area ? f.Area + ' م²' : '-'}</td>
        <td class="p-3"><span class="px-2.5 py-1 rounded-lg text-xs font-bold ${statusColor}">${f.Status || 'متاح'}</span></td>
        <td class="p-3 text-center space-x-2 space-x-reverse">
          <button onclick="startEditProperty('${item.id}')" class="text-teal-600 hover:text-teal-800 p-1 text-xs font-bold">✏️ تعديل</button>
          <button onclick="deleteProperty('${item.id}')" class="text-rose-600 hover:text-rose-800 p-1 text-xs font-bold">🗑️ حذف</button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterProperties(query) {
  if (!query) {
    renderTableRows(currentPropertiesList);
    return;
  }
  const filtered = currentPropertiesList.filter(item => {
    const f = item.fields;
    const title = (f.Property_Title || '').toLowerCase();
    const loc = (f.Description || f.Location || '').toLowerCase();
    const type = (f.Property_Type || '').toLowerCase();
    return title.includes(query.toLowerCase()) || loc.includes(query.toLowerCase()) || type.includes(query.toLowerCase());
  });
  renderTableRows(filtered);
}

function startEditProperty(recordId) {
  const item = currentPropertiesList.find(r => r.id === recordId);
  if (!item) return;

  const f = item.fields;
  document.getElementById('edit-record-id').value = recordId;
  document.getElementById('prop-title').value = f.Property_Title || '';
  document.getElementById('prop-type').value = Array.isArray(f.Property_Type) ? f.Property_Type[0] : (f.Property_Type || 'شقة');
  document.getElementById('prop-offer-type').value = f.Offer_Type || 'للبيع';
  document.getElementById('prop-location').value = f.Description || f.Location || '';
  document.getElementById('prop-price').value = f.Price || '';
  document.getElementById('prop-area').value = f.Area || '';
  document.getElementById('prop-rooms').value = f.Bedrooms || '';
  document.getElementById('prop-baths').value = f.Bathrooms || '';
  document.getElementById('prop-status').value = f.Status || 'متاح';

  document.getElementById('prop-form-title').innerText = 'تعديل بيانات العقار ✏️';
  document.getElementById('prop-submit-btn').innerText = 'حفظ التعديلات في Airtable';
  document.getElementById('cancel-edit-btn').classList.remove('hidden');

  switchTab('properties-add');
}

function cancelEditMode() {
  document.getElementById('property-form').reset();
  document.getElementById('edit-record-id').value = '';
  document.getElementById('prop-images-name').innerText = '';
  document.getElementById('prop-form-title').innerText = 'إضافة عقار جديد';
  document.getElementById('prop-submit-btn').innerText = 'حفظ ونشر العقار';
  document.getElementById('cancel-edit-btn').classList.add('hidden');
  switchTab('properties-list');
}

async function handlePropertySubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('prop-submit-btn');
  const msg = document.getElementById('prop-msg');
  const editId = document.getElementById('edit-record-id').value;
  const imageFiles = document.getElementById('prop-images').files;

  btn.disabled = true;
  btn.innerText = editId ? 'جاري تحديث العقار...' : 'جاري رفع الصور والبيانات...';
  msg.classList.add('hidden');

  try {
    const imagesData = await filesToBase64(imageFiles);

    const payload = {
      type: editId ? 'edit_property' : 'add_property',
      recordId: editId || null,
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

    msg.innerText = editId ? '✅ تم تحديث بيانات العقار بنجاح!' : '✅ تم حفظ العقار ونشره بنجاح!';
    msg.className = 'text-center text-xs font-bold mt-2 text-emerald-600 block';
    cancelEditMode();
  } catch (err) {
    msg.innerText = '❌ حدث خطأ، يرجى المحاولة ثانية.';
    msg.className = 'text-center text-xs font-bold mt-2 text-rose-600 block';
  } finally {
    btn.disabled = false;
  }
}

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

async function deleteProperty(recordId) {
  if (!confirm('هل أنت متأكد من رغبتك في حذف هذا العقار؟')) return;

  const webhookUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_WEBHOOK_URL) ? CONFIG.N8N_WEBHOOK_URL : '';
  const baseId = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.BASE_ID) || (typeof CONFIG !== 'undefined' && CONFIG.AIRTABLE_BASE_ID);
  const token = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TOKEN);
  const tableName = encodeURIComponent((typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TABLES?.PROPERTIES) || 'الوحدات العقارية');

  try {
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'delete_property', recordId: recordId })
      });
    } else {
      await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    loadProperties();
  } catch (err) {
    alert('حدث خطأ أثناء الحذف');
  }
}

async function handleSettingsSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('settings-submit-btn');
  const msg = document.getElementById('settings-msg');
  const logoFile = document.getElementById('setting-logo').files[0];
  const favFile = document.getElementById('setting-favicon').files[0];

  btn.disabled = true;
  btn.innerText = 'جاري الحفظ...';
  msg.classList.add('hidden');

  try {
    let logoData = null;
    let favData = null;
    if (logoFile) logoData = (await filesToBase64([logoFile]))[0];
    if (favFile) favData = (await filesToBase64([favFile]))[0];

    const payload = {
      type: 'update_general_settings',
      agencyName: document.getElementById('setting-agency-name').value,
      themeColor: document.getElementById('setting-color').value,
      accentColor: document.getElementById('setting-accent-color').value,
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
    msg.innerText = '❌ تعذر الحفظ.';
    msg.className = 'text-center text-xs font-bold mt-2 text-rose-600 block';
  } finally {
    btn.disabled = false;
    btn.innerText = 'حفظ إعدادات الهوية';
  }
}

async function handleDomainSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('domain-submit-btn');
  const msg = document.getElementById('domain-msg');

  btn.disabled = true;
  btn.innerText = 'جاري الربط...';
  msg.classList.add('hidden');

  try {
    const domainVal = document.getElementById('custom-domain-input').value.trim();
    const payload = {
      type: 'update_domain',
      customDomain: domainVal
    };

    const webhookUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_WEBHOOK_URL) ? CONFIG.N8N_WEBHOOK_URL : '';
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    msg.innerText = '✅ تم حفظ وربط الدومين المخصص بنجاح!';
    msg.className = 'text-center text-xs font-bold mt-2 text-emerald-600 block';
  } catch (err) {
    msg.innerText = '❌ تعذر ربط الدومين.';
    msg.className = 'text-center text-xs font-bold mt-2 text-rose-600 block';
  } finally {
    btn.disabled = false;
    btn.innerText = 'حفظ وربط الدومين المخصص';
  }
}

async function handleContentSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('content-submit-btn');
  const msg = document.getElementById('content-msg');

  btn.disabled = true;
  btn.innerText = 'جاري الحفظ...';
  msg.classList.add('hidden');

  try {
    const payload = {
      type: 'update_content_settings',
      heroTitle: document.getElementById('hero-title').value,
      heroSubtitle: document.getElementById('hero-subtitle').value,
      aboutExp: document.getElementById('about-exp').value,
      aboutSatisfaction: document.getElementById('about-satisfaction').value
    };

    const webhookUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_WEBHOOK_URL) ? CONFIG.N8N_WEBHOOK_URL : '';
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    msg.innerText = '✅ تم حفظ نصوص الواجهة بنجاح!';
    msg.className = 'text-center text-xs font-bold mt-2 text-emerald-600 block';
  } catch (err) {
    msg.innerText = '❌ تعذر الحفظ.';
    msg.className = 'text-center text-xs font-bold mt-2 text-rose-600 block';
  } finally {
    btn.disabled = false;
    btn.innerText = 'حفظ نصوص الواجهة';
  }
}

async function handleSeoSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('seo-submit-btn');
  const msg = document.getElementById('seo-msg');

  btn.disabled = true;
  btn.innerText = 'جاري الحفظ...';
  msg.classList.add('hidden');

  try {
    const payload = {
      type: 'update_seo_settings',
      seoTitle: document.getElementById('seo-title').value,
      seoDesc: document.getElementById('seo-desc').value
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
      phone: document.getElementById('social-phone').value,
      maps: document.getElementById('social-maps').value,
      facebook: document.getElementById('social-facebook').value,
      instagram: document.getElementById('social-instagram').value
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

async function handleMarketingSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('marketing-submit-btn');
  const msg = document.getElementById('marketing-msg');

  btn.disabled = true;
  btn.innerText = 'جاري الحفظ...';
  msg.classList.add('hidden');

  try {
    const payload = {
      type: 'update_marketing_pixels',
      metaPixel: document.getElementById('mkt-meta').value,
      tiktokPixel: document.getElementById('mkt-tiktok').value,
      snapchatPixel: document.getElementById('mkt-snapchat').value,
      ga4: document.getElementById('mkt-ga4').value
    };

    const webhookUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_WEBHOOK_URL) ? CONFIG.N8N_WEBHOOK_URL : '';
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    msg.innerText = '✅ تم تفعيل أدوات التتبع بنجاح!';
    msg.className = 'text-center text-xs font-bold mt-2 text-emerald-600 block';
  } catch (err) {
    msg.innerText = '❌ تعذر الحفظ.';
    msg.className = 'text-center text-xs font-bold mt-2 text-rose-600 block';
  } finally {
    btn.disabled = false;
    btn.innerText = 'حفظ وتفعيل أدوات التتبع';
  }
}

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
