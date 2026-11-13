export const ICON_KEYS = [
  // Standard categories (Town / Murderers / Cult / Gray)
  "offensive",
  "defensive",
  "supportive",
  "investigative",
  "political",
  "disruptive",
  "deceptive",
  "conversion",
  "suicidal",
  "restorative",
  "reactive",
  "trapping",
  "informative",
  // Neutral-only categories
  "survival",
  "targeted",
  "conditional",
  "opportunistic",
  "independent",
  "elimination",
  "mission",
  "majority",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

/** Categories available to Town / Murderers / Cult / Gray */
export const STANDARD_CATEGORIES: IconKey[] = [
  "offensive",
  "defensive",
  "supportive",
  "investigative",
  "political",
  "disruptive",
  "deceptive",
  "conversion",
  "suicidal",
  "restorative",
  "reactive",
  "trapping",
  "informative",
];

/** Categories available only when faction is Neutral */
export const NEUTRAL_CATEGORIES: IconKey[] = [
  "survival",
  "targeted",
  "conditional",
  "opportunistic",
  "independent",
  "elimination",
  "mission",
  "majority",
];

export type FactionTone = "town" | "murderers" | "cult" | "neutral" | "gray";

export type AbilityMode = "Nocturnal" | "Diurnal" | "Cathemeral";

export type AvatarTransform = {
  x: number;
  y: number;
  scale: number;
  rotate: number;
};

export type RoleCard = {
  role: string;
  faction: string;
  factionTone: FactionTone;
  abilityMode: AbilityMode;
  icons: IconKey[];
  avatarName: string;
  avatarTaken: string;
  quote: string;
  abilityLabel: string;
  ability: string;
  secondAbility: boolean;
  abilityLabel2: string;
  ability2: string;
  value: string;
  valueLabel: string;
  avatarImage: string;
  avatar: AvatarTransform;
};

export const DEFAULT_AVATAR: AvatarTransform = { x: 0, y: 0, scale: 1, rotate: 0 };

export const TEMPLATE: RoleCard = {
  role: "Role",
  faction: "Town",
  factionTone: "town",
  abilityMode: "Nocturnal",
  icons: ["investigative"],
  avatarName: "Avatar",
  avatarTaken: "Source",
  quote: "Quote",
  abilityLabel: "Ability",
  ability: "What this role does.",
  secondAbility: false,
  abilityLabel2: "Ability",
  ability2: "",
  value: "+0",
  valueLabel: "Value",
  avatarImage: "",
  avatar: DEFAULT_AVATAR,
};

const DECK_KEY = "rolecard.deck.v1";
const LEGACY_KEY = "rolecard.v3";

export const FACTIONS: { label: string; tone: FactionTone }[] = [
  { label: "Town", tone: "town" },
  { label: "Murderers", tone: "murderers" },
  { label: "Cult", tone: "cult" },
  { label: "Neutral", tone: "neutral" },
  { label: "Gray", tone: "gray" },
];

export type SavedCard = {
  id: string;
  updatedAt: number;
  card: RoleCard;
};

export function blankCard(): RoleCard {
  return {
    ...TEMPLATE,
    icons: [...TEMPLATE.icons],
    avatar: { ...DEFAULT_AVATAR },
  };
}

function newId() {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Map old icon keys from previous versions to the new set */
const LEGACY_ICON_MAP: Record<string, IconKey> = {
  search: "investigative",
  mind: "supportive",
  eye: "investigative",
  moon: "survival",
  shield: "defensive",
  flame: "offensive",
  mask: "deceptive",
  key: "political",
};

export function normalizeCard(parsed: Partial<RoleCard> | undefined): RoleCard {
  const rawIcons = parsed?.icons ?? TEMPLATE.icons;
  const icons = rawIcons
    .map((k) => LEGACY_ICON_MAP[k] ?? k)
    .filter((k): k is IconKey => (ICON_KEYS as readonly string[]).includes(k));
  return {
    ...blankCard(),
    ...parsed,
    icons: icons.slice(0, 3).length ? icons.slice(0, 3) : ["investigative"],
    avatar: { ...DEFAULT_AVATAR, ...parsed?.avatar },
    secondAbility: Boolean(parsed?.secondAbility),
    avatarImage: typeof parsed?.avatarImage === "string" ? parsed.avatarImage : "",
  };
}

export function loadLibrary(): { activeId: string; deck: SavedCard[] } {
  if (typeof window === "undefined") {
    const id = "draft";
    return { activeId: id, deck: [{ id, updatedAt: 0, card: blankCard() }] };
  }
  try {
    const raw = localStorage.getItem(DECK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { activeId?: string; deck?: SavedCard[] };
      const deck = (parsed.deck ?? [])
        .filter((item) => item && item.id && item.card)
        .map((item) => ({
          id: item.id,
          updatedAt: item.updatedAt || 0,
          card: normalizeCard(item.card),
        }));
      if (deck.length) {
        const activeId = deck.some((item) => item.id === parsed.activeId)
          ? parsed.activeId!
          : deck[0].id;
        return { activeId, deck };
      }
    }
  } catch {
    /* start fresh */
  }
  const legacy = readLegacy();
  const id = newId();
  const card = legacy ?? { ...blankCard(), avatarImage: "/portraits/example.png" };
  return { activeId: id, deck: [{ id, updatedAt: Date.now(), card }] };
}

function readLegacy(): RoleCard | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    return normalizeCard(JSON.parse(raw) as Partial<RoleCard>);
  } catch {
    return null;
  }
}

export function saveLibrary(deck: SavedCard[], activeId: string) {
  const write = (items: SavedCard[]) =>
    localStorage.setItem(DECK_KEY, JSON.stringify({ activeId, deck: items }));
  try {
    write(deck);
  } catch {
    try {
      write(
        deck.map((item) =>
          item.id === activeId ? item : { ...item, card: { ...item.card, avatarImage: "" } },
        ),
      );
    } catch {
      write(deck.map((item) => ({ ...item, card: { ...item.card, avatarImage: "" } })));
    }
  }
}

export function makeSavedCard(card: RoleCard = blankCard()): SavedCard {
  return { id: newId(), updatedAt: Date.now(), card };
}

/** Return the category list that should be offered for a given faction tone */
export function categoriesForFaction(tone: FactionTone): IconKey[] {
  return tone === "neutral" ? NEUTRAL_CATEGORIES : STANDARD_CATEGORIES;
}
