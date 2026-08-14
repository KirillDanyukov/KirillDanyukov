'use strict';

const TRANSLATIONS = {
  ru: {
    'page-title':'Кирилл Данюков — активист студсовета МичГАУ',
    'page-description':'Кирилл Данюков — активист студсовета МичГАУ (Мичуринский ГАУ), студент Центра-колледжа прикладных квалификаций. КВН, медиа, волонтёрство, блогинг.',
    'hero-name':'Кирилл Данюков',
    'hero-desc':'Творческий деятель, активист студсовета МичГАУ, студент Центра-колледжа прикладных квалификаций. КВН, блогер, автор медиапроектов.',
    'hero-since':'С 2023 года развиваюсь в сфере медиа, видеопроизводства, блогинга и творческих проектов.',
    'scroll-hint':'листай ниже',
    'section-experience':'Опыт и достижения',
    'kvn-title':'КВН','kvn-1':'Основатель команды КВН «STUD SQUAD»','kvn-2':'Ранее команда выступала под названием «Орлята»','kvn-3':'Участие в творческих конкурсах и юмористических мероприятиях','tykni':'Тыкни!',
    'media-title':'Медиа и блогинг','media-1':'Бывший руководитель команды блогеров «Продолжение»','media-2':'Создание видеороликов, монтаж, работа над авторскими проектами','media-3':'Производство короткометражных фильмов',
    'startups-title':'Стартапы и проекты','startups-1':'Участник развития проекта «Bubble Gum»','startups-2':'Участие в развитии проекта «BigFoot»',
    'vol-title':'Волонтёрство','vol-1':'Участие в волонтёрских развивающих мероприятиях','vol-2':'Помощь в организации событий и поддержка благотворительных инициатив','vol-3':'Заместитель руководителя комитета по работе с общежитиями Совета студенческого самоуправления ФГБОУ ВО Мичуринский ГАУ',
    'awards-title':'Награды','award-1':'Благодарственное письмо за помощь в организации и проведении Дебюта Первокурсника 2025','award-2':'Студент года 2025 победитель номинации Творческая личность',
    'education-title':'Образование и студсовет','education-desc':'Студент 2 курса Центра-колледжа прикладных квалификаций (Мичуринский ГАУ / МичГАУ). Заместитель руководителя комитета по общежитиям Студенческого совета. Победитель номинации «Студент года 2025».','education-item-1':'Студент 2 курса Центра-колледжа прикладных квалификаций МичГАУ','education-item-2':'Заместитель руководителя комитета по общежитиям Студенческого совета','education-item-3':'Победитель номинации «Студент года 2025» — Творческая личность',
    'who-title':'Кто я?','blogger-title':'Блогер','blogger-desc':'Создаю медиаконтент, работаю с аудиторией, веду блог.','artist-title':'Артист','artist-desc':'Участвую в КВН, театральных постановках, творческих событиях.','volunteer-title':'Волонтёр','volunteer-desc':'Являюсь волонтёром, участвую в волонтёрских инициативах, поддерживаю развитие сообщества.','host-title':'Ведущий и организатор','host-desc':'Организую мероприятия, веду творческие программы, работаю с командами.',
    'works-title':'Мои работы','video-1':'Видео 1','video-2':'Видео 2','video-3':'Видео 3','video-4':'Видео 4','video-5':'Видео 5','video-6':'Видео 6','video-7':'Видео 7','video-8':'Видео 8',
    'orgs-title':'Волонтёрские организации','orgs-subtitle':'в которых я состою','contacts-title':'Контакты','contacts-desc':'Связаться со мной можно через ВКонтакте.','footer-sign':'Kirill Danyukov © 2026','easter-label':'Что это такое?','gamepad-aria':'Что это такое? — мини-игра'
  },
  en: {
    'page-title':'Kirill Danyukov — Portfolio','page-description':'Kirill Danyukov — activist of the Student Council of MichGAU (Michurinsk State Agrarian University), student at the Center-College of Applied Qualifications. KVN, media, volunteering, blogging.','hero-name':'Kirill Danyukov','hero-desc':'Creative personality, KVN performer, blogger, author of media projects and participant in public initiatives.','hero-since':'Since 2023 I have been developing in the fields of media, video production, blogging and creative projects.','scroll-hint':'scroll down','section-experience':'Experience & Achievements',
    'kvn-title':'KVN','kvn-1':'Founder of the KVN team «STUD SQUAD»','kvn-2':'Previously the team performed under the name «Orlyata»','kvn-3':'Participation in creative competitions and humor events','tykni':'Click me!',
    'media-title':'Media & Blogging','media-1':'Former head of the blogger team «Prodolzhenie»','media-2':'Creating videos, editing, working on original projects','media-3':'Production of short films',
    'startups-title':'Startups & Projects','startups-1':'Participant in the development of the «Bubble Gum» project','startups-2':'Participation in the development of the «BigFoot» project',
    'vol-title':'Volunteering','vol-1':'Participation in volunteer development events','vol-2':'Assistance in organizing events and support of charitable initiatives','vol-3':'Deputy Head of the Dormitory Committee of the Student Self-Government Council of Michurinsk State Agrarian University',
    'awards-title':'Awards','award-1':'Letter of appreciation for helping organize the First-Year Student Debut 2025','award-2':'Student of the Year 2025, winner of the Creative Personality nomination',
    'education-title':'Education & Student Council','education-desc':'2nd year student at the Center-College of Applied Qualifications (Michurinsk State Agrarian University / MichGAU). Deputy Head of the Dormitory Committee of the Student Council. Winner of the «Student of the Year 2025» nomination.','education-item-1':'2nd year student at the Center-College of Applied Qualifications of MichGAU','education-item-2':'Deputy Head of the Dormitory Committee of the Student Council','education-item-3':'Winner of «Student of the Year 2025» — Creative Personality nomination',
    'who-title':'Who am I?','blogger-title':'Blogger','blogger-desc':'I create media content, work with audiences, and run a blog.','artist-title':'Performer','artist-desc':'I participate in KVN, theatrical performances and creative events.','volunteer-title':'Volunteer','volunteer-desc':'I am a volunteer, participate in volunteer initiatives and support community development.','host-title':'Host & Organizer','host-desc':'I organize events, host creative programs and work with teams.',
    'works-title':'My Works','video-1':'Video 1','video-2':'Video 2','video-3':'Video 3','video-4':'Video 4','video-5':'Video 5','video-6':'Video 6','video-7':'Video 7','video-8':'Video 8',
    'orgs-title':'Volunteer Organizations','orgs-subtitle':'I am a member of','contacts-title':'Contacts','contacts-desc':'You can contact me via VKontakte.','footer-sign':'Kirill Danyukov © 2026','easter-label':'What is this?','gamepad-aria':'What is this? — mini-game'
  }
};

