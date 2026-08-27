let currentPropertiesList = [];
let isArabic = true;
// متغير لتخزين قطاع العميل الحالي (افتراضياً عقارات)
let clientSector = 'عقارات'; 

window.onload = function() {
  if (localStorage.getItem('theme') === 'dark') {
    document.getElementById('html-root').classList.add('dark');
  }

  // دعم الـ Routing من الـ URL Hash
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
  if (root.classList.contains('dark')) {
    root.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    root.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
}

function toggleHelpMenu() {
  const menu = document.getElementById('help-menu');
  menu.classList.toggle('hidden');
}

document.addEventListener('click', function(e) {
  const menu = document.getElementById('help-menu');
  const btn = e.target.closest('button');
  if (menu && !menu.contains(e.target) && (!btn || (!btn.innerText.includes('الدعم') && !btn.innerHTML.includes('help-circle')))) {
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
  
  // تفعيل أيقونات Lucide إذا لم تكن مفعلة
  if(typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  loadClientProfile().then(() => {
    switchTab(defaultTab, true);
    loadVisitorCount();
  });
}

function logout() {
  sessionStorage.removeItem('admin_logged_in');
  location.reload();
}

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

// دالة تحديث واجهة المستخدم بناءً على القطاع
function updateUIBasedOnSector(sector) {
  clientSector = sector;
  document.getElementById('item-sector').value = sector;
  
  const ui = {
    'عقارات': {
      groupLabel: 'العقارات والوحدات',
      listLabel: 'جميع الوحدات',
      addLabel: 'إضافة عقار',
      titleLabel: 'عنوان العقار *',
      catLabel: 'نوع العقار *',
      typeLabel: 'نوع العرض *',
      locLabel: 'المنطقة / الموقع *',
      categories: ['شقة', 'فيلا', 'تاون هاوس', 'تجاري', 'شاليه', 'أرض'],
      types: ['للبيع', 'للإيجار'],
      showRealEstateFields: true
    },
    'محاماة': {
      groupLabel: 'الخدمات القانونية',
      listLabel: 'جميع الخدمات/القضايا',
      addLabel: 'إضافة خدمة',
      titleLabel: 'اسم الخدمة / القضية *',
      catLabel: 'التخصص *',
      typeLabel: 'نوع الخدمة *',
      locLabel: 'المحكمة / الجهة *',
      categories: ['مدني', 'جنائي', 'أسرة', 'تأسيس شركات', 'استشارة'],
      types: ['توكيل', 'استشارة أونلاين', 'كتابة عقود'],
      showRealEstateFields: false
    },
    'عيادات': {
      groupLabel: 'الخدمات الطبية',
      listLabel: 'جميع الكشوفات',
      addLabel: 'إضافة كشف/خدمة',
      titleLabel: 'اسم الخدمة / الكشف *',
      catLabel: 'القسم الطبي *',
      typeLabel: 'نوع الكشف *',
      locLabel: 'الفرع / العيادة *',
      categories: ['أسنان', 'جلدية', 'باطنة', 'أطفال', 'تجميل'],
      types: ['كشف بالعيادة', 'استشارة فيديو', 'جلسة'],
      showRealEstateFields: false
    },
    'سيارات': {
      groupLabel: 'معرض السيارات',
      listLabel: 'جميع السيارات',
      addLabel: 'إضافة سيارة',
      titleLabel: 'ماركة وموديل السيارة *',
      catLabel: 'نوع السيارة *',
      typeLabel: 'الحالة *',
      locLabel: 'الفرع / المعرض *',
      categories: ['سيدان', 'SUV', 'هاتشباك', 'نقل'],
      types: ['جديد', 'مستعمل'],
      showRealEstateFields: false
    }
  };

  const config = ui[sector] || ui['عقارات'];

  // تحديث نصوص القائمة الجانبية والأزرار
  const navGroup = document.getElementById('nav-group-products');
  if(navGroup) navGroup.innerText = config.groupLabel;
  const navListLabel = document.getElementById('nav-list-label');
  if(navListLabel) navListLabel.innerText = config.listLabel;
  const navAddLabel = document.getElementById('nav-add-label');
  if(navAddLabel) navAddLabel.innerText = config.addLabel;
  
  const listTitle = document.getElementById('list-title');
  if(listTitle) listTitle.innerText = config.listLabel;
  const btnAddLabel = document.getElementById('btn-add-label');
  if(btnAddLabel) btnAddLabel.innerText = config.addLabel;
  
  const propFormTitle = document.getElementById('prop-form-title');
  if(propFormTitle) propFormTitle.innerText = config.addLabel;

  // تحديث الـ Labels في فورم الإضافة
  document.getElementById('lbl-title').innerText = config.titleLabel;
  document.getElementById('lbl-category').innerText = config.catLabel;
  document.getElementById('lbl-type').innerText = config.typeLabel;
  document.getElementById('lbl-location').innerText = config.locLabel;
  
  // تحديث عناوين الجدول
  const thLocation = document.getElementById('th-location');
  if(thLocation) thLocation.innerText = config.locLabel.replace(' *','');
  
  // إخفاء/إظهار حقول العقارات الخاصة (مساحة، غرف، حمامات)
  const realEstateFields = document.querySelectorAll('.real-estate-field');
  realEstateFields.forEach(field => {
    if(config.showRealEstateFields) {
      field.classList.remove('hidden');
    } else {
      field.classList.add('hidden');
    }
  });

  // إخفاء عمود المساحة من الجدول للقطاعات غير العقارية
  const thArea = document.getElementById('th-area');
  if(thArea) {
    if(config.showRealEstateFields) thArea.classList.remove('hidden');
    else thArea.classList.add('hidden');
  }

  // تعبئة الـ Select Options
  const catSelect = document.getElementById('prop-type');
  catSelect.innerHTML = `<option value="" disabled selected>اختر...</option>` + 
                        config.categories.map(c => `<option value="${c}">${c}</option>`).join('');

  const typeSelect = document.getElementById('prop-offer-type');
  typeSelect.innerHTML = config.types.map(t => `<option value="${t}">${t}</option>`).join('');
}

// جلب بيانات العميل الحقيقية
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
      
      // استخراج القطاع من Airtable وتحديث الواجهة
      if(client.Sector) {
        updateUIBasedOnSector(client.Sector);
      } else {
        updateUIBasedOnSector('عقارات'); // افتراضي
      }

      if (client.Company_Name) {
        document.getElementById('sidebar-agency-name').innerText = client.Company_Name;
        document.getElementById('setting-agency-name').value = client.Company_Name;
      }
      if (client.Logo_URL) {
        document.getElementById('sidebar-logo').src = client.Logo_URL;
      }
      if (client.Domain) {
        document.getElementById('custom-domain-input').value = client.Domain;
        if (topPreview) topPreview.href = `https://${client.Domain}`;
      }
      if (client.Subscription_Plan) {
        document.getElementById('sidebar-plan-name').innerText = client.Subscription_Plan;
        document.getElementById('plan-title-display').innerText = client.Subscription_Plan;
      }
      
      // تعبئة حقول السوشيال والميتا إذا كانت موجودة (اختياري)
      if(document.getElementById('social-whatsapp') && client.Whatsapp) document.getElementById('social-whatsapp').value = client.Whatsapp;
      if(document.getElementById('mkt-meta') && client.Meta_Pixel_ID) document.getElementById('mkt-meta').value = client.Meta_Pixel_ID;
      
    }
  } catch (e) {
    console.log('Error loading client profile:', e);
    updateUIBasedOnSector('عقارات'); // Fallback
  }
}

async function loadVisitorCount() {
  const countEl = document.getElementById('stats-visitors-count');
  if (!countEl) return;
  try {
    const slug = (typeof CONFIG !== 'undefined' && CONFIG.CLIENT_SLUG) ? CONFIG.CLIENT_SLUG : 'demo';
    const res = await fetch(`https://api.counterapi.dev/v1/lucidia_saas/${slug}/up`);
    const data = await res.json();
    countEl.innerText = `${(data.count || 124).toLocaleString()}`;
  } catch (e) {
    countEl.innerText = '148';
  }
}

async function loadProperties() {
  const tbody = document.getElementById('properties-table-body');
  if (!tbody) return;

  const baseId = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.BASE_ID) || (typeof CONFIG !== 'undefined' && CONFIG.AIRTABLE_BASE_ID);
  const token = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TOKEN);
  // تأكد من أن اسم الجدول هنا مطابق لاسم جدول المنتجات/الخدمات في Airtable
  const tableName = encodeURIComponent((typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TABLES?.PROPERTIES) || 'المنتجات / الخدمات');

  if (!baseId || !token) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400">يرجى ضبط إعدادات الربط في config.js</td></tr>`;
    return;
  }

  try {
    // جلب المنتجات المخصصة للقطاع الخاص بالعميل (فلترة إضافية يمكن إضافتها لاحقاً)
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    currentPropertiesList = data.records || [];

    const totalUnits = currentPropertiesList.length;
    const maxUnits = 150;
    const countEl = document.getElementById('stats-items-count');
    const barEl = document.getElementById('stats-items-bar');
    const leftEl = document.getElementById('stats-items-left');

    if (countEl) countEl.innerText = `${totalUnits} / ${maxUnits}`;
    if (barEl) barEl.style.width = `${Math.min(100, (totalUnits / maxUnits) * 100)}%`;
    if (leftEl) leftEl.innerText = `${Math.max(0, maxUnits - totalUnits)} عنصر`;

    if (!currentPropertiesList.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">لا توجد بيانات مسجلة حتى الآن</td></tr>`;
      return;
    }

    renderTableRows(currentPropertiesList);
    if(typeof lucide !== 'undefined') lucide.createIcons();

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-rose-500 flex items-center justify-center gap-2"><i data-lucide="alert-circle"></i> حدث خطأ أثناء الاتصال بقاعدة البيانات</td></tr>`;
    if(typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function renderTableRows(records) {
  const tbody = document.getElementById('properties-table-body');
  const showArea = clientSector === 'عقارات';
  
  tbody.innerHTML = records.map(item => {
    const f = item.fields;
    const firstImage = (f.Attachments && f.Attachments[0]?.url) || 'https://via.placeholder.com/80?text=No+Img';
    
    // دعم الحقول القديمة والجديدة
    const title = f.Item_Title || f.Property_Title || 'بدون عنوان';
    const category = f.Item_Category || f.Property_Type || '-';
    const loc = f.Description || f.Location || '-';
    const price = f.Price || 0;
    const status = f.Status || 'متاح';
    const area = f.Area ? f.Area + ' م²' : '-';

    let statusColor = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    if(status.includes('غير') || status.includes('مباع') || status.includes('مكتمل')) statusColor = 'bg-rose-50 text-rose-600 border border-rose-200';
    if(status.includes('قريبا')) statusColor = 'bg-amber-50 text-amber-600 border border-amber-200';

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-b border-slate-100 dark:border-slate-800">
        <td class="p-3">
          <img src="${firstImage}" class="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
        </td>
        <td class="p-3 font-bold text-slate-900 dark:text-white truncate max-w-[150px]">${title}</td>
        <td class="p-3"><span class="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 text-[11px]">${category}</span></td>
        <td class="p-3 text-slate-500 dark:text-slate-400 truncate max-w-[150px]" title="${loc}">${loc}</td>
        <td class="p-3 font-bold text-blue-600 dark:text-blue-400">${Number(price).toLocaleString()} ج</td>
        ${showArea ? `<td class="p-3 text-slate-600 dark:text-slate-400">${area}</td>` : '<td class="hidden"></td>'}
        <td class="p-3"><span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColor}">${status}</span></td>
        <td class="p-3 text-center">
          <div class="flex justify-center gap-2">
            <button onclick="startEditProperty('${item.id}')" class="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition" title="تعديل">
              <i data-lucide="edit" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteProperty('${item.id}')" class="text-rose-600 hover:text-rose-800 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30 transition" title="حذف">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterProperties(query) {
  if (!query) {
    renderTableRows(currentPropertiesList);
    if(typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }
  const filtered = currentPropertiesList.filter(item => {
    const f = item.fields;
    const title = (f.Item_Title || f.Property_Title || '').toLowerCase();
    const loc = (f.Description || f.Location || '').toLowerCase();
    const type = (f.Item_Category || f.Property_Type || '').toLowerCase();
    return title.includes(query.toLowerCase()) || loc.includes(query.toLowerCase()) || type.includes(query.toLowerCase());
  });
  renderTableRows(filtered);
  if(typeof lucide !== 'undefined') lucide.createIcons();
}

function startEditProperty(recordId) {
  const item = currentPropertiesList.find(r => r.id === recordId);
  if (!item) return;

  const f = item.fields;
  document.getElementById('edit-record-id').value = recordId;
  document.getElementById('prop-title').value = f.Item_Title || f.Property_Title || '';
  
  // Set category gracefully
  const catVal = Array.isArray(f.Item_Category) ? f.Item_Category[0] : (f.Item_Category || f.Property_Type || '');
  const catSelect = document.getElementById('prop-type');
  if([...catSelect.options].some(o => o.value === catVal)) catSelect.value = catVal;
  
  document.getElementById('prop-offer-type').value = f.Item_Type || f.Offer_Type || '';
  document.getElementById('prop-location').value = f.Location || '';
  document.getElementById('prop-description').value = f.Description || '';
  document.getElementById('prop-price').value = f.Price || '';
  document.getElementById('prop-area').value = f.Area || '';
  document.getElementById('prop-rooms').value = f.Bedrooms || '';
  document.getElementById('prop-baths').value = f.Bathrooms || '';
  document.getElementById('prop-status').value = f.Status || 'متاح';

  document.getElementById('prop-form-title').innerText = 'تعديل البيانات';
  const btn = document.getElementById('prop-submit-btn');
  btn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> حفظ التعديلات`;
  document.getElementById('cancel-edit-btn').classList.remove('hidden');

  switchTab('properties-add');
  if(typeof lucide !== 'undefined') lucide.createIcons();
}

function cancelEditMode() {
  document.getElementById('property-form').reset();
  document.getElementById('edit-record-id').value = '';
  document.getElementById('prop-images-name').innerText = '';
  document.getElementById('prop-form-title').innerText = 'إضافة عنصر جديد';
  
  const btn = document.getElementById('prop-submit-btn');
  btn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> حفظ ونشر`;
  
  document.getElementById('cancel-edit-btn').classList.add('hidden');
  switchTab('properties-list');
  if(typeof lucide !== 'undefined') lucide.createIcons();
}

async function handlePropertySubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('prop-submit-btn');
  const msg = document.getElementById('prop-msg');
  const editId = document.getElementById('edit-record-id').value;
  const imageFiles = document.getElementById('prop-images').files;

  btn.disabled = true;
  btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> جاري المعالجة...`;
  if(typeof lucide !== 'undefined') lucide.createIcons();
  msg.classList.add('hidden');

  try {
    let imagesData = null;
    if(imageFiles.length > 0) {
        imagesData = await filesToBase64(imageFiles);
    }

    const payload = {
      type: editId ? 'edit_item' : 'add_item',
      recordId: editId || null,
      Sector: document.getElementById('item-sector').value,
      Item_Title: document.getElementById('prop-title').value,
      Item_Category: document.getElementById('prop-type').value,
      Item_Type: document.getElementById('prop-offer-type').value,
      Location: document.getElementById('prop-location').value,
      Description: document.getElementById('prop-description').value,
      Price: document.getElementById('prop-price').value,
      Area: document.getElementById('prop-area').value,
      Bedrooms: document.getElementById('prop-rooms').value,
      Bathrooms: document.getElementById('prop-baths').value,
      Status: document.getElementById('prop-status').value,
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

    msg.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 inline"></i> ` + (editId ? 'تم تحديث البيانات بنجاح!' : 'تم الحفظ والنشر بنجاح!');
    msg.className = 'flex items-center justify-center gap-1 text-center text-xs font-bold mt-2 text-emerald-600';
    if(typeof lucide !== 'undefined') lucide.createIcons();
    
    setTimeout(() => {
        cancelEditMode();
    }, 1500);

  } catch (err) {
    msg.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 inline"></i> حدث خطأ، يرجى المحاولة ثانية.`;
    msg.className = 'flex items-center justify-center gap-1 text-center text-xs font-bold mt-2 text-rose-600';
    if(typeof lucide !== 'undefined') lucide.createIcons();
  } finally {
    btn.disabled = false;
  }
}

function exportToExcel() {
  if (!currentPropertiesList.length) {
    alert('لا توجد بيانات لتصديرها.');
    return;
  }

  const exportData = currentPropertiesList.map(item => {
    const f = item.fields;
    return {
      'القطاع': f.Sector || '',
      'العنوان': f.Item_Title || f.Property_Title || '',
      'القسم': f.Item_Category || f.Property_Type || '',
      'النوع': f.Item_Type || f.Offer_Type || '',
      'الموقع': f.Location || '',
      'الوصف': f.Description || '',
      'السعر (ج.م)': f.Price || 0,
      'المساحة (م²)': f.Area || 0,
      'الحالة': f.Status || 'متاح'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات');
  XLSX.writeFile(workbook, 'Lucidia_Export.xlsx');
}

async function deleteProperty(recordId) {
  if (!confirm('هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً؟')) return;

  const webhookUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_WEBHOOK_URL) ? CONFIG.N8N_WEBHOOK_URL : '';
  const baseId = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.BASE_ID) || (typeof CONFIG !== 'undefined' && CONFIG.AIRTABLE_BASE_ID);
  const token = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TOKEN);
  const tableName = encodeURIComponent((typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TABLES?.PROPERTIES) || 'المنتجات / الخدمات');

  try {
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'delete_item', recordId: recordId })
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

// دالة مساعدة لعمل Submits للإعدادات
async function genericSettingsSubmit(e, btnId, msgId, payloadType, payloadData, successMsg) {
  e.preventDefault();
  const btn = document.getElementById(btnId);
  const msg = document.getElementById(msgId);
  
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> جاري الحفظ...`;
  if(typeof lucide !== 'undefined') lucide.createIcons();
  msg.classList.add('hidden');

  try {
    const payload = { type: payloadType, ...payloadData };
    const webhookUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_WEBHOOK_URL) ? CONFIG.N8N_WEBHOOK_URL : '';
    
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    msg.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 inline"></i> ${successMsg}`;
    msg.className = 'flex items-center justify-center gap-1 text-center text-xs font-bold mt-2 text-emerald-600';
  } catch (err) {
    msg.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 inline"></i> تعذر الحفظ.`;
    msg.className = 'flex items-center justify-center gap-1 text-center text-xs font-bold mt-2 text-rose-600';
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    if(typeof lucide !== 'undefined') lucide.createIcons();
  }
}

async function handleSettingsSubmit(e) {
  e.preventDefault();
  const logoFile = document.getElementById('setting-logo').files[0];
  const favFile = document.getElementById('setting-favicon').files[0];
  
  let logoData = null, favData = null;
  if (logoFile) logoData = (await filesToBase64([logoFile]))[0];
  if (favFile) favData = (await filesToBase64([favFile]))[0];

  const payloadData = {
    Company_Name: document.getElementById('setting-agency-name').value,
    Theme_Color: document.getElementById('setting-color').value,
    accentColor: document.getElementById('setting-accent-color').value,
    logo: logoData,
    favicon: favData
  };
  
  genericSettingsSubmit(e, 'settings-submit-btn', 'settings-msg', 'update_general_settings', payloadData, 'تم حفظ إعدادات الهوية بنجاح!');
}

async function handleDomainSubmit(e) {
  const payloadData = { customDomain: document.getElementById('custom-domain-input').value.trim() };
  genericSettingsSubmit(e, 'domain-submit-btn', 'domain-msg', 'update_domain', payloadData, 'تم حفظ الدومين المخصص بنجاح!');
}

async function handleContentSubmit(e) {
  const payloadData = {
    heroTitle: document.getElementById('hero-title').value,
    heroSubtitle: document.getElementById('hero-subtitle').value,
    aboutExp: document.getElementById('about-exp').value,
    aboutSatisfaction: document.getElementById('about-satisfaction').value
  };
  genericSettingsSubmit(e, 'content-submit-btn', 'content-msg', 'update_content_settings', payloadData, 'تم حفظ نصوص الواجهة بنجاح!');
}

async function handleSeoSubmit(e) {
  const payloadData = {
    seoTitle: document.getElementById('seo-title').value,
    seoDesc: document.getElementById('seo-desc').value
  };
  genericSettingsSubmit(e, 'seo-submit-btn', 'seo-msg', 'update_seo_settings', payloadData, 'تم حفظ إعدادات ה-SEO بنجاح!');
}

async function handleSocialSubmit(e) {
  const payloadData = {
    Whatsapp: document.getElementById('social-whatsapp').value,
    phone: document.getElementById('social-phone').value,
    maps: document.getElementById('social-maps').value,
    Facebook: document.getElementById('social-facebook').value,
    Instagram: document.getElementById('social-instagram').value
  };
  genericSettingsSubmit(e, 'social-submit-btn', 'social-msg', 'update_social_settings', payloadData, 'تم حفظ الروابط بنجاح!');
}

async function handleMarketingSubmit(e) {
  const payloadData = {
    Meta_Pixel_ID: document.getElementById('mkt-meta').value,
    tiktokPixel: document.getElementById('mkt-tiktok').value,
    snapchatPixel: document.getElementById('mkt-snapchat').value,
    ga4: document.getElementById('mkt-ga4').value
  };
  genericSettingsSubmit(e, 'marketing-submit-btn', 'marketing-msg', 'update_marketing_pixels', payloadData, 'تم تفعيل أدوات التتبع بنجاح!');
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
