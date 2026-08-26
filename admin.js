/**
 * ==========================================================
 *  لوحة التحكم — إضافة عقار جديد عبر Webhook (وليس عبر Airtable مباشرة)
 * ==========================================================
 *
 * ⚠️ ملاحظة أمان مهمة جداً — اقرأها قبل الاستخدام الفعلي:
 *
 * 1) كلمة المرور تحت دي (ADMIN_PASSWORD) هي حماية شكلية فقط (Client-Side).
 *    أي حد يفتح "View Source" أو أدوات المطور هيقدر يشوفها بسهولة، ولو
 *    عرف رابط admin.html هيقدر يتخطاها بسهولة عن طريق تعديل الكود من
 *    الـ Console. هي مناسبة بس لمرحلة الاختبار (MVP) عشان تمنع الزوار
 *    العاديين بالصدفة من الدخول، مش لحماية بيانات حساسة فعلياً.
 *
 * 2) الحماية الحقيقية يجب أن تكون من جهة الخادم (Server-Side)، يعني في
 *    الـ n8n Webhook نفسه، مش هنا. يجب أن يتحقق الـ Webhook من صحة
 *    ADMIN_SECRET (اللي بنبعته هنا كـ Header) قبل ما يقبل أي طلب،
 *    ويرفض أي طلب من غير الـ Secret الصحيح. لو حد عرف رابط الـ Webhook
 *    مباشرة (هو ظاهر في الكود برضه)، من غير التحقق من الـ Secret في
 *    n8n هيقدر يبعت بيانات وهمية للجدول عندك بسهولة.
 *
 * 3) للاستخدام الفعلي (Production) لاحقاً، الأفضل استبدال هذا كله
 *    بنظام تسجيل دخول حقيقي (مثل Firebase Auth أو حساب بسيط عبر n8n
 *    نفسه بـ JWT)، لكن للـ MVP هذا الأسلوب كافٍ ومقبول.
 * ========================================================== */

// ضع هنا رابط الـ Webhook الخاص بـ n8n (سيستقبل بيانات العقار ويتولى
// هو الاتصال بـ Airtable من جهة الخادم — التوكن بتاع Airtable يبقى
// محفوظ داخل n8n فقط، ولا يظهر أبداً في كود المتصفح)
const WEBHOOK_URL = "https://n8n.hellolucidagency.com/webhook-test/14cdad9c-e685-4a4b-aec9-76cd19544ee6";

// كلمة مرور شكلية لمرحلة الاختبار فقط (راجع التحذير في الأعلى)
const ADMIN_PASSWORD = "123456";

// نفس القيمة يجب ضبطها كشرط تحقق داخل خطوة "IF" الأولى في سيناريو n8n
// (تحقق أن Header اسمه X-Admin-Secret يساوي بالظبط هذه القيمة قبل أي خطوة تانية)
const ADMIN_SECRET = "REPLACE_WITH_A_LONG_RANDOM_SECRET";

/* ========================================================== */

const els = {
  passwordScreen: document.getElementById("password-screen"),
  passwordForm: document.getElementById("password-form"),
  passwordInput: document.getElementById("password-input"),
  passwordError: document.getElementById("password-error"),

  formScreen: document.getElementById("form-screen"),
  propertyForm: document.getElementById("property-form"),
  logoutBtn: document.getElementById("logout-btn"),

  imageInput: document.getElementById("image-input"),
  imagePreview: document.getElementById("image-preview"),

  submitBtn: document.getElementById("submit-btn"),
  submitLabel: document.getElementById("submit-label"),
  submitSpinner: document.getElementById("submit-spinner"),

  formSuccess: document.getElementById("form-success"),
  formError: document.getElementById("form-error"),
};

init();

function init() {
  // لو المستخدم سجّل دخول قبل كده في نفس الجلسة (Tab)، منعديش عليه كلمة المرور تاني
  if (sessionStorage.getItem("admin_authed") === "true") {
    showForm();
  }

  els.passwordForm.addEventListener("submit", handlePasswordSubmit);
  els.logoutBtn.addEventListener("click", handleLogout);
  els.imageInput.addEventListener("change", handleImagePreview);
  els.propertyForm.addEventListener("submit", handleFormSubmit);
}

