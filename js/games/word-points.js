/* מילים בנקודות — build a Hebrew word from letter tiles on a row of bonus squares (language).
   Every tile has points; some squares double or triple a letter or the whole word. Untimed. */
(function () {
  'use strict';

  var ROUNDS = 5;

  /* Words the game accepts (standard ktiv male, 2–8 letters), gathered from the other games'
     word lists plus common everyday words. Final letters are compared as regular letters. */
  var DICT = 'אב אבא אבוקדו אבטיח אביב אביון אבל אבן אגודל אגוז אגוזים אגם אגס אגסים אגרוף אדום אדומה אדיב אדמה אהב אהבה אהבו' +
    ' או אוהב אוהבים אוהבת אוהל אווז אוויר אווירה אוזן אוטו אוטובוס אויב אוכל אוכלים אוכלת אוכמניות אולי אומץ אונייה' +
    ' אוסטרליה אופה אופים אופנוע אופניים אוקיינוס אור אורז אורח אורחת אורן אושר אות אותיות אז אח אחד אחורה אחות אחיין' +
    ' אחרון אחרונה אחרי אחריות אחת אי איום איטי איטית איטליה אייל איך איכר איל אילת אימה אינטרנט איפה איש אישה איתן אך' +
    ' אכזבה אכל אכלה אכלו אל אלה אלו אלון אלמוני אלף אם אמא אמבולנס אמבטיה אמיד אמיץ אמיצה אמנון אמסטרדם אמר אמרה אמרו' +
    ' אמת אנגליה אנחנו אני אננס אנפה אסף אסר אף אפה אפונה אפור אפורה אפל אפלה אפרוח אפרסק אפרסקים אפשר אפתה אצבע' +
    ' אצבעות אצל אקדח אקורדיון אקליפטוס ארבע ארבעה ארבעים ארגון ארגז ארגנטינה ארובה ארוחה ארוך ארוכה ארוכים ארון ארז' +
    ' אריה ארכיון ארמון ארנב ארנבת ארנק ארץ אש אשדוד אשכולית אשל אשקלון את אתה אתונה אתם אתמול אתן בא באגט באה באו' +
    ' באיטיות באים באר בבקשה בגד בגדים בגוף בדידות בהיר בובה בוגדני בודפשט בוהן בוחר בוחרת בוטן בוטנים בוכה בוכים בונה' +
    ' בונים בוסתן בוץ בוקר בורג בורדו בורח בורחת בורי בורקס בושה בחוץ בחר בחרה בטוח בטטה בטלן בטן ביאר ביוב ביטוח' +
    ' בייגל בייגלה ביישנות בימה בין בינה ביסלי ביסקוויט ביצה ביצוע ביצים ביקור ביקר ביקרה ביקש ביקשה בירה בירור בישל' +
    ' בישלה בית בכה בכו בכתה בלון בלי במבה במהירות במקום בן בנה בנו בנות בנים בננה בננות בנק בנתה בעיה בעל בפנים' +
    ' בצוותא בצל בקבוק ברבור ברד ברווז ברוקולי ברוש ברז ברזיל ברזל ברח ברחה ברחו בריא בריאה בריאות בריכה ברך ברכיים' +
    ' ברלין ברק ברשימה בשפע בשר בת גאווה גב גבה גבוה גבוהה גבוהים גבינה גביע גבעה גג גדול גדולה גדולות גדולים גדוש גדל' +
    ' גדלה גובה גודל גוון גוזל גולה גולף גומה גומי גונן גוף גופייה גור גורילה גורל גזע גזר גזרה גיהץ גיחך גיטרה גילה' +
    ' גינה גיר גל גלגל גלגלת גלויה גלידה גלים גלימה גלעין גלריה גלשן גם גמל גמר גן גנן גננת געגוע גפרור גפרורים גר גרב' +
    ' גרביים גרה גרו גרון גרזן גרים גרם גרמניה גשם גשר דאג דאגה דב דבורה דבק דבש דג דגים דגימה דגירה דגל דגם דגן דהר' +
    ' דואג דואגת דואר דוב דובדבן דובדבנים דובי דוד דודה דוור דולפין דומם דחוק דיבר דיברה דייג דילג דימונה דירה דל דלי' +
    ' דליל דליפה דלעת דלפק דלק דלקת דלת דם דממה דניס דף דקה דקות דקל דרור דרך דשא האותיות הבאה הבהיר הביא הביאה הביט' +
    ' הבין הבינה הגביר הגדיל הגה הגון הגיע הגן הדור הדליק הוא הודה הודו הודתה הווה הולדת הולך הולכים הולכת הולנד הומה' +
    ' הון הורים הזדמנות הזדרז הזמין הזמינה החביא החל החליט החליטה החמיא החריב היא היום הילל היפופוטם היתולי הכין הכינה' +
    ' הלאה הלך הלכה הלכו הם המבורגר המולה המציאות המשיך המתין הן הנאה הנה הסביר הסבירה הסכים הסתיר הסתכל העניק הפחית' +
    ' הפסיד הפסיק הפריע הפתעה הצלחה הצליח הצליחה הקטין הקים הקלה הר הרבה הרגיש הרגישה הרהר הריח הרים הרס הרצליה הרשה' +
    ' השיב השליך השלים השתהה השתתפות התבונן התחיל התחילה התחלה התיר התמהמה התעמלות התרגשות וופלים וטרינר וילון וינה' +
    ' ומקום ומשחק ופל ורד ורוד ורודה ושתייה זאב זאת זבוב זברה זה זהב זו זוג זוהר זוכר זוכרת זועם זורק זורקת זחל זיכרון' +
    ' זית זיתים זכה זכר זכרה זכרו זמן זמר זניח זעיר זעם זעק זקן זקנה זר זרוע זריז זריחה זרע זרק זרקה זרקו חביתה חבצלת' +
    ' חבר חברה חברים חג חגב חגורה חגים חד חדגוני חדה חדווה חדיש חדל חדר חדרה חדש חדשה חדשות חדשים חודש חודשים חוזה' +
    ' חוזק חוזר חוזרת חוט חוכמה חול חולדה חולה חולי חולים חולם חולמת חולצה חולשה חום חומה חומוס חומץ חוף חופשה חורף' +
    ' חושב חושבים חושבת חושך חותך חותכת חותמת חותן חזה חזק חזקה חזקים חזר חזרה חזרו חי חיבב חיבק חיבקה חיבר חיברה חייך' +
    ' חייכה חייל חיילת חיים חיכה חיכתה חילזון חילק חילקה חיפה חיפושית חיפש חיפשה חיש חכם חכמה חכמים חלב חלה חלול חלום' +
    ' חלון חלוץ חלוק חלזון חליל חליפה חלל חלם חלמה חלק חלקה חלש חלשה חם חמאה חמה חמוד חמודה חמוץ חמוצה חמור חמים חמישה' +
    ' חמישי חמישים חמנייה חמסין חמש חן חנוכה חנות חסה חסון חסידה חפץ חצאית חצוף חצוצרה חצי חציל חצילים חקלאי חרון חרוץ' +
    ' חריצות חרישי חרצית חשב חשבה חשבו חשבון חשוב חשובה חשוך חשמל חשמלאי חשף חשש חתול חתולה חתולים חתונה חתירה חתך' +
    ' חתכה חתן טבח טבחית טבעת טבריה טוב טובה טובות טובים טווס טון טונה טורקיה טורקיז טוש טחינה טיול טייל טיילה טייס' +
    ' טיל טיפה טיפס טיפסה טיפש טירה טירמיסו טכנאי טל טלוויזיה טלסקופ טלפון טניס טס טסה טסו טסים טעות טעים טעם טעמה טפל' +
    ' טרומבון טריאתלון טרקטור יבש יבשה יבשת יגון יגע יד ידוע ידיד ידיים ידע ידעה ידעו יהיר יהירות יהלום יוגה יודע' +
    ' יודעים יודעת יוון יום יונה יוצא יוצאת יורד יורדת יושב יושבים יושבת יושר יותר יחד ייאוש ייבב יין ילד ילדה ילדות' +
    ' ילדים ילקוט ים ימים ימין ינשוף יסמין יער יפה יפות יפים יפן יצא יצאה יצאו ירד ירדה ירדו ירוק ירוקה ירושלים ירח' +
    ' יריב ירפה ישב ישבה ישבו ישיש ישן ישנה ישנו ישנות ישנים ישר ישרה יתוש כאב כאן כבאי כבאית כבד כבדה כביר כביש כבר' +
    ' כבש כבשה כד כדור כדורגל כדוריד כדורסל כדורעף כובע כוונה כוורת כוח כוכב כוכבים כונן כוננית כוס כוסות כועס כועסת' +
    ' כורסה כותב כותבים כותבת כותל כותרת כזב כחול כחולה כחוש כי כיבה כיבס כיבסה כיבתה כיוון כיור כיכר כינור כיסא' +
    ' כיסאות כיריים כיתה כל כלב כלבה כלבים כלה כלוב כלור כלי כליה כלכלה כלל כלנית כמה כמו כמות כן כנים כנראה כסוף כסיל' +
    ' כסף כעס כעסה כעת כף כפית כפפה כפפות כפר כפתור כרוב כרובית כרוז כרזה כרטיס כריך כריש כרית כרך כרכרה כרם כרס כתב' +
    ' כתבה כתבו כתובת כתום כתומה כתף כתפיים כתר לא לאהוב לאט לאכול לאפות לב לבד לבוא לבוש לבחור לביאה לביבה לבכות לבן' +
    ' לבנה לבנות לבקר לבקש לברוח לבש לבשל לגור לדאוג לדבר לדעת לה להביא להבין להדליק להחזיר להיכנס להכין להצליח לוהט' +
    ' לוויתן לוח לוטרה לומד לומדים לומדת לונדון לוקוס לוקח לוקחת לזיהוי לזכור לזרוק לח לחוד לחזור לחי לחייך לחכות' +
    ' לחלום לחם לחפש לחש לחשה לחשוב לחתוך לטאה לטוס לטייל לטפס ליבנה ליגה ליד ליווי ליטוף ליטר לילה לימד לימדה לימון' +
    ' לימונדה לימונים ליסבון ליפול ליצן ליקוי ליקט לישון לכבות לכבס לכן לכעוס לכתוב ללכת ללמוד למד למדה למדו למה למטה' +
    ' למכור למעלה למצוא לנגן לנוח לנסוע לנסות לנצח לנקות לנשום לסגור לסדר לספור לספר לעבוד לעזור לעלות לעמוד לענות' +
    ' לפחד לפני לפעמים לפתוח לפתע לצאת לצחוק לצייר לצלם לקבל לקום לקח לקחה לקחו לקחת לקנות לקפוץ לקרוא לראות לרדת לרוץ' +
    ' לרחוץ לרצות לרקוד לשאול לשבת לשון לשחות לשחק לשטוף לשיר לשכב לשכוח לשלוח לשלם לשמוח לשמוע לשמור לשתות לתקן לתת' +
    ' מאה מאוד מאוורר מאוחר מאושר מאזניים מאפינס מבחן מבחנה מביא מביאה מבין מבינה מבצר מבקר מבקרת מבקש מבקשת מברג' +
    ' מברשת מבשל מבשלת מגב מגבת מגדל מגהץ מגנט מגף מגפיים מגרפה מגרש מדבר מדברים מדברת מדוכדך מדף מדפסת מדרגות מדריד' +
    ' מה מהדק מהולל מהותי מהזיכרון מהיר מהירה מהנדס מהר מואר מוזיאון מוזיקה מוזר מוח מוכן מוכנה מוכר מוכרת מול מונית' +
    ' מוס מופלא מוצא מוצאת מוקדם מורא מורה מורים מורכב מושט מזגן מזוהם מזוודה מזון מזכירה מזל מזלג מזרקה מחברת מחבת' +
    ' מחדד מחט מחייך מחייכת מחיר מחכה מחכים מחל מחלה מחפש מחפשת מחק מחר מחרוזת מחריד מחשב מחשבון מטאטא מטבח מטבע' +
    ' מטוטלת מטונף מטוס מטייל מטיילת מטמון מטען מטפה מטפחת מטפס מטפסת מטר מטרה מטריה מטרייה מטרפה מי מיאן מיהר מיושן' +
    ' מיותרות מיותרת מיטה מייגע מילא מילאה מילה מיליון מיליליטר מילים מילימטר מים מיץ מיקרוגל מכאוב מכולת מכונית מכוער' +
    ' מכוש מכחול מכין מכינה מכלול מכנסיים מכסה מכר מכרה מכרו מכרז מכשיר מכתב מכתש מלא מלאה מלאווח מלאכה מלבוש מלוח' +
    ' מלוחה מלוכלך מלוכלכת מלון מלח מלחמה מלטשת מלך מלכה מלפפון מלפפונים מלצר מלצרית ממון ממתק ממתקים מנגו מנגן מנגנת' +
    ' מנה מנהרה מנוחה מנומס מנוע מנורה מנחה מנסה מנסים מנעול מנתה מסדר מסדרת מסובך מסוכן מסוק מסור מסיבה מסך מסלול' +
    ' מסננת מסע מסעדה מספר מספרה מספריים מספרים מספרת מסרק מעבורת מעדר מעון מעט מעטפה מעיין מעיל מעל מעלית מענה מעניין' +
    ' מערה מערוך מעשייה מפה מפוחית מפורסם מפל מפעל מפרשית מפתח מצא מצאה מצאו מצוחצח מצוי מצח מצחיק מצחיקה מצייר מציירת' +
    ' מצילתיים מצית מצליח מצליחה מצלם מצלמה מצלמת מצפן מצקת מצרים מקבל מקבלת מקדחה מקום מקלדת מקלחת מקסיקו מקרר מר' +
    ' מראה מרגיש מרגישה מרובע מרווח מרפאה מרפסת מרפק מרק מרשמלו מרתף מרתק משאית משגה משולש משונה משחק משחקים משחקת משי' +
    ' משכורת משכן משלם משלמת משמעות משמעותי משמש משעמם משענת משעשע משפחה משפט משקל משקפיים משרד מת מתוק מתוקה מתחיל' +
    ' מתחילה מתחת מתי מתכון מתכנת מתמהמה מתנה מתנשא נאה נאות נאמן נאמנות נבוב נבון נבח נבל נגע נגעה נגר נדיב נדיבה' +
    ' נדיבות נדיר נהג נהגת נהדר נהר נוגה נודע נוכל נוסע נוסעים נוסעת נועז נופל נופלת נוקשה נורא נורה נורית נושם נושמת' +
    ' נותן נותנת נזם נח נחה נחו נחל נחמד נחמדה נחפז נחש נטל נטש ניגן ניגנה ניידת נינוח ניסה ניסתה ניצח ניצחה ניצחון' +
    ' ניקה ניקתה נישא נכד נכדה נכדים נכנס נכנסה נכנסו נכשל נמוך נמוכה נמל נמלה נמר נסיך נסיכה נסיעה נסע נסעה נסעו' +
    ' נעורים נעילה נעימה נעל נעליים נענע נעץ נער נערה נפוץ נפל נפלא נפלה נפלו נצרת נקודה נקי נקייה נקניק נקניקיות' +
    ' נקניקייה נר נרגז נרחב נרקיס נשם נשמה נשק נשקה נשר נתיב נתן נתנה נתנו נתניה סבא סבוך סבון סביבה סביון סביח סבך' +
    ' סבל סבלנות סברה סבתא סגול סגולה סגור סגורה סגר סגרה סגרו סוגר סוגרת סוד סודה סוודר סוכות סוכר סוכריות סוכרייה' +
    ' סוללה סוללות סולם סוס סוסה סוף סופגניות סופגנייה סופה סופר סופרת סחלב סיבה סידר סידרה סיום סיוע סיים סיימה סייע' +
    ' סיכה סיכון סין סיף סיפור סיפר סיפרה סיר סירב סירה סכין סכנה סל סלון סלח סלחה סלט סליחה סלמון סלע סלק סמרטוט סנאי' +
    ' סנדל סנדלים סנונית סנטימטר סנטר סערה סף ספה ספוג ספוגים ספורט ספינה ספל ספסל ספק ספר ספרד ספרה ספרייה ספרים' +
    ' ספרית ספרנית סקי סקסופון סקרנות סרגל סרדין סרטן סתיו עבד עבדה עבדו עבודה עבר עגבניות עגבנייה עגול עגולה עגום' +
    ' עגורן עגיל עגילים עגינה עגל עגלה עגלון עד עובד עובדים עובדת עוגב עוגה עוגיות עוגייה עוגן עוד עוזר עוזרת עולה' +
    ' עולים עומד עומדים עומדת עונג עונה עונים עוף עוצמה עור עורב עז עזב עזר עזרה עזרו עט עטלף עיגול עייף עייפה עין' +
    ' עיניים עיפרון עיר עיתון עיתונאי עכביש עכבר עכברים עכו עכשיו על עלה עלו עליז עליזה עלים עליצות עלתה עם עמד עמדה' +
    ' עמדו עמוס עמוק עמוקה עמל עמק ענב ענבים ענה ענו ענוג ענווה עני עניבה עניו ענייה ענן עננים ענף ענק ענתה עסוק עסוקה' +
    ' עפולה עפעף עץ עצב עצוב עצובה עצום עצים עצל עצלות עצלן עצם עצמאות עצמות עקב עקרב עקשנות ערב ערבב ערבבה ערמון' +
    ' ערמונים ערפל ערק עשור עשיר עשירה עשר עשרה עשרים עתה עתיד עתיק פאזל פארק פגש פגשה פגשו פה פודינג פוחד פוחדת' +
    ' פומפייה פופקורן פורטוגל פורים פורל פותח פותחת פח פחד פחדה פחדן פחות פטיש פטריות פטרייה פיגום פיוס פיזר פיל פילים' +
    ' פינגווין פינה פיצה פיקוח פיקוס פיקח פירה פירות פיתה פיתוי פיתות פך פלאפל פלמינגו פלס פלפל פלפלים פנוי פנויה פנים' +
    ' פנס פסח פסטה פסיכולוג פסנתר פעוט פעם פעמון פר פראג פרג פרגוד פרדס פרה פרוזדור פרוסה פרות פרח פרחים פרי פריז פרס' +
    ' פרעוש פרפר פרק פשוט פשוטה פתאום פתוח פתוחה פתח פתחה פתחו פתיתים פתרון צב צבא צבי צביון צביטה צבירה צבע צבעה' +
    ' צבעוני צבעים צבר צבת צד צדדים צדף צהוב צהובה צהריים צוהל צוואר צוחק צוחקים צוחקת צוללת צונן צורה צחיח צחק צחקה' +
    ' צחקו ציור צייד צייר ציירה ציירו צילם צילמה ציפור ציפורים ציפורן צלחות צלחת צלם צמא צמאה צמח צמיד צמצם צמר צנום' +
    ' צנון צנוע צנצנת צעיף צעיר צעירה צעירים צעק צעקה צער צפצפה צפרדע צפת צר צרה צרח צרעה צרפת צרצר קדימה קהילה קהל קו' +
    ' קובה קובייה קוטר קול קולב קולה קולנוע קולפן קומה קומקום קונה קונים קוסם קוף קופה קופים קופסה קופץ קופצת קוקוס' +
    ' קורא קוראים קוראת קורה קורנס קורנפלקס קורקינט קטן קטנה קטנוע קטנות קטנטן קטנים קיבה קיבל קיבלה קיבץ קיווי' +
    ' קילוגרם קילומטר קיפוד קיפל קיפלה קיץ קיר קישוא קישוט קל קלה קלים קלמנטינה קלמר קלפים קלקל קלרינט קם קמה קמו קמח' +
    ' קמים קמצן קמצנות קן קנאה קנגורו קנדה קנה קנו קניון קניות קנתה קערה קפה קפץ קפצה קפצו קץ קציצה קצר קצרה קצרים קצת' +
    ' קקטוס קר קרא קראה קראו קרב קרה קרואסון קרוב קרובה קרח קרחון קרים קרנף קרסול קרפיון קשה קשוח קשיח קשים קשיש קשר' +
    ' קשרה קשת ראה ראו ראש ראשון ראשונה ראשי ראשית ראתה רב רביעי רבע רגוע רגיל רגל רגליים רגע רדוד רדיו רואה רואים רוב' +
    ' רוויה רוח רוחב רוטב רוכסן רומא רומן רוסיה רועש רועשת רופא רופאה רוצה רוצים רוקד רוקדת רוקח רושם רותח רז רזה רזים' +
    ' רחב רחבה רחוב רחובות רחוק רחוקה רחץ רחצה רחצו רטוב רטובה ריאה ריאות ריבה ריבוע רימון ריסים ריצה ריק ריקה ריקוד' +
    ' ריקים רך רכב רכבה רכבל רכבת רכה רכיבה רכש רם רמאי רמזור רמזים רע רעב רעבה רעה רעיון רעים רעם רענן רעננה רעש רפה' +
    ' רץ רצה רצו רצים רצפה רצתה רק רקד רקדה רקדו רקפת שאון שאל שאלה שאלו שבוע שבועות שבור שבורה שבט שביל שביעי שבע' +
    ' שבעה שבר שברה שברו שבת שגיאה שגרתי שגשג שד שדה שואל שואלת שוב שווארמה שווייץ שוחה שוחח שוחים שוטה שוטר שוטרת' +
    ' שוכב שוכבת שוכח שוכחת שולח שולחן שולחת שולי שום שומע שומעים שומעת שומר שומרת שועל שוק שוקו שוקולד שור שורש שותה' +
    ' שותים שזיף שחה שחו שחור שחורה שחייה שחמט שחף שחצן שחקן שחתה שט שטיח שטף שטר שי שיבח שידה שיח שיחק שיחקה שיחקו' +
    ' שילם שילמה שימורים שימפנזה שינה שיניים שיעור שיער שיפץ שיר שירה שירים שישה שישי שכב שכבה שכבו שכח שכחה שכחו שכיח' +
    ' שכן שכנה שכנים שכתבתם של שלב שלג שלד שלה שלו שלווה שלולית שלום שלוש שלושה שלושים שלח שלחה שלחו שלט שלישי שלכת' +
    ' שלם שלמה שם שמאל שמה שמו שמונה שמורה שמח שמחה שמחו שמחים שמיים שמיכה שמלה שמן שמנה שמנת שמע שמעה שמעו שמפו שמר' +
    ' שמרה שמרטף שמש שן שנא שנה שני שנייה שניים שנים שניצל שעה שעון שעועית שעות שפה שפירית שפך שפכה שפתיים שקד שקדן' +
    ' שקט שקטה שקיעה שקית שקמה שקר שקרן שקשוקה שר שרב שרברב שרה שרו שרים שרימפס שריר שרפרף שרק שרקה שרשרת שש שתה שתו' +
    ' שתייה שתיים שתק שתתה תאומים תאונה תאנה תאריך תבונה תדיר תה תודה תוכי תוכנית תולעת תום תוף תות תותים תחבורה תחילה' +
    ' תחנה תחת תיאטרון תינוק תינוקת תיעב תיק תיקן תיקנה תירס תיש תכלת תל תלה תליון תלמיד תלמידה תלתה תלתן תמוה תמונה' +
    ' תמיד תמנון תמר תמרים תנור תנין תעודה תעוזה תפאורה תפוז תפוזים תפוח תפוחים תפוקה תפזורת תפילה תפנית תפס תפסה תפסו' +
    ' תפקיד תפר תפרה תפריט תקווה תקרה תרופה תרנגול תרנגולת תשובה תשורה תשוש תשע תשעה';

  var TO_REG = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  var TO_FIN = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' };
  function norm(w) { return w.split('').map(function (c) { return TO_REG[c] || c; }).join(''); }
  function withFinal(s) {
    var l = s.charAt(s.length - 1);
    return TO_FIN[l] ? s.slice(0, -1) + TO_FIN[l] : s;
  }

  var WORDS = {};      // normalized -> display form
  var LIST = [];
  DICT.split(' ').forEach(function (w) {
    if (!w) return;
    var n = norm(w);
    if (!WORDS[n]) { WORDS[n] = w; LIST.push(n); }
  });

  // Points per letter: common letters 1, less common 2, rare 3.
  var VALUE = {};
  'אהוילמנרשת'.split('').forEach(function (l) { VALUE[l] = 1; });
  'בדכעקס'.split('').forEach(function (l) { VALUE[l] = 2; });
  'גזחטפצ'.split('').forEach(function (l) { VALUE[l] = 3; });
  // Extra tiles are drawn mostly from common letters.
  var FILL = 'אאההווייללממננררששתתבדכעקסגזחטפצ';

  /* Bonus squares by row length (index 0 = the first, rightmost square). */
  var BONUS = {
    5: ['', 'L2', '', '', 'W2'],
    6: ['', 'L2', '', 'W2', '', 'L3'],
    7: ['', 'L2', '', 'W2', '', 'L3', ''],
    8: ['', 'L2', '', 'W2', '', 'L3', '', 'W2']
  };
  // two short lines, so the label fits a narrow square when 8 squares share one row
  var BONUS_TEXT = { L2: 'אות\n×2', L3: 'אות\n×3', W2: 'מילה\n×2' };

  /* Per level (1–50): tiles in the rack (= squares on the row), and the goal:
     len = a word of at least that many letters (bonuses shown but not needed),
     pts = at least that share of the best possible score with these tiles (1 = the best word). */
  var LEVELS = [
    { r: 5, len: 2 }, { r: 5, len: 3 }, { r: 6, len: 3 }, { r: 6, len: 3 }, { r: 6, len: 4 },   // 1–5
    { r: 6, len: 4 }, { r: 7, len: 4 }, { r: 7, len: 4 }, { r: 6, pts: 0.4 }, { r: 6, pts: 0.45 }, // 6–10
    { r: 7, pts: 0.45 }, { r: 7, pts: 0.5 }, { r: 7, pts: 0.55 }, { r: 7, pts: 0.6 }, { r: 7, pts: 0.65 }, // 11–15
    { r: 8, pts: 0.6 }, { r: 8, pts: 0.65 }, { r: 8, pts: 0.7 }, { r: 8, pts: 0.72 }, { r: 8, pts: 0.75 }, // 16–20
    { r: 8, pts: 0.78 }, { r: 8, pts: 0.8 }, { r: 8, pts: 0.83 }, { r: 8, pts: 0.85 }, { r: 8, pts: 0.88 }, // 21–25
    { r: 8, pts: 0.9 }, { r: 8, pts: 0.93 }, { r: 8, pts: 0.95 }, { r: 8, pts: 0.97 }, { r: 8, pts: 1 },     // 26–30
    // 31–50: hard = the extra tiles are rarer letters; must = tiles marked ⭐ that the word has to use;
    // move = the bonus squares change places every round
    { r: 8, pts: 0.95, hard: true }, { r: 8, pts: 0.97, hard: true }, { r: 8, pts: 1, hard: true },        // 31–33
    { r: 8, pts: 1, hard: true }, { r: 8, pts: 1, hard: true },                                             // 34–35
    { r: 8, pts: 0.9, must: 1 }, { r: 8, pts: 0.95, must: 1 }, { r: 8, pts: 1, must: 1 },                   // 36–38
    { r: 8, pts: 1, must: 1, hard: true }, { r: 8, pts: 1, must: 1, hard: true },                           // 39–40
    { r: 8, pts: 0.95, must: 1, move: true }, { r: 8, pts: 1, must: 1, move: true },                        // 41–42
    { r: 8, pts: 1, must: 1, move: true, hard: true }, { r: 8, pts: 1, must: 1, move: true, hard: true },   // 43–44
    { r: 8, pts: 1, must: 1, move: true, hard: true },                                                      // 45
    { r: 8, pts: 0.95, must: 2, move: true }, { r: 8, pts: 1, must: 2, move: true },                        // 46–47
    { r: 8, pts: 1, must: 2, move: true, hard: true }, { r: 8, pts: 1, must: 2, move: true, hard: true },   // 48–49
    { r: 8, pts: 1, must: 2, move: true, hard: true }                                                       // 50
  ];
  var HARD_FILL = 'בדכעקסגזחטפצבדכעקסגזחטפצאהוילמנרשת';

  // does the word use all the ⭐ letters (as many times as they are marked)?
  function usesMust(w, mustLetters) {
    var left = w.split('');
    return (mustLetters || []).every(function (l) { var k = left.indexOf(l); if (k === -1) return false; left.splice(k, 1); return true; });
  }

  function score(word, bonus) {
    var sum = 0, wm = 1;
    for (var i = 0; i < word.length; i++) {
      var v = VALUE[word.charAt(i)] || 1, b = bonus[i];
      sum += v * (b === 'L2' ? 2 : b === 'L3' ? 3 : 1);
      if (b === 'W2') wm *= 2;
    }
    return sum * wm;
  }

  function canMake(word, rack) {
    var left = rack.slice();
    for (var i = 0; i < word.length; i++) {
      var k = left.indexOf(word.charAt(i));
      if (k === -1) return false;
      left.splice(k, 1);
    }
    return true;
  }

  /* All dictionary words the rack can make, best first. */
  function options(rack, bonus) {
    return LIST.filter(function (w) { return w.length <= rack.length && canMake(w, rack); })
      .map(function (w) { return { w: w, s: score(w, bonus) }; })
      .sort(function (a, b) { return b.s - a.s || b.w.length - a.w.length; });
  }

  /* A rack built around a real word, so there is always a good answer. */
  function makeRack(spec, pick, shuffle) {
    var bonus = BONUS[spec.r];
    if (spec.move) bonus = shuffle(bonus.slice());
    for (var t = 0; t < 200; t++) {
      var minL = spec.len || 3;
      var pool = LIST.filter(function (w) { return w.length >= minL && w.length <= spec.r; });
      var seed = pick(pool);
      var rack = seed.split('');
      var fill = (spec.hard ? HARD_FILL : FILL).split('');
      while (rack.length < spec.r) rack.push(pick(fill));
      rack = shuffle(rack);
      // ⭐ tiles: letters of the seed word, so a word using them always exists
      var mustLetters = spec.must ? shuffle(seed.split('')).slice(0, spec.must) : [];
      var must = [];
      mustLetters.forEach(function (l) {
        for (var k = 0; k < rack.length; k++) if (rack[k] === l && must.indexOf(k) === -1) { must.push(k); break; }
      });
      var opts = options(rack, bonus).filter(function (o) { return usesMust(o.w, mustLetters); });
      var ok = spec.len ? opts.filter(function (o) { return o.w.length >= spec.len; }) : opts;
      if (!ok.length) continue;
      var best = opts[0].s;
      var goal = spec.len ? 0 : Math.max(2, Math.ceil(best * spec.pts));
      return { rack: rack, bonus: bonus, opts: opts, best: best, goal: goal, must: must, mustLetters: mustLetters };
    }
    return null;
  }

  var css = [
    '.wpt-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:.7rem;}',
    '.wpt-explain:not(:empty)~.wpt-score{display:none;}',
    '.wpt-wrap .g-actions{flex-wrap:nowrap;gap:.5rem;}',
    '.wpt-wrap .g-actions .btn{min-width:0;padding-inline:.9rem;}',
    '.wpt-goal{margin:0;font-size:1.2rem;font-weight:800;text-align:center;background:var(--language-soft);color:var(--language);',
    'padding:.35rem 1rem;border-radius:999px;}',
    '.wpt-row{display:grid;grid-template-columns:repeat(var(--n),minmax(0,3.6rem));gap:.3rem;justify-content:center;direction:rtl;width:100%;}',
    '.wpt-sq{position:relative;height:3.5rem;border-radius:var(--radius-sm);border:2px dashed var(--line);background:var(--surface-2);',
    'display:grid;place-items:center;padding:0;font-family:var(--font-display);font-weight:900;font-size:min(1.9rem,calc(60vw / var(--n)));color:var(--ink);cursor:pointer;}',
    '.wpt-sq:disabled{cursor:default;}',
    '.wpt-sq.b-L2{background:var(--logic-soft);border-color:var(--logic);}',
    '.wpt-sq.b-L3{background:var(--memory-soft);border-color:var(--memory);}',
    '.wpt-sq.b-W2{background:var(--attention-soft);border-color:var(--attention);}',
    '.wpt-sq .wpt-b{position:absolute;inset:0;display:grid;place-items:center;white-space:pre-line;text-align:center;font-family:var(--font-body);font-size:min(.75rem,3vw);font-weight:800;color:var(--ink-soft);line-height:1.15;}',
    '.wpt-sq.is-filled{border-style:solid;background:var(--surface);}',
    '.wpt-sq.is-filled .wpt-b{display:none;}',
    '.wpt-rack{display:grid;grid-template-columns:repeat(4,minmax(0,3.6rem));gap:.5rem;justify-content:center;direction:rtl;width:100%;}',
    '.wpt-tile{position:relative;height:3.6rem;padding:0;border-radius:var(--radius-sm);border:2px solid var(--sun);background:var(--sun-soft);',
    'box-shadow:var(--shadow);font-family:var(--font-display);font-weight:900;font-size:2rem;color:var(--ink);cursor:pointer;line-height:1;}',
    '.wpt-tile.is-used{visibility:hidden;}',
    '.wpt-star{position:absolute;top:-.45rem;right:-.35rem;font-size:1rem;line-height:1;}',
    '.wpt-v,.wpt-sq .wpt-v{position:absolute;bottom:3px;left:5px;font-family:var(--font-body);font-size:.8rem;font-weight:800;color:var(--ink-soft);}',
    '.wpt-sq .wpt-v{font-size:min(.8rem,3vw);bottom:1px;left:3px;}',
    '.wpt-score{margin:0;font-size:1.15rem;font-weight:800;text-align:center;font-variant-numeric:tabular-nums;min-height:1.5rem;}',
    '.wpt-explain{margin:0;font-size:1.1rem;font-weight:600;text-align:center;text-wrap:balance;padding:.35rem .8rem;border-radius:var(--radius-sm);width:100%;max-width:30rem;}',
    '.wpt-explain:empty{display:none;}',
    '.wpt-explain.is-good{background:var(--good-soft);color:var(--good);}',
    '.wpt-explain.is-bad{background:var(--bad-soft);color:var(--ink);}',
    '.wpt-explain.is-info{background:var(--surface-2);}'
  ].join('');

  BrainGames.register({
    id: 'word-points',
    name: 'מילים בנקודות',
    skill: 'language',
    tagline: 'בנו מילה מהאותיות וצברו נקודות',
    benefit: 'שליפת מילים, איות ותכנון',
    instructions: [
      'למטה יש אותיות, ולכל אות מספר נקודות (בפינה).',
      'לחצו על אותיות כדי לבנות מילה בשורה, מימין לשמאל. משבצות צבעוניות מכפילות נקודות.',
      'לחיצה על אות בשורה מחזירה אותה. כשהמילה מוכנה לחצו "זו המילה".',
      'בהתחלה צריך מילה באורך מסוים, ובהמשך מספר נקודות. ברמות הגבוהות מאוד חובה להשתמש באותיות המסומנות ⭐. אין שעון.'
    ],
    css: css,
    _model: { LIST: LIST, score: score, options: options, makeRack: makeRack, LEVELS: LEVELS, usesMust: usesMust },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var round = 0, correct = 0, helped = 0;
      var usedSeeds = {};

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({
            correct: correct, total: ROUNDS,
            note: 'הצלחתם ב-' + correct + ' מתוך ' + ROUNDS + ' סבבים' + (helped ? ' (ב-' + helped + ' בעזרת רמז)' : '')
          });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var R;
        for (var t = 0; t < 10; t++) {
          R = makeRack(spec, ctx.pick, ctx.shuffle);
          if (R && !usedSeeds[R.rack.slice().sort().join('')]) break;
        }
        usedSeeds[R.rack.slice().sort().join('')] = true;
        play(R);
      }

      function play(R) {
        root.innerHTML = '';
        var n = R.rack.length;
        var slots = [];          // tile index per square, or -1
        for (var i = 0; i < n; i++) slots.push(-1);
        var used = R.rack.map(function () { return false; });
        var answered = false, hinted = false, misses = 0;

        var goalText = (spec.len ? 'בנו מילה של ' + spec.len + ' אותיות או יותר' : 'השיגו לפחות ' + R.goal + ' נקודות') +
          (R.must.length ? (R.must.length === 1 ? ', עם האות ⭐' : ', עם שתי האותיות ⭐') : '');
        var goal = el('p', { class: 'wpt-goal' }, goalText);
        var squares = R.bonus.map(function (b, j) {
          return el('button', { class: 'wpt-sq' + (b ? ' b-' + b : ''), type: 'button', onclick: function () { onSquare(j); } });
        });
        // the whole word on one line: up to 8 squares share the row width
        var row = el('div', { class: 'wpt-row', style: { '--n': R.bonus.length }, 'aria-label': 'שורת המילה' }, squares);
        var tiles = R.rack.map(function (l, ti) {
          return el('button', { class: 'wpt-tile', type: 'button', 'aria-label': 'האות ' + l + ', ' + VALUE[l] + ' נקודות', onclick: function () { onTile(ti); } },
            [l, el('span', { class: 'wpt-v', 'aria-hidden': 'true' }, String(VALUE[l])),
              R.must.indexOf(ti) !== -1 ? el('span', { class: 'wpt-star', 'aria-hidden': 'true' }, '⭐') : null]);
        });
        var rack = el('div', { class: 'wpt-rack', 'aria-label': 'האותיות שלכם' }, tiles);
        var scoreLine = el('p', { class: 'wpt-score', 'aria-live': 'polite' });
        var explain = el('p', { class: 'wpt-explain', 'aria-live': 'polite' });
        var submitBtn = el('button', { class: 'btn btn-primary', type: 'button', onclick: submit }, 'זו המילה');
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var giveUpBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: giveUp }, 'הראו לי');
        var actions = el('div', { class: 'g-actions' }, [submitBtn, hintBtn, giveUpBtn]);

        ctx.setStatus(spec.len ? 'בנו מילה מהאותיות' : 'בנו מילה ששווה מספיק נקודות');
        // a message takes the score line's place (see css), so the board does not grow mid-round
        root.appendChild(el('div', { class: 'wpt-wrap' }, [goal, row, explain, scoreLine, rack, actions]));
        render();

        function word() {
          var s = '';
          for (var j = 0; j < n && slots[j] !== -1; j++) s += R.rack[slots[j]];
          return s;
        }

        function render() {
          var w = word();
          squares.forEach(function (sq, j) {
            var ti = slots[j];
            sq.innerHTML = '';
            sq.classList.toggle('is-filled', ti !== -1);
            if (ti !== -1) {
              var l = R.rack[ti];
              var isLast = j === n - 1 || slots[j + 1] === -1;
              sq.appendChild(document.createTextNode(isLast && TO_FIN[l] ? TO_FIN[l] : l));
              sq.appendChild(el('span', { class: 'wpt-v', 'aria-hidden': 'true' }, String(VALUE[l])));
            } else if (R.bonus[j]) {
              sq.appendChild(el('span', { class: 'wpt-b' }, BONUS_TEXT[R.bonus[j]]));
            }
            sq.disabled = answered || ti === -1;
          });
          tiles.forEach(function (t, ti) { t.classList.toggle('is-used', used[ti]); t.disabled = answered || used[ti]; });
          scoreLine.textContent = w.length ? '"' + withFinal(w) + '" · ' + score(w, R.bonus) + ' נקודות' : '';
          submitBtn.disabled = answered || w.length < 2;
          hintBtn.disabled = answered;
          giveUpBtn.disabled = answered;
        }

        function onTile(ti) {
          if (answered || used[ti]) return;
          var j = slots.indexOf(-1);
          if (j === -1) return;
          ctx.sound('tap');
          slots[j] = ti; used[ti] = true;
          explain.className = 'wpt-explain'; explain.textContent = '';
          render();
        }

        // Removing a letter from the middle closes the gap, so the word stays in one piece.
        function onSquare(j) {
          if (answered || slots[j] === -1) return;
          used[slots[j]] = false;
          slots.splice(j, 1);
          slots.push(-1);
          render();
        }

        function goodEnough(w) {
          return usesMust(w, R.mustLetters) && (spec.len ? w.length >= spec.len : score(w, R.bonus) >= R.goal);
        }

        function bestFitting() {
          return R.opts.filter(function (o) { return goodEnough(o.w); })[0];
        }

        function submit() {
          if (answered) return;
          var w = word();
          if (!WORDS[w]) {
            explain.className = 'wpt-explain is-bad';
            explain.textContent = '"' + withFinal(w) + '" לא במילון של המשחק. נסו מילה אחרת.';
            ctx.feedback(false, 'נסו מילה אחרת');
            return;
          }
          if (!usesMust(w, R.mustLetters)) {
            misses++;
            explain.className = 'wpt-explain is-bad';
            explain.textContent = '"' + WORDS[w] + '" היא מילה, אבל צריך להשתמש ' + (R.must.length === 1 ? 'באות המסומנת ⭐' : 'בשתי האותיות המסומנות ⭐') + '.';
            ctx.feedback(false, 'חסרה אות ⭐');
            return;
          }
          if (!goodEnough(w)) {
            misses++;
            explain.className = 'wpt-explain is-bad';
            explain.textContent = spec.len
              ? '"' + WORDS[w] + '" היא מילה, אבל צריך לפחות ' + spec.len + ' אותיות.'
              : '"' + WORDS[w] + '" שווה ' + score(w, R.bonus) + ' נקודות. צריך לפחות ' + R.goal + '.';
            ctx.feedback(false, 'עוד לא מספיק');
            return;
          }
          finishRound(true, w);
        }

        function hint() {
          if (answered) return;
          var b = bestFitting();
          // clear the row and put the first letter of a good word in place
          slots.forEach(function (ti) { if (ti !== -1) used[ti] = false; });
          for (var j = 0; j < n; j++) slots[j] = -1;
          var first = b.w.charAt(0), ti = -1;
          R.rack.forEach(function (l, k) { if (ti === -1 && l === first) ti = k; });
          slots[0] = ti; used[ti] = true;
          hinted = true;
          explain.className = 'wpt-explain is-info';
          explain.textContent = 'יש מילה טובה שמתחילה ב"' + first + '" ויש בה ' + b.w.length + ' אותיות.';
          render();
        }

        function giveUp() { if (!answered) finishRound(false, null); }

        function finishRound(ok, w) {
          answered = true;
          if (ok) { correct++; if (hinted) helped++; }
          var best = R.opts[0];
          var b = bestFitting();
          explain.className = 'wpt-explain ' + (ok ? 'is-good' : 'is-info');
          explain.textContent = ok
            ? 'מצוין! "' + WORDS[w] + '" שווה ' + score(w, R.bonus) + ' נקודות.' +
              (best.w !== w ? ' המילה הכי שווה כאן: "' + WORDS[best.w] + '" (' + best.s + ').' : ' זו המילה הכי שווה!')
            : 'למשל: "' + WORDS[b.w] + '" (' + b.s + ' נקודות).' + (best.w !== b.w ? ' הכי שווה: "' + WORDS[best.w] + '" (' + best.s + ').' : '');
          render();
          ctx.feedback(ok, ok ? undefined : 'למשל: ' + WORDS[b.w]).then(function () {
            if (ok) { ctx.wait(2600).then(nextRound); return; } // a correct answer moves on by itself
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
              round >= ROUNDS ? 'לסיכום' : 'הלאה');
            actions.innerHTML = '';
            actions.appendChild(next);
          });
        }
      }

      nextRound();
    }
  });
})();
