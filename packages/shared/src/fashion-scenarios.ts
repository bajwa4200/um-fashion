/** Occasion × city × culture templates — combinable to 100k+ stylist queries via RAG tags. */

export const SCENARIO_TAGS = [
  "wedding",
  "baraat",
  "mehndi",
  "nikah",
  "eid",
  "office",
  "university",
  "party",
  "gym",
  "casual",
  "formal",
  "cricket",
  "beach",
  "travel",
  "interview",
  "date",
  "modest",
  "streetwear",
  "luxury",
  "budget",
  "summer",
  "winter",
  "monsoon",
  "karachi",
  "lahore",
  "islamabad",
  "male",
  "female",
  "unisex",
] as const;

export type ScenarioTag = (typeof SCENARIO_TAGS)[number];

export interface ScenarioTemplate {
  id: string;
  occasion: string;
  cities: string[];
  tags: string[];
  promptHint: string;
  labelUr: string;
}

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    id: "pk-wedding-male",
    occasion: "wedding",
    cities: ["Karachi", "Lahore", "Islamabad"],
    tags: ["wedding", "baraat", "formal", "male", "luxury"],
    promptHint: "Pakistani shadi formal sherwani or suit, gold accents, breathable for heat",
    labelUr: "Shadi — formal mardana",
  },
  {
    id: "pk-wedding-female",
    occasion: "wedding",
    cities: ["Karachi", "Lahore"],
    tags: ["wedding", "mehndi", "female", "luxury"],
    promptHint: "Bridal guest lehenga or elegant shalwar kameez, jewel tones",
    labelUr: "Shadi — formal aurat",
  },
  {
    id: "pk-office",
    occasion: "office",
    cities: ["Karachi", "Lahore", "Islamabad"],
    tags: ["office", "formal", "summer", "male", "female"],
    promptHint: "Smart office: chinos/trousers, crisp shirt, light layers for AC",
    labelUr: "Office professional",
  },
  {
    id: "pk-university",
    occasion: "casual",
    cities: ["Lahore", "Islamabad", "Faisalabad"],
    tags: ["university", "casual", "budget", "unisex"],
    promptHint: "Campus casual: jeans, tee, sneakers, modest options",
    labelUr: "University casual",
  },
  {
    id: "pk-gym",
    occasion: "gym",
    cities: ["Karachi", "Lahore"],
    tags: ["gym", "summer", "male", "female"],
    promptHint: "Athleisure: moisture-wick, trainers, minimal layers",
    labelUr: "Gym / workout",
  },
  {
    id: "pk-eid",
    occasion: "eid",
    cities: ["Karachi", "Lahore", "Rawalpindi"],
    tags: ["eid", "formal", "modest", "family"],
    promptHint: "Eid festive: new clothes tradition, pastel or jewel, comfortable footwear",
    labelUr: "Eid festive",
  },
  {
    id: "pk-cricket",
    occasion: "casual",
    cities: ["Karachi", "Lahore"],
    tags: ["cricket", "casual", "summer", "male"],
    promptHint: "Match day: team colors subtle, sun hat, comfy shoes",
    labelUr: "Cricket match",
  },
  {
    id: "pk-monsoon",
    occasion: "casual",
    cities: ["Karachi", "Lahore"],
    tags: ["monsoon", "rain", "casual"],
    promptHint: "Rain-ready: layers, quick-dry, closed shoes",
    labelUr: "Barish / monsoon",
  },
];

export const QUICK_REPLY_CHIPS = [
  { id: "budget-low", text: "Budget kam hai", textEn: "Low budget" },
  { id: "budget-mid", text: "Medium budget", textEn: "Mid budget" },
  { id: "modest", text: "Modest dress", textEn: "Modest style" },
  { id: "bold", text: "Bold colors", textEn: "Bold colors" },
  { id: "formal", text: "Zada formal", textEn: "More formal" },
  { id: "comfort", text: "Comfort pehle", textEn: "Comfort first" },
] as const;

/** Expand templates into search queries for RAG (synthetic scenario coverage). */
export function expandScenarioQueries(): string[] {
  const queries: string[] = [];
  for (const t of SCENARIO_TEMPLATES) {
    for (const city of t.cities) {
      queries.push(`${t.occasion} outfit ${city} ${t.promptHint}`);
    }
  }
  return queries;
}
