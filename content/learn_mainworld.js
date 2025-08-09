(function () {
  // 在页面主世界执行，避免内联脚本 CSP 限制：通过 content_scripts world: MAIN 注入
  try {
    const define = (obj, key, getter) => {
      try { Object.defineProperty(obj, key, { get: getter, configurable: true }); } catch (_) {}
    };
    // 伪装可见性/焦点
    define(document, 'hidden', () => false);
    define(Document.prototype || {}, 'hidden', () => false);
    define(document, 'visibilityState', () => 'visible');
    define(Document.prototype || {}, 'visibilityState', () => 'visible');
    define(document, 'webkitHidden', () => false);
    define(document, 'mozHidden', () => false);
    try { document.hasFocus = () => true; } catch (_) {}

    // 阻断可见性相关事件注册
    const blockedEvents = new Set(['visibilitychange','webkitvisibilitychange','blur','pagehide','freeze']);
    const origAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      try { if (blockedEvents.has(String(type))) return; } catch (_) {}
      return origAddEventListener.call(this, type, listener, options);
    };
    const stop = (e) => { try { e.stopImmediatePropagation(); } catch (_) {} };
    blockedEvents.forEach((t) => {
      try { window.addEventListener(t, stop, true); } catch (_) {}
      try { document.addEventListener(t, stop, true); } catch (_) {}
    });
    try { Object.defineProperty(document, 'onvisibilitychange', { set() {}, get() { return null; } }); } catch (_) {}

    // 劫持 HTMLMediaElement.prototype.pause，阻止被动暂停
    try {
      const proto = HTMLMediaElement.prototype;
      const _pause = proto.pause;
      Object.defineProperty(proto, 'pause', {
        value: function () {
          try {
            if (this && this.tagName === 'VIDEO') {
              this.muted = true;
              try { this.play(); } catch (_) {}
              return;
            }
          } catch (_) {}
          return _pause.apply(this, arguments);
        },
        configurable: true
      });
    } catch (_) {}

    // 主动派发前台事件
    const fire = (type) => {
      try {
        document.dispatchEvent(new Event(type));
        window.dispatchEvent(new Event(type));
      } catch (_) {}
    };
    const burst = () => {
      ['visibilitychange','webkitvisibilitychange','focus','pageshow'].forEach(fire);
    };
    setTimeout(burst, 300);
    setTimeout(burst, 1000);
    setInterval(burst, 10000);

    // 捕获暂停事件，立即恢复
    document.addEventListener('pause', (e) => {
      try {
        const v = e.target;
        if (v && v.tagName === 'VIDEO') {
          v.muted = true;
          v.play().catch(() => {});
        }
      } catch (_) {}
    }, true);
  } catch (e) {
    // ignore
  }
})();


