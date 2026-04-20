// src/ui/petDisplay.js
// Alpine 組件：寵物視覺 + 背景 + 心情/階段 bar。

export function petDisplayComponent(deps) {
  // deps: { getMood, getVisualState, getStageInfo }
  return {
    mood: 60,
    visualState: 'calm',
    stageInfo: { currentStage: 'egg', progress: 0, nextStage: 'newborn', current: 0, needed: 300 },

    init() {
      setInterval(() => {
        this.mood = Math.round(deps.getMood());
        this.visualState = deps.getVisualState();
        this.stageInfo = deps.getStageInfo();
      }, 200);
    },

    get petEmoji() {
      return {
        egg: '🥚', newborn: '🐣', young: '🐥',
        growth: '🦊', advanced: '🦄', final: '✨',
      }[this.stageInfo.currentStage];
    },

    get stateIcon() {
      return { happy: '😄', calm: '🙂', worried: '😟', scared: '😱' }[this.visualState];
    },

    get bgClass() {
      return {
        happy:   'bg-gradient-to-b from-sky-200 to-sky-50',
        calm:    'bg-gradient-to-b from-slate-100 to-slate-50',
        worried: 'bg-gradient-to-b from-slate-300 to-slate-200',
        scared:  'bg-gradient-to-b from-slate-600 to-slate-800 text-white',
      }[this.visualState];
    },

    get petAnimationClass() {
      return {
        happy:   'animate-bounce',
        calm:    '',
        worried: 'opacity-60 translate-y-4',
        scared:  'opacity-20 translate-y-12',
      }[this.visualState];
    },
  };
}
