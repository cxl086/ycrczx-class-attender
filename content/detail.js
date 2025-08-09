(function () {
  function isCourseDetailPage() {
    return /\/zzpx\/courseDetail\/(\d+)/.test(location.pathname);
  }

  function ensureButton() {
    if (document.getElementById('class-attender-batch-play')) return;

    const btn = document.createElement('button');
    btn.id = 'class-attender-batch-play';
    btn.textContent = '批量播放';
    Object.assign(btn.style, {
      position: 'fixed',
      right: '16px',
      bottom: '24px',
      zIndex: '2147483647',
      padding: '10px 14px',
      background: '#1677ff',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    });
    btn.addEventListener('click', onBatchPlayClick);
    document.body.appendChild(btn);
  }

  async function onBatchPlayClick() {
    // 优先按你的要求点击 .section
    const sections = Array.from(document.querySelectorAll('.section'));
    if (sections.length > 0) {
      for (let i = 0; i < sections.length; i += 1) {
        const el = sections[i];
        try { el.click(); } catch (_) {}
        // 节流，减少弹窗拦截概率
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 250));
      }
      return;
    }

    // 回退：逐个打开播放链接（在新窗口中打开，而不是新标签）
    const links = Array.from(document.querySelectorAll('a[href*="/video/courseLearnPage"], a[href*="courseLearnPage?"]'));
    if (links.length === 0) {
      alert('未找到课时入口（.section 或播放链接）。');
      return;
    }
    for (let i = 0; i < links.length; i += 1) {
      const href = links[i].href;
      try {
        chrome.runtime.sendMessage({ type: 'OPEN_URL_IN_WINDOW', url: href });
      } catch (_) {
        // 回退：仍用新标签页
        try { window.open(href, '_blank'); } catch (__) {}
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 400));
    }
  }

  function init() {
    if (!isCourseDetailPage()) return;
    ensureButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


