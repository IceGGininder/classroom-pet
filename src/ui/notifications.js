// src/ui/notifications.js
// Alpine 組件 + helper：通知佇列管理。
// 升階、解鎖技能等事件透過 dispatch('pet-notify') 送進來，自動顯示 toast 4 秒。
// 呼叫端負責判斷靜音模式 (state.settings.isMuted)，靜音時不呼叫 notify()。

export function notificationsComponent() {
  return {
    toasts: [],

    init() {
      window.addEventListener('pet-notify', (e) => {
        const id = Date.now() + Math.random();
        this.toasts.push({ id, ...e.detail });
        setTimeout(() => {
          this.toasts = this.toasts.filter(t => t.id !== id);
        }, 4000);
      });
    },
  };
}

export function notify(title, message, type = 'info') {
  window.dispatchEvent(new CustomEvent('pet-notify', {
    detail: { title, message, type },
  }));
}
