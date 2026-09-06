export function selectJapaneseVoice(voices: readonly SpeechSynthesisVoice[]) {
  const japaneseVoices = voices.filter((voice) => normalizeLanguage(voice.lang).startsWith("ja"));

  return japaneseVoices.find((voice) => normalizeLanguage(voice.lang) === "ja-jp" && voice.localService)
    ?? japaneseVoices.find((voice) => normalizeLanguage(voice.lang) === "ja-jp")
    ?? japaneseVoices.find((voice) => voice.localService)
    ?? japaneseVoices[0]
    ?? null;
}

function normalizeLanguage(language: string) {
  return language.trim().toLowerCase().replaceAll("_", "-");
}
