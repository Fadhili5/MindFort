/** Sample topics for hackathon demo. */
export interface Topic {
  id: string;
  subject: string;
  name: string;
  description: string;
  sampleQuestions: { question: string; answer: string }[];
}

export const DEMO_TOPICS: Topic[] = [
  {
    id: "quadratic_factoring",
    subject: "mathematics",
    name: "Quadratic Factoring",
    description: "Factor quadratic expressions of the form ax² + bx + c",
    sampleQuestions: [
      { question: "Factor: x² + 5x + 6", answer: "(x + 2)(x + 3)" },
      { question: "Factor: x² - 7x + 12", answer: "(x - 3)(x - 4)" },
      { question: "Factor: x² + x - 12", answer: "(x + 4)(x - 3)" },
      { question: "Factor: x² - 9", answer: "(x + 3)(x - 3)" },
    ],
  },
  {
    id: "fractions_addition",
    subject: "mathematics",
    name: "Adding Fractions",
    description: "Add fractions with different denominators",
    sampleQuestions: [
      { question: "Calculate: 1/3 + 1/4", answer: "7/12" },
      { question: "Calculate: 2/5 + 1/3", answer: "11/15" },
      { question: "Calculate: 3/8 + 1/4", answer: "5/8" },
    ],
  },
  {
    id: "photosynthesis",
    subject: "science",
    name: "Photosynthesis",
    description: "Understand the process of photosynthesis in plants",
    sampleQuestions: [
      { question: "What gas do plants absorb during photosynthesis?", answer: "carbon dioxide" },
      { question: "What is the primary pigment in photosynthesis?", answer: "chlorophyll" },
      { question: "Where in the cell does photosynthesis occur?", answer: "chloroplast" },
    ],
  },
];
