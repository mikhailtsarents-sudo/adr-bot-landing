const QUESTION_SCENARIO_POOL = [
  {
    id: "scenario_license",
    question_text: "Where is your driver's license?",
    answer_options: [
      "I forgot it at home",
      "Here in my hand",
      "The company keeps it",
      "You do not need it",
    ],
    correct_answer: "Here in my hand",
    simple_explanation: "The driver must be able to present the license immediately during a roadside check.",
    category: "driver_license_check",
    topic_tags: ["license", "inspection"],
  },
  {
    id: "scenario_cargo",
    question_text: "What are you transporting?",
    answer_options: [
      "I am not sure",
      "Dangerous goods with documents",
      "Only empty boxes",
      "Nothing important",
    ],
    correct_answer: "Dangerous goods with documents",
    simple_explanation: "The load and documents must match what the driver declares during inspection.",
    category: "cargo_declaration",
    topic_tags: ["cargo", "declaration"],
  },
  {
    id: "scenario_stop_reason",
    question_text: "Why did you stop here?",
    answer_options: [
      "For a routine inspection",
      "Because I was lost",
      "To avoid a fine",
      "I do not know",
    ],
    correct_answer: "For a routine inspection",
    simple_explanation: "A controlled stop should read as a normal inspection moment, not random confusion.",
    category: "stop_reason",
    topic_tags: ["roadside-stop", "inspection"],
  },
  {
    id: "scenario_passed_inspection",
    question_text: "Have you passed inspection?",
    answer_options: [
      "Not yet, you are still checking",
      "Yes, it finished yesterday",
      "I pass automatically",
      "Inspection is optional",
    ],
    correct_answer: "Not yet, you are still checking",
    simple_explanation: "During the active interaction the inspection is still in progress until the officer releases the driver.",
    category: "inspection_status",
    topic_tags: ["inspection", "status"],
  },
  {
    id: "scenario_transport_docs",
    question_text: "Where are your transport documents?",
    answer_options: [
      "In the glove compartment",
      "I left them at dispatch",
      "No documents are needed",
      "The inspector already has them",
    ],
    correct_answer: "In the glove compartment",
    simple_explanation: "Transport documents must be available in the vehicle and ready to show during inspection.",
    category: "transport_documents",
    topic_tags: ["documents", "vehicle"],
  },
  {
    id: "scenario_route_stop",
    question_text: "Why are you parked on this route?",
    answer_options: [
      "For the inspection checkpoint",
      "Just to rest anywhere",
      "Because the cargo is gone",
      "No specific reason",
    ],
    correct_answer: "For the inspection checkpoint",
    simple_explanation: "The stop should clearly read as part of the inspection flow, not random roadside behavior.",
    category: "route_stop_reason",
    topic_tags: ["route", "checkpoint"],
  },
  {
    id: "scenario_cab_check",
    question_text: "Who checked the cab before departure?",
    answer_options: [
      "The driver performed the check",
      "Nobody needs to check it",
      "Only the customer checks it",
      "The police check it first",
    ],
    correct_answer: "The driver performed the check",
    simple_explanation: "The driver is responsible for checking the cab and documents before departure.",
    category: "cab_check",
    topic_tags: ["cab", "pretrip"],
  },
];

const QUESTION_SCENARIO_IDS = QUESTION_SCENARIO_POOL.map((scenario) => scenario.id);
const DEFAULT_SCENARIO_ID = QUESTION_SCENARIO_IDS[0];

function text(value) {
  return value == null ? "" : String(value).trim();
}

function resolveQuestionScenario(scenarioId) {
  const requestedId = text(scenarioId) || DEFAULT_SCENARIO_ID;
  return (
    QUESTION_SCENARIO_POOL.find((scenario) => scenario.id === requestedId) ||
    QUESTION_SCENARIO_POOL[0]
  );
}

function applyScenarioAnchor(questionInput, scenarioId) {
  if (!text(scenarioId)) return questionInput;
  const scenario = resolveQuestionScenario(scenarioId);
  return {
    ...questionInput,
    source_id: scenario.id,
    topic_tags: scenario.topic_tags,
    payload: {
      ...(questionInput?.payload || {}),
      question_text: scenario.question_text,
      answer_options: scenario.answer_options,
      correct_answer: scenario.correct_answer,
      simple_explanation: scenario.simple_explanation,
      category: scenario.category,
    },
    fixed_scenario: scenario.id,
  };
}

const DYNAMIC_SCENARIO_CATEGORIES = [
  "fire_safety", "tank_transport", "emergency_equipment", "marking_labeling",
  "cargo_securing", "tunnel_routes", "duties_of_driver", "transport_documents",
  "packaging", "training",
];

async function generateDynamicScenario() {
  const apiKey = text(process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN);
  if (!apiKey) return null;

  const category = DYNAMIC_SCENARIO_CATEGORIES[Math.floor(Math.random() * DYNAMIC_SCENARIO_CATEGORIES.length)];

  const systemPrompt = [
    "Generate a realistic ADR Gefahrguttransport multiple-choice question in German.",
    "Return strict JSON: { id, question_text, answer_options (array of 4 strings), correct_answer, simple_explanation, category, topic_tags (array) }",
    "question_text must be a real ADR exam-style question in German.",
    "All answer_options and correct_answer must be in German.",
    "simple_explanation: one sentence in German explaining why the correct answer is right.",
  ].join(" ");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
          { role: "user", content: [{ type: "input_text", text: `category: ${category}` }] },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "adr_scenario",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "string" },
                question_text: { type: "string" },
                answer_options: { type: "array", items: { type: "string" } },
                correct_answer: { type: "string" },
                simple_explanation: { type: "string" },
                category: { type: "string" },
                topic_tags: { type: "array", items: { type: "string" } },
              },
              required: ["id", "question_text", "answer_options", "correct_answer", "simple_explanation", "category", "topic_tags"],
            },
          },
        },
      }),
    });
    if (!response.ok) return null;
    const json = await response.json();
    const raw = text(json.output_text || "");
    if (!raw) return null;
    const scenario = JSON.parse(raw);
    if (!scenario?.question_text || !Array.isArray(scenario?.answer_options)) return null;
    return { ...scenario, id: scenario.id || `dynamic_${category}_${Date.now()}` };
  } catch {
    return null;
  }
}

export async function pickScenario(questionInput, scenarioId) {
  const hasRealContent =
    text(questionInput?.payload?.question_text) &&
    text(questionInput?.payload?.correct_answer);

  if (hasRealContent && !text(scenarioId)) {
    return questionInput;
  }

  if (text(scenarioId)) {
    return applyScenarioAnchor(questionInput, scenarioId);
  }

  const dynamic = await generateDynamicScenario().catch(() => null);
  if (dynamic) {
    return {
      ...questionInput,
      source_id: dynamic.id,
      topic_tags: dynamic.topic_tags,
      payload: {
        ...(questionInput?.payload || {}),
        question_text: dynamic.question_text,
        answer_options: dynamic.answer_options,
        correct_answer: dynamic.correct_answer,
        simple_explanation: dynamic.simple_explanation,
        category: dynamic.category,
      },
      fixed_scenario: dynamic.id,
    };
  }

  return applyScenarioAnchor(questionInput, DEFAULT_SCENARIO_ID);
}

export {
  QUESTION_SCENARIO_POOL,
  QUESTION_SCENARIO_IDS,
  DEFAULT_SCENARIO_ID,
  resolveQuestionScenario,
  applyScenarioAnchor,
};
