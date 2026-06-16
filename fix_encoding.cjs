/**
 * سكريبت إصلاح ترميز TeacherDashboard.jsx
 * يحاول عدة طرق لعكس التشويه ويختار الأنسب
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'TeacherDashboard.jsx');

// قراءة الملف
const rawBuffer = fs.readFileSync(filePath);
const contentUtf8 = rawBuffer.toString('utf8');

console.log('=== فحص الترميز ===');
console.log('حجم الملف (bytes):', rawBuffer.length);
console.log('طول المحتوى (chars):', contentUtf8.length);

// عينة من النص المشوّه للتحقق
const sample = contentUtf8.slice(500, 600);
console.log('\nعينة من الملف الحالي:');
console.log(sample);

// --- الطريقة 1: latin1 → utf8 (الأشيع لإصلاح Mojibake) ---
function tryMethod1(content) {
  try {
    // نفترض أن كل char في النص هو byte في Latin-1
    // نجمع bytes ثم نعيد القراءة كـ UTF-8
    const allInRange = [...content].every(c => c.charCodeAt(0) <= 255);
    if (!allInRange) {
      const outOfRange = [...content].filter(c => c.charCodeAt(0) > 255);
      console.log('\nالطريقة 1: يوجد', outOfRange.length, 'حرف خارج نطاق 0-255 (مثل:', outOfRange.slice(0, 5).join(', '), ')');
      return null;
    }
    const bytes = Buffer.from([...content].map(c => c.charCodeAt(0)));
    return bytes.toString('utf8');
  } catch (e) {
    console.log('الطريقة 1 فشلت:', e.message);
    return null;
  }
}

// --- الطريقة 2: قراءة الـ buffer مباشرةً كـ latin1 ثم تحويل ---
function tryMethod2() {
  try {
    const asLatin1 = rawBuffer.toString('latin1');
    // محاولة إصلاح: كل حرف latin1 يمثل byte أصلي من UTF-8
    const bytes = Buffer.from([...asLatin1].map(c => c.charCodeAt(0)));
    return bytes.toString('utf8');
  } catch (e) {
    console.log('الطريقة 2 فشلت:', e.message);
    return null;
  }
}

// --- الطريقة 3: CP1256 (Windows Arabic) ---
function tryMethod3() {
  // جدول تحويل CP1256 → Unicode للأحرف المختلفة عن Latin-1
  const cp1256Map = {
    0x80: 0x20AC, 0x81: 0x067E, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E,
    0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6, 0x89: 0x2030,
    0x8A: 0x0679, 0x8B: 0x2039, 0x8C: 0x0152, 0x8D: 0x0686, 0x8E: 0x0698,
    0x8F: 0x0688, 0x90: 0x06AF, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C,
    0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x06A9,
    0x99: 0x2122, 0x9A: 0x0691, 0x9B: 0x203A, 0x9C: 0x0153, 0x9D: 0x200C,
    0x9E: 0x200D, 0x9F: 0x06BA, 0xA0: 0x00A0, 0xA1: 0x060C, 0xA2: 0x00A2,
    0xA3: 0x00A3, 0xA4: 0x00A4, 0xA5: 0x00A5, 0xA6: 0x00A6, 0xA7: 0x00A7,
    0xA8: 0x00A8, 0xA9: 0x00A9, 0xAA: 0x06BE, 0xAB: 0x00AB, 0xAC: 0x00AC,
    0xAD: 0x00AD, 0xAE: 0x00AE, 0xAF: 0x00AF, 0xB0: 0x00B0, 0xB1: 0x00B1,
    0xB2: 0x00B2, 0xB3: 0x00B3, 0xB4: 0x00B4, 0xB5: 0x00B5, 0xB6: 0x00B6,
    0xB7: 0x00B7, 0xB8: 0x00B8, 0xB9: 0x00B9, 0xBA: 0x061B, 0xBB: 0x00BB,
    0xBC: 0x00BC, 0xBD: 0x00BD, 0xBE: 0x00BE, 0xBF: 0x061F, 0xC0: 0x06C1,
    0xC1: 0x0621, 0xC2: 0x0622, 0xC3: 0x0623, 0xC4: 0x0624, 0xC5: 0x0625,
    0xC6: 0x0626, 0xC7: 0x0627, 0xC8: 0x0628, 0xC9: 0x0629, 0xCA: 0x062A,
    0xCB: 0x062B, 0xCC: 0x062C, 0xCD: 0x062D, 0xCE: 0x062E, 0xCF: 0x062F,
    0xD0: 0x0630, 0xD1: 0x0631, 0xD2: 0x0632, 0xD3: 0x0633, 0xD4: 0x0634,
    0xD5: 0x0635, 0xD6: 0x0636, 0xD7: 0x00D7, 0xD8: 0x0637, 0xD9: 0x0638,
    0xDA: 0x0639, 0xDB: 0x063A, 0xDC: 0x0640, 0xDD: 0x0641, 0xDE: 0x0642,
    0xDF: 0x0643, 0xE0: 0x00E0, 0xE1: 0x0644, 0xE2: 0x00E2, 0xE3: 0x0645,
    0xE4: 0x0646, 0xE5: 0x0647, 0xE6: 0x0648, 0xE7: 0x00E7, 0xE8: 0x00E8,
    0xE9: 0x0649, 0xEA: 0x064A, 0xEB: 0x0651, 0xEC: 0x00EC, 0xED: 0x0652,
    0xEE: 0x00EE, 0xEF: 0x00EF, 0xF0: 0x00F0, 0xF1: 0x064B, 0xF2: 0x064C,
    0xF3: 0x064D, 0xF4: 0x064E, 0xF5: 0x064F, 0xF6: 0x0650, 0xF7: 0x00F7,
    0xF8: 0x00F8, 0xF9: 0x0653, 0xFA: 0x00FA, 0xFB: 0x0654, 0xFC: 0x0643, // تقريبي
    0xFD: 0x200E, 0xFE: 0x200F, 0xFF: 0x06D2
  };

  try {
    let result = '';
    for (let i = 0; i < rawBuffer.length; i++) {
      const byte = rawBuffer[i];
      if (byte < 0x80) {
        result += String.fromCharCode(byte);
      } else if (cp1256Map[byte]) {
        result += String.fromCharCode(cp1256Map[byte]);
      } else {
        result += String.fromCharCode(byte);
      }
    }
    return result;
  } catch (e) {
    console.log('الطريقة 3 فشلت:', e.message);
    return null;
  }
}

// تشغيل المحاولات
console.log('\n=== محاولة الطريقة 1 (Latin-1 bytes → UTF-8) ===');
const r1 = tryMethod1(contentUtf8);
if (r1) {
  const sample1 = r1.slice(500, 600);
  console.log('النتيجة:', sample1);
  // هل يحتوي على عربي صحيح؟
  const hasArabic = /[\u0600-\u06FF]/.test(sample1);
  console.log('يحتوي على عربي صحيح:', hasArabic);
}

console.log('\n=== محاولة الطريقة 2 (Buffer Latin-1 → UTF-8) ===');
const r2 = tryMethod2();
if (r2) {
  const sample2 = r2.slice(500, 600);
  console.log('النتيجة:', sample2);
  const hasArabic = /[\u0600-\u06FF]/.test(sample2);
  console.log('يحتوي على عربي صحيح:', hasArabic);
}

console.log('\n=== محاولة الطريقة 3 (CP1256) ===');
const r3 = tryMethod3();
if (r3) {
  const sample3 = r3.slice(500, 600);
  console.log('النتيجة:', sample3);
  const hasArabic = /[\u0600-\u06FF]/.test(sample3);
  console.log('يحتوي على عربي صحيح:', hasArabic);

  // فحص نموذج: هل "حان الوقت" يظهر بشكل صحيح؟
  const hasHan = r3.includes('حان الوقت');
  console.log('يحتوي على "حان الوقت":', hasHan);
}

// فحص النص الحالي للتأكد من نوع التشويه
console.log('\n=== تحليل حروف النص المشوّه ===');
const garbledSample = 'ط­ط§ظ† ط§ظ„ظˆظ‚طھ';
console.log('مثال مشوّه:', garbledSample);
console.log('رموز Unicode:');
for (const c of garbledSample) {
  console.log(`  '${c}' = U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0')} (${c.charCodeAt(0)})`);
}

// محاولة 4: عكس خاص
// إذا كان النص المشوّه هو نتاج: UTF-8 bytes → CP1256 chars → UTF-8
// الإصلاح: قراءة الـ buffer كـ CP1256 (أي تحويل كل byte بجدول CP1256)
console.log('\n=== توصية ===');
if (r3 && r3.includes('حان الوقت')) {
  console.log('✅ الطريقة 3 (CP1256) تعمل! يمكن حفظ الملف المُصحَّح.');
  fs.writeFileSync(filePath + '.cp1256fixed.jsx', r3, 'utf8');
  console.log('تم حفظ النسخة المُصحَّحة في:', filePath + '.cp1256fixed.jsx');
} else {
  console.log('❌ لم تنجح الطرق التلقائية. سيتم استخدام جدول استبدال يدوي.');
}
