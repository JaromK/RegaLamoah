/* תשבץ — small Hebrew crosswords built fresh every time from a bank of everyday words and clues (language).
   Tap a square or a clue, type with the big Hebrew keyboard. Across words read right to left, down words top to
   bottom. A full word is checked (wrong letters turn red). Untimed. */
(function () {
  'use strict';

  var ABC = 'אבגדהוזחטיכלמנסעפצקרשת';
  var TO_BASE = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  var TO_FINAL = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' };
  function base(ch) { return TO_BASE[ch] || ch; }
  function baseWord(w) { return w.split('').map(base).join(''); }

  /* answer|easy clue|harder clue (optional). A leading * marks a less common word (from level 16). */
  var BANK = [
    'ירושלים|בירת ישראל|עיר הקודש והבירה', 'כלב|חיה שנובחת|החבר הכי טוב של האדם', 'חתול|חיה שמייללת|אוהב לרדוף אחרי עכברים',
    'פרה|נותנת לנו חלב|חיה ברפת שאומרת מו', 'סוס|רוכבים עליו|דוהר באורווה', 'שמש|מאירה ביום|הכוכב הכי קרוב אלינו',
    'ירח|מאיר בלילה|מלא באמצע החודש העברי', 'ים|יש בו גלים|התיכון או האדום', 'ספר|קוראים בו|יש בו פרקים ועמודים',
    'שולחן|אוכלים לידו|רהיט עם ארבע רגליים', 'כיסא|יושבים עליו|יש לו משענת', 'חלב|משקה לבן מהפרה|שמים אותו בקפה',
    'לחם|אופים אותו במאפייה|מברכים עליו "המוציא"', 'מים|שותים אותם כשצמאים|נוזל שקוף שיוצא מהברז', 'גשם|יורד מהעננים|בא בחורף וממלא את הכנרת',
    'שלג|לבן וקר, יורד בחורף|יורד לפעמים על החרמון', 'עץ|יש לו גזע וענפים|ביער יש הרבה כאלה', 'פרח|גדל בגינה ויש לו ריח|ורד או חבצלת',
    'תפוח|פרי אדום או ירוק|טובלים אותו בדבש בראש השנה', 'בננה|פרי צהוב וארוך|קולפים אותה, וקופים אוהבים אותה', 'ענב|פרי קטן שגדל באשכול|עושים ממנו יין',
    'לימון|פרי צהוב וחמוץ|סוחטים אותו על הסלט', 'תות|פרי אדום, קטן ומתוק|פרי שדה אדום עם נקודות', 'אבטיח|פרי גדול, ירוק מבחוץ ואדום מבפנים|אוכלים אותו בקיץ עם גבינה בולגרית',
    'גזר|ירק כתום|ארנבים אוהבים אותו', 'עגבנייה|ירק אדום לסלט|עושים ממנה רסק', 'מלפפון|ירק ירוק וארוך לסלט|כובשים אותו בחומץ',
    'בצל|ירק שגורם לדמעות|ירק בשכבות', 'שום|ירק לבן עם ריח חזק|יש לו שיניים אבל לא נושך', 'ביצה|התרנגולת מטילה אותה|מבשלים אותה רכה או קשה',
    'דבש|הדבורים מכינות אותו|מתוק, אוכלים אותו בראש השנה', 'סוכר|ממתיק את התה|גבישים לבנים ומתוקים', 'מלח|ממליחים איתו את האוכל|יש ממנו הרבה בים המלח',
    'קפה|משקה חם של בוקר|שותים אותו שחור או הפוך', 'תה|משקה חם עם שקית|מוסיפים לו נענע', 'עוגה|אופים אותה ליום הולדת|יש עליה קצפת או שוקולד',
    'גבינה|עשויה מחלב, לבנה או צהובה|מורחים אותה על לחם', 'אורז|גרגרים לבנים שמבשלים|תוספת לבנה ליד העוף', 'מרק|אוכלים אותו בכף, חם|של עוף, מבשלים אותו בסיר',
    'בית|גרים בו|יש בו חדרים ודלת', 'דלת|נכנסים דרכה|יש לה ידית ומנעול', 'חלון|מסתכלים דרכו החוצה|יש לו זכוכית ותריס',
    'מיטה|ישנים בה|פורשים עליה סדין', 'כרית|שמים אותה מתחת לראש|ממלאים אותה בנוצות', 'שעון|מראה מה השעה|יש לו מחוגים',
    'טלפון|מדברים בו מרחוק|מחייגים בו', 'מפתח|פותח את הדלת|נכנס למנעול', 'כוס|שותים ממנה|של תה או של יין',
    'צלחת|אוכלים ממנה|שמים אותה על השולחן ליד המזלג', 'כף|אוכלים בה מרק|כלי אוכל עגול', 'מזלג|כלי אוכל עם שיניים|דוקרים בו אוכל',
    'סכין|חותכים בה|חדה, במגירת המטבח', 'סיר|מבשלים בו|יש לו מכסה ושתי ידיות', 'מקרר|שומר על האוכל קר|יש בו מקפיא',
    'תנור|אופים בו עוגה|מחממים בו אוכל', 'ראש|החלק העליון של הגוף|יש עליו שיער', 'יד|יש בה חמש אצבעות|כותבים בה',
    'רגל|הולכים עליה|יש בה ברך וכף', 'עין|רואים בה|כחולה, ירוקה או חומה', 'אוזן|שומעים בה|תולים עליה עגיל',
    'אף|מריחים בו|באמצע הפנים', 'פה|אוכלים ומדברים בו|יש בו שיניים ולשון', 'לב|פועם בחזה|אומרים שאוהבים איתו',
    'שן|מצחצחים אותה|רופא השיניים מטפל בה', 'בטן|כואבת כשאוכלים יותר מדי|יש בה טבור', 'גב|הצד האחורי של הגוף|שוכבים עליו',
    'שיער|גדל על הראש|מסרקים אותו', 'אבא|ההורה הגבר|בעלה של אמא', 'אמא|ההורה האישה|אשתו של אבא',
    'סבא|אבא של אבא|בעלה של סבתא', 'סבתא|אמא של אמא|אופה עוגות לנכדים', 'ילד|קטן, עוד לא מבוגר|הולך לבית ספר',
    'תינוק|ישן בעריסה|יונק ומחליפים לו חיתול', 'אח|בן של אותם הורים|הבן של ההורים שלי', 'דוד|אח של אבא|גם מלך ישראל, שכתב תהילים',
    'מורה|מלמד בכיתה|נותן שיעורי בית', 'רופא|מטפל בחולים|כותב מרשם', 'נהג|נוהג באוטובוס|יושב מאחורי ההגה',
    'טבח|מבשל במסעדה|עובד במטבח עם כובע לבן', 'שוטר|שומר על החוק|עובד במשטרה', 'חייל|משרת בצבא|לובש מדים',
    'זמר|שר שירים|עומד על הבמה עם מיקרופון', 'צייר|מצייר תמונות|עובד עם מכחול', 'נגר|בונה רהיטים מעץ|עובד עם מסור ופטיש',
    'גנן|מטפל בגינה|משקה את הצמחים', 'דוור|מביא את המכתבים|עובד בדואר', 'אופה|מכין לחם ועוגות|עובד במאפייה',
    'אדום|צבע הדם|צבע העגבנייה', 'כחול|צבע השמיים|צבע הים', 'ירוק|צבע הדשא|צבע הרמזור כשמותר לעבור',
    'צהוב|צבע הבננה|צבע החלמון', 'לבן|צבע השלג|צבע החלב', 'שחור|צבע הלילה|צבע הפחם',
    'סגול|צבע החציל|צבע הענבים הכהים', 'ורוד|צבע הפלמינגו|אדום חיוור', 'כתום|צבע התפוז|צבע הגזר',
    'תפוז|פרי כתום שסוחטים|יפו מפורסמת בו', 'אגס|פרי בצורת פעמון|פרי ירוק עם צוואר', '*שזיף|פרי סגול קטן|כשמייבשים אותו הוא פרונה',
    '*אפרסק|פרי עם קליפה רכה ופלומה|פרי קיץ כתום עם גלעין', 'רימון|פרי עם הרבה גרעינים אדומים|פרי שאוכלים בראש השנה, עם כתר', 'תמר|פרי מתוק שגדל על הדקל|מכינים ממנו סילאן',
    'זית|פרי קטן שעושים ממנו שמן|היונה הביאה עלה שלו לנוח', 'חסה|ירק עלים ירוק לסלט|ירק שאוכלים בליל הסדר', 'תירס|ירק צהוב שגדל בקלח|עושים ממנו פופקורן',
    'פלפל|ירק אדום, ירוק או צהוב|יש גם חריף', 'חציל|ירק סגול|קולים אותו על האש לסלט', 'אריה|מלך החיות|יש לו רעמה',
    'פיל|חיה ענקית עם חדק|לא שוכח לעולם', 'קוף|חיה שאוהבת בננות|מטפס על עצים ומחקה', 'דוב|חיה גדולה שאוהבת דבש|ישן כל החורף',
    'ארנב|חיה עם אוזניים ארוכות|קופץ ואוהב גזר', 'עכבר|חיה קטנה שהחתול רודף אחריה|יש גם כזה ליד המחשב', 'נמר|חתול גדול עם כתמים|טורף מהיר עם פרווה מנוקדת',
    'זאב|חיה שמייללת לירח|אכל את סבתא של כיפה אדומה', 'שועל|חיה ערמומית עם זנב|ערמומי במשלים', 'גמל|חיה עם דבשת|ספינת המדבר',
    'חמור|חיה שנושאת משאות|נושא משאות ונוער', 'כבש|נותן לנו צמר|חי בעדר עם רועה', 'עז|נותנת חלב ויש לה זקן|עושים מהחלב שלה גבינה',
    'תרנגול|קורא קוקוריקו|מעיר את כולם בבוקר', 'ברווז|שוחה בבריכה ואומר גע גע|עוף מים עם מקור רחב', 'יונה|ציפור של שלום|ציפור שהביאה עלה זית',
    'נחש|זוחל בלי רגליים|מוריד את העור שלו', 'צב|זוחל עם שריון|איטי מאוד', 'דג|שוחה בים|יש לו סנפירים',
    'דבורה|עושה דבש|גם שופטת בתנ"ך', 'פרפר|חרק עם כנפיים צבעוניות|היה פעם זחל', 'נמלה|חרק קטן וחרוץ|סוחבת פירורים לקן',
    '*עכביש|טווה קורים|יש לו שמונה רגליים', 'זברה|סוס עם פסים|פסים בשחור ולבן', 'תוכי|ציפור צבעונית שמדברת|ציפור שמחקה מילים',
    '*ינשוף|ציפור של הלילה|ציפור עם עיניים גדולות', 'נשר|ציפור גדולה ורחבת כנפיים|עוף דורס בהרים', 'אוטובוס|נוסעים בו עם כרטיס|עוצר בתחנה',
    'רכבת|נוסעת על פסים|יש לה קרונות', 'מטוס|טס בשמיים|נוחת בשדה התעופה', 'אונייה|שטה בים|יש לה עוגן',
    'אופניים|רוכבים עליהם ודוושים|יש להם שני גלגלים', 'מכונית|נוסעים בה על הכביש|יש לה ארבעה גלגלים', 'משאית|מובילה סחורה|רכב כבד עם ארגז',
    'מונית|נוסעים בה בתשלום|יש לה מונה', 'סירה|שטה באגם, קטנה|חותרים בה במשוטים', 'כביש|המכוניות נוסעות עליו|יש בו נתיבים',
    'גשר|עוברים עליו מעל הנהר|מחבר בין שתי גדות', 'רחוב|יש בו בתים ומדרכה|לכל בית יש מספר בו', 'עיר|יותר גדולה מכפר|יש בה עירייה',
    'כפר|מקום קטן, לא עיר|ישוב קטן', 'הר|גבוה מאוד, מטפסים עליו|החרמון או תבור', 'נהר|הירדן הוא כזה|זורם אל הים',
    'מדבר|חם ויבש ויש בו חול|הנגב הוא כזה', 'חול|יש הרבה ממנו בחוף|בונים ממנו ארמונות על החוף', 'אבן|קשה וכבדה|זורקים אותה למים',
    'ענן|אפור או לבן בשמיים|ממנו יורד גשם', 'רוח|מזיזה את העלים|נושבת', 'כוכב|מנצנץ בשמיים בלילה|יש שישה קצוות למגן דוד',
    'שמיים|למעלה, כחולים ביום|הציפורים עפות בהם', 'אדמה|שותלים בה|יש בה תולעים', 'קיץ|העונה החמה|עונה של חופש גדול',
    'חורף|העונה הקרה והגשומה|עונה של מעיל ומטרייה', 'אביב|עונת הפריחה|העונה של פסח', 'סתיו|העונה שבה נושרים העלים|בא אחרי הקיץ',
    'בוקר|מתחיל כשהשמש זורחת|זמן ארוחת הבוקר', 'ערב|כשהשמש שוקעת|בא אחרי הצהריים', 'לילה|ישנים בו|חשוך ויש כוכבים',
    'יום|עשרים וארבע שעות|ההפך מלילה', 'שבוע|שבעה ימים|מיום ראשון עד שבת', 'חודש|בערך שלושים ימים|יש שנים עשר כאלה בשנה',
    'שנה|שנים עשר חודשים|מתחילה בראש השנה', 'שבת|יום המנוחה|מדליקים בה נרות בערב', 'פסח|חג המצות|חג החירות',
    'חנוכה|חג האורים|מדליקים חנוכייה', 'פורים|חג שמתחפשים בו|קוראים בו את המגילה', 'סוכות|חג שיושבים בו בסוכה|חג עם לולב ואתרוג',
    'מצה|אוכלים אותה בפסח|לחם שטוח ופריך', 'סביבון|מסובבים אותו בחנוכה|נס גדול היה פה', 'נר|דולק ומאיר|מדליקים בשבת',
    'חולצה|לובשים על הגוף העליון|יש לה שרוולים', 'מכנסיים|לובשים על הרגליים|יש להם שתי רגליות', 'שמלה|בגד של אישה|לובשים אותה לחתונה',
    'כובע|לובשים על הראש|מגן מהשמש', 'נעל|לובשים על כף הרגל|יש לה שרוכים', 'גרב|לובשים בתוך הנעל|באה בזוג',
    'מעיל|לובשים בחורף|מחמם בקור', 'צעיף|כורכים סביב הצוואר|מחמם את הצוואר', 'כפפה|לובשים על היד בקור|יש לה חמש אצבעות',
    'משקפיים|עוזרים לראות טוב|יושבים על האף', 'טבעת|לובשים על האצבע|נותנים אותה בחתונה', 'שרשרת|לובשים על הצוואר|תכשיט עם חוליות',
    'תיק|נושאים בו דברים|יש לו רצועה', 'מטרייה|פותחים אותה בגשם|מגינה מהטיפות', 'עט|כותבים בו בדיו|כלי כתיבה כחול',
    'עיפרון|כותבים בו ומוחקים|מחדדים אותו', 'מחברת|כותבים בה בכיתה|יש בה שורות', 'מכתב|כותבים ושולחים בדואר|שמים אותו במעטפה',
    'עיתון|קוראים בו חדשות|מגיע כל בוקר', 'שיר|שרים אותו|יש לו מילים ולחן', 'ריקוד|זזים לפי המוזיקה|הורה הוא כזה',
    'כינור|כלי נגינה עם קשת|כלי מיתרים שמחזיקים ליד הסנטר', 'גיטרה|כלי נגינה עם שישה מיתרים|פורטים עליה', 'תוף|מכים עליו בקצב|כלי הקשה',
    'פסנתר|כלי נגינה עם קלידים|קלידים שחורים ולבנים', 'חליל|נושפים בו ומנגנים|כלי נשיפה', 'כדור|בועטים בו|עגול, משחקים בו',
    'משחק|משחקים בו|שש-בש או שחמט', 'בובה|ילדה משחקת בה|צעצוע שנראה כמו תינוק', 'גן|יש בו פרחים ועצים|ילדים קטנים הולכים אליו',
    'חוף|ליד הים, יש בו חול|שם שוכבים בשמש', 'מלון|ישנים בו בחופשה|יש בו קבלה וחדרים', 'כסף|משלמים בו|שקלים',
    'זהב|מתכת צהובה ויקרה|מהם עושים טבעות יקרות', 'שקל|המטבע של ישראל|מאה אגורות', 'חנות|קונים בה|יש בה מוכר וקופה',
    'שוק|קונים בו פירות וירקות|מחנה יהודה הוא כזה', 'בנק|שומרים בו כסף|יש בו כספומט', 'דואר|שולחים ממנו מכתבים|קונים בו בולים',
    'ספרייה|שואלים בה ספרים|יש בה מדפים מלאים', 'מוזיאון|רואים בו תמונות ופסלים|מקום של תערוכות', 'חיפה|עיר על הכרמל|עיר הנמל בצפון',
    'אילת|עיר על ים סוף|העיר הכי דרומית', 'טבריה|עיר ליד הכנרת|עיר עם חמי מרפא', 'צפת|עיר בגליל של המקובלים|עיר הציירים בהרים',
    'עכו|עיר עתיקה עם חומות|עיר נמל ליד חיפה', 'כנרת|אגם בצפון|ים קטן במים מתוקים', 'ירדן|נהר בארץ|נהר שזורם לים המלח',
    'נגב|המדבר בדרום|באר שבע נמצאת בו', 'גליל|האזור בצפון הארץ|יש בו עליון ותחתון', 'שלום|ההפך ממלחמה|ברכה שאומרים בפגישה',
    'תודה|אומרים כשמקבלים משהו|מילה של הכרת טובה', 'בבקשה|אומרים כשמבקשים|מילת נימוס', 'אהבה|רגש חם בין אנשים|יש אותה ממבט ראשון',
    'שמחה|הרגשה טובה|ההפך מעצב', 'חלום|רואים אותו בשינה|לפעמים הוא מתגשם', 'שקט|ההפך מרעש|אין שום קול',
    'רעש|קולות חזקים|ההפך משקט', 'אור|ההפך מחושך|השמש נותנת אותו', 'חושך|כשאין אור|יש אותו בלילה',
    'חג|יום מיוחד עם משפחה|פסח, שבועות או סוכות', 'סלט|ירקות חתוכים בקערה|ירקות עם שמן ולימון', 'קערה|כלי עמוק לסלט|כלי עגול ועמוק',
    'מגבת|מתנגבים בה|תולים אותה אחרי המקלחת', 'סבון|רוחצים איתו ידיים|עושה קצף', 'מברשת|מצחצחים בה שיניים|יש לה שערות קשות',
    'מסרק|מסדרים בו את השיער|יש לו שיניים', 'מראה|רואים בה את עצמנו|תלויה באמבטיה', 'מנורה|מדליקים אותה בחושך|יש בה נורה',
    'וילון|מכסה את החלון|סוגרים אותו בערב', 'שטיח|מונח על הרצפה|מנקים אותו בשואב אבק', 'ארון|שמים בו בגדים|יש לו מדפים ודלתות',
    'ספה|יושבים עליה בסלון|כורסה ארוכה', 'גינה|יש בה פרחים ליד הבית|שותלים בה ומשקים', 'גדר|מקיפה את החצר|יש לה שער',
    'חצר|השטח מסביב לבית|תולים בה כביסה', 'מדרגות|עולים בהן לקומה|יש להן מעקה', 'מעלית|עולים בה לקומה גבוהה|לוחצים בה על כפתור',
    'קומה|חלק של בניין|גרים בשלישית', 'חדר|חלק של הבית|חדר שינה או חדר אוכל', 'מטבח|מבשלים בו|יש בו כיור ותנור',
    'כיור|שוטפים בו כלים|יש לו ברז', 'ברז|יוצאים ממנו מים|פותחים וסוגרים אותו', 'אמבטיה|מתרחצים בה|ממלאים אותה במים חמים',
    'כביסה|מכבסים אותה במכונה|תולים אותה לייבוש', 'מטאטא|מטאטאים בו את הרצפה|יש לו מקל ושערות', 'פטיש|דופקים בו מסמרים|כלי עבודה של הנגר',
    'מסמר|דופקים אותו בפטיש|פיסת ברזל עם ראש', 'מספריים|גוזרים בהם נייר|יש להם שני להבים', 'חוט|תופרים איתו|מכניסים אותו למחט',
    'מחט|תופרים בה|יש לה חור קטן', 'כפתור|סוגר את החולצה|תופרים אותו לבגד', 'כיס|שמים בו דברים במכנסיים|יש בו ארנק',
    'ארנק|שומרים בו כסף|יש בו כרטיס אשראי', 'מתנה|נותנים אותה ביום הולדת|עטופה בנייר צבעוני', 'נייר|כותבים עליו|עושים אותו מעץ',
    'תמונה|תולים אותה על הקיר|מצלמים אותה', 'קיר|תולים עליו תמונה|יש לבית ארבעה כאלה', 'גג|החלק העליון של הבית|יש עליו דוד שמש',
    'שכן|גר לידנו|בדירה ממול', 'חבר|מישהו שאוהבים לבלות איתו|ידיד קרוב', 'כלה|מתחתנת בשמלה לבנה|עומדת עם החתן',
    'חתן|מתחתן עם הכלה|שובר כוס בחתונה', 'חתונה|כלה וחתן מתחתנים בה|יש בה חופה', 'מלך|יושב על כסא ועל ראשו כתר|שולט בממלכה',
    'מלכה|אשתו של המלך|אסתר הייתה כזו', 'כתר|המלך שם אותו על הראש|עשוי זהב', '*ארמון|המלך גר בו|בית גדול ומפואר',
    'עוף|בשר של תרנגולת|מבשלים ממנו מרק', 'בשר|קונים אותו אצל הקצב|שמים אותו על האש', 'דגים|שוחים בים|אוכלים אותם בשבת, ממולאים',
    'פיתה|לחם עגול עם כיס|ממלאים אותה בפלאפל', 'חומוס|ממרח מגרגרים|אוכלים אותו עם פיתה', 'פלאפל|כדורים מטוגנים בפיתה|אוכל רחוב ישראלי',
    'שוקולד|ממתק חום ומתוק|עושים אותו מקקאו', 'גלידה|קרה ומתוקה בקיץ|אוכלים אותה בגביע', 'עוגייה|מאפה קטן ומתוק|טובלים אותה בתה',
    'ריבה|מורחים אותה על לחם, מפירות|מבשלים פירות עם סוכר', 'חמאה|מורחים אותה על לחם|עשויה משמנת', 'שמן|מטגנים בו|זית או חמניות',
    'כרוב|ירק עגול עם עלים|ממלאים את העלים שלו', '*דלעת|ירק כתום גדול|מכינים ממנה מרק כתום', 'קישוא|ירק ירוק שממלאים|דומה למלפפון אבל מבשלים אותו',
    'אחות|בת של אותם הורים|גם עובדת בבית חולים', 'דודה|אחות של אמא|אשתו של הדוד',
    'נכד|הבן של הבן|סבא וסבתא מפנקים אותו', 'הורים|אבא ואמא|ההורה ועוד הורה', 'משפחה|אבא, אמא והילדים|מתכנסת לארוחת חג',
    'מנוחה|נחים בה|מה שעושים בשבת', 'שינה|ישנים בלילה|שמונה שעות בלילה', 'טיול|הולכים בו לנוף יפה|יוצאים אליו עם תרמיל',
    'בריכה|שוחים בה|יש בה מים כחולים', 'מקלחת|מתרחצים בה מתחת לזרם|יש בה ראש מים',
    'תרופה|לוקחים אותה כשחולים|קונים בבית מרקחת', 'חום|יש כשחולים|מודדים אותו במדחום', 'כאב|מרגישים כשנפגעים|כאב ראש או כאב בטן',
    'בריא|לא חולה|במצב טוב', 'שמח|לא עצוב|מרגיש טוב', 'עצוב|לא שמח|מרגיש רע ובוכה',
    'גדול|לא קטן|ענק', 'קטן|לא גדול|זעיר', 'חם|לא קר|כמו בקיץ', 'קר|לא חם|כמו בחורף',
    'מהר|לא לאט|בזריזות', 'לאט|לא מהר|בנחת', 'יפה|נעים לראות|נאה', 'ישן|לא חדש|עתיק', 'חדש|לא ישן|מהחנות, עוד לא היה בשימוש',
    'גבוה|לא נמוך|כמו מגדל', 'נמוך|לא גבוה|קרוב לרצפה', 'מתוק|הטעם של סוכר|כמו דבש', 'מלוח|הטעם של מלח|כמו מי ים', 'חמוץ|הטעם של לימון|עושה פרצוף',
    'אחד|המספר הראשון|יותר מאפס', 'שתיים|אחת ועוד אחת|זוג', 'שלוש|אחרי שתיים|שתיים ועוד אחת', 'ארבע|אחרי שלוש|מספר הרגליים של שולחן',
    'חמש|מספר האצבעות ביד|חצי מעשר', 'שש|אחרי חמש|מספר הקצוות במגן דוד', 'שבע|מספר הימים בשבוע|אחרי שש', 'עשר|מספר האצבעות בשתי ידיים|תשע ועוד אחת',
    'מאה|עשר פעמים עשר|מספר האגורות בשקל', 'אלף|עשר פעמים מאה|האות הראשונה'
  ];

  function parseBank() {
    var seen = {}, out = [];
    BANK.forEach(function (line) {
      var p = line.split('|');
      var hard = p[0].charAt(0) === '*';
      var w = hard ? p[0].slice(1) : p[0];
      if (!p[1] || seen[w]) return;
      seen[w] = 1;
      out.push({ w: w, b: baseWord(w), easy: p[1], hard: p[2] || p[1], rare: hard });
    });
    return out;
  }
  var WORDS = parseBank();

  /* Level 1–50: n = largest grid side, target = number of words, free = share of squares shown at the start,
     hardClue = chance of the harder clue, rare = less common words allowed. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    // harder sooner (the user found it too easy): bigger grids and more words every 8 levels, the free letters
    // gone by level 21, the harder clues fully in by level 20, less common words from 10, fewer hints allowed later
    return {
      n: Math.min(8, 5 + Math.floor((L - 1) / 8)),
      rows: Math.min(7, 5 + Math.floor((L - 1) / 8)), // at most 7 rows, so the squares stay big above the keyboard
      target: Math.min(12, 4 + Math.floor((L - 1) / 5)),
      free: Math.max(0, 0.3 - 0.015 * (L - 1)),
      hardClue: L <= 4 ? 0 : Math.min(1, (L - 4) / 16),
      rare: L >= 10,
      boards: L <= 30 ? 2 : 1,
      maxHints: L <= 15 ? 3 : L <= 30 ? 2 : 1
    };
  }

  /* Builds a crossword on an n×n canvas: grid[r][c] = base letter or ''. Column 0 is the rightmost (the board is
     right-to-left), so an across word runs c, c+1, … and reads like Hebrew. */
  function tryPlace(g, used, nr, nc, w, r0, c0, d) {
    var dr = d === 'down' ? 1 : 0, dc = d === 'down' ? 0 : 1, L = w.length, cross = 0;
    var er = r0 + dr * (L - 1), ec = c0 + dc * (L - 1);
    if (r0 < 0 || c0 < 0 || er >= nr || ec >= nc) return -1;
    var br = r0 - dr, bc = c0 - dc, ar = er + dr, ac = ec + dc;
    if (br >= 0 && bc >= 0 && g[br][bc]) return -1;
    if (ar < nr && ac < nc && g[ar][ac]) return -1;
    for (var i = 0; i < L; i++) {
      var r = r0 + dr * i, c = c0 + dc * i, ch = g[r][c];
      if (ch) {
        if (ch !== w[i] || used[r][c][d]) return -1;
        cross++;
      } else {
        // the squares beside a new letter must stay empty, so no accidental words appear
        var r1 = r + dc, c1 = c + dr, r2 = r - dc, c2 = c - dr;
        if (r1 < nr && c1 < nc && g[r1][c1]) return -1;
        if (r2 >= 0 && c2 >= 0 && g[r2][c2]) return -1;
      }
    }
    return cross === L ? -1 : cross;
  }

  function build(sp, rnd, pool) {
    var n = sp.n, nr = sp.rows, g = [], used = [];
    for (var r = 0; r < nr; r++) {
      g.push([]); used.push([]);
      for (var c = 0; c < n; c++) { g[r].push(''); used[r].push({}); }
    }
    var placed = [];
    function put(e, r0, c0, d) {
      var dr = d === 'down' ? 1 : 0, dc = d === 'down' ? 0 : 1;
      for (var i = 0; i < e.b.length; i++) { g[r0 + dr * i][c0 + dc * i] = e.b[i]; used[r0 + dr * i][c0 + dc * i][d] = true; }
      placed.push({ e: e, r: r0, c: c0, d: d });
    }
    var list = rnd.shuffle(pool);
    // the first word: a long one, across, near the middle
    var first = null;
    for (var k = 0; k < list.length; k++) if (list[k].b.length >= Math.min(n, 5) - 1 && list[k].b.length <= n) { first = list[k]; break; }
    if (!first) return null;
    put(first, rnd.randInt(1, nr - 2), rnd.randInt(0, n - first.b.length), 'across');
    var tries = 0;
    for (var j = 0; j < list.length && placed.length < sp.target && tries < 400; j++) {
      var e = list[j];
      if (e === first || e.b.length > n) continue;
      if (placed.some(function (p) { return p.e.b === e.b; })) continue;
      tries++;
      var opts = [];
      for (var rr = 0; rr < nr; rr++) for (var cc = 0; cc < n; cc++) ['across', 'down'].forEach(function (d) {
        var x = tryPlace(g, used, nr, n, e.b, rr, cc, d);
        if (x > 0) opts.push({ r: rr, c: cc, d: d, x: x });
      });
      if (!opts.length) continue;
      var best = Math.max.apply(null, opts.map(function (o) { return o.x; }));
      // mostly take the placement with the most crossings
      var pickFrom = rnd.randInt(0, 2) ? opts.filter(function (o) { return o.x === best; }) : opts;
      var o = rnd.pick(pickFrom);
      put(e, o.r, o.c, o.d);
    }
    return { g: g, placed: placed };
  }

  /* A finished puzzle: cropped grid, numbered words with clues, squares to show at the start. */
  function makePuzzle(level, rnd) {
    var sp = spec(level);
    var pool = WORDS.filter(function (e) { return e.b.length <= sp.n && (sp.rare || !e.rare); });
    var best = null;
    for (var t = 0; t < 60; t++) {
      var b = build(sp, rnd, pool);
      if (!b) continue;
      if (!best || b.placed.length > best.placed.length) best = b;
      if (best.placed.length >= sp.target) break;
    }
    if (!best) return null;
    var n = sp.n, minR = n, maxR = 0, minC = n, maxC = 0;
    best.placed.forEach(function (p) {
      var L = p.e.b.length, er = p.d === 'down' ? p.r + L - 1 : p.r, ec = p.d === 'down' ? p.c : p.c + L - 1;
      minR = Math.min(minR, p.r); maxR = Math.max(maxR, er); minC = Math.min(minC, p.c); maxC = Math.max(maxC, ec);
    });
    var rows = maxR - minR + 1, cols = maxC - minC + 1, grid = [];
    for (var r = 0; r < rows; r++) { grid.push([]); for (var c = 0; c < cols; c++) grid[r].push(best.g[r + minR][c + minC]); }
    var words = best.placed.map(function (p) {
      var cells = [];
      for (var i = 0; i < p.e.b.length; i++) cells.push([p.r - minR + (p.d === 'down' ? i : 0), p.c - minC + (p.d === 'down' ? 0 : i)]);
      var useHard = rnd.randInt(1, 100) <= sp.hardClue * 100;
      // alt = the other clue of the word, offered by "רמז" as a second way to think of it
      return { answer: p.e.w, b: p.e.b, d: p.d, cells: cells, clue: useHard ? p.e.hard : p.e.easy, alt: useHard ? p.e.easy : p.e.hard };
    });
    // numbering in reading order (top row first, right to left)
    var num = 0, numbers = {};
    for (var rr = 0; rr < rows; rr++) for (var cc = 0; cc < cols; cc++) {
      var starts = words.filter(function (w) { return w.cells[0][0] === rr && w.cells[0][1] === cc; });
      if (starts.length) { num++; numbers[rr + ',' + cc] = num; starts.forEach(function (w) { w.num = num; }); }
    }
    words.sort(function (a, b) { return a.num - b.num || (a.d === 'across' ? -1 : 1); });
    // a square shows its final form when every word through it ends there
    var finals = {};
    for (var r2 = 0; r2 < rows; r2++) for (var c2 = 0; c2 < cols; c2++) {
      if (!grid[r2][c2]) continue;
      var through = words.filter(function (w) { return w.cells.some(function (x) { return x[0] === r2 && x[1] === c2; }); });
      finals[r2 + ',' + c2] = through.length > 0 && through.every(function (w) {
        var last = w.cells[w.cells.length - 1];
        return last[0] === r2 && last[1] === c2 && TO_FINAL[grid[r2][c2]] && w.answer.charAt(w.answer.length - 1) !== grid[r2][c2];
      });
    }
    // free letters, never a whole word
    var letterCells = [];
    for (var r3 = 0; r3 < rows; r3++) for (var c3 = 0; c3 < cols; c3++) if (grid[r3][c3]) letterCells.push(r3 + ',' + c3);
    var given = {}, want = Math.round(letterCells.length * sp.free);
    rnd.shuffle(letterCells).forEach(function (k) {
      if (want <= 0) return;
      given[k] = true;
      var full = words.some(function (w) { return w.cells.every(function (x) { return given[x[0] + ',' + x[1]]; }); });
      if (full) delete given[k]; else want--;
    });
    return { rows: rows, cols: cols, grid: grid, words: words, numbers: numbers, finals: finals, given: given, spec: sp };
  }

  function shown(P, r, c, letter) {
    return P.finals[r + ',' + c] ? (TO_FINAL[letter] || letter) : letter;
  }

  var css = [
    '.cw-clue{display:flex;align-items:center;gap:.4rem;width:100%;max-width:30rem;min-height:3.9rem;background:var(--language-soft);',
    'border-radius:var(--radius-sm);padding:.25rem .3rem;}',
    '.cw-clue-text{flex:1;text-align:center;font-size:1.15rem;font-weight:800;line-height:1.25;text-wrap:balance;}',
    '.cw-clue-text small{font-size:1rem;font-weight:800;color:var(--language);white-space:nowrap;}',
    '.cw-nav{min-width:2.6rem;min-height:2.9rem;border:0;border-radius:var(--radius-sm);background:var(--surface);color:var(--ink);font-size:1.5rem;font-weight:900;cursor:pointer;}',
    '.cw-grid{--cs:min(calc((100vw - 3rem) / var(--cols)), max(calc((100svh - 27.5rem) / var(--rows)), calc(82vw / var(--cols))), 3.6rem);display:grid;',
    'grid-template-columns:repeat(var(--cols),var(--cs));grid-auto-rows:var(--cs);direction:rtl;gap:0;touch-action:manipulation;}',
    '.cw-cell{position:relative;margin:0;padding:0;border:1px solid var(--ink);background:var(--surface);color:var(--ink);',
    'font-family:var(--font-display);font-weight:900;font-size:calc(var(--cs) * .62);line-height:1;display:grid;place-items:center;cursor:pointer;margin-inline-start:-1px;margin-top:-1px;}',
    '.cw-cell.is-black{background:transparent;border-color:transparent;cursor:default;}',
    '.cw-cell .cw-num{position:absolute;top:1px;inset-inline-start:2px;font-family:var(--font-body,inherit);font-size:max(.62rem,calc(var(--cs) * .25));font-weight:800;color:var(--ink-soft);line-height:1;}',
    '.cw-cell.is-word{background:var(--c-yellow-soft);}',
    '.cw-cell.is-cur{background:var(--c-yellow);color:var(--c-on-yellow);}',
    '.cw-cell.is-cur .cw-num{color:var(--c-on-yellow);}',
    '.cw-cell.is-given{color:var(--c-blue);}',
    '.cw-cell.is-wrong{color:var(--c-red);box-shadow:inset 0 0 0 3px var(--c-red);}',
    '.cw-cell.is-ok{color:var(--c-green);}',
    '.cw-kbd{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:4px;width:100%;max-width:30rem;direction:rtl;}',
    '.cw-key{min-height:2.6rem;line-height:1;padding:0;border:2px solid var(--line);border-radius:8px;background:var(--surface-2);color:var(--ink);',
    'font-size:1.4rem;font-weight:800;cursor:pointer;touch-action:manipulation;}',
    '.cw-key:active{background:var(--c-yellow-soft);}',
    '.cw-key.is-back{grid-column:span 2;font-size:1.05rem;white-space:nowrap;}',
    '.cw-acts{display:flex;gap:.5rem;justify-content:center;width:100%;}',
    '.cw-acts .btn{min-height:2.9rem;padding-block:.3rem;}',
    '.play-board.cw-board{gap:.55rem;padding-block:.6rem;}',
    /* a computer screen: the keyboard goes beside the grid, so the squares can be big */
    '@media (min-width:900px){',
    '.cw-playing .app{max-width:72rem;}',
    '.play-board.cw-board{display:grid;grid-template-columns:auto minmax(20rem,28rem);grid-template-rows:auto auto auto;',
    'grid-template-areas:"grid clue" "grid kbd" "grid acts";justify-content:center;align-content:center;align-items:center;column-gap:2rem;row-gap:.8rem;}',
    '.cw-board .cw-grid{grid-area:grid;--cs:min(calc((72rem - 36rem) / var(--cols)), calc((100svh - 12.5rem) / var(--rows)), 6rem);}',
    '.cw-board .cw-clue{grid-area:clue;}.cw-board .cw-kbd{grid-area:kbd;}.cw-board .cw-acts{grid-area:acts;}',
    '.cw-board .cw-key{min-height:3.2rem;}',
    '}'
  ].join('');

  BrainGames.register({
    id: 'crossword',
    name: 'תשבץ',
    skill: 'language',
    isNew: true,
    tagline: 'פתרו תשבץ קטן לפי ההגדרות',
    benefit: 'אוצר מילים, שליפה מהזיכרון ואיות',
    instructions: [
      'לחצו על משבצת כדי לבחור מילה. ההגדרה שלה מופיעה למעלה.',
      'הקלידו את המילה במקלדת. מילים לרוחב נכתבות מימין לשמאל, מילים לאורך מלמעלה למטה.',
      'כשמילה מלאה, אות לא נכונה נצבעת באדום.',
      'אין שעון. תקועים? "רמז" נותן הגדרה נוספת ומראה אילו אותיות כבר ידועות, ולחיצה נוספת אומרת באיזו אות המילה מתחילה.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, words: WORDS, base: base, tryPlace: tryPlace },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.boards;
      var round = 0, good = 0;
      var keyHandler = null;
      var board = root.closest ? root.closest('.play-board') : null;
      if (board) board.classList.add('cw-board');
      document.body.classList.add('cw-playing');

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: good, total: ROUNDS, note: 'פתרתם ' + good + ' מתוך ' + ROUNDS + ' תשבצים עם עד ' + (sp.maxHints === 1 ? 'רמז אחד' : sp.maxHints === 2 ? 'שני רמזים' : 'שלושה רמזים') });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var P = null;
        for (var t = 0; t < 5 && !P; t++) P = makePuzzle(level, ctx);
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        root.__cw = P; // read by the automated tests
        var rows = P.rows, cols = P.cols;
        var val = {}, fixed = {}, cellEls = {}, hints = 0, done = false;
        var tip = null, badK = null; // tip = { w, step }: the word the last hint was about; badK = a letter marked wrong
        var curW = P.words[0], curI = 0;
        Object.keys(P.given).forEach(function (k) { var rc = k.split(','); val[k] = P.grid[+rc[0]][+rc[1]]; fixed[k] = true; });

        function key(x) { return x[0] + ',' + x[1]; }
        function wordsAt(k) { return P.words.filter(function (w) { return w.cells.some(function (x) { return key(x) === k; }); }); }
        function wordFull(w) { return w.cells.every(function (x) { return val[key(x)]; }); }
        function wordRight(w) { return w.cells.every(function (x) { return val[key(x)] === P.grid[x[0]][x[1]]; }); }

        var gridEl = el('div', { class: 'cw-grid', style: { '--cols': cols, '--rows': rows } });
        for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
          (function (r, c) {
            var k = r + ',' + c;
            if (!P.grid[r][c]) { gridEl.appendChild(el('div', { class: 'cw-cell is-black', 'aria-hidden': 'true' })); return; }
            var b = el('button', { class: 'cw-cell', type: 'button', onclick: function () { tapCell(k); } });
            cellEls[k] = b;
            gridEl.appendChild(b);
          })(r, c);
        }

        var clueText = el('div', { class: 'cw-clue-text', 'aria-live': 'polite' });
        var clue = el('div', { class: 'cw-clue' }, [
          el('button', { class: 'cw-nav', type: 'button', 'aria-label': 'ההגדרה הקודמת', onclick: function () { step(-1); } }, '›'),
          clueText,
          el('button', { class: 'cw-nav', type: 'button', 'aria-label': 'ההגדרה הבאה', onclick: function () { step(1); } }, '‹')
        ]);

        var kbd = el('div', { class: 'cw-kbd' }, ABC.split('').map(function (l) {
          return el('button', { class: 'cw-key', type: 'button', onclick: function () { type(l); } }, l);
        }).concat([el('button', { class: 'cw-key is-back', type: 'button', 'aria-label': 'מחיקה', onclick: back }, 'מחק ⌫')]));
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var showBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: reveal }, 'הראו פתרון');
        var acts = el('div', { class: 'cw-acts' }, [hintBtn, showBtn]);
        root.appendChild(clue);
        root.appendChild(gridEl);
        root.appendChild(kbd);
        root.appendChild(acts);
        ctx.setStatus('לחצו על משבצת והקלידו את המילה');

        // the squares shrink a little when the page would need scrolling (keeps everything on one screen)
        function fit() {
          if (!gridEl.isConnected) return;
          gridEl.style.removeProperty('--cs');
          var over = document.documentElement.scrollHeight - window.innerHeight;
          if (over <= 0) return;
          var cs = gridEl.firstChild.getBoundingClientRect().height;
          gridEl.style.setProperty('--cs', Math.max(28, Math.floor(cs - over / rows - 1)) + 'px');
        }

        if (keyHandler) document.removeEventListener('keydown', keyHandler);
        keyHandler = function (e) {
          if (done || e.ctrlKey || e.metaKey || e.altKey) return;
          var ch = base(e.key || '');
          if (ABC.indexOf(ch) >= 0 && ch.length === 1) { e.preventDefault(); type(ch); }
          else if (e.key === 'Backspace') { e.preventDefault(); back(); }
        };
        document.addEventListener('keydown', keyHandler);

        function render() {
          var inWord = {};
          curW.cells.forEach(function (x) { inWord[key(x)] = true; });
          Object.keys(cellEls).forEach(function (k) {
            var rc = k.split(','), r = +rc[0], c = +rc[1], b = cellEls[k];
            b.innerHTML = '';
            if (P.numbers[k]) b.appendChild(el('span', { class: 'cw-num' }, String(P.numbers[k])));
            if (val[k]) b.appendChild(document.createTextNode(shown(P, r, c, val[k])));
            b.classList.toggle('is-given', !!fixed[k]);
            b.classList.toggle('is-word', !done && !!inWord[k]);
            b.classList.toggle('is-cur', !done && key(curW.cells[curI]) === k);
            // a letter is checked once a word through it is full
            var checked = wordsAt(k).some(wordFull);
            b.classList.toggle('is-wrong', !!val[k] && (checked || k === badK) && val[k] !== P.grid[r][c]);
            b.setAttribute('aria-label', val[k] ? shown(P, r, c, val[k]) : 'משבצת ריקה');
          });
          clueText.innerHTML = '';
          clueText.appendChild(el('small', null, curW.num + ' ' + (curW.d === 'across' ? 'מאוזן' : 'מאונך') + ': '));
          clueText.appendChild(document.createTextNode(curW.clue));
          fit();
        }

        function firstOpen(w) {
          for (var i = 0; i < w.cells.length; i++) if (!val[key(w.cells[i])]) return i;
          for (var j = 0; j < w.cells.length; j++) if (val[key(w.cells[j])] !== P.grid[w.cells[j][0]][w.cells[j][1]]) return j;
          return 0;
        }
        function select(w, i) { curW = w; curI = i == null ? firstOpen(w) : i; render(); }

        function tapCell(k) {
          if (done) return;
          ctx.sound('tap');
          var ws = wordsAt(k);
          var idxIn = function (w) { for (var i = 0; i < w.cells.length; i++) if (key(w.cells[i]) === k) return i; return -1; };
          if (ws.indexOf(curW) >= 0) {
            if (key(curW.cells[curI]) === k && ws.length > 1) { var o = ws[ws[0] === curW ? 1 : 0]; select(o, idxIn(o)); return; }
            select(curW, idxIn(curW)); return;
          }
          var w = ws.filter(function (x) { return x.d === curW.d; })[0] || ws[0];
          select(w, idxIn(w));
        }

        function step(dir) {
          if (done) return;
          var i = P.words.indexOf(curW);
          select(P.words[(i + dir + P.words.length) % P.words.length]);
        }

        function type(l) {
          if (done) return;
          var k = key(curW.cells[curI]);
          if (fixed[k] && val[k] === l) {
            // typing the given letter itself just moves on, so the whole word can be typed
            ctx.sound('tap');
            var nf = curI + 1;
            if (nf < curW.cells.length) curI = nf;
            render();
            return;
          }
          if (fixed[k]) {
            // skip ahead over given letters
            var j = curI;
            while (j < curW.cells.length && fixed[key(curW.cells[j])]) j++;
            if (j >= curW.cells.length) return;
            curI = j; k = key(curW.cells[curI]);
          }
          ctx.sound('tap');
          if (k === badK) badK = null;
          val[k] = l;
          var nx = curI + 1;
          while (nx < curW.cells.length && fixed[key(curW.cells[nx])]) nx++;
          if (nx < curW.cells.length) curI = nx;
          afterChange();
        }

        function back() {
          if (done) return;
          var k = key(curW.cells[curI]);
          if (val[k] && !fixed[k]) { if (k === badK) badK = null; delete val[k]; render(); return; }
          var j = curI - 1;
          while (j >= 0 && fixed[key(curW.cells[j])]) j--;
          if (j < 0) return;
          curI = j; delete val[key(curW.cells[j])];
          render();
        }

        function afterChange() {
          if (Object.keys(cellEls).every(function (k) { var rc = k.split(','); return val[k] === P.grid[+rc[0]][+rc[1]]; })) { render(); finishBoard(false); return; }
          if (wordFull(curW)) {
            if (wordRight(curW)) {
              ctx.sound('good');
              // on to the next word that still needs letters
              var i = P.words.indexOf(curW);
              for (var s = 1; s < P.words.length; s++) {
                var w = P.words[(i + s) % P.words.length];
                if (!wordRight(w)) { select(w); ctx.setStatus('נכון! עכשיו: ' + w.num + ' ' + (w.d === 'across' ? 'מאוזן' : 'מאונך')); return; }
              }
            } else {
              ctx.setStatus('אות באדום אינה נכונה. תקנו');
              curI = firstOpen(curW);
            }
          }
          render();
        }

        /* A hint that helps think of the word, never types it: first a second clue and the letters already known,
           then the first letter (told, not filled in). A wrong letter is pointed out, not corrected. */
        function wname(w) { return w.num + ' ' + (w.d === 'across' ? 'מאוזן' : 'מאונך'); }
        function rightAt(x) { return val[key(x)] && val[key(x)] === P.grid[x[0]][x[1]]; }
        function pattern(w) {
          return w.cells.map(function (x) { return rightAt(x) ? shown(P, x[0], x[1], val[key(x)]) : '_'; }).join(' ');
        }
        function hint() {
          if (done) return;
          // 1. a wrong letter comes first: mark it, without saying what is right
          var bad = null;
          P.words.forEach(function (w) {
            w.cells.forEach(function (x, i) { if (!bad && val[key(x)] && !fixed[key(x)] && !rightAt(x)) bad = { w: w, i: i, k: key(x) }; });
          });
          if (bad) {
            if (bad.k !== badK) hints++; // the same mark again is not another hint
            badK = bad.k; tip = null;
            select(bad.w, bad.i);
            ctx.setStatus('רמז: האות במשבצת האדומה לא נכונה. מחקו אותה (⌫) וחשבו שוב על ההגדרה');
            return;
          }
          var w = !wordRight(curW) ? curW : P.words.filter(function (x) { return !wordRight(x); })[0];
          if (!w) return;
          var len = w.cells.length + ' אותיות';
          if (tip && tip.w === w && tip.step === 2) { select(w); ctx.setStatus(tip.text); return; } // said already: not another hint
          hints++;
          // 2. pressing again on the same word: the first letter, unless it is known already
          if (tip && tip.w === w && tip.step === 1) {
            tip.step = 2;
            if (!rightAt(w.cells[0])) {
              ctx.setStatus('רמז ל-' + wname(w) + ': המילה מתחילה באות ' + P.grid[w.cells[0][0]][w.cells[0][1]] + ' (' + len + ': ' + pattern(w) + ')');
            } else {
              // the first letter is there: a word that crosses this one gives more letters
              var cross = P.words.filter(function (o) {
                return o !== w && !wordRight(o) && o.cells.some(function (x) { return !rightAt(x) && w.cells.some(function (y) { return key(y) === key(x); }); });
              })[0];
              ctx.setStatus(cross ? 'רמז: נסו קודם את ' + wname(cross) + '. היא חוצה את המילה הזאת ותיתן לה עוד אות'
                : 'רמז ל-' + wname(w) + ': ' + pattern(w) + '. חשבו על מילה של ' + len + ' שמתאימה להגדרה. אפשר גם ללחוץ "הראו פתרון"');
            }
            tip.text = (document.querySelector('.play-status') || {}).textContent;
            select(w);
            return;
          }
          // 3. a new word: another clue for it, and the letters already known
          tip = { w: w, step: 1 };
          select(w);
          var other = w.alt && w.alt !== w.clue ? 'הגדרה נוספת: ' + w.alt + '. ' : '';
          ctx.setStatus('רמז ל-' + wname(w) + ': ' + other + 'יש בה ' + len + ': ' + pattern(w) + (other ? '' : '. מילים שחוצות אותה ייתנו עוד אותיות'));
        }

        function reveal() {
          if (done) return;
          hints = 99; tip = null; badK = null;
          Object.keys(cellEls).forEach(function (k) { var rc = k.split(','); val[k] = P.grid[+rc[0]][+rc[1]]; });
          finishBoard(true);
        }

        function finishBoard(shownAll) {
          done = true;
          render();
          Object.keys(cellEls).forEach(function (k) { cellEls[k].disabled = true; if (!shownAll && !fixed[k]) cellEls[k].classList.add('is-ok'); });
          var ok = !shownAll && hints <= sp.maxHints;
          if (ok) good++;
          clueText.innerHTML = '';
          clueText.appendChild(document.createTextNode(shownAll ? 'הנה הפתרון' : 'התשבץ פתור!'));
          ctx.setStatus(shownAll ? 'זה הפתרון המלא' : ok ? 'כל הכבוד, פתרתם את התשבץ!' : 'פתרתם, בעזרת כמה רמזים');
          ctx.feedback(ok, shownAll ? 'הנה הפתרון' : undefined).then(function () {
            kbd.remove();
            acts.innerHTML = '';
            if (!shownAll) { ctx.wait(600).then(nextRound); return; } // a correct answer moves on by itself
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
              round >= ROUNDS ? 'לסיכום' : 'לתשבץ הבא');
            acts.appendChild(next);
          });
        }

        select(P.words[0]);
        ctx.wait(50).then(fit);
        ctx.wait(400).then(fit);
      }

      nextRound();
      return function cleanup() { if (keyHandler) document.removeEventListener('keydown', keyHandler); if (board) board.classList.remove('cw-board'); document.body.classList.remove('cw-playing'); };
    }
  });
})();
