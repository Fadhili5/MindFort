export { createMasteryRecord, applyReview, isDue, computeMasteryScore } from "./sm2.js";
export { classifyAnswer, levenshteinSimilarity } from "./classifier.js";
export type { ClassifierInput, ClassifierResult } from "./classifier.js";
export { selectScaffolding, shouldReduceScaffolding } from "./scaffolding.js";
export { selectNextTopic, buildInterleavedQueue } from "./scheduler.js";
