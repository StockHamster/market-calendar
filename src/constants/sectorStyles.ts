// 섹터 색상 및 이모지 정의
// 배경색이 진하면 텍스트는 흰색, 밝으면 검은색으로 조정됨

export const sectorStyles: {
  [key: string]: { emoji: string; color: string };
} = {
  "섹터":         { emoji: "　", color: "#ffffff" },
  "2차전지":      { emoji: "🔋", color: "#71e046" },
  "5G":          { emoji: "📶", color: "#258441" },
  "AI":          { emoji: "🤖", color: "#85b3d0" },
  "CBDC":        { emoji: "💱", color: "#3480ff" },
  "LNG":         { emoji: "⛽", color: "#37a1ff" },
  "STO":         { emoji: "📈", color: "#ff5283" },
  "가상화폐":      { emoji: "🪙", color: "#FFD700" },
  "가스":         { emoji: "🛢️", color: "#868686" },
  "건설":         { emoji: "🏗️", color: "#8f3a26" },
  "게임":         { emoji: "🎮", color: "#ef2f61" },
  "관세수혜":      { emoji: "📦", color: "#7869ff" },
  "남북경협":      { emoji: "🕊️", color: "#ee6565" },
  "냉각":         { emoji: "❄️", color: "#88e8f0" },
  "드론":         { emoji: "🛸", color: "#6a7181" },
  "로봇":         { emoji: "🦾", color: "#818fc9" },
  "리튬":         { emoji: "🔋", color: "#646458" },
  "물류":         { emoji: "📦", color: "#c3965d" },
  "바이오":       { emoji: "🧬", color: "#28daff" },
  "반도체":       { emoji: "💾", color: "#ff9435" },
  "방산":         { emoji: "💣", color: "#ff2020" },
  "보안":         { emoji: "🔐", color: "#f26c97" },
  "보험":         { emoji: "🛡️", color: "#003366" },
  "비만치료제":    { emoji: "⚕️", color: "#50b9f6" },
  "비철금속":      { emoji: "🔩", color: "#808080" },
  "상법개정":      { emoji: "⚖️", color: "#0d03cc" },
  "석유화학":      { emoji: "🏭", color: "#736464" },
  "수소차":        { emoji: "💧", color: "#00B0F0" },
  "스테이블 코인": { emoji: "🤑", color: "#d9b359" },
  "신규주":       { emoji: "🆕", color: "#caff63" },
  "양자":         { emoji: "🔬", color: "#3cff00" },
  "에너지":       { emoji: "⚡", color: "#ffba76" },
  "엔터":         { emoji: "🎤", color: "#3dff8b" },
  "여행":         { emoji: "🗺️", color: "#50bcdf" },
  "영상·컨텐츠":   { emoji: "🎬", color: "#7E57C2" },
  "오염수":       { emoji: "🌊", color: "#488bae" },
  "우주항공":      { emoji: "🚀", color: "#9d8ff1" },
  "유가":         { emoji: "🛢️", color: "#7c4f55" },
  "유리기판":      { emoji: "🧊", color: "#7affde" },
  "원전":         { emoji: "☢️", color: "#69ff20" },
  "웹툰":         { emoji: "📖", color: "#668af2" },
  "음식료":        { emoji: "🍽️", color: "#ffd220" },
  "의료AI":        { emoji: "🩺", color: "#88accc" },
  "의류":          { emoji: "👕", color: "#d949bc" },
  "이재명":        { emoji: "🧓", color: "#0D33B3" },
  "자동차":        { emoji: "🚗", color: "#4f66ca" },
  "자율주행":      { emoji: "🚘", color: "#49caca" },
  "재건":         { emoji: "🧱", color: "#ff5614" },
  "저출생":        { emoji: "👶", color: "#ff75d0" },
  "전기전력":      { emoji: "🔌", color: "#fcff00" },
  "정책":         { emoji: "📜", color: "#2faaaf" },
  "제약":         { emoji: "💊", color: "#21ff21" },
  "조선":         { emoji: "⛴️", color: "#6b79ff" },
  "증권":         { emoji: "📈", color: "#1832f8" },
  "지역화폐":      { emoji: "🏙️", color: "#6b917a" },
  "지주사":        { emoji: "📊", color: "#4a7a8d" },
  "창투사":        { emoji: "🏢", color: "#00509f" },
  "철강":         { emoji: "🏗️", color: "#00509f" },
  "철도":         { emoji: "🚆", color: "#686c74" },
  "초전도체":      { emoji: "🧲", color: "#c6ccc9" },
  "코로나":        { emoji: "🦠", color: "#ad2e2e" },
  "탄소포집":      { emoji: "🌫️", color: "#87cde4" },
  "탈플라스틱":    { emoji: "🌿", color: "#39e75e" },
  "태양광":       { emoji: "🌞", color: "#ffb644" },
  "토스":         { emoji: "💸", color: "#1956f0" },
  "폭염":         { emoji: "🥵", color: "#EE0000" },
  "풍력":         { emoji: "🌬️", color: "#55b1e1" },
  "항공":         { emoji: "✈️", color: "#003366" },
  "해운":         { emoji: "🚢", color: "#ff8092" },
  "휴대폰부품":    { emoji: "📱", color: "#455A64" },
  "희토류":        { emoji: "🔋", color: "#8e8181" },
  "화장품":        { emoji: "💄", color: "#ff8092" }
};

// 색이 어두운지 판단해서 텍스트 색상 정하기
export function getTextColor(bgColor: string): "white" | "black" {
  if (!bgColor.startsWith("#") || bgColor.length !== 7) return "black";
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  return luminance > 140 ? "black" : "white";
}

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
