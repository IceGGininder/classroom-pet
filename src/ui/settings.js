// src/ui/settings.js
// Alpine 組件：設定 Modal。寵物命名、階段門檻預設、重新校準、匯出匯入。

const PRESETS = {
  loose:    [0, 180, 480, 1080, 2100, 3600],
  standard: [0, 300, 800, 1800, 3500, 6000],
  strict:   [0, 450, 1200, 2700, 5250, 9000],
};

export function settingsModalComponent(deps) {
  return {
    open: false,
    petName: '',

    init() {
      this.petName = deps.getState().pet.name;
    },

    get thresholdDisplay() {
      return deps.getState().settings.stageThresholds.join(' / ');
    },

    savePetName() {
      deps.onRenamePet(this.petName);
    },

    applyPreset(preset) {
      deps.onApplyThresholdPreset(PRESETS[preset], preset);
    },

    recalibrate() {
      if (confirm('要花 10 秒重新校準，請先讓教室保持一般安靜。確定？')) {
        deps.onRecalibrate();
        this.open = false;
      }
    },

    doExport() {
      deps.onExport();
    },

    async doImport(ev) {
      const file = ev.target.files[0];
      if (!file) return;
      try {
        await deps.onImport(file);
        alert('匯入成功，頁面將重新整理');
        location.reload();
      } catch (e) {
        alert('匯入失敗：' + e.message);
      }
    },
  };
}
