/**
 * إصلاح Mojibake: UTF-8 bytes were read as CP1256 characters
 * كل حرف عربي (2 bytes UTF-8) تحوّل لحرفين مشوّهين من CP1256
 *
 * المنطق:
 * 1. نبني خريطة عكسية: Unicode char → CP1256 byte
 * 2. نمشي على الملف حرفًا حرفًا
 * 3. لو شفنا حرف CP1256 من المدى D8-FF + حرف CP1256 من المدى 80-BF بعده
 *    → نجمع الـ bytes ونفك تشفير UTF-8
 * 4. غير كده نبقي الحرف كما هو
 */

const fs = require('fs');
const path = require('path');

// ===== بناء جدول CP1256 =====
const CP1256_TO_UNICODE = {};

// 0x00-0x7F: ASCII (نفس Unicode)
for (let i = 0; i <= 0x7F; i++) CP1256_TO_UNICODE[i] = i;

// 0x80-0xFF: الجزء الخاص بـ CP1256
const cp1256Ext = {
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
  0xF8: 0x00F8, 0xF9: 0x0653, 0xFA: 0x00FA, 0xFB: 0x0654, 0xFC: 0x00FC,
  0xFD: 0x200E, 0xFE: 0x200F, 0xFF: 0x06D2
};
Object.assign(CP1256_TO_UNICODE, cp1256Ext);

// الخريطة العكسية: Unicode codepoint → CP1256 byte
const UNICODE_TO_CP1256 = {};
for (const [byte, unicode] of Object.entries(CP1256_TO_UNICODE)) {
  UNICODE_TO_CP1256[unicode] = parseInt(byte);
}

// ===== دالة الإصلاح =====
function fixMojibake(content) {
  const chars = [...content];
  const result = [];
  let i = 0;
  let fixedCount = 0;

  while (i < chars.length) {
    const char = chars[i];
    const code = char.codePointAt(0);

    // ASCII: نبقيه كما هو
    if (code < 0x80) {
      result.push(char);
      i++;
      continue;
    }

    // هل الحرف الحالي يُمثّل CP1256 byte في المدى 0xC2-0xFF؟
    const cp1256Byte = UNICODE_TO_CP1256[code];

    if (cp1256Byte !== undefined && cp1256Byte >= 0xC2 && cp1256Byte <= 0xFF) {
      // يمكن أن يكون أول byte في تسلسل UTF-8 مشوّه
      // ننظر للحرف التالي
      const nextChar = chars[i + 1];
      if (nextChar !== undefined) {
        const nextCode = nextChar.codePointAt(0);
        const nextCp1256 = UNICODE_TO_CP1256[nextCode];

        if (nextCp1256 !== undefined && nextCp1256 >= 0x80 && nextCp1256 <= 0xBF) {
          // 2-byte UTF-8 sequence مشوّه — نُصلحه
          const b1 = cp1256Byte;
          const b2 = nextCp1256;
          try {
            const decoded = Buffer.from([b1, b2]).toString('utf8');
            // تحقق أن الناتج حرف عربي صالح
            if (decoded && decoded.length === 1 && decoded.codePointAt(0) >= 0x0600) {
              result.push(decoded);
              fixedCount++;
              i += 2;
              continue;
            }
          } catch {
            // فشل الفك، نبقي الحرف كما هو
          }
        }

        // هل يوجد تسلسل 3-byte؟ (للتعامل مع U+0800+)
        const nextNext = chars[i + 2];
        if (nextCp1256 !== undefined && nextCp1256 >= 0xE0 && nextCp1256 <= 0xEF && nextNext) {
          const nextNextCode = nextNext.codePointAt(0);
          const nextNextCp1256 = UNICODE_TO_CP1256[nextNextCode];
          if (nextNextCp1256 !== undefined && nextNextCp1256 >= 0x80 && nextNextCp1256 <= 0xBF) {
            try {
              const decoded = Buffer.from([cp1256Byte, nextCp1256, nextNextCp1256]).toString('utf8');
              if (decoded && decoded.length === 1) {
                result.push(decoded);
                fixedCount++;
                i += 3;
                continue;
              }
            } catch {
              // فشل
            }
          }
        }
      }
    }

    // حرف عادي — نبقيه كما هو
    result.push(char);
    i++;
  }

  return { fixed: result.join(''), fixedCount };
}

// ===== التحقق أولاً =====
console.log('=== التحقق من الخوارزمية ===');
const testGarbled = 'ط­ط§ظ† ط§ظ„ظˆظ‚طھطŒ ظٹط±ط¬ظ‰ ط§ظ„طھط­ط¯ظٹط«';
const testFixed = fixMojibake(testGarbled);
console.log('مُشوّه  :', testGarbled);
console.log('مُصحَّح :', testFixed.fixed);
console.log('الصواب  : حان الوقت، يرجى التحديث');
console.log('عدد الإصلاحات:', testFixed.fixedCount);

const testOk = testFixed.fixed.includes('حان الوقت');
console.log('الاختبار:', testOk ? '✅ ناجح' : '❌ فاشل');

if (!testOk) {
  console.error('الخوارزمية لا تعمل. وقف.');
  process.exit(1);
}

// ===== تطبيق الإصلاح على الملف =====
const filePath = path.join(__dirname, 'src', 'components', 'TeacherDashboard.jsx');
const backupPath = filePath + '.backup';

console.log('\n=== قراءة الملف ===');
const originalContent = fs.readFileSync(filePath, 'utf8');
console.log('حجم الملف:', originalContent.length, 'حرف');

console.log('\n=== تطبيق الإصلاح ===');
const { fixed, fixedCount } = fixMojibake(originalContent);
console.log('عدد الأحرف المُصلَحة:', fixedCount);
console.log('حجم الملف بعد الإصلاح:', fixed.length, 'حرف');

// تحقق من وجود عربي صحيح في النتيجة
const arabicSamples = ['حان الوقت', 'يرجى التحديث', 'الأحد', 'الإثنين', 'تسجيل الحضور'];
console.log('\n=== فحص العينات ===');
arabicSamples.forEach(s => {
  console.log(`'${s}': ${fixed.includes(s) ? '✅' : '❌'}`);
});

// نسخة احتياطية + حفظ
console.log('\n=== حفظ ===');
fs.copyFileSync(filePath, backupPath);
console.log('✅ نسخة احتياطية:', backupPath);

fs.writeFileSync(filePath, fixed, 'utf8');
console.log('✅ تم حفظ الملف المُصلَح:', filePath);

// تحقق نهائي
const verify = fs.readFileSync(filePath, 'utf8');
console.log('\n=== تحقق نهائي ===');
arabicSamples.forEach(s => {
  console.log(`'${s}': ${verify.includes(s) ? '✅' : '❌'}`);
});
