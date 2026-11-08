<script>
(function(){
  'use strict';

  var KEY = 'sujian.v1';
  var HELP_KEY = 'sujian_help_shown';
  var LANG_KEY = 'sujian_lang';
  var THEME_KEY = 'sujian_theme';
  var TEXT_COLOR_KEY = 'sujian_text_color';
  var $ = function(id){ return document.getElementById(id); };

  

  var currentLang = localStorage.getItem(LANG_KEY) || (navigator.language.startsWith('zh') ? 'zh' : 'en');
  var t = dict[currentLang];

  var app         = $('app');
  var noteList    = $('noteList');
  var editor      = $('editor');
  var preview     = $('preview');
  var noteMeta    = $('noteMeta');
  var noteCount   = $('noteCount');
  var modeBtn     = $('modeBtn');
  var fileInput   = $('fileInput');
  var searchInput = $('searchInput');
  var toggleBtn   = $('toggleSidebar');
  var mask        = $('sidebar-mask');
  var saveBtn     = $('saveBtn');
  var dlgHelp     = $('dlgHelp');
  var langBtn     = $('langBtn');
  var themeBtn    = $('themeBtn');
  var textColorBtn= $('textColorBtn');

  var notes = [];
  var currentId = null;
  var mode = 'edit';
  var query = '';
  var saveTimer = null;
  var saveBtnTimer = null;

  /* ---------- 主题与字色控制 ---------- */
  var currentTheme = localStorage.getItem(THEME_KEY) || 'dark';
  var currentTextColor = localStorage.getItem(TEXT_COLOR_KEY) || 'auto';

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark') themeBtn.textContent = t.themeDark;
    else if (currentTheme === 'light') themeBtn.textContent = t.themeLight;
    else themeBtn.textContent = t.themeGrid;
    applyTextColor();
  }

  function applyTextColor() {
    if (currentTextColor === 'black') {
      editor.style.color = '#000000';
      preview.style.color = '#000000';
      textColorBtn.textContent = t.colorBlack;
    } else if (currentTextColor === 'white') {
      editor.style.color = '#ffffff';
      preview.style.color = '#ffffff';
      textColorBtn.textContent = t.colorWhite;
    } else {
      editor.style.color = 'var(--text)';
      preview.style.color = 'var(--text)';
      textColorBtn.textContent = t.colorAuto;
    }
  }

  themeBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (currentTheme === 'dark') currentTheme = 'light';
    else if (currentTheme === 'light') currentTheme = 'grid';
    else currentTheme = 'dark';
    localStorage.setItem(THEME_KEY, currentTheme);
    applyTheme();
  });

  textColorBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (currentTextColor === 'auto') currentTextColor = 'black';
    else if (currentTextColor === 'black') currentTextColor = 'white';
    else currentTextColor = 'auto';
    localStorage.setItem(TEXT_COLOR_KEY, currentTextColor);
    applyTextColor();
  });

  /* ---------- 语言切换功能 ---------- */
  function applyLanguage() {
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
    document.title = t.title;
    t = dict[currentLang];

    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      el.innerHTML = t[el.dataset.i18n] || el.innerHTML;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
      el.title = t[el.dataset.i18nTitle] || '';
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      el.placeholder = t[el.dataset.i18nPlaceholder] || '';
    });

    langBtn.textContent = currentLang === 'zh' ? 'EN' : '中';
    modeBtn.textContent = (mode === 'edit') ? t.preview : t.edit;
    if (saveBtn.textContent === '已保存' || saveBtn.textContent === 'Saved') {
      saveBtn.textContent = t.saved;
    } else {
      saveBtn.textContent = t.save;
    }

    applyTheme(); // 更新主题按钮文字
    renderList();
    var n = getNote(currentId);
    updateMeta(n);
    if (mode === 'preview') renderPreview();
  }

  langBtn.addEventListener('click', function(e) {
    e.preventDefault();
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    localStorage.setItem(LANG_KEY, currentLang);
    applyLanguage();
  });

  /* ---------- 工具 ---------- */

  function uid(){
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function esc(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  var URL_RE = /(https?:\/\/[^\s<>"'，。；：！？、（）【】《》「」]+|www\.[^\s<>"'，。；：！？、（）【】《》「」]+)/g;

  function linkify(text){
    var out = '', last = 0, m;
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(text)) !== null){
      out += esc(text.slice(last, m.index));
      var url = m[1], tail = '';
      var tm = url.match(/[.,;:!?)\]}>]+$/);
      if (tm){ tail = tm[0]; url = url.slice(0, -tail.length); }
      var href = /^https?:\/\//i.test(url) ? url : 'http://' + url;
      out += '<a href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' + esc(url) + '</a>';
      out += esc(tail);
      last = m.index + m[0].length;
    }
    out += esc(text.slice(last));
    return out;
  }

  function fmtDate(ts){
    var d = new Date(ts);
    var p = function(x){ return String(x).padStart(2,'0'); };
    if (currentLang === 'zh') {
      return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    } else {
      var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    }
  }

  function stamp(){
    var d = new Date(), p = function(x){ return String(x).padStart(2,'0'); };
    return d.getFullYear() + p(d.getMonth()+1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes());
  }

  function baseName(n){
    var d = new Date(n.createdAt), p = function(x){ return String(x).padStart(2,'0'); };
    return 'Sujian_' + d.getFullYear() + p(d.getMonth()+1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes());
  }

  function titleOf(n){
    var first = n.content.split('\n').map(function(s){ return s.trim(); }).filter(Boolean)[0];
    if (!first) return t.emptyNote;
    return first.length > 26 ? first.slice(0, 26) + '…' : first;
  }

  function getNote(id){
    for (var i = 0; i < notes.length; i++) if (notes[i].id === id) return notes[i];
    return null;
  }

  function download(blob, filename){
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------- 存储 ---------- */

  function load(){
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      var arr = Array.isArray(data) ? data : (data && data.notes);
      if (!Array.isArray(arr)) return [];
      return arr.filter(function(n){ return n && typeof n.content === 'string'; })
                .map(function(n){
                  return {
                    id: n.id || uid(),
                    content: n.content,
                    createdAt: Number(n.createdAt) || Date.now(),
                    updatedAt: Number(n.updatedAt) || Date.now()
                  };
                });
    } catch(e){ return []; }
  }

  function persist(){
    try { localStorage.setItem(KEY, JSON.stringify(notes)); }
    catch(e){ console.warn('Save failed', e); }
  }

  function flush(){
    if (saveTimer){ clearTimeout(saveTimer); saveTimer = null; }
    persist();
  }

  function manualSave() {
    flush();
    saveBtn.textContent = t.saved;
    saveBtn.style.color = 'var(--accent)';
    saveBtn.style.textShadow = '0 0 8px var(--glow)';
    
    if (saveBtnTimer) clearTimeout(saveBtnTimer);
    saveBtnTimer = setTimeout(function() {
      saveBtn.textContent = t.save;
      saveBtn.style.color = 'var(--text)';
      saveBtn.style.textShadow = 'none';
    }, 1500);
  }

  /* ---------- 渲染 ---------- */

  function filteredNotes(){
    var q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(function(n){
      return n.content.toLowerCase().indexOf(q) !== -1;
    });
  }

  function createLi(n){
    var li = document.createElement('li');
    li.dataset.id = n.id;
    var tDiv = document.createElement('div');
    tDiv.className = 'li-title';
    tDiv.textContent = titleOf(n);
    var dDiv = document.createElement('div');
    dDiv.className = 'li-date';
    dDiv.textContent = fmtDate(n.createdAt);
    li.appendChild(tDiv); li.appendChild(dDiv);
    li.addEventListener('click', function(){ selectNote(n.id); });
    return li;
  }

  function renderList(){
    var list = filteredNotes();
    noteList.innerHTML = '';

    if (!list.length){
      var hint = document.createElement('li');
      hint.className = 'empty-hint';
      hint.textContent = query ? t.noMatch : t.noNotes;
      noteList.appendChild(hint);
    } else {
      list.forEach(function(n){ noteList.appendChild(createLi(n)); });
    }

    noteCount.textContent = query
      ? list.length + '/' + notes.length
      : (notes.length ? notes.length + t.noteUnit : '');
    updateActive();
  }

  function updateActive(){
    var lis = noteList.children;
    for (var i = 0; i < lis.length; i++){
      lis[i].classList.toggle('active', lis[i].dataset.id === currentId);
    }
  }

  function updateMeta(n){
    noteMeta.textContent = n
      ? fmtDate(n.createdAt) + ' · ' + n.content.length + t.charUnit
      : '';
  }

  function updateListItem(n){
    var li = noteList.querySelector('li[data-id="' + n.id + '"]');
    if (!li) return;
    var tDiv = li.querySelector('.li-title');
    if (tDiv) tDiv.textContent = titleOf(n);
  }

  function renderPreview(){
    var n = getNote(currentId);
    preview.innerHTML = (n && n.content)
      ? linkify(n.content)
      : '<span class="empty">' + t.emptyPreview + '</span>';
  }

  function setMode(m){
    mode = m;
    editor.classList.toggle('hidden', m === 'preview');
    preview.classList.toggle('hidden', m === 'edit');
    modeBtn.textContent = (m === 'edit') ? t.preview : t.edit;
    if (m === 'preview') renderPreview();
    else editor.focus();
  }

  /* ---------- 笔记操作 ---------- */

  function selectNote(id){
    if (id === currentId) {
      closeMobileSidebar();
      return;
    }
    flush();
    currentId = id;
    var n = getNote(id);
    editor.value = n ? n.content : '';
    updateActive();
    updateMeta(n);
    if (mode === 'preview') renderPreview();
    
    closeMobileSidebar();
    editor.focus();
  }

  function newNote(){
    flush();
    var cur = getNote(currentId);
    if (cur && cur.content.trim() === ''){ 
      closeMobileSidebar();
      setMode('edit'); 
      return; 
    }

    query = '';
    searchInput.value = '';

    var n = { id: uid(), content: '', createdAt: Date.now(), updatedAt: Date.now() };
    notes.unshift(n);
    currentId = n.id;
    editor.value = '';
    renderList();
    updateMeta(n);
    setMode('edit');
    persist();
    closeMobileSidebar();
  }

  function deleteNote(){
    var n = getNote(currentId);
    if (!n) return;
    if (!confirm(t.delConfirm)) return;

    var idx = notes.indexOf(n);
    notes.splice(idx, 1);

    if (notes.length === 0){
      notes.push({ id: uid(), content: '', createdAt: Date.now(), updatedAt: Date.now() });
      currentId = notes[0].id;
    } else {
      currentId = notes[Math.min(idx, notes.length - 1)].id;
    }

    editor.value = getNote(currentId).content;
    renderList();
    updateMeta(getNote(currentId));
    setMode('edit');
    persist();
  }

  /* ---------- 导出 ---------- */

  function exportTxt(){
    var n = getNote(currentId);
    if (!n) return;
    download(new Blob([n.content], {type:'text/plain;charset=utf-8'}), baseName(n) + '.txt');
  }

  function exportDoc(){
    var n = getNote(currentId);
    if (!n) return;
    var body = linkify(n.content).replace(/\n/g, '<br>');
    var html =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:w="urn:schemas-microsoft-com:office:word" ' +
      'xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8">' +
      '<title>' + esc(titleOf(n)) + '</title>' +
      '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>' +
      '</w:WordDocument></xml><![endif]--></head>' +
      '<body style="font-family:Arial,sans-serif;font-size:12pt;line-height:1.8;">' +
      body + '</body></html>';
    download(new Blob(['\ufeff', html], {type:'application/msword;charset=utf-8'}), baseName(n) + '.doc');
  }

  function exportJson(){
    flush();
    var data = { app: 'sujian', version: 1, exportedAt: new Date().toISOString(), notes: notes };
    download(
      new Blob([JSON.stringify(data, null, 2)], {type:'application/json;charset=utf-8'}),
      t.backupPrefix + stamp() + '.json'
    );
  }

  /* ---------- 导入 ---------- */

  function importJson(file){
    var reader = new FileReader();
    reader.onload = function(){
      try {
        var data = JSON.parse(reader.result);
        var arr = Array.isArray(data) ? data : (data && data.notes);
        if (!Array.isArray(arr)) throw new Error(t.importErrValid);

        var clean = arr.filter(function(n){ return n && typeof n.content === 'string'; })
                       .map(function(n){
                         return {
                           id: n.id || uid(),
                           content: n.content,
                           createdAt: Number(n.createdAt) || Date.now(),
                           updatedAt: Number(n.updatedAt) || Date.now()
                         };
                       });

        if (!clean.length) throw new Error(t.importErrEmpty);
        if (!confirm(t.importConfirm.replace('{n}', clean.length))) return;

        flush();
        var map = {};
        notes.forEach(function(n){ map[n.id] = n; });
        clean.forEach(function(n){
          var old = map[n.id];
          if (!old || n.updatedAt > old.updatedAt) map[n.id] = n;
        });
        notes = Object.keys(map).map(function(k){ return map[k]; })
                    .sort(function(a,b){ return b.createdAt - a.createdAt; });

        currentId = notes[0].id;
        editor.value = notes[0].content;
        renderList();
        updateMeta(notes[0]);
        setMode('edit');
        persist();
        alert(t.importSuccess.replace('{n}', notes.length));
      } catch(err){
        alert(t.importErrTitle + err.message);
      }
    };
    reader.onerror = function(){ alert(t.importErrRead); };
    reader.readAsText(file, 'utf-8');
  }

  /* ---------- 侧栏控制 ---------- */

  function isMobile() {
    return window.innerWidth <= 768;
  }

  function closeMobileSidebar() {
    if (isMobile()) {
      app.classList.remove('mobile-open');
    }
  }

  function toggleSidebar(e) {
    if (e) e.preventDefault();
    if (isMobile()) {
      app.classList.toggle('mobile-open');
    } else {
      app.classList.toggle('collapsed');
    }
  }

  /* ---------- 事件绑定 ---------- */

  toggleBtn.addEventListener('click', toggleSidebar);
  mask.addEventListener('click', closeMobileSidebar);

  saveBtn.addEventListener('click', function(e) {
    e.preventDefault();
    manualSave();
  });

  editor.addEventListener('input', function(){
    var n = getNote(currentId);
    if (!n) return;
    n.content = editor.value;
    n.updatedAt = Date.now();
    updateListItem(n);
    updateMeta(n);
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){ saveTimer = null; persist(); }, 400);
  });

  searchInput.addEventListener('input', function(){
    query = searchInput.value;
    renderList();
  });

  $('newBtn').addEventListener('click', function(e){ e.preventDefault(); newNote(); });

  modeBtn.addEventListener('click', function(e){
    e.preventDefault();
    setMode(mode === 'edit' ? 'preview' : 'edit');
  });

  $('delBtn').addEventListener('click', function(e){ e.preventDefault(); deleteNote(); });

  document.querySelectorAll('[data-act]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      var act = a.dataset.act;
      if (act === 'txt') exportTxt();
      else if (act === 'doc') exportDoc();
      else if (act === 'json') exportJson();
      else if (act === 'import') fileInput.click();
    });
  });

  fileInput.addEventListener('change', function(e){
    var f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (f) importJson(f);
  });

  $('helpBtn').addEventListener('click', function(e) {
    e.preventDefault();
    dlgHelp.showModal();
  });

  $('closeHelp').addEventListener('click', function(e) {
    e.preventDefault();
    dlgHelp.close();
  });

  /* ---------- 全局快捷键监听 ---------- */
  document.addEventListener('keydown', function(e){
    var isCmdOrCtrl = e.metaKey || e.ctrlKey;

    if (isCmdOrCtrl) {
      switch(e.key.toLowerCase()) {
        case 's': e.preventDefault(); manualSave(); break;
        case 'n': e.preventDefault(); newNote(); break;
        case 'f': e.preventDefault(); searchInput.focus(); break;
        case 'e': e.preventDefault(); setMode(mode === 'edit' ? 'preview' : 'edit'); break;
        case 'b': e.preventDefault(); toggleSidebar(); break;
      }
    } else if (e.key === 'Escape') {
      if (dlgHelp.open) return;
      
      if (document.activeElement === searchInput) {
        searchInput.value = '';
        searchInput.blur();
        query = '';
        renderList();
      } else if (mode === 'preview') {
        setMode('edit');
      }
    }
  });

  window.addEventListener('beforeunload', flush);
  
  window.addEventListener('resize', function(){
    if(!isMobile()){
      app.classList.remove('mobile-open');
    }
  });

  /* ---------- 启动 ---------- */
  
  notes = load().sort(function(a,b){ return b.createdAt - a.createdAt; });
  if (!notes.length){
    notes.push({ id: uid(), content: '', createdAt: Date.now(), updatedAt: Date.now() });
  }
  currentId = notes[0].id;
  editor.value = notes[0].content;

  applyLanguage(); // 内部会调用 applyTheme 和 applyTextColor

  if (!isMobile() && !localStorage.getItem(HELP_KEY)) {
    dlgHelp.showModal();
    localStorage.setItem(HELP_KEY, 'true');
  }

})();
</script>
</body>
</html>
