// src/ui/controls.js
// Alpine 組件：老師控制面板。模式切換、微調、暫停、靜音、重置本節。

export function controlsComponent(deps) {
  // deps: { getState, onModeChange, onAdjust, onPause, onResume, onResetSession, onToggleMute }
  return {
    currentMode: 'focus',
    isPaused: false,
    isMuted: false,
    currentAdjustment: 0,

    init() {
      const s = deps.getState();
      this.currentMode = s.settings.currentMode;
      this.isPaused = s.settings.isPaused;
      this.isMuted = s.settings.isMuted;
      this.currentAdjustment = s.settings.modes[this.currentMode].adjustment;
    },

    setMode(mode) {
      this.currentMode = mode;
      this.currentAdjustment = deps.getState().settings.modes[mode].adjustment;
      deps.onModeChange(mode);
    },

    adjust(delta) {
      this.currentAdjustment += delta;
      deps.onAdjust(this.currentMode, this.currentAdjustment);
    },

    togglePause() {
      this.isPaused = !this.isPaused;
      this.isPaused ? deps.onPause() : deps.onResume();
    },

    toggleMute() {
      this.isMuted = !this.isMuted;
      deps.onToggleMute(this.isMuted);
    },

    resetSession() {
      if (confirm('重置本節心情值？')) deps.onResetSession();
    },
  };
}
