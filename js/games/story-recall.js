/* זוכרים סיפור — a short illustrated comic: 3–6 panels, each a big emoji scene with one caption line, shown one
   at a time (player-paced, "הבא"). Then questions from memory, answered with pictures where possible: which object,
   who, where, colours, numbers, what came first, what did NOT happen (memory). Untimed. */
(function () {
  'use strict';

  var COLORS = { 'אדום': 'red', 'כחול': 'blue', 'צהוב': 'yellow', 'ירוק': 'green', 'סגול': 'purple', 'שחור': 'black' };

  /* Stories. p = panels [scene, caption, fact?]; the first and last panel are always shown, middle ones may be skipped
     at low levels, so a middle caption never depends on another middle one.
     fact = [kind, question, answer, wrong, wrong, wrong]  kind: pic (picture answers 'emoji label'), color (a colour
     name from COLORS), num (a number). no = things that did NOT happen (for "מה לא קרה?"). */
  var STORIES = [
    { p: [
      ['🏠 👵 ☀️', 'בבוקר סבתא רחל יצאה מהבית.'],
      ['🚌', 'היא נסעה באוטובוס לשוק.', ['pic', 'איך רחל נסעה לשוק?', '🚌 באוטובוס', '🚕 במונית', '🚲 באופניים', '🚆 ברכבת']],
      ['🍎 🍎 🍎 🍎', 'בשוק היא קנתה ארבעה תפוחים.', ['num', 'כמה תפוחים רחל קנתה?', 4]],
      ['👩 💬 👵', 'היא פגשה את השכנה דינה.', ['pic', 'את מי רחל פגשה בשוק?', '👩 השכנה', '👮 שוטר', '👨‍🍳 טבח', '👧 ילדה']],
      ['🌧️ ☂️', 'התחיל גשם, ורחל פתחה מטרייה סגולה.', ['color', 'באיזה צבע הייתה המטרייה?', 'סגול']],
      ['🏠 🥧', 'בבית היא אפתה פאי תפוחים.', ['pic', 'מה רחל אפתה בבית?', '🥧 פאי', '🎂 עוגה', '🍪 עוגיות', '🍞 לחם']]],
      no: [['🐕', 'רחל טיילה עם כלב.'], ['🏊', 'רחל שחתה בבריכה.']] },
    { p: [
      ['🌅 👴 🎣', 'בבוקר מוקדם סבא דוד הלך לדוג.'],
      ['🚣 🌊', 'הוא שט בסירה קטנה אל אמצע האגם.', ['pic', 'במה דוד שט?', '🚣 סירה קטנה', '🚢 אונייה', '🏄 גלשן', '🚂 רכבת']],
      ['🐟 🐟 🐟', 'הוא דג שלושה דגים.', ['num', 'כמה דגים דוד דג?', 3]],
      ['🦆 🦆', 'שני ברווזים שחו ליד הסירה.', ['pic', 'מי שחה ליד הסירה?', '🦆 ברווזים', '🦢 ברבור', '🐢 צב', '🐸 צפרדע']],
      ['🌬️ 🧢', 'הרוח העיפה לו את הכובע הכחול.', ['color', 'באיזה צבע היה הכובע של דוד?', 'כחול']],
      ['🏠 🍳 🐟', 'בערב הוא טיגן את הדגים לכל המשפחה.', ['pic', 'מה דוד עשה עם הדגים?', '🍳 טיגן אותם', '🐈 נתן לחתול', '🧊 הקפיא', '🌊 החזיר למים']]],
      no: [['⛺', 'דוד ישן באוהל.'], ['🐻', 'דוד ראה דוב.']] },
    { p: [
      ['🎂 👧', 'היום יום ההולדת של הנכדה נועה.'],
      ['🎈 🎈 🎈 🎈 🎈', 'סבתא שרה ניפחה חמישה בלונים.', ['num', 'כמה בלונים סבתא ניפחה?', 5]],
      ['🎁', 'היא עטפה מתנה בנייר ירוק.', ['color', 'באיזה צבע היה נייר העטיפה?', 'ירוק']],
      ['🧸', 'בתוך המתנה היה דובי.', ['pic', 'מה היה בתוך המתנה?', '🧸 דובי', '⚽ כדור', '📚 ספר', '🎨 צבעים']],
      ['🎶 💃', 'כל המשפחה שרה ורקדה.'],
      ['🍰 😋', 'בסוף כולם אכלו עוגת שוקולד.', ['pic', 'איזו עוגה אכלו?', '🍫 שוקולד', '🍓 תותים', '🍋 לימון', '🧀 גבינה']]],
      no: [['🐴', 'הילדים רכבו על סוס.'], ['🎪', 'כולם הלכו לקרקס.']] },
    { p: [
      ['🏡 👨‍🌾', 'משה יצא לעבוד בגינה.'],
      ['🌱 🌱 🌱 🌱 🌱 🌱', 'הוא שתל שישה שתילים.', ['num', 'כמה שתילים משה שתל?', 6]],
      ['🐌 🍃', 'על עלה הוא מצא חילזון.', ['pic', 'מה משה מצא על העלה?', '🐌 חילזון', '🐞 חיפושית', '🐛 זחל', '🐜 נמלה']],
      ['🌻', 'ליד הגדר צמחה חמנייה גבוהה.', ['pic', 'איזה פרח צמח ליד הגדר?', '🌻 חמנייה', '🌹 ורד', '🌷 צבעוני', '🌵 קקטוס']],
      ['🚿 💧', 'הוא השקה את כל הגינה.'],
      ['🍅 🧺', 'בסוף הוא קטף עגבניות לסלט.', ['pic', 'מה משה קטף?', '🍅 עגבניות', '🥒 מלפפונים', '🥕 גזרים', '🍆 חצילים']]],
      no: [['🐇', 'ארנב אכל את הגזר.'], ['⛈️', 'הייתה סופת ברקים.']] },
    { p: [
      ['🚉 👫', 'יעקב ואסתר חיכו לרכבת.'],
      ['🚆 🕘', 'הרכבת הגיעה בשעה תשע.', ['num', 'באיזו שעה הגיעה הרכבת?', 9]],
      ['🏖️ ☀️', 'הם ירדו בתחנה ליד הים.', ['pic', 'לאן הם נסעו?', '🏖️ לים', '⛰️ להרים', '🏙️ לעיר', '🏜️ למדבר']],
      ['⛱️', 'הם פתחו שמשייה אדומה.', ['color', 'באיזה צבע הייתה השמשייה?', 'אדום']],
      ['🍦', 'יעקב קנה גלידה.', ['pic', 'מה יעקב קנה?', '🍦 גלידה', '🍉 אבטיח', '🌭 נקניקייה', '🥤 שתייה']],
      ['🐚 🐚', 'אסתר אספה צדפים על החוף.', ['pic', 'מה אסתר אספה על החוף?', '🐚 צדפים', '🦀 סרטנים', '🍂 עלים', '⭐ כוכבים']]],
      no: [['🐬', 'יעקב שחה עם דולפין.'], ['⛵', 'הם שטו במפרשית.']] },
    { p: [
      ['🏠 👴 🤧', 'אברהם התעורר עם שיעול.'],
      ['🚕', 'הוא נסע במונית למרפאה.', ['pic', 'איך אברהם נסע למרפאה?', '🚕 במונית', '🚌 באוטובוס', '🚗 במכונית שלו', '🚶 ברגל']],
      ['🏥 👩‍⚕️', 'הרופאה בדקה אותו בעדינות.', ['pic', 'מי בדקה את אברהם?', '👩‍⚕️ רופאה', '👮 שוטר', '👨‍🍳 טבח', '👩‍🏫 מורה']],
      ['💊 💊', 'היא נתנה לו שתי תרופות.', ['num', 'כמה תרופות אברהם קיבל?', 2]],
      ['🍵 🍯', 'בבית הוא שתה תה עם דבש.', ['pic', 'מה אברהם שתה בבית?', '🍵 תה עם דבש', '☕ קפה', '🥛 חלב', '🧃 מיץ']],
      ['🛏️ 😴', 'בערב הוא הלך לישון מוקדם.']],
      no: [['🏃', 'אברהם רץ בפארק.'], ['🍕', 'אברהם אכל פיצה.']] },
    { p: [
      ['🏠 🐈', 'לחנה יש חתול שחור בשם מיצי.', ['color', 'באיזה צבע החתול של חנה?', 'שחור']],
      ['🚪 🐈', 'בבוקר החתול יצא מהדלת ולא חזר.'],
      ['🌳 🔍', 'חנה חיפשה אותו בפארק.', ['pic', 'איפה חנה חיפשה את החתול?', '🌳 בפארק', '🏫 בבית הספר', '🏪 בחנות', '🏖️ בים']],
      ['👦 🏠 🐈', 'ילד מהשכונה ראה את החתול על גג.', ['pic', 'איפה היה החתול?', '🏠 על גג', '🚗 מתחת למכונית', '🌳 על עץ', '📦 בקופסה']],
      ['🐟 🐈', 'השכן פיתה אותו עם דג, והחתול ירד.', ['pic', 'במה פיתו את החתול לרדת?', '🐟 דג', '🥛 חלב', '🧀 גבינה', '🍗 עוף']],
      ['🏠 🥛 😊', 'בבית חנה נתנה לו קערת חלב.']],
      no: [['🐕', 'כלב רדף אחרי החתול.'], ['🚒', 'כבאים הגיעו עם משאית.']] },
    { p: [
      ['👵 📖', 'סבתא מרים מצאה מתכון ישן.'],
      ['🥚 🥚 🥚', 'היא שברה שלוש ביצים לקערה.', ['num', 'כמה ביצים מרים שברה?', 3]],
      ['🍫', 'היא הוסיפה הרבה שוקולד.', ['pic', 'מה מרים הוסיפה לבצק?', '🍫 שוקולד', '🍓 תותים', '🥕 גזר', '🍌 בננה']],
      ['🔥 ⏰', 'העוגה נאפתה בתנור שעה שלמה.'],
      ['📞 👧', 'הנכדה התקשרה ואמרה שהיא באה.', ['pic', 'מי התקשר למרים?', '👧 הנכדה', '👨 הבן', '👮 שוטר', '👴 השכן']],
      ['🎂 ☕', 'הן אכלו יחד עוגה ושתו קפה.']],
      no: [['🐕', 'הכלב אכל את העוגה.'], ['🛒', 'מרים הלכה לסופר.']] },
    { p: [
      ['🎒 👨 👩', 'בני ורינה יצאו לטיול.'],
      ['🚗 ⛰️', 'הם נסעו במכונית אל ההרים.', ['pic', 'לאן בני ורינה נסעו?', '⛰️ להרים', '🏖️ לים', '🏙️ לעיר', '🏜️ למדבר']],
      ['🦌', 'בדרך הם ראו צבי.', ['pic', 'איזו חיה ראו בדרך?', '🦌 צבי', '🐗 חזיר בר', '🦊 שועל', '🐇 ארנב']],
      ['🧺 🥪', 'הם עצרו לפיקניק עם כריכים.', ['pic', 'מה הם אכלו בפיקניק?', '🥪 כריכים', '🍕 פיצה', '🍝 פסטה', '🍔 המבורגר']],
      ['🌦️ 🌈', 'אחרי גשם קצר הופיעה קשת בענן.', ['pic', 'מה הופיע בשמיים?', '🌈 קשת', '✈️ מטוס', '🎈 בלון', '🦅 נשר']],
      ['📷', 'רינה צילמה ארבע תמונות.', ['num', 'כמה תמונות רינה צילמה?', 4]]],
      no: [['⛷️', 'בני גלש בשלג.'], ['🐍', 'הם ראו נחש.']] },
    { p: [
      ['🐕 🏠', 'לעמוס יש כלב קטן בשם בובי.'],
      ['📬 ✉️', 'הדוור הביא מכתב.', ['pic', 'מה הדוור הביא?', '✉️ מכתב', '📦 חבילה', '📰 עיתון', '💐 פרחים']],
      ['🐕 💨', 'בובי חטף את המכתב וברח.'],
      ['🪑 🐕', 'עמוס מצא אותו מתחת לספסל בגינה.', ['pic', 'איפה עמוס מצא את בובי?', '🪑 מתחת לספסל', '🚗 מתחת למכונית', '🌳 על עץ', '🛏️ מתחת למיטה']],
      ['💍 💌', 'במכתב הייתה הזמנה לחתונה.', ['pic', 'מה היה במכתב?', '💍 הזמנה לחתונה', '🎂 הזמנה ליום הולדת', '💰 חשבון', '📷 תמונה']],
      ['🦴 🐕', 'עמוס נתן לבובי עצם.', ['pic', 'מה עמוס נתן לבובי?', '🦴 עצם', '⚽ כדור', '🥩 סטייק', '🧸 בובה']]],
      no: [['🐈', 'בובי רדף אחרי חתול.'], ['🚲', 'הדוור רכב על אופניים.']] },
    { p: [
      ['👚 🧺', 'אורית אספה את הכביסה.'],
      ['👕 🧼', 'היא כיבסה חולצה אדומה.', ['color', 'באיזה צבע הייתה החולצה?', 'אדום']],
      ['☀️ 👕', 'היא תלתה את הכביסה בשמש.'],
      ['🌬️ 🧦', 'רוח חזקה העיפה גרב.', ['pic', 'מה הרוח העיפה?', '🧦 גרב', '🧣 צעיף', '👒 כובע', '🧤 כפפה']],
      ['🐕 🧦', 'כלב השכנים מצא את הגרב.', ['pic', 'מי מצא את הגרב?', '🐕 כלב', '🐈 חתול', '🐦 ציפור', '👦 ילד']],
      ['👕 👕 👕 👕 👕 👕 👕', 'בערב היא קיפלה שבע חולצות.', ['num', 'כמה חולצות אורית קיפלה?', 7]]],
      no: [['🌧️', 'ירד גשם על הכביסה.'], ['🔥', 'החולצה נשרפה.']] },
    { p: [
      ['🎨 👴', 'שמעון הלך לחוג ציור.'],
      ['🖼️ ⛵', 'הוא צייר סירה על הים.', ['pic', 'מה שמעון צייר?', '⛵ סירה', '🏠 בית', '🌳 עץ', '🐎 סוס']],
      ['🖌️ 🌊', 'הוא צבע את הים בכחול.', ['color', 'באיזה צבע שמעון צבע את הים?', 'כחול']],
      ['☕ 🍪', 'בהפסקה הוא שתה קפה ואכל עוגייה.', ['pic', 'מה שמעון אכל בהפסקה?', '🍪 עוגייה', '🍩 סופגנייה', '🍎 תפוח', '🥐 קרואסון']],
      ['👩‍🏫 👏', 'המורה אמרה שהציור יפה מאוד.', ['pic', 'מי אמר שהציור יפה?', '👩‍🏫 המורה', '👵 אשתו', '👦 הנכד', '👮 שוטר']],
      ['🏠 🖼️', 'בבית הוא תלה את הציור על הקיר.']],
      no: [['🎹', 'שמעון ניגן בפסנתר.'], ['✂️', 'שמעון גזר נייר.']] },
    { p: [
      ['💐 👩', 'דנה רצתה לשמח את אמא שלה.'],
      ['🏪 🌹', 'היא נכנסה לחנות פרחים.', ['pic', 'לאיזו חנות דנה נכנסה?', '💐 חנות פרחים', '🍞 מאפייה', '👗 חנות בגדים', '📚 חנות ספרים']],
      ['🌷 🌷 🌷 🌷 🌷', 'היא קנתה חמישה צבעונים.', ['num', 'כמה צבעונים דנה קנתה?', 5]],
      ['🎀', 'המוכר קשר אותם בסרט צהוב.', ['color', 'באיזה צבע היה הסרט?', 'צהוב']],
      ['🚌', 'היא נסעה באוטובוס לאמא.', ['pic', 'איך דנה נסעה לאמא?', '🚌 באוטובוס', '🚕 במונית', '🚆 ברכבת', '🚲 באופניים']],
      ['👵 😊 💐', 'אמא חייכה ושמה את הפרחים באגרטל.']],
      no: [['🐝', 'דבורה עקצה את דנה.'], ['🎂', 'דנה קנתה עוגה.']] },
    { p: [
      ['🏊 👴', 'סבא חיים הולך לבריכה כל בוקר.'],
      ['🕶️ 🎒', 'הוא לקח משקפי שמש ומגבת.', ['pic', 'מה חיים לקח איתו?', '🕶️ משקפי שמש', '⌚ שעון', '📻 רדיו', '☂️ מטרייה']],
      ['🏊 🔟', 'הוא שחה עשר בריכות.', ['num', 'כמה בריכות חיים שחה?', 10]],
      ['👴 🤝 👴', 'הוא פגש שם חבר ותיק מהצבא.', ['pic', 'את מי חיים פגש בבריכה?', '👴 חבר ותיק', '👶 תינוק', '👮 שוטר', '👩‍🍳 טבחית']],
      ['🍊 🥤', 'אחרי השחייה הם שתו מיץ תפוזים.', ['pic', 'מה הם שתו אחרי השחייה?', '🍊 מיץ תפוזים', '🍋 לימונדה', '☕ קפה', '🥛 חלב']],
      ['🚶 🏠', 'חיים הלך הביתה ברגל.']],
      no: [['🦈', 'כריש שחה בבריכה.'], ['🎾', 'חיים שיחק טניס.']] },
    { p: [
      ['🏺 👨', 'רפי הלך לשוק הפשפשים.'],
      ['📻', 'הוא מצא רדיו ישן.', ['pic', 'מה רפי מצא בשוק?', '📻 רדיו', '📺 טלוויזיה', '☎️ טלפון', '⏰ שעון']],
      ['💰', 'הוא שילם עליו עשרים שקלים.', ['num', 'כמה שקלים רפי שילם?', 20]],
      ['🪑', 'הוא ראה גם כיסא ירוק ויפה.', ['color', 'באיזה צבע היה הכיסא?', 'ירוק']],
      ['🎻 🎶', 'נגן כינור ניגן ליד הדוכן.', ['pic', 'על מה ניגן הנגן?', '🎻 כינור', '🎸 גיטרה', '🎺 חצוצרה', '🥁 תוף']],
      ['🏠 📻 🎵', 'בבית הרדיו עבד, ורפי שמע שירים.']],
      no: [['🐒', 'קוף גנב את הרדיו.'], ['👓', 'רפי קנה משקפיים.']] },
    { p: [
      ['🍽️ 👫', 'יוסי ונורית הלכו למסעדה לחגוג יום נישואים.'],
      ['🍝', 'יוסי הזמין פסטה.', ['pic', 'מה יוסי הזמין?', '🍝 פסטה', '🍕 פיצה', '🥩 סטייק', '🍣 סושי']],
      ['🍕', 'נורית הזמינה פיצה.', ['pic', 'מה נורית הזמינה?', '🍕 פיצה', '🍝 פסטה', '🥗 סלט', '🍲 מרק']],
      ['🕯️ 🕯️', 'על השולחן דלקו שני נרות.', ['num', 'כמה נרות דלקו על השולחן?', 2]],
      ['🍨', 'לקינוח הם חלקו גלידה.'],
      ['🚕 🌙', 'בלילה הם חזרו הביתה במונית.', ['pic', 'איך הם חזרו הביתה?', '🚕 במונית', '🚌 באוטובוס', '🚶 ברגל', '🚲 באופניים']]],
      no: [['🎤', 'יוסי שר בקריוקי.'], ['🎂', 'המלצר הביא עוגה.']] },
    { p: [
      ['📺 👵', 'אסתר צפתה בטלוויזיה בערב.'],
      ['🌑', 'פתאום החשמל נפל והכול היה חשוך.'],
      ['🕯️ 🕯️ 🕯️', 'היא הדליקה שלושה נרות.', ['num', 'כמה נרות אסתר הדליקה?', 3]],
      ['📻', 'היא שמעה חדשות ברדיו עם סוללות.', ['pic', 'במה אסתר שמעה חדשות?', '📻 ברדיו', '📺 בטלוויזיה', '📱 בטלפון', '💻 במחשב']],
      ['👨 🔦', 'השכן בא עם פנס לבדוק שהכול בסדר.', ['pic', 'מה השכן הביא?', '🔦 פנס', '🕯️ נר', '🔨 פטיש', '🧰 ארגז כלים']],
      ['💡 😊', 'אחרי שעה החשמל חזר.']],
      no: [['☎️', 'אסתר התקשרה לחשמלאי.'], ['🍲', 'אסתר בישלה מרק.']] },
    { p: [
      ['🚪 👦', 'הנכד איתי בא לבקר את סבא.'],
      ['♟️', 'הם שיחקו שחמט.', ['pic', 'במה הם שיחקו?', '♟️ שחמט', '🃏 קלפים', '🎲 קוביות', '⚽ כדורגל']],
      ['🏆 👦', 'איתי ניצח פעמיים.', ['num', 'כמה פעמים איתי ניצח?', 2]],
      ['🥞', 'סבא הכין לו חביתיות.', ['pic', 'מה סבא הכין לאיתי?', '🥞 חביתיות', '🍳 חביתה', '🍕 פיצה', '🥗 סלט']],
      ['🪁', 'אחר כך הם העיפו עפיפון אדום.', ['color', 'באיזה צבע היה העפיפון?', 'אדום']],
      ['🚗 👋', 'בערב אבא של איתי בא לקחת אותו.', ['pic', 'מי בא לקחת את איתי?', '👨 אבא', '👩 אמא', '👵 סבתא', '🚕 נהג מונית']]],
      no: [['🐶', 'הם הלכו לחנות חיות.'], ['🎬', 'הם הלכו לקולנוע.']] },
    { p: [
      ['☕ 👩', 'ציפי ישבה בבית קפה.'],
      ['🥐', 'היא הזמינה קרואסון.', ['pic', 'מה ציפי הזמינה לאכול?', '🥐 קרואסון', '🍰 עוגה', '🥪 כריך', '🍩 סופגנייה']],
      ['📰', 'היא קראה עיתון.', ['pic', 'מה ציפי קראה?', '📰 עיתון', '📖 ספר', '✉️ מכתב', '📱 טלפון']],
      ['🐦', 'ציפור קטנה נחתה על השולחן.', ['pic', 'מי נחת על השולחן?', '🐦 ציפור', '🐝 דבורה', '🦋 פרפר', '🐈 חתול']],
      ['🍞 🐦', 'ציפי נתנה לה פירורים.'],
      ['💵', 'היא שילמה שלושים שקלים והלכה.', ['num', 'כמה שקלים ציפי שילמה?', 30]]],
      no: [['🌧️', 'התחיל לרדת גשם.'], ['🎂', 'המלצר הביא עוגה.']] },
    { p: [
      ['⏰ 👨', 'אבי התעורר מאוחר.'],
      ['🚏 🚌', 'האוטובוס נסע בלי לחכות לו.'],
      ['🚲', 'אבי לקח את האופניים.', ['pic', 'איך אבי נסע לעבודה בסוף?', '🚲 באופניים', '🚕 במונית', '🚌 באוטובוס', '🚶 ברגל']],
      ['🐄 🐄 🐄 🐄', 'בדרך הוא ראה ארבע פרות.', ['num', 'כמה פרות אבי ראה?', 4]],
      ['🏢 👍', 'הוא הגיע לעבודה בזמן.'],
      ['🍩', 'החברים בעבודה כיבדו אותו בסופגנייה.', ['pic', 'במה כיבדו את אבי?', '🍩 סופגנייה', '🍰 עוגה', '🍪 עוגייה', '🍫 שוקולד']]],
      no: [['🚑', 'אמבולנס עצר ליד אבי.'], ['🐕', 'כלב רדף אחרי אבי.']] },
    { p: [
      ['📚 👵', 'סבתא לאה הלכה לספרייה.'],
      ['📕', 'היא שאלה ספר אדום וגדול.', ['color', 'באיזה צבע היה הספר?', 'אדום']],
      ['🔍 👓', 'היא לא מצאה את המשקפיים שלה.'],
      ['👜 👓', 'בסוף המשקפיים היו בתיק.', ['pic', 'איפה היו המשקפיים?', '👜 בתיק', '🧥 בכיס המעיל', '🛋️ על הספה', '🚗 במכונית']],
      ['🐢 🌍', 'הספר היה על צב שטייל בעולם.', ['pic', 'על מי היה הספר?', '🐢 צב', '🐘 פיל', '🦁 אריה', '🐇 ארנב']],
      ['🛋️ 📖 🍵', 'בבית היא קראה על הספה עם כוס תה.']],
      no: [['🎹', 'לאה ניגנה בפסנתר.'], ['🚂', 'לאה נסעה ברכבת.']] },
    { p: [
      ['❄️ 🏙️', 'בבוקר ירד שלג בעיר.'],
      ['🧥 🧣', 'משה לבש מעיל וצעיף כחול.', ['color', 'באיזה צבע היה הצעיף של משה?', 'כחול']],
      ['⛄', 'הנכדים בנו איש שלג.', ['pic', 'מה בנו הנכדים?', '⛄ איש שלג', '🏰 טירה', '🏠 בית', '🚗 מכונית']],
      ['🥕 ⛄', 'לאיש השלג שמו גזר במקום אף.', ['pic', 'מה שמו לאיש השלג במקום אף?', '🥕 גזר', '🍌 בננה', '🥒 מלפפון', '🍆 חציל']],
      ['☕ ☕ ☕', 'בבית שתו שלוש כוסות שוקו חם.', ['num', 'כמה כוסות שוקו שתו?', 3]],
      ['🔥 😊', 'כולם ישבו ליד האח והתחממו.']],
      no: [['⛷️', 'משה גלש בסקי.'], ['🚒', 'כבאית נתקעה בשלג.']] },
    { p: [
      ['🚗 👨', 'עמוס נסע במכונית לעבודה.'],
      ['🚗 💨', 'פתאום נשמע רעש והמכונית עצרה.'],
      ['📞', 'הוא התקשר למוסך.'],
      ['🚚', 'הגיעה משאית גרר.', ['pic', 'מה הגיע לעזור לעמוס?', '🚚 משאית גרר', '🚑 אמבולנס', '🚓 ניידת', '🚒 כבאית']],
      ['🔧 👨‍🔧', 'המכונאי החליף גלגל.', ['pic', 'מי תיקן את המכונית?', '👨‍🔧 מכונאי', '👨‍🍳 טבח', '👨‍⚕️ רופא', '👨‍🏫 מורה']],
      ['💵', 'עמוס שילם מאה שקלים.', ['num', 'כמה שקלים עמוס שילם?', 100]]],
      no: [['⛽', 'עמוס עצר לתדלק.'], ['🚨', 'שוטר עצר את עמוס.']] },
    { p: [
      ['🍲 👵', 'ביום שישי סבתא רינה בישלה מרק.'],
      ['🍗', 'בתנור היה עוף עם תפוחי אדמה.', ['pic', 'מה היה בתנור?', '🍗 עוף', '🐟 דג', '🥩 סטייק', '🍕 פיצה']],
      ['🍞', 'הבן הביא חלה מהמאפייה.', ['pic', 'מה הבן הביא?', '🍞 חלה', '🍰 עוגה', '🍷 יין', '💐 פרחים']],
      ['👨‍👩‍👧‍👦 👵 👴', 'שישה אנשים ישבו סביב השולחן.', ['num', 'כמה אנשים ישבו סביב השולחן?', 6]],
      ['🍷 🥂', 'כולם הרימו כוסות ואמרו לחיים.'],
      ['🍽️ 👧', 'אחרי האוכל הנכדה שטפה כלים.', ['pic', 'מי שטף את הכלים?', '👧 הנכדה', '👦 הנכד', '👵 סבתא', '👨 הבן']]],
      no: [['🎆', 'היו זיקוקים בשמיים.'], ['📺', 'כולם ראו טלוויזיה.']] },
    { p: [
      ['🦁 👴 👧', 'סבא לקח את הנכדה שירה לגן החיות.'],
      ['🐘 💧', 'הם ראו פיל ענק שותה מים.', ['pic', 'איזו חיה שתתה מים?', '🐘 פיל', '🦒 ג׳ירפה', '🦓 זברה', '🦏 קרנף']],
      ['🐒 🍌', 'קוף אכל בננה.', ['pic', 'מה אכל הקוף?', '🍌 בננה', '🍎 תפוח', '🥜 בוטנים', '🍇 ענבים']],
      ['🦒 🦒 🦒', 'שלוש ג׳ירפות עמדו ליד העצים.', ['num', 'כמה ג׳ירפות עמדו ליד העצים?', 3]],
      ['🎈', 'סבא קנה לשירה בלון ירוק.', ['color', 'באיזה צבע היה הבלון?', 'ירוק']],
      ['🦜 👋', 'תוכי אמר להם שלום.', ['pic', 'מי אמר להם שלום?', '🦜 תוכי', '🐒 קוף', '🦉 ינשוף', '🐧 פינגווין']]],
      no: [['🐊', 'הם ראו תנין.'], ['🐎', 'שירה רכבה על סוס.']] },
    { p: [
      ['💍 👰 🤵', 'הנכד של דוד התחתן.'],
      ['👔', 'דוד לבש עניבה סגולה.', ['color', 'באיזה צבע הייתה העניבה של דוד?', 'סגול']],
      ['🎺 🎶', 'להקה ניגנה בחצוצרה.', ['pic', 'באיזה כלי ניגנה הלהקה?', '🎺 חצוצרה', '🎻 כינור', '🥁 תוף', '🎹 פסנתר']],
      ['💃 🕺', 'דוד רקד עם אשתו.'],
      ['🎂', 'העוגה הייתה בגובה ארבע קומות.', ['num', 'כמה קומות היו לעוגה?', 4]],
      ['📸 👨‍👩‍👧‍👦', 'צלם צילם את כל המשפחה.', ['pic', 'מי צילם את המשפחה?', '📸 צלם', '👮 שוטר', '👨‍🍳 טבח', '👩‍⚕️ רופאה']]],
      no: [['🌧️', 'ירד גשם על האורחים.'], ['🐎', 'החתן הגיע על סוס.']] },
    { p: [
      ['🏕️ 👨 👦', 'אבא ובנו יצאו לקמפינג.'],
      ['⛺', 'הם הקימו אוהל צהוב.', ['color', 'באיזה צבע היה האוהל?', 'צהוב']],
      ['🔥 🌭', 'בערב הם צלו נקניקיות על האש.', ['pic', 'מה הם צלו על האש?', '🌭 נקניקיות', '🌽 תירס', '🍗 עוף', '🐟 דג']],
      ['🦉 🌙', 'ינשוף קרא מהעץ.', ['pic', 'מי קרא מהעץ?', '🦉 ינשוף', '🐺 זאב', '🐸 צפרדע', '🦇 עטלף']],
      ['⭐ ⭐ ⭐ ⭐ ⭐', 'הם ספרו כוכבים עד שנרדמו.'],
      ['🌅 ☕', 'בבוקר הם שתו קפה ליד האוהל.', ['pic', 'מה הם שתו בבוקר?', '☕ קפה', '🧃 מיץ', '🥛 חלב', '🍵 תה']]],
      no: [['🐻', 'דוב נכנס לאוהל.'], ['🌧️', 'גשם הציף את האוהל.']] }
  ];

  /* Level 1–50 → panels, questions, kinds of questions, answer count. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, Math.round(Number(level)) || 1));
    return {
      level: L,
      panels: L <= 6 ? 3 : L <= 14 ? 4 : L <= 24 ? 5 : 6,
      q: L <= 4 ? 3 : L <= 14 ? 4 : L <= 29 ? 5 : 6,
      opts: L <= 5 ? 3 : 4,
      detail: L >= 8,            // colours and numbers
      order: L >= 15 ? (L >= 40 ? 2 : 1) : 0,  // order questions
      order3: L >= 25,           // "what came first of three" / "what came right after"
      not: L >= 30 ? 1 : 0,      // "what did NOT happen"
      lure: L >= 20,             // wrong answers taken from the same story
      back: L <= 20              // a "back" button while looking at the panels
    };
  }

  function pic(s) { var i = s.indexOf(' '); return { e: s.slice(0, i), t: s.slice(i + 1) }; }
  function usable(f, sp) { return f && (f[0] === 'pic' || sp.detail); }

  /* Which panels are shown: always the first and the last, the middle ones chosen (in order). */
  function pickPanels(story, sp, R) {
    var n = Math.min(sp.panels, story.p.length), mids = [];
    for (var i = 1; i < story.p.length - 1; i++) mids.push(i);
    // prefer middle panels that can be asked about
    var withF = R.shuffle(mids.filter(function (i) { return usable(story.p[i][2], sp); }));
    var without = R.shuffle(mids.filter(function (i) { return !usable(story.p[i][2], sp); }));
    var chosen = withF.concat(without).slice(0, n - 2);
    return [0].concat(chosen.sort(function (a, b) { return a - b; }), [story.p.length - 1]);
  }

  function numOptions(n, count, R) {
    var near = n >= 10 ? [n - 10, n + 10, n + 5, n - 5, n + 20] : [n - 1, n + 1, n + 2, n - 2, n + 3];
    near = R.shuffle(near.filter(function (x) { return x > 0 && x !== n; }));
    return R.shuffle([n].concat(near.slice(0, count - 1)));
  }

  /* A question: { kind: 'pic'|'color'|'num'|'scene', q, options: [{key, e?, t?, color?}], answer: key } */
  function factQuestion(story, idx, shown, sp, R) {
    var f = story.p[idx][2], n = sp.opts, opts;
    if (f[0] === 'pic') {
      var right = f[2], wrong = R.shuffle(f.slice(3));
      if (sp.lure) {
        // a picture from another shown panel of the same story makes a tempting wrong answer
        var lures = [];
        shown.forEach(function (j) {
          var g = story.p[j][2];
          if (j !== idx && g && g[0] === 'pic' && pic(g[2]).e !== pic(right).e && pic(g[2]).t !== pic(right).t) lures.push(g[2]);
        });
        if (lures.length) wrong = [R.pick(lures)].concat(wrong.filter(function (w) { return pic(w).e !== pic(lures[0]).e; }));
      }
      var seen = {}, list = [right];
      seen[pic(right).e] = true;
      wrong.forEach(function (w) { if (list.length < n && !seen[pic(w).e]) { seen[pic(w).e] = true; list.push(w); } });
      opts = R.shuffle(list).map(function (s) { var p = pic(s); return { key: s, e: p.e, t: p.t }; });
      return { kind: 'pic', q: f[1], options: opts, answer: right, panel: idx };
    }
    if (f[0] === 'color') {
      var others = R.shuffle(Object.keys(COLORS).filter(function (c) { return c !== f[2]; })).slice(0, n - 1);
      opts = R.shuffle([f[2]].concat(others)).map(function (c) { return { key: c, t: c, color: COLORS[c] }; });
      return { kind: 'color', q: f[1], options: opts, answer: f[2], panel: idx };
    }
    opts = numOptions(f[2], n, R).map(function (x) { return { key: String(x), t: String(x) }; });
    return { kind: 'num', q: f[1], options: opts, answer: String(f[2]), panel: idx };
  }

  function sceneOpt(story, i) { return { key: 'p' + i, e: story.p[i][0], t: story.p[i][1] }; }

  function orderQuestion(story, shown, sp, R) {
    var kinds = sp.order3 && shown.length >= 4 ? ['first3', 'last3', 'after'] : ['first2'];
    var k = R.pick(kinds), pick, ans;
    if (k === 'first2') {
      pick = R.shuffle(shown).slice(0, 2).sort(function (a, b) { return a - b; });
      return { kind: 'scene', q: 'מה קרה קודם?', options: R.shuffle(pick.map(function (i) { return sceneOpt(story, i); })), answer: 'p' + pick[0] };
    }
    if (k === 'after') {
      var at = R.randInt(0, shown.length - 2), nextI = shown[at + 1];
      var rest = R.shuffle(shown.filter(function (i) { return i !== shown[at] && i !== nextI; })).slice(0, 2);
      return { kind: 'scene', q: 'מה קרה מיד אחרי: "' + story.p[shown[at]][1] + '"', options: R.shuffle([nextI].concat(rest).map(function (i) { return sceneOpt(story, i); })), answer: 'p' + nextI };
    }
    pick = R.shuffle(shown).slice(0, 3).sort(function (a, b) { return a - b; });
    ans = k === 'first3' ? pick[0] : pick[2];
    return { kind: 'scene', q: k === 'first3' ? 'מה מאלה קרה ראשון?' : 'מה מאלה קרה אחרון?', options: R.shuffle(pick.map(function (i) { return sceneOpt(story, i); })), answer: 'p' + ans };
  }

  /* "which picture was in the story?" — one shown scene and scenes from other stories (easy filler) */
  function seenQuestion(story, shown, sp, R) {
    var small = shown.filter(function (i) { return story.p[i][0].split(' ').length <= 3; });
    var i = R.pick(small.length ? small : shown);
    var others = [];
    R.shuffle(STORIES.filter(function (x) { return x !== story; })).forEach(function (o) {
      var c = R.pick(o.p.filter(function (q) { return q[0].split(' ').length <= 3; }));
      if (others.length < sp.opts - 1 && c && c[0] !== story.p[i][0] && !others.some(function (x) { return x.e === c[0]; })) others.push({ key: 'x' + others.length, e: c[0], t: '' });
    });
    return { kind: 'scene', q: 'איזו תמונה הייתה בסיפור?', options: R.shuffle([{ key: 'p' + i, e: story.p[i][0], t: '' }].concat(others)), answer: 'p' + i };
  }

  function notQuestion(story, shown, R) {
    var real = R.shuffle(shown).slice(0, 3).map(function (i) { return sceneOpt(story, i); });
    var fake = R.pick(story.no);
    var fo = { key: 'no', e: fake[0], t: fake[1] };
    return { kind: 'scene', q: 'מה מאלה לא קרה בסיפור?', options: R.shuffle(real.concat([fo])), answer: 'no' };
  }

  /* A whole round: the shown panels and the questions about them. */
  function makeRound(story, sp, R) {
    var shown = pickPanels(story, sp, R);
    var qs = [];
    var special = [];
    for (var o = 0; o < sp.order; o++) special.push(orderQuestion(story, shown, sp, R));
    for (var t = 0; t < sp.not; t++) special.push(notQuestion(story, shown, R));
    var facts = R.shuffle(shown.filter(function (i) { return usable(story.p[i][2], sp); }));
    var want = Math.max(0, sp.q - special.length);
    facts.slice(0, want).forEach(function (i) { qs.push(factQuestion(story, i, shown, sp, R)); });
    // not enough facts in the shown panels: more order questions
    while (qs.length + special.length < sp.q) special.push(sp.level < 15 ? seenQuestion(story, shown, sp, R) : orderQuestion(story, shown, sp, R));
    // facts in story order first (easier to recall), the special questions at the end
    qs.sort(function (a, b) { return a.panel - b.panel; });
    return { shown: shown, questions: qs.concat(R.shuffle(special)) };
  }

  var css = [
    '.sr-count{margin:0;color:var(--ink-soft);font-weight:800;font-size:1.05rem;}',
    '.sr-dots{display:flex;gap:.4rem;justify-content:center;}',
    '.sr-dots i{width:.9rem;height:.9rem;border-radius:50%;background:var(--line);}',
    '.sr-dots i.on{background:var(--memory);}',
    '.sr-panel{width:100%;max-width:22rem;border:4px solid var(--ink);border-radius:var(--radius);background:var(--surface);overflow:hidden;',
    'display:flex;flex-direction:column;box-shadow:var(--shadow);}',
    '.sr-scene{min-height:13rem;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.2rem .5rem;padding:.8rem;',
    'background:var(--memory-soft);font-size:3.7rem;line-height:1.15;direction:ltr;}',
    '.sr-scene.is-many{font-size:2.9rem;}',
    '.sr-cap{margin:0;padding:.7rem .8rem;border-top:4px solid var(--ink);font-size:1.35rem;font-weight:800;text-align:center;line-height:1.35;min-height:4.6rem;',
    'display:flex;align-items:center;justify-content:center;text-wrap:balance;}',
    '.sr-q{font-size:1.3rem;font-weight:800;text-align:center;margin:0;text-wrap:balance;line-height:1.35;}',
    '.sr-choices{width:100%;max-width:26rem;}',
    '.sr-pic{display:flex;flex-direction:column;align-items:center;gap:.15rem;min-height:6.4rem;}',
    '.sr-pic .sr-e{font-size:2.8rem;line-height:1.1;}',
    '.sr-pic .sr-t{font-size:1.1rem;font-weight:800;line-height:1.2;}',
    '.sr-sw{display:block;width:3rem;height:3rem;border-radius:50%;border:3px solid var(--ink);margin-bottom:.2rem;}',
    '.sr-num{font-size:2.2rem;font-weight:900;}',
    '.sr-scenes{grid-template-columns:1fr;gap:.5rem;}',
    '.sr-scenes .g-choice{display:flex;align-items:center;gap:.6rem;text-align:start;min-height:4rem;padding:.35rem .7rem;font-size:1.1rem;line-height:1.3;}',
    '.sr-scenes .sr-e{font-size:1.9rem;flex:none;direction:ltr;min-width:4.2rem;text-align:center;}',
    '.sr-scenes.is-two .g-choice{min-height:5.5rem;}',
    '.sr-scenes.is-two .sr-e{font-size:2.6rem;}',
    '.sr-scenes.is-pics .g-choice{justify-content:center;min-height:4.8rem;}',
    '.sr-scenes.is-pics .sr-e{font-size:2.8rem;}'
  ].join('');

  BrainGames.register({
    id: 'story-recall',
    name: 'זוכרים סיפור',
    skill: 'memory',
    tagline: 'סיפור קומיקס קצר בתמונות, ואז שאלות מהזיכרון',
    benefit: 'זיכרון של פרטים ושל סדר האירועים',
    instructions: [
      'יופיע סיפור קצר בתמונות, תמונה אחרי תמונה. מתחת לכל תמונה יש משפט אחד.',
      'הסתכלו וקראו בנחת, ולחצו "הבא" כשאתם מוכנים.',
      'אחר כך ענו על שאלות מהזיכרון: מה היה, מי, איפה, באיזה צבע, כמה, ומה קרה קודם. לרוב בוחרים תמונה.',
      'בשלבים הגבוהים הסיפור ארוך יותר, ויש גם שאלות על הסדר ועל מה שלא קרה. אין שעון.'
    ],
    css: css,
    _model: { STORIES: STORIES, spec: spec, makeRound: makeRound, pickPanels: pickPanels, COLORS: COLORS },
    start: function (root, ctx) {
      var el = ctx.el;
      var sp = spec(ctx.level);
      var ROUNDS = 2;
      var order = ctx.shuffle(STORIES.map(function (_, i) { return i; }));
      var round = 0, correct = 0, total = 0;

      function nextStory() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: correct, total: total, note: 'זכרתם ' + correct + ' מתוך ' + total + ' פרטים משני סיפורים' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var story = STORIES[order[round - 1]];
        var R = makeRound(story, sp, ctx);
        showPanel(story, R, 0);
      }

      function showPanel(story, R, k) {
        root.innerHTML = '';
        var idx = R.shown[k], P = story.p[idx];
        var last = k === R.shown.length - 1;
        ctx.setStatus(k === 0 ? 'הסתכלו על הסיפור וזכרו את הפרטים' : 'זכרו את הפרטים');
        var dots = el('div', { class: 'sr-dots', 'aria-hidden': 'true' }, R.shown.map(function (_, j) { return el('i', { class: j <= k ? 'on' : '' }); }));
        var emojis = P[0].split(' ');
        root.appendChild(el('p', { class: 'sr-count' }, 'תמונה ' + (k + 1) + ' מתוך ' + R.shown.length));
        root.appendChild(dots);
        root.appendChild(el('div', { class: 'sr-panel' }, [
          el('div', { class: 'sr-scene' + (emojis.length > 4 ? ' is-many' : ''), role: 'img', 'aria-label': P[1] }, emojis.map(function (e) { return el('span', null, e); })),
          el('p', { class: 'sr-cap' }, P[1])]));
        var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () {
          next.disabled = true;
          if (last) ask(story, R, 0); else showPanel(story, R, k + 1);
        } }, last ? 'לשאלות' : 'הבא');
        var row = [next];
        if (sp.back && k > 0) row.push(el('button', { class: 'btn btn-secondary btn-lg', type: 'button', onclick: function () { showPanel(story, R, k - 1); } }, 'הקודם'));
        root.appendChild(el('div', { class: 'g-actions' }, row));
        ctx.studyTimer(next, 6000);
      }

      function optionEl(Q, o) {
        if (Q.kind === 'scene') return [el('span', { class: 'sr-e' }, o.e.split(' ').join('')), el('span', null, o.t)];
        if (Q.kind === 'pic') return [el('span', { class: 'sr-e' }, o.e), el('span', { class: 'sr-t' }, o.t)];
        if (Q.kind === 'color') return [el('span', { class: 'sr-sw', style: { background: 'var(--c-' + o.color + ')' } }), el('span', { class: 'sr-t' }, o.t)];
        return el('span', { class: 'sr-num' }, o.t);
      }

      function ask(story, R, i) {
        if (i >= R.questions.length) { nextStory(); return; }
        var Q = R.questions[i];
        root.innerHTML = '';
        ctx.setStatus('שאלה ' + (i + 1) + ' מתוך ' + R.questions.length);
        var answered = false;
        var buttons = Q.options.map(function (o) {
          var b = el('button', { class: 'g-choice' + (Q.kind === 'pic' || Q.kind === 'color' ? ' sr-pic' : ''), type: 'button', 'data-key': o.key,
            onclick: function () { choose(o, b); } }, optionEl(Q, o));
          return b;
        });
        root.appendChild(el('p', { class: 'sr-q' }, Q.q));
        root.appendChild(el('div', { class: 'g-choices sr-choices' + (Q.kind === 'scene' ? ' sr-scenes' + (Q.options.length === 2 ? ' is-two' : '') + (Q.options.every(function (o) { return !o.t; }) ? ' is-pics' : '') : '') }, buttons));
        var actions = el('div', { class: 'g-actions' });
        root.appendChild(actions);

        function choose(o, btn) {
          if (answered) return;
          answered = true;
          total++;
          var ok = o.key === Q.answer;
          if (ok) correct++;
          buttons.forEach(function (b) { b.disabled = true; if (b.getAttribute('data-key') === Q.answer) b.classList.add('is-correct'); });
          if (!ok) btn.classList.add('is-wrong');
          var right = Q.options.filter(function (x) { return x.key === Q.answer; })[0];
          var msg = Q.kind === 'scene' ? (Q.answer === 'no' ? 'זה לא קרה בסיפור' : 'התשובה מסומנת בירוק') : 'התשובה: ' + right.t;
          ctx.feedback(ok, ok ? undefined : msg).then(function () {
            if (ok) { ask(story, R, i + 1); return; }
            var nb = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { nb.disabled = true; ask(story, R, i + 1); } }, 'הבא');
            actions.appendChild(nb);
          });
        }
      }

      nextStory();
    }
  });
})();
