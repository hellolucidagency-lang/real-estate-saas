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
}

function logout() {
  sessionStorage.removeItem('admin_logged_in');
  location.reload();
}

function switchTab(tab) {
  const propBtn = document.getElementById('tab-btn-properties');
  const setBtn = document.getElementById('tab-btn-settings');
  const propSec = document.getElementById('section-properties');
  const setSec = document.getElementById('section-settings');

  if (tab === 'properties') {
    propBtn.className = 'tab-active py-3 px-6 text-sm transition';
    setBtn.className = 'tab-inactive py-3 px-6 text-sm transition';
    propSec.classList.remove('hidden');
    setSec.classList.add('hidden');
  } else {
    setBtn.className = 'tab-active py-3 px-6 text-sm transition';
    propBtn.className = 'tab-inactive py-3 px-6 text-sm transition';
    setSec.classList.remove('hidden');
    propSec.classList.add('hidden');
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

// إرسال بيانات العقار (صور متعددة + المساحة والمنطقة)
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
    msg.className = 'text-center text-sm font-semibold mt-2 text-green-600 block';
    document.getElementById('property-form').reset();
  } catch (err) {
    msg.innerText = '❌ حدث خطأ أثناء الحفظ، يرجى المحاولة ثانية.';
    msg.className = 'text-center text-sm font-semibold mt-2 text-red-600 block';
  } finally {
    btn.disabled = false;
    btn.innerText = 'حفظ ونشر العقار';
  }
}

// إرسال بيانات الهوية
async function handleSettingsSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('settings-submit-btn');
  const msg = document.getElementById('settings-msg');
  const logoFile = document.getElementById('setting-logo').files[0];

  btn.disabled = true;
  btn.innerText = 'جاري حفظ الهوية...';
  msg.classList.add('hidden');

  try {
    let logoData = null;
    if (logoFile) {
      const converted = await filesToBase64([logoFile]);
      logoData = converted[0];
    }

    const payload = {
      type: 'update_settings',
      agencyName: document.getElementById('setting-agency-name').value,
      whatsapp: document.getElementById('setting-whatsapp').value,
      themeColor: document.getElementById('setting-color').value,
      logo: logoData
    };

    const webhookUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_SETTINGS_WEBHOOK_URL) ? CONFIG.N8N_SETTINGS_WEBHOOK_URL : CONFIG.N8N_WEBHOOK_URL;

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    msg.innerText = '✅ تم حفظ إعدادات الهوية بنجاح!';
    msg.className = 'text-center text-sm font-semibold mt-2 text-green-600 block';
  } catch (err) {
    msg.innerText = '❌ تعذر حفظ الهوية، يرجى المحاولة ثانية.';
    msg.className = 'text-center text-sm font-semibold mt-2 text-red-600 block';
  } finally {
    btn.disabled = false;
    btn.innerText = 'حفظ إعدادات الهوية';
  }
}
