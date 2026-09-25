// DeepSeek Voice: язык интерфейса DeepSeek и голосовой ввод на любом языке.
// Ctrl+Пробел — микрофон вкл/выкл.
// Голосовые команды в конце фразы: «отправить» / send, «очистить» / clear.
(() => {
  if (window.__dsVoice) return;
  window.__dsVoice = true;

  // ---------- настройки ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('dsVoice.' + k); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('dsVoice.' + k, v); } catch {} },
  };
  // Язык интерфейса хранит сам DeepSeek (значение "system" или код вроде "en_US", "ru", "de").
  const LOCALE_KEY = '__appKit_@deepseek/chat_localePreference';
  const APP_LOCALES = ['zh_CN', 'en_US', 'zh_Hant', 'zh_HK', 'ja', 'en_AU', 'en_CA', 'en_GB', 'en_IN', 'en_SG', 'en_ZA',
    'af', 'am', 'ar', 'az', 'be', 'bg', 'bn', 'ca', 'cs', 'da', 'de', 'el', 'es', 'es_419', 'es_US', 'et', 'eu', 'fa',
    'fa_AE', 'fa_AF', 'fa_IR', 'fi', 'fil', 'fr', 'fr_CA', 'gl', 'gu', 'he', 'hi', 'hr', 'hu', 'hy', 'id', 'is', 'it',
    'ka', 'kk', 'km', 'kn', 'ko', 'ky', 'lo', 'lt', 'lv', 'mk', 'ml', 'mn', 'mr', 'ms', 'ms_MY', 'my', 'nb', 'ne', 'nl',
    'pa', 'pl', 'pt_BR', 'pt_PT', 'rm', 'ro', 'ru', 'si', 'sk', 'sl', 'sq', 'sr', 'sv', 'sw', 'ta', 'te', 'th', 'tr',
    'uk', 'ur', 'vi', 'zu'];
  function appLocale() {
    try { return JSON.parse(localStorage.getItem(LOCALE_KEY)).value || 'system'; } catch { return 'system'; }
  }
  function setAppLocale(v) {
    try { localStorage.setItem(LOCALE_KEY, JSON.stringify({ value: v, __version: '0' })); } catch {}
    location.reload();
  }
  const uiCode = () => { const l = appLocale(); return (l === 'system' ? navigator.language : l).slice(0, 2).toLowerCase(); };

  const DICT_LANGS = ['ru-RU', 'en-US', 'en-GB', 'uk-UA', 'be-BY', 'kk-KZ', 'uz-UZ', 'ky-KG', 'az-AZ', 'hy-AM', 'ka-GE',
    'mn-MN', 'de-DE', 'fr-FR', 'es-ES', 'es-MX', 'it-IT', 'pt-BR', 'pt-PT', 'pl-PL', 'cs-CZ', 'sk-SK', 'sl-SI', 'hr-HR',
    'sr-RS', 'bg-BG', 'ro-RO', 'hu-HU', 'el-GR', 'nl-NL', 'sv-SE', 'nb-NO', 'da-DK', 'fi-FI', 'et-EE', 'lv-LV', 'lt-LT',
    'tr-TR', 'ar-SA', 'he-IL', 'fa-IR', 'ur-PK', 'hi-IN', 'bn-IN', 'ta-IN', 'th-TH', 'vi-VN', 'id-ID', 'ms-MY', 'fil-PH',
    'zh-CN', 'zh-TW', 'zh-HK', 'ja-JP', 'ko-KR'];
  function langName(code, inLang) {
    try {
      const n = new Intl.DisplayNames([inLang || code.replace('_', '-')], { type: 'language' }).of(code.replace('_', '-'));
      return n.charAt(0).toUpperCase() + n.slice(1);
    } catch { return code; }
  }
  function defaultDictLang() {
    const nav = navigator.language || 'ru-RU';
    return DICT_LANGS.find(c => c.toLowerCase() === nav.toLowerCase()) || DICT_LANGS.find(c => c.slice(0, 2) === nav.slice(0, 2)) || 'ru-RU';
  }
  let lang = store.get('lang', defaultDictLang());
  if (!DICT_LANGS.includes(lang)) lang = defaultDictLang();

  // ---------- тексты панели ----------
  const I18N = {
    ru: {
      mic: 'Голосовой ввод (Ctrl+Пробел)', dict: 'Язык диктовки', settings: 'Настройки',
      appLang: 'Язык приложения', system: 'Как в системе', dictSet: 'Язык диктовки: ',
      listen: 'Говорите… «отправить» — отправить сообщение.', noInput: 'Не нашёл поле ввода. Откройте чат.',
      notAllowed: 'Нет доступа к микрофону. Разрешите его в значке замка слева от адреса.', noMic: 'Микрофон не найден.',
      network: 'Сервис распознавания речи недоступен (сеть).', langNS: 'Этот язык не поддерживается распознаванием.',
      micFail: 'Не удалось включить микрофон: ', noSR: 'Распознавание речи недоступно в этом браузере',
    },
    uk: {
      mic: 'Голосове введення (Ctrl+Пробіл)', dict: 'Мова диктування', settings: 'Налаштування',
      appLang: 'Мова застосунку', system: 'Як у системі', dictSet: 'Мова диктування: ',
      listen: 'Говоріть… «надіслати» — надіслати повідомлення.', noInput: 'Не знайшов поле введення. Відкрийте чат.',
      notAllowed: 'Немає доступу до мікрофона. Дозвольте його в значку замка ліворуч від адреси.', noMic: 'Мікрофон не знайдено.',
      network: 'Сервіс розпізнавання мовлення недоступний (мережа).', langNS: 'Ця мова не підтримується розпізнаванням.',
      micFail: 'Не вдалося увімкнути мікрофон: ', noSR: 'Розпізнавання мовлення недоступне в цьому браузері',
    },
    en: {
      mic: 'Voice input (Ctrl+Space)', dict: 'Dictation language', settings: 'Settings',
      appLang: 'App language', system: 'System default', dictSet: 'Dictation language: ',
      listen: 'Speak… say "send" to send the message.', noInput: 'Chat input not found. Open a chat.',
      notAllowed: 'Microphone access denied. Allow it via the lock icon left of the address.', noMic: 'No microphone found.',
      network: 'Speech recognition service unavailable (network).', langNS: 'This language is not supported for recognition.',
      micFail: 'Could not start the microphone: ', noSR: 'Speech recognition is not available in this browser',
    },
  };
  const t = I18N[uiCode()] || (uiCode() === 'be' || uiCode() === 'kk' ? I18N.ru : I18N.en);
  const uiLocale = (appLocale() === 'system' ? navigator.language : appLocale().replace('_', '-'));

  // ---------- UI ----------
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;right:16px;bottom:96px;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host{--bg:#fff;--fg:#1f2329;--muted:#6b7280;--line:#e5e7eb}
      @media (prefers-color-scheme: dark){:host{--bg:#1f2023;--fg:#e8e8ea;--muted:#9ca3af;--line:#3a3b40}}
      .wrap{position:relative;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font:13px system-ui,sans-serif}
      .row{display:flex;gap:8px;align-items:center}
      .b{width:44px;height:44px;border-radius:50%;border:none;cursor:pointer;font-size:20px;position:relative;
        background:#4d6bfe;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.25);display:grid;place-items:center}
      .b.off{background:#8a8f98}
      .b.rec{background:#e5484d;animation:p 1.2s infinite}
      @keyframes p{0%,100%{box-shadow:0 0 0 0 rgba(229,72,77,.6)}50%{box-shadow:0 0 0 10px rgba(229,72,77,0)}}
      .tip{max-width:300px;padding:6px 10px;border-radius:8px;background:rgba(20,20,20,.85);color:#fff;display:none}
      .tip.show{display:block}
      .panel{display:none;width:280px;padding:14px;border-radius:12px;background:var(--bg);color:var(--fg);
        border:1px solid var(--line);box-shadow:0 8px 28px rgba(0,0,0,.25)}
      .panel.show{display:block}
      .panel h3{margin:0 0 10px;font-size:14px}
      .panel label{display:block;margin:10px 0 4px;color:var(--muted);font-size:12px}
      .panel select{width:100%;box-sizing:border-box;padding:6px;border-radius:6px;border:1px solid var(--line);background:var(--bg);color:var(--fg);font-size:13px}
    </style>
    <div class="wrap">
      <div class="panel" id="panel">
        <h3 id="pTitle"></h3>
        <label id="lApp"></label><select id="appLang"></select>
        <label id="lDict"></label><select id="dictLang"></select>
      </div>
      <div class="tip" id="tip"></div>
      <div class="row">
        <button class="b" id="gear">⚙️</button>
        <button class="b off" id="mic">🎤</button>
      </div>
    </div>`;
  const $ = (id) => root.getElementById(id);
  const micBtn = $('mic'), tip = $('tip'), panel = $('panel');
  (document.body ? Promise.resolve() : new Promise(r => addEventListener('DOMContentLoaded', r)))
    .then(() => document.body.appendChild(host));

  let tipTimer;
  function say(text, ms = 3000) {
    tip.textContent = text; tip.classList.add('show');
    clearTimeout(tipTimer);
    if (ms) tipTimer = setTimeout(() => tip.classList.remove('show'), ms);
  }

  // тексты
  micBtn.title = t.mic; $('gear').title = t.settings;
  $('pTitle').textContent = t.settings; $('lApp').textContent = t.appLang; $('lDict').textContent = t.dict;

  // язык приложения
  const appSel = $('appLang');
  appSel.add(new Option(t.system, 'system'));
  APP_LOCALES.map(c => [c, langName(c)]).sort((a, b) => a[1].localeCompare(b[1]))
    .forEach(([c, n]) => appSel.add(new Option(n, c)));
  appSel.value = appLocale();
  appSel.onchange = () => setAppLocale(appSel.value);

  // язык диктовки
  const dictSel = $('dictLang');
  const dictItems = DICT_LANGS.map(c => [c, langName(c)]).sort((a, b) => a[1].localeCompare(b[1]));
  dictItems.forEach(([c, n]) => dictSel.add(new Option(n, c)));
  function setDictLang(v, announce) {
    lang = v; store.set('lang', v);
    dictSel.value = v;
    if (announce) say(t.dictSet + langName(v));
    if (listening) { stopMic(); startMic(); }
  }
  dictSel.onchange = () => setDictLang(dictSel.value, true);

  $('gear').onclick = (e) => { e.stopPropagation(); panel.classList.toggle('show'); };
  document.addEventListener('click', (e) => { if (!e.composedPath().includes(host)) panel.classList.remove('show'); }, true);

  // ---------- поле ввода ----------
  function input() {
    const list = [...document.querySelectorAll('textarea')].filter(el => el.offsetParent);
    return document.querySelector('textarea#chat-input') || list[list.length - 1] || null;
  }
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
  function setText(v) {
    const ta = input(); if (!ta) return;
    valueSetter.call(ta, v);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function send() {
    const ta = input(); if (!ta || !ta.value.trim()) return;
    ta.focus();
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
    // запасной путь: кнопка отправки рядом с полем
    setTimeout(() => {
      if (!ta.value.trim()) return;
      let box = ta.parentElement;
      for (let i = 0; i < 6 && box; i++, box = box.parentElement) {
        const btns = [...box.querySelectorAll('[role="button"],button')].filter(b => b.offsetParent && !b.getAttribute('aria-disabled'));
        if (btns.length) { btns[btns.length - 1].click(); return; }
      }
    }, 400);
  }

  // микрофон нужен только в чате; ⚙ (настройки, язык приложения) — везде
  new MutationObserver(() => { micBtn.style.display = input() ? '' : 'none'; })
    .observe(document.documentElement, { childList: true, subtree: true });

  // ---------- распознавание ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, listening = false, base = '';
  setDictLang(lang, false);
  if (!SR) { micBtn.disabled = true; micBtn.title = t.noSR; return; }

  const CMD = [
    { re: /\s*(отправ(ить|ь|ляй)|отправка|надіслати|надішли|send( it)?|submit)[.!。]?\s*$/i, run: () => { stopMic(); setTimeout(send, 150); } },
    { re: /\s*(очисти(ть)?|сотри|стереть|очистити|clear( all)?|erase)[.!。]?\s*$/i, run: () => { base = ''; setText(''); } },
  ];
  const noSpaces = () => /^(zh|ja|th)/.test(lang);

  function startMic() {
    const ta = input();
    if (!ta) { say(t.noInput); return; }
    base = ta.value ? ta.value.replace(/\s*$/, noSpaces() ? '' : ' ') : '';
    rec = new SR();
    rec.lang = lang; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (ev) => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i], tr = r[0].transcript;
        if (!r.isFinal) { interim += tr; continue; }
        let txt = tr.trim(), cmd = null;
        for (const c of CMD) if (c.re.test(txt)) { cmd = c; txt = txt.replace(c.re, ''); break; }
        if (txt) {
          const sep = noSpaces() || !base || /\s$/.test(base) ? '' : ' ';
          base += sep + txt.charAt(0).toUpperCase() + txt.slice(1) + (noSpaces() ? '' : ' ');
        }
        setText(base.trimEnd());
        if (cmd) { cmd.run(); return; }
      }
      if (interim) setText((base + interim).trimEnd());
    };
    rec.onerror = (e) => {
      const msg = { 'not-allowed': t.notAllowed, 'service-not-allowed': t.notAllowed, 'audio-capture': t.noMic,
        'network': t.network, 'language-not-supported': t.langNS }[e.error];
      if (msg) { say(msg, 6000); stopMic(); }
    };
    rec.onend = () => { if (listening) { try { rec.start(); } catch { stopMic(); } } };
    try { rec.start(); } catch (e) { say(t.micFail + e.message, 6000); return; }
    listening = true;
    micBtn.classList.remove('off'); micBtn.classList.add('rec');
    say(`${langName(lang, uiLocale)}: ${t.listen}`, 4000);
  }
  function stopMic() {
    listening = false;
    if (rec) { try { rec.stop(); } catch {} rec = null; }
    micBtn.classList.remove('rec'); micBtn.classList.add('off');
  }
  const toggleMic = () => (listening ? stopMic() : startMic());
  micBtn.onclick = toggleMic;
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.code === 'Space') { e.preventDefault(); toggleMic(); }
  }, true);
})();
