const adjectives = ["Swift", "Calm", "Bold", "Keen", "Wise", "Bright", "Quick", "Sharp"];
const nouns = ["Falcon", "River", "Stone", "Storm", "Ember", "Frost", "Wave", "Peak"];

export const generateUsername = (): string => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}${noun}${num}`;
};

export const getStoredUsername = (): string => {
  const stored = localStorage.getItem("collab-editor-username");
  if (stored) return stored;
  const generated = generateUsername();
  localStorage.setItem("collab-editor-username", generated);
  return generated;
};

export const setStoredUsername = (username: string): void => {
  localStorage.setItem("collab-editor-username", username);
};