/* ==========================================================
 *  شاشة كلمة المرور
 * ========================================================== */

function handlePasswordSubmit(e) {
  e.preventDefault();
  const value = els.passwordInput.value.trim();

  if (value === ADMIN_PASSWORD) {
    sessionStorage.setItem("admin_authed", "true");
    els.passwordError.classList.add("hidden");
    showForm();
  } else {
    els.passwordError.classList.remove("hidden");
    els.passwordInput.value = "";
    els.passwordInput.focus();
  }
}

function handleLogout() {
  sessionStorage.removeItem("admin_authed");
  els.propertyForm.reset();
  els.imagePreview.classList.add("hidden");
  els.formScreen.classList.add("hidden");
  els.passwordScreen.classList.remove("hidden");
  els.passwordInput.value = "";
}

function showForm() {
  els.passwordScreen.classList.add("hidden");
  els.formScreen.classList.remove("hidden");
}

/* ==========================================================
 *  معاينة الصورة المختارة
 * ========================================================== */

function handleImagePreview() {
  const file = els.imageInput.files?.[0];
  if (!file) {
    els.imagePreview.classList.add("hidden");
    return;
  }
  els.imagePreview.src = URL.createObjectURL(file);
  els.imagePreview.classList.remove("hidden");
}

/* ==========================================================
 *  إرسال الفورم إلى الـ Webhook (وليس إلى Airtable مباشرة)
 * ========================================================== */

async function handleFormSubmit(e) {
  e.preventDefault();
  resetMessages();

  if (WEBHOOK_URL === "YOUR_N8N_WEBHOOK_URL_HERE") {
    showError("لم يتم ضبط رابط الـ Webhook بعد. عدّل WEBHOOK_URL في admin.js أولاً.");
    return;
  }

  const form = e.target;
  const title = form.title.value.trim();
  const price = form.price.value;
  const status = form.status.value;
  const imageFile = els.imageInput.files?.[0];

  if (!title || !price || !status || !imageFile) {
    showError("من فضلك أكمل جميع الحقول واختر صورة.");
    return;
  }

  // تجميع البيانات في FormData (يدعم إرفاق ملف الصورة مباشرة)
  const formData = new FormData();
  formData.append("title", title);
  formData.append("price", price);
  formData.append("status", status);
  formData.append("image", imageFile);

  setLoading(true);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      // هذا الـ Header هو خط الدفاع الحقيقي — تأكد أن n8n يتحقق منه
      // قبل أي خطوة، وارفض أي طلب لا يحمل نفس القيمة بالظبط
      headers: { "X-Admin-Secret": ADMIN_SECRET },
      body: formData,
      // لا نضيف "Content-Type" يدوياً هنا عن قصد — المتصفح يضيفه تلقائياً
      // مع الـ boundary الصحيح الخاص بالـ multipart/form-data
    });

    if (!res.ok) {
      throw new Error(`فشل الإرسال (${res.status})`);
    }

    showSuccess("تم حفظ العقار بنجاح ✅");
    form.reset();
    els.imagePreview.classList.add("hidden");
  } catch (err) {
    console.error(err);
    showError("حدث خطأ أثناء الإرسال. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
  } finally {
    setLoading(false);
  }
}

/* ==========================================================
 *  دوال مساعدة لعرض الحالة
 * ========================================================== */

function setLoading(isLoading) {
  els.submitBtn.disabled = isLoading;
  els.submitBtn.classList.toggle("opacity-70", isLoading);
  els.submitLabel.textContent = isLoading ? "جاري الحفظ..." : "حفظ العقار";
  els.submitSpinner.classList.toggle("hidden", !isLoading);
}

function showSuccess(message) {
  els.formSuccess.textContent = message;
  els.formSuccess.classList.remove("hidden");
}

function showError(message) {
  els.formError.textContent = message;
  els.formError.classList.remove("hidden");
}

function resetMessages() {
  els.formSuccess.classList.add("hidden");
  els.formError.classList.add("hidden");
}
