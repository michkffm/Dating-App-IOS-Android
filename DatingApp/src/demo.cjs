const profiles = Object.freeze([
  { id: "gina", name: "Gina", age: 24, color: "#FCE7F2", icon: "cafe-outline", interests: ["Brunch", "Fitness", "Wellness"], likesBack: true },
  { id: "alex", name: "Alex", age: 31, color: "#EDE4FF", icon: "trail-sign-outline", interests: ["Wandern", "Konzerte", "Kochen"], likesBack: false },
  { id: "sam", name: "Sam", age: 29, color: "#FFE9E3", icon: "musical-notes-outline", interests: ["Musik", "Segeln", "Fotografie"], likesBack: true }
]);
const known = new Set(profiles.map(({ id }) => id));
const empty = () => ({ nickname: "", decisions: {} });
const nickname = (value) => typeof value === "string" ? value.trim().slice(0, 24) : "";

function parseState(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return empty();
    const decisions = {};
    for (const { id } of profiles) {
      const value = data.decisions?.[id];
      if (value === "like" || value === "pass") decisions[id] = value;
    }
    return { nickname: nickname(data.nickname), decisions };
  } catch {
    return empty();
  }
}

function decide(state, id, action) {
  if (!known.has(id) || !["like", "pass"].includes(action) || state.decisions[id]) return state;
  return { ...state, decisions: { ...state.decisions, [id]: action } };
}

const matches = (state) => profiles.filter(({ id, likesBack }) => likesBack && state.decisions[id] === "like");
module.exports = { profiles, empty, nickname, parseState, decide, matches };
