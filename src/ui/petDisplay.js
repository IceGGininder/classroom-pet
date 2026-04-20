// src/ui/petDisplay.js
// Alpine 組件：寵物視覺 + 心情資訊。
// 改用 AI 生成的 PNG 場景圖（6 階段 × 4 心情 = 24 張），表情 + 背景都包在圖裡。

export function petDisplayComponent(deps) {
  return {
    mood: 60,
    visualState: 'calm',
    stageInfo: {
      currentStage: 'egg',
      progress: 0,
      nextStage: 'newborn',
      current: 0,
      needed: 300,
    },

    init() {
      this.refresh();
      setInterval(() => this.refresh(), 200);
      this.preloadImages();
    },

    refresh() {
      this.mood = Math.round(deps.getMood());
      this.visualState = deps.getVisualState();
      this.stageInfo = deps.getStageInfo();
    },

    preloadImages() {
      // 預載全部 24 張避免切換時閃爍
      const stages = ['egg', 'newborn', 'young', 'growth', 'advanced', 'final'];
      const moods = ['happy', 'calm', 'worried', 'scared'];
      for (const s of stages) {
        for (const m of moods) {
          const img = new Image();
          img.src = `./assets/pets/${s}_${m}.png`;
        }
      }
    },

    get petImageUrl() {
      return `./assets/pets/${this.stageInfo.currentStage}_${this.visualState}.png`;
    },

    get stateText() {
      return {
        happy:   '開心',
        calm:    '平靜',
        worried: '擔心',
        scared:  '害怕',
      }[this.visualState] ?? '';
    },

    get petAnimationClass() {
      return {
        happy:   'animate-bounce',
        calm:    '',
        worried: 'opacity-80',
        scared:  'opacity-90',
      }[this.visualState];
    },
  };
}
