// 섹터 색상 및 이모지 정의
// 배경색이 진하면 텍스트는 흰색, 밝으면 검은색으로 조정됨

export const sectorStyles = {
  "2차전지":     { emoji: "🔋", color: "#71e046" },
  "AI":          { emoji: "🤖", color: "#85b3d0" },
  "CBDC":        { emoji: "💱", color: "#3480ff" },
  "STO":         { emoji: "📈", color: "#ff5283" },
  "가스":         { emoji: "🛢️", color: "#868686" },
  "냉각":         { emoji: "❄️", color: "#88e8f0" },
  "남북경협":      { emoji: "🕊️", color: "#ee6565" },
  "드론":         { emoji: "🛸", color: "#6a7181" },
  "로봇":         { emoji: "🦾", color: "#818fc9" },
  "바이오":       { emoji: "🧬", color: "#28daff" },
  "반도체":       { emoji: "💾", color: "#ff9435" },
  "방산":         { emoji: "💣", color: "#ff2020" },
  "보안":         { emoji: "🔐", color: "#f26c97" },
  "비만치료제":    { emoji: "⚕️", color: "#50b9f6" },
  "스테이블 코인": { emoji: "🪙", color: "#d9b359" },
  "엔터":         { emoji: "🎤", color: "#3dff8b" },
  "유리기판":      { emoji: "🧊", color: "#7affde" },
  "에너지":       { emoji: "⚡", color: "#ffba76" },
  "유가":         { emoji: "🛢️", color: "#7c4f55" },
  "양자":         { emoji: "🔬", color: "#3cff00" },
  "우주항공":      { emoji: "🚀", color: "#9d8ff1" },
  "원전":         { emoji: "☢️", color: "#69ff20" },
  "지역화폐":      { emoji: "🏙️", color: "#6b917a" },
  "조선":         { emoji: "⛴️", color: "#6b79ff" },
  "전기전력":      { emoji: "🔌", color: "#fcff00" },
  "저출생":        { emoji: "👶", color: "#ff75d0" },
  "창투사":        { emoji: "🏢", color: "#00509f" },
  "철강":         { emoji: "🏗️", color: "#00509f" },
  "초전도체":      { emoji: "🧲", color: "#c6ccc9" },
  "코로나":        { emoji: "🦠", color: "#ad2e2e" },
  "탄소포집":      { emoji: "🌫️", color: "#87cde4" },
  "희토류":        { emoji: "🔋", color: "#8e8181" },
  "화장품":        { emoji: "💄", color: "#ff8092" },
  "해운":         { emoji: "🚢", color: "#ff8092" },
  "없음":         { emoji: "❓", color: "#cccccc" }
};

// 색이 어두운지 판단해서 텍스트 색상 정하기
export const getTextColor = (bgColor) => {
  if (!bgColor) return "#000";
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  return luminance < 160 ? "#fff" : "#000";
};

// 시간별 주도 섹터 설정 (기본은 '없음')
export const timeSectors = {
  "08:00": "없음",
  "09:00": "없음",
  "10:00": "없음",
  "11:00": "없음",
  "12:00": "없음",
  "13:00": "없음",
  "14:00": "없음",
  "15:00": "없음",
  "20:00": "없음"
};
