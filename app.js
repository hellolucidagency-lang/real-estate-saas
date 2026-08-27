// app.js - محرك عرض موقع العميل الديناميكي
document.addEventListener('DOMContentLoaded', async () => {
  const loadingScreen = document.getElementById('loading-screen');
  const errorScreen = document.getElementById('error-screen');
  const appContainer = document.getElementById('app');

  // 1. تحديد هوية العميل (Slug)
  const urlParams = new URLSearchParams(window.location.search);
  const hostname = window.location.hostname;
  
  let clientSlug = urlParams.get('client') || (typeof CONFIG !== 'undefined' && CONFIG.CLIENT_SLUG);

  // إذا كان العميل يفتح من دومين فرعي مثل: ahmed-estate.hellolucidagency.workers.dev
  if (!clientSlug && hostname.includes('.')) {
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'real-estate-saas' && parts[0] !== 'www') {
      clientSlug = parts[0];
    }
  }

  // افتراضي في حالة التجربة المحلية
  if (!clientSlug) clientSlug = 'ahmed-estate';

  const baseId = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.BASE_ID) || (typeof CONFIG !== 'undefined' && CONFIG.AIRTABLE_BASE_ID);
  const token = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TOKEN);
  const clientsTable = encodeURIComponent((typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TABLES?.CLIENTS) || 'Clients');
  const propsTable = encodeURIComponent((typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TABLES?.PROPERTIES) || 'الوحدات العقارية');

  if (!baseId || !token) {
    showError('يرجى التأكد من إعدادات الاتصال في config.js');
    return;
  }

  try {
    // 2. جلب بيانات العميل من جدول Clients
    const clientRes = await fetch(`https://api.airtable.com/v0/${baseId}/${clientsTable}?filterByFormula={Client_Slug}='${clientSlug}'`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const clientData = await clientRes.json();

    if (!clientData.records || clientData.records.length === 0) {
      showError('لم يتم العثور على هذا المكتب العقاري.');
      return;
    }

    const client = clientData.records[0].fields;
    renderClientBranding(client);

    // 3. جلب عقارات العميل فقط من جدول الوحدات العقارية
    const propsRes = await fetch(`https://api.airtable.com/v0/${baseId}/${propsTable}?filterByFormula={Status}='متاح'`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const propsData = await propsRes.json();
    
    // فلترة العقارات الخاصة بهذا العميل
    const clientProps = (propsData.records || []).filter(r => {
      const c = r.fields['Client_Slug (from Clients)'];
      if (Array.isArray(c)) return c.includes(clientSlug);
      return c === clientSlug || !c; // لو عقار تجريبي
    });

    renderProperties(clientProps, client);

    // إظهار الموقع وإخفاء شاشة التحميل
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      appContainer.classList.remove('hidden');
    }, 400);

  } catch (err) {
    showError('حدث خطأ أثناء تحميل بيانات الموقع.');
  }

  function showError(msg) {
    loadingScreen.style.display = 'none';
    errorScreen.classList.remove('hidden');
    document.getElementById('error-message').innerText = msg;
  }

  // تطبيق الهوية والألوان وروابط التواصل
  function renderClientBranding(client) {
    const brandName = client.Company_Name || client.Client_Slug;
    const brandColor = client.Theme_Color || '#16302B';
    const whatsappNumber = client.Whatsapp || '201111197146';

    document.documentElement.style.setProperty('--theme-color', brandColor);
    document.title = `${brandName} | العقارات والوحدات المتاحة`;

    document.getElementById('client-name').innerText = brandName;
    document.getElementById('hero-client-name').innerText = brandName;
    document.getElementById('footer-client-name').innerText = brandName;

    // اللوجو
    const logoEl = document.getElementById('client-logo');
    const logoUrl = client.Logo_URL || (client.Logo && client.Logo[0]?.url);
    if (logoUrl) {
      logoEl.src = logoUrl;
      logoEl.classList.remove('hidden');
    }

    // Favicon
    if (client.Favicon_URL) {
      const fav = document.getElementById('favicon');
      if (fav) fav.href = client.Favicon_URL;
    }

    // روابط الواتساب العامة
    const waLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً، أود الاستفسار عن العقارات المتاحة لديكم')}`;
    const headWa = document.getElementById('header-whatsapp');
    const floatWa = document.getElementById('floating-whatsapp');
    
    if (headWa) headWa.href = waLink;
    if (floatWa) {
      floatWa.href = waLink;
      floatWa.classList.remove('hidden');
      floatWa.classList.add('flex');
    }

    // تفعيل Meta Pixel إذا وجد
    if (client.Meta_Pixel_ID) {
      injectMetaPixel(client.Meta_Pixel_ID);
    }
  }

  // عرض بطاقات العقارات
  function renderProperties(properties, client) {
    const grid = document.getElementById('properties-grid');
    const countEl = document.getElementById('properties-count');
    const emptyEl = document.getElementById('empty-properties');
    const template = document.getElementById('property-card-template');

    countEl.innerText = `يوجد لدينا حالياً ${properties.length} عقار متاح`;

    if (properties.length === 0) {
      emptyEl.classList.remove('hidden');
      return;
    }

    grid.innerHTML = '';
    const whatsappNumber = client.Whatsapp || '201111197146';

    properties.forEach(item => {
      const f = item.fields;
      const clone = template.content.cloneNode(true);

      // استخراج الصور (من Cloudinary أولاً أو Attachments)
      let images = [];
      if (f.Cloudinary_Images) {
        images = f.Cloudinary_Images.split(',').map(s => s.trim());
      } else if (f.Attachments && Array.isArray(f.Attachments)) {
        images = f.Attachments.map(a => a.url);
      }

      if (images.length === 0) {
        images = ['https://via.placeholder.com/600x400?text=No+Image'];
      }

      // سلايدر الصور والـ Dots
      const scrollBox = clone.querySelector('.image-scroll');
      const dotsBox = clone.querySelector('.dots');
      
      images.forEach((imgUrl, idx) => {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'w-full h-full shrink-0';
        imgDiv.innerHTML = `<img src="${imgUrl}" class="w-full h-full object-cover" loading="lazy" />`;
        scrollBox.appendChild(imgDiv);

        if (images.length > 1) {
          const dot = document.createElement('span');
          dot.className = `w-2 h-2 rounded-full ${idx === 0 ? 'bg-white' : 'bg-white/50'}`;
          dotsBox.appendChild(dot);
        }
      });

      // تفاصيل العقار
      const title = f.Property_Title || f.Description || 'عقار مميز';
      clone.querySelector('.title').innerText = title;
      clone.querySelector('.price-badge').innerText = `${Number(f.Price || 0).toLocaleString()} ج.م`;
      clone.querySelector('.location').innerText = f.Description ? `📍 ${f.Description}` : '';
      clone.querySelector('.status-badge').innerText = f.Status || 'متاح';
      clone.querySelector('.offer-type').innerText = `${f.Property_Type || 'شقة'} · ${f.Offer_Type || 'للبيع'}`;

      // المساحة والغرف والحمامات
      const meta = clone.querySelector('.meta');
      meta.innerHTML = `
        ${f.Area ? `<span>📐 ${f.Area} م²</span>` : ''}
        ${f.Bedrooms ? `<span>🛏️ ${f.Bedrooms} غرف</span>` : ''}
        ${f.Bathrooms ? `<span>🚿 ${f.Bathrooms} حمام</span>` : ''}
      `;

      // زر الاستفسار عبر واتساب لكل عقار مخصص
      const propWaMsg = `مرحباً، أود الاستفسار عن عقار: ${title} - السعر: ${Number(f.Price || 0).toLocaleString()} ج.م`;
      const propWaLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(propWaMsg)}`;
      const cardWa = clone.querySelector('.card-whatsapp');
      cardWa.href = propWaLink;

      grid.appendChild(clone);
    });
  }

  function injectMetaPixel(pixelId) {
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', pixelId);
    fbq('track', 'PageView');
  }
});
