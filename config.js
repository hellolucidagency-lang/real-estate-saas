/**
 * ==========================================================
 *  ملف الإعدادات — عدّل هذا الملف فقط، لا تلمس app.js
 * ==========================================================
 */

const AIRTABLE_CONFIG = {

  // 1) ضع هنا الـ Base ID الخاص بقاعدة بياناتك في Airtable
  //    تجده في رابط الـ API الخاص بقاعدتك، يبدأ بحرف "app"
  //    مثال: "appXXXXXXXXXXXXXX"
  BASE_ID: "appsR3i0QyJj5VotR",

  // 2) ضع هنا الـ Personal Access Token (يُفضّل أن يكون Read-Only
  //    وله صلاحية وصول على هذه القاعدة فقط)
  //    ⚠️ تحذير أمني مهم: هذا التوكن سيكون مرئياً لأي شخص يفتح
  //    "عرض المصدر" (View Source) في المتصفح لأن الكود يعمل بالكامل
  //    من جهة العميل (Client-Side) ولا يوجد خادم خلفي يخفيه.
  //    لذلك يُنصح بشدة أن يكون توكن "قراءة فقط" (Read-Only) ومحدود
  //    الصلاحيات على هذه القاعدة تحديداً فقط، وليس على كل حسابك.
  TOKEN: "patZiuR7JNB1znZO0.d8b81eb6f43d8e10901b31b6607b52b9517e69dcaf236b50535681d03d3f1080",

  // 3) أسماء الجداول والحقول — عدّلها فقط إذا كانت أسماء جداولك مختلفة
  TABLES: {
    CLIENTS: "Clients",
    PROPERTIES: "الوحدات العقارية",
  },

  FIELDS: {
    // حقول جدول Clients
    CLIENT_SLUG: "Client_Slug",
    COMPANY_NAME: "Company_Name",
    LOGO_URL: "Logo_URL",
    THEME_COLOR: "Theme_Color",
    WHATSAPP: "Whatsapp",
    FAVICON_URL: "Favicon_URL",
    SHARE_IMAGE_URL: "Share_Image_URL",

    // الحقل الذي يربط كل عقار بالعميل داخل جدول العقارات (Table 1)
    // ⚠️ عدّل هذا الاسم ليطابق اسم الحقل الفعلي عندك.
    // غالباً يكون هذا حقل نصي (Lookup أو Text) يحمل نفس قيمة Client_Slug،
    // أو حقل Link to another record يربط بجدول Clients.
    PROPERTY_CLIENT_SLUG: "Client_Slug (from Clients)",

    // حقول جدول العقارات (Table 1) — عدّل الأسماء إذا لزم الأمر
    PROPERTY_TITLE: "Title",
    PROPERTY_LOCATION: "Location",
    PROPERTY_PRICE: "Price",
    PROPERTY_BEDROOMS: "Bedrooms",
    PROPERTY_BATHROOMS: "Bathrooms",
    PROPERTY_AREA: "Area",
    PROPERTY_IMAGES: "Cloudinary_Images", // نصوص مفصولة بفاصلة
  },
};