const GAME_TRANSLATIONS = {
  ru: {'game-aria-label':'Мини-игра Поймай мусор','game-close-aria':'Закрыть игру','game-pause-aria':'Пауза','game-title':'Поймай мусор!','game-start':'Старт','game-records':'Рекорды','game-settings':'Настройки','game-best-score':'Лучший рекорд','game-back':'Назад','game-sound-vol':'Громкость звуков','game-music-vol':'Громкость музыки','game-pause':'Пауза','game-resume':'Продолжить','game-main-menu':'Главное меню','game-over':'Игра окончена','game-your-score':'Ваш счёт:','game-best-score-colon':'Лучший рекорд:','game-new-record':'🏆 НОВЫЙ РЕКОРД!','game-play-again':'Сыграть снова'},
  en: {'game-aria-label':'Mini-game Catch the Trash','game-close-aria':'Close game','game-pause-aria':'Pause','game-title':'Catch the Trash!','game-start':'Start','game-records':'High Scores','game-settings':'Settings','game-best-score':'Best Score','game-back':'Back','game-sound-vol':'SFX Volume','game-music-vol':'Music Volume','game-pause':'Pause','game-resume':'Resume','game-main-menu':'Main Menu','game-over':'Game Over','game-your-score':'Your Score:','game-best-score-colon':'Best Score:','game-new-record':'🏆 NEW RECORD!','game-play-again':'Play Again'}
};

Object.keys(GAME_TRANSLATIONS).forEach(lang => Object.assign(TRANSLATIONS[lang], GAME_TRANSLATIONS[lang]));

let currentLang = 'ru';

function applyLang(lang) {
  if (!TRANSLATIONS[lang]) lang = 'ru';
  const dict = TRANSLATIONS[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.dataset.i18nAria;
    if (dict[key] !== undefined) el.setAttribute('aria-label', dict[key]);
  });
  document.title = dict['page-title'] || document.title;
  document.documentElement.lang = lang;
  document.documentElement.dir = 'ltr';
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && dict['page-description']) metaDesc.setAttribute('content', dict['page-description']);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && dict['page-title']) ogTitle.setAttribute('content', dict['page-title']);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc && dict['page-description']) ogDesc.setAttribute('content', dict['page-description']);
  document.querySelectorAll('.lang-option').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
  currentLang = lang;
  localStorage.setItem('lang', lang);
}

function initLang() {
  const saved = localStorage.getItem('lang');
  if (saved && TRANSLATIONS[saved]) { applyLang(saved); return; }
  const userLangs = navigator.languages || [navigator.language || navigator.userLanguage];
  let matched = null;
  for (let l of userLangs) {
    if (!l) continue;
    const short = l.toLowerCase().split('-')[0];
    if (TRANSLATIONS[short]) { matched = short; break; }
  }
  applyLang(matched || 'ru');
}

document.addEventListener('DOMContentLoaded', () => {
  const langBtn = document.getElementById('langBtn');
  const langDropdown = document.getElementById('langDropdown');
  if (langBtn && langDropdown) {
    langBtn.addEventListener('click', e => { e.stopPropagation(); langDropdown.classList.toggle('open'); });
    document.addEventListener('click', () => langDropdown.classList.remove('open'));
    langDropdown.addEventListener('click', e => {
      const btn = e.target.closest('.lang-option');
      if (!btn || !TRANSLATIONS[btn.dataset.lang]) return;
      applyLang(btn.dataset.lang);
      langDropdown.classList.remove('open');
    });
  }
  initLang();
});
