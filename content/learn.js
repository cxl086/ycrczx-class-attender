(function () {
  function isCourseLearnPage() {
    return /\/video\/courseLearnPage/.test(location.pathname);
  }

  function tryClickPlay() {
    // 优先使用给出的选择器
    const btn = document.querySelector('.vjs-big-play-button');
    if (btn) {
      btn.click();
      return true;
    }
    // 可能页面延迟渲染，继续返回 false
    return false;
  }

  async function forcePlayVideo() {
    const video = document.querySelector('video');
    if (!video) return false;
    try {
      // 设置静音，避免未授权播放被拦截
      video.muted = true;
      video.volume = 0;
      // 保证播放速度和暂停状态
      video.playbackRate = 1;
      await video.play();
      return true;
    } catch (e) {
      // 若自动播放被策略拦截，继续依赖按钮点击循环
      return false;
    }
  }

  function muteTab() {
    try {
      chrome.runtime.sendMessage({ type: 'MUTE_ACTIVE_TAB' });
    } catch (_) {
      // ignore
    }
    // 同时静音页面内所有 video，双保险
    document.querySelectorAll('video').forEach(v => {
      try { v.muted = true; v.volume = 0; } catch (_) {}
    });
  }

  function waitForPlayButtonAndPlay(timeoutMs = 15000) {
    const start = Date.now();
    const timer = setInterval(async () => {
      const clicked = tryClickPlay();
      const played = await forcePlayVideo();
      if (clicked || played || Date.now() - start > timeoutMs) {
        clearInterval(timer);
      }
    }, 600);
  }

  function autoProceedNextOnEnded() {
    const video = document.querySelector('video');
    if (!video) return;
    video.addEventListener('ended', () => {
      // 页面可能有“下一节/下一集”按钮，尝试点击
      const nextSelectors = [
        'a.next',
        'button.next',
        'a[aria-label*="下一"], button[aria-label*="下一"]'
      ];
      for (const sel of nextSelectors) {
        const el = document.querySelector(sel);
        if (el) { el.click(); return; }
      }
      // 回退：遍历所有 a/button，基于文本匹配“下一”
      const candidates = Array.from(document.querySelectorAll('a, button'));
      for (const el of candidates) {
        const text = (el.textContent || '').trim();
        if (text.includes('下一')) { el.click(); return; }
      }
      // 若没有明确“下一节”，可根据站点结构扩展：点击目录中下一个未学项
    });
  }

  function init() {
    if (!isCourseLearnPage()) return;
    // 静音
    muteTab();
    // 自动播放
    waitForPlayButtonAndPlay();
    // 进度保活：若卡住不动，周期性强制 play
    setInterval(() => { forcePlayVideo(); }, 5000);
    // 自动下一节（尽量）
    autoProceedNextOnEnded();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


