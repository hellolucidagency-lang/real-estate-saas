// app.js - محرك العرض الديناميكي لمنظومة لوسيديا (متعدد القطاعات)
document.addEventListener('DOMContentLoaded', async () => {
  const loadingScreen = document.getElementById('loading-screen');
  const errorScreen = document.getElementById('error-screen');
  const appContainer = document.getElementById('app');

  // 1. تحديد هوية العميل (Slug)
  const urlParams = new URLSearchParams(window.location.search);
  const hostname = window.location.hostname;
  
  let clientSlug = urlParams.get('client') || (typeof CONFIG !== 'undefined' && CONFIG.CLIENT_SLUG);

  // إذا كان العميل يفتح من دومين فرعي
  if (!clientSlug && hostname.includes('.')) {
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'saas' && parts[0] !== 'www') {
      clientSlug = parts[0];
    }
  }

  // افتراضي في حالة التجربة
  if (!clientSlug) clientSlug = 'demo';

  const baseId = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.BASE_ID) || (typeof CONFIG !== 'undefined' && CONFIG.AIRTABLE_BASE_ID);
  const token = (typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TOKEN);
  const clientsTable = encodeURIComponent((typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TABLES?.CLIENTS) || 'Clients');
  const itemsTable = encodeURIComponent((typeof AIRTABLE_CONFIG !== 'undefined' && AIRTABLE_CONFIG.TABLES?.PROPERTIES) || 'المنتجات / الخدمات');

  if (!baseId || !token) {
    showError('حدث خطأ في الإعدادات، يرجى مراجعة الدعم الفني.');
    return;
  }

  let allItems = []; // لتخزين العناصر من أجل الفلترة لاحقاً

  try {
    // 2. جلب بيانات العميل (الهوية والقطاع)
    const clientRes = await fetch(`https://api.airtable.com/v0/${baseId}/${clientsTable}?filterByFormula={Client_Slug}='${clientSlug}'`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const clientData = await clientRes.json();

    if (!clientData.records || clientData.records.length === 0) {
      showError('لم يتم العثور على حساب هذا العميل.');
      return;
    }

    const client = clientData.records[0].fields;
    const sector = client.Sector || 'عقارات'; // القطاع الافتراضي

    // تطبيق الهوية المرئية والنصوص المخصصة
    renderClientBranding(client, sector);

    // 3. جلب منتجات/خدمات العميل النشطة فقط
    const itemsRes = await fetch(`https://api.airtable.com/v0/${baseId}/${itemsTable}?filterByFormula=AND({Status}='متاح', OR({Client_Slug (from Clients)}='${clientSlug}', {Client_Slug (from Clients)}=''))`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const itemsData = await itemsRes.json();
    allItems = itemsData.records || [];

    // إنشاء أزرار الفلترة بناءً على الأقسام الموجودة في الداتا
    generateFilters(allItems);

    // عرض العناصر
    renderItems(allItems, client, sector);

    // إظهار الموقع وإخفاء شاشة التحميل بنعومة
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      appContainer.classList.remove('hidden');
    }, 300);

  } catch (err) {
    showError('حدث خطأ أثناء الاتصال بالخادم.');
  }

  function showError(msg) {
    loadingScreen.style.display = 'none';
    errorScreen.classList.remove('hidden');
    document.getElementById('error-message').innerText = msg;
  }

  // تطبيق الهوية وتعديل النصوص بناءً على القطاع
  function renderClientBranding(client, sector) {
    const brandName = client.Company_Name || client.Client_Slug;
    // إضافة لون hover أغمق قليلاً باستخدام CSS
    const baseColor = client.Theme_Color || '#2563eb';
    
    document.documentElement.style.setProperty('--theme-color', baseColor);
    document.title = client.SEO_Title || `${brandName} | الصفحة الرسمية`;

    document.getElementById('client-name').innerText = brandName;
    document.getElementById('hero-client-name').innerText = brandName;
    document.getElementById('footer-client-name').innerText = brandName;

    // اللوجو والـ Favicon
    if (client.Logo_URL || (client.Logo && client.Logo[0]?.url)) {
      const logoEl = document.getElementById('client-logo');
      logoEl.src = client.Logo_URL || client.Logo[0].url;
      logoEl.classList.remove('hidden');
    }
    if (client.Favicon_URL) {
      document.getElementById('favicon').href = client.Favicon_URL;
    }

    // تخصيص النصوص الديناميكية للـ Hero حسب القطاع
    const heroBadge = document.getElementById('hero-badge');
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    const headWaSpan = document.querySelector('#header-whatsapp span');

    if(sector === 'عيادات') {
      heroBadge.innerText = 'رعاية صحية متكاملة';
      heroTitle.innerHTML = `مرحباً بكم في عيادات <span class="theme-text">${brandName}</span>`;
      heroSubtitle.innerText = client.SEO_Description || 'فريق طبي متخصص وتجربة هادئة من أول استشارة. تصفح خدماتنا واحجز موعدك الآن.';
      headWaSpan.innerText = 'احجز استشارتك';
    } else if (sector === 'محاماة') {
      heroBadge.innerText = 'استشارات قانونية موثوقة';
      heroTitle.innerHTML = `مكتب <span class="theme-text">${brandName}</span> للمحاماة`;
      heroSubtitle.innerText = client.SEO_Description || 'نقدم لك الدعم القانوني في كافة القضايا. تواصل معنا للحصول على استشارة فورية.';
      headWaSpan.innerText = 'طلب استشارة';
    } else if (sector === 'سيارات') {
      heroBadge.innerText = 'أفضل العروض والسيارات';
      heroTitle.innerHTML = `معرض <span class="theme-text">${brandName}</span> للسيارات`;
      heroSubtitle.innerText = client.SEO_Description || 'تصفح أحدث موديلات السيارات المتاحة لدينا واطلب تجربة قيادة بكل سهولة.';
      headWaSpan.innerText = 'تواصل معنا';
    } else {
      // عقارات (الافتراضي)
      heroBadge.innerText = 'أفضل العقارات المتاحة';
      heroTitle.innerHTML = `عقارات مختارة من <span class="theme-text">${brandName}</span>`;
      heroSubtitle.innerText = client.SEO_Description || 'اكتشف أفضل الشقق والفيلات المتاحة للبيع أو الإيجار واستفسر عنها فوراً.';
      headWaSpan.innerText = 'تواصل معنا';
    }

    // روابط الواتساب العامة
    const whatsappNumber = client.Whatsapp || '201111197146';
    const waLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً، أود التواصل مع ${brandName} بخصوص الخدمات المتاحة.`)}`;
    
    document.getElementById('header-whatsapp').href = waLink;
    document.getElementById('floating-whatsapp').href = waLink;

    // تفعيل Meta Pixel إذا وجد
    if (client.Meta_Pixel_ID) {
      injectMetaPixel(client.Meta_Pixel_ID);
    }
  }

  // استخراج الأقسام لعمل أزرار الفلترة
  function generateFilters(items) {
    const filterContainer = document.getElementById('categories-filter');
    if(!filterContainer) return;

    // الحصول على الأقسام الفريدة من الداتا
    const categories = new Set();
    items.forEach(item => {
      const cat = item.fields.Item_Category || item.fields.Property_Type;
      if(cat) {
        // إذا كان مصفوفة أو نص
        const catStr = Array.isArray(cat) ? cat[0] : cat;
        categories.add(catStr);
      }
    });

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'cat-btn bg-white text-slate-500 border border-slate-200 text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap hover:bg-slate-50 transition';
      btn.innerText = cat;
      btn.onclick = (e) => {
        // تغيير شكل الزر النشط
        document.querySelectorAll('.cat-btn').forEach(b => {
          b.className = 'cat-btn bg-white text-slate-500 border border-slate-200 text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap hover:bg-slate-50 transition';
        });
        e.target.className = 'cat-btn active theme-bg text-white text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap shadow-sm';
        
        filterItems(cat);
      };
      filterContainer.appendChild(btn);
    });
  }

  // فلترة العناصر عند الضغط على زر القسم
  window.filterByCategory = function(cat) {
    // تفعيل زر "الكل"
    document.querySelectorAll('.cat-btn').forEach(b => {
        b.className = 'cat-btn bg-white text-slate-500 border border-slate-200 text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap hover:bg-slate-50 transition';
    });
    document.querySelector('.cat-btn').className = 'cat-btn active theme-bg text-white text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap shadow-sm';
    
    renderItems(allItems, { Whatsapp: (typeof CONFIG !== 'undefined' && CONFIG.CLIENT_SLUG) ? '' : '201111197146'}, document.getElementById('item-sector')?.value || 'عقارات');
  };

  function filterItems(category) {
    const filtered = allItems.filter(item => {
      const cat = Array.isArray(item.fields.Item_Category) ? item.fields.Item_Category[0] : (item.fields.Item_Category || item.fields.Property_Type);
      return cat === category;
    });
    // نمرر Sector افتراضي لتجنب الأخطاء
    renderItems(filtered, { Whatsapp: '' }, document.getElementById('item-sector')?.value || 'عقارات');
  }

  // عرض بطاقات المنتجات/الخدمات
  function renderItems(items, client, sector) {
    const grid = document.getElementById('properties-grid');
    const emptyEl = document.getElementById('empty-properties');
    const template = document.getElementById('property-card-template');

    if (items.length === 0) {
      grid.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');
    grid.innerHTML = '';
    const whatsappNumber = client.Whatsapp || '201111197146';

    items.forEach(item => {
      const f = item.fields;
      const clone = template.content.cloneNode(true);

      // 1. معالجة الصور
      let firstImage = 'https://via.placeholder.com/600x400?text=No+Image';
      if (f.Attachments && Array.isArray(f.Attachments) && f.Attachments.length > 0) {
        firstImage = f.Attachments[0].url;
      }
      clone.querySelector('.card-image').src = firstImage;

      // 2. النصوص الأساسية (تدعم الأسماء القديمة والجديدة)
      const title = f.Item_Title || f.Property_Title || 'بدون عنوان';
      const category = Array.isArray(f.Item_Category) ? f.Item_Category[0] : (f.Item_Category || f.Property_Type || 'عام');
      const offerType = f.Item_Type || f.Offer_Type || '';
      const price = f.Price || 0;
      
      clone.querySelector('.title').innerText = title;
      clone.querySelector('.category-badge').innerText = category;
      
      // تنسيق السعر (إخفاؤه لو كان صفر)
      const priceBadge = clone.querySelector('.price-badge');
      if(price > 0) {
          priceBadge.innerText = `${Number(price).toLocaleString()} ج`;
      } else {
          priceBadge.style.display = 'none';
      }

      // 3. الحالة والوصف
      const statusBadge = clone.querySelector('.status-badge');
      statusBadge.innerText = offerType;
      statusBadge.className = 'status-badge text-[10px] font-extrabold px-2 py-0.5 rounded-md whitespace-nowrap bg-slate-100 text-slate-600';

      const locationEl = clone.querySelector('.location');
      if (f.Location) {
        locationEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${f.Location}`;
      } else {
        locationEl.style.display = 'none';
      }

      clone.querySelector('.description').innerText = f.Description || '';

      // 4. الحقول المخصصة للعقارات
      const realEstateMeta = clone.querySelector('.real-estate-meta');
      // إذا لم يكن عقاراً أو لا توجد بيانات، قم بإخفائها
      if ((sector !== 'عقارات') || (!f.Area && !f.Bedrooms && !f.Bathrooms)) {
        realEstateMeta.style.display = 'none';
      } else {
        realEstateMeta.classList.remove('hidden');
        realEstateMeta.classList.add('flex');
        clone.querySelector('.meta-area').innerHTML = f.Area ? `<span class="text-slate-400 font-normal">المساحة:</span> ${f.Area}م²` : '';
        clone.querySelector('.meta-rooms').innerHTML = f.Bedrooms ? `<span class="text-slate-400 font-normal">غرف:</span> ${f.Bedrooms}` : '';
        clone.querySelector('.meta-baths').innerHTML = f.Bathrooms ? `<span class="text-slate-400 font-normal">حمامات:</span> ${f.Bathrooms}` : '';
      }

      // 5. زر الاستفسار / الحجز
      let actionText = 'استفسر عن هذا العرض';
      if(sector === 'عيادات') actionText = 'احجز هذه الخدمة';
      if(sector === 'محاماة') actionText = 'طلب استشارة';
      
      const propWaMsg = `مرحباً، أود الاستفسار بخصوص: ${title}`;
      const propWaLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(propWaMsg)}`;
      
      const cardWa = clone.querySelector('.card-whatsapp');
      cardWa.href = propWaLink;
      cardWa.innerText = actionText;

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
