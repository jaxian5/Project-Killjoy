import { useEffect, useRef, useState } from "react";
import { RoleCardView } from "@/components/role-card";
import {
  DEFAULT_AVATAR,
  FACTIONS,
  categoriesForFaction,
  loadLibrary,
  makeSavedCard,
  saveLibrary,
  type AbilityMode,
  type IconKey,
  type RoleCard,
  type SavedCard,
} from "@/lib/card";

const ICON_LABEL: Record<IconKey, string> = {
  // Standard
  offensive: "Offensive",
  defensive: "Defensive",
  supportive: "Supportive",
  investigative: "Investigative",
  political: "Political",
  disruptive: "Disruptive",
  deceptive: "Deceptive",
  conversion: "Conversion",
  suicidal: "Suicidal",
  restorative: "Restorative",
  reactive: "Reactive",
  trapping: "Trapping",
  informative: "Informative",
  control: "Control",
  // Additional faction categories
  survival: "Survival",
  targeted: "Targeted",
  conditional: "Conditional",
  opportunistic: "Opportunistic",
  independent: "Independent",
  elimination: "Elimination",
  mission: "Mission-based",
  majority: "Majority",
};

const MODES: AbilityMode[] = ["Nocturnal", "Diurnal", "Cathemeral"];

export function CardStudio() {
  const [deck, setDeck] = useState<SavedCard[]>([]);
  const [activeId, setActiveId] = useState("");
  const [card, setCard] = useState<RoleCard | null>(null);
  const [ready, setReady] = useState(false);
  const [showDeck, setShowDeck] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const library = loadLibrary();
    setDeck(library.deck);
    setActiveId(library.activeId);
    setCard(library.deck.find((item) => item.id === library.activeId)?.card ?? library.deck[0].card);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !card || !activeId) return;
    setDeck((prev) => prev.map((item) => (item.id === activeId ? { ...item, card, updatedAt: Date.now() } : item)));
  }, [card, activeId, ready]);

  useEffect(() => {
    if (!ready || !activeId || deck.length === 0) return;
    saveLibrary(deck, activeId);
  }, [deck, activeId, ready]);

  function patch(partial: Partial<RoleCard>) {
    setCard((c) => (c ? { ...c, ...partial } : c));
  }

  function createCard() {
    const saved = makeSavedCard();
    setDeck((prev) => [saved, ...prev]);
    setActiveId(saved.id);
    setCard(saved.card);
    setFileKey((n) => n + 1);
    setShowDeck(true);
  }

  function openCard(id: string) {
    const found = deck.find((item) => item.id === id);
    if (!found) return;
    setActiveId(id);
    setCard(found.card);
    setFileKey((n) => n + 1);
  }

  function removeCard(id: string) {
    setDeck((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (next.length === 0) {
        const saved = makeSavedCard();
        setActiveId(saved.id);
        setCard(saved.card);
        return [saved];
      }
      if (id === activeId) {
        setActiveId(next[0].id);
        setCard(next[0].card);
      }
      return next;
    });
    setFileKey((n) => n + 1);
  }

  function toggleIcon(key: IconKey) {
    setCard((c) => {
      if (!c) return c;
      if (c.icons.includes(key)) {
        const next = c.icons.filter((k) => k !== key);
        return { ...c, icons: next.length ? next : c.icons };
      }
      if (c.icons.length >= 3) return c;
      return { ...c, icons: [...c.icons, key] };
    });
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const avatarImage = await fitImage(file);
    patch({ avatarImage, avatar: { ...DEFAULT_AVATAR } });
  }

  async function downloadCard() {
    const node = cardRef.current;
    if (!node || !card || saving) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, { pixelRatio: 3, cacheBust: true, backgroundColor: "#100e0c" });
      const link = document.createElement("a");
      const name = (card.role || "card").trim().replace(/[^\w\-]+/g, "-").replace(/^-|-$/g, "") || "card";
      link.href = dataUrl;
      link.download = `${name}.png`;
      link.click();
    } finally {
      setSaving(false);
    }
  }

  if (!card) return null;

  const availableCategories = categoriesForFaction(card.factionTone);

  return (
    <main className="studio">
      <header className="studio-bar">
        <div>
          <p className="eyebrow">Card studio</p>
          <h1>Killjoy</h1>
        </div>
        <div className="bar-actions">
          <button type="button" className="ghost" onClick={createCard}>
            Create card
          </button>
          <button type="button" className={showDeck ? "chip on" : "ghost"} onClick={() => setShowDeck((v) => !v)}>
            Cards ({deck.length})
          </button>
          <button type="button" className="ghost" onClick={() => window.print()}>
            Print
          </button>
          <button type="button" className="solid" disabled={saving} onClick={() => void downloadCard()}>
            {saving ? "Saving…" : "Download"}
          </button>
        </div>
      </header>

      {showDeck ? (
        <ul className="deck">
          {deck.map((item) => (
            <li key={item.id} className={item.id === activeId ? "is-open" : ""}>
              <button type="button" onClick={() => openCard(item.id)}>
                <strong>{item.card.role || "Untitled"}</strong>
                <span>
                  {item.card.faction} · {item.card.value || "0"}
                </span>
              </button>
              <button type="button" className="ghost" onClick={() => removeCard(item.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="studio-grid">
        <section className="stage" aria-label="Card preview">
          <RoleCardView
            rootRef={cardRef}
            card={card}
            onMove={(x, y) => patch({ avatar: { ...card.avatar, x, y } })}
            onScale={(scale) => patch({ avatar: { ...card.avatar, scale } })}
          />
          <p className="fine stage-hint">Drag the portrait. Scroll to scale.</p>
        </section>

        <form className="editor" onSubmit={(e) => e.preventDefault()}>
          <fieldset>
            <legend>Identity</legend>
            <label>
              Role
              <input value={card.role} onChange={(e) => patch({ role: e.target.value })} />
            </label>
            <div className="split">
              <label>
                Faction
                <select
                  value={card.factionTone}
                  onChange={(e) => {
                    const tone = e.target.value as RoleCard["factionTone"];
                    const found = FACTIONS.find((f) => f.tone === tone);
                    const allowed = categoriesForFaction(tone);
                    const kept = card.icons.filter((k) => allowed.includes(k));
                    patch({
                      factionTone: tone,
                      faction: found?.label ?? card.faction,
                      icons: kept.length ? kept : [allowed[0]],
                    });
                  }}
                >
                  {FACTIONS.map((f) => (
                    <option key={f.tone} value={f.tone}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Value
                <input value={card.value} onChange={(e) => patch({ value: e.target.value })} />
              </label>
            </div>
            <p className="fine">Ability mode</p>
            <div className="picks">
              {MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={card.abilityMode === mode ? "chip on" : "chip"}
                  onClick={() => patch({ abilityMode: mode })}
                >
                  {mode}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Categories · {card.icons.length}/3</legend>
            <div className="picks">
              {availableCategories.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={card.icons.includes(key) ? "chip on" : "chip"}
                  onClick={() => toggleIcon(key)}
                >
                  {ICON_LABEL[key]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Avatar</legend>
            <div className="split">
              <label>
                Name
                <input value={card.avatarName} onChange={(e) => patch({ avatarName: e.target.value })} />
              </label>
              <label>
                Taken
                <input value={card.avatarTaken} onChange={(e) => patch({ avatarTaken: e.target.value })} />
              </label>
            </div>
            <label>
              Quote
              <input value={card.quote} onChange={(e) => patch({ quote: e.target.value })} />
            </label>
            <label>
              Portrait
              <input
                key={fileKey}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/*"
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
            </label>
            <p className="fine">Transparent PNG, WebP, and GIF portraits stay transparent.</p>
            {card.avatarImage ? (
              <div className="transform">
                <label>
                  Scale {card.avatar.scale.toFixed(2)}
                  <input
                    type="range"
                    min={0.4}
                    max={2.6}
                    step={0.02}
                    value={card.avatar.scale}
                    onChange={(e) => patch({ avatar: { ...card.avatar, scale: Number(e.target.value) } })}
                  />
                </label>
                <label>
                  Rotate {card.avatar.rotate}°
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={card.avatar.rotate}
                    onChange={(e) => patch({ avatar: { ...card.avatar, rotate: Number(e.target.value) } })}
                  />
                </label>
                <button type="button" className="ghost" onClick={() => patch({ avatar: { ...DEFAULT_AVATAR } })}>
                  Reset transform
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    patch({ avatarImage: "", avatar: { ...DEFAULT_AVATAR } });
                    setFileKey((n) => n + 1);
                  }}
                >
                  Remove portrait
                </button>
              </div>
            ) : null}
          </fieldset>

          <fieldset>
            <legend>Abilities</legend>
            <label>
              Name
              <input value={card.abilityLabel} onChange={(e) => patch({ abilityLabel: e.target.value })} />
            </label>
            <label>
              Text
              <textarea rows={3} value={card.ability} onChange={(e) => patch({ ability: e.target.value })} />
            </label>
            <button
              type="button"
              className={card.secondAbility ? "chip on" : "chip"}
              onClick={() => patch({ secondAbility: !card.secondAbility })}
            >
              {card.secondAbility ? "Second ability on" : "Add a second ability"}
            </button>
            {card.secondAbility ? (
              <>
                <label>
                  Second name
                  <input value={card.abilityLabel2} onChange={(e) => patch({ abilityLabel2: e.target.value })} />
                </label>
                <label>
                  Second text
                  <textarea rows={3} value={card.ability2} onChange={(e) => patch({ ability2: e.target.value })} />
                </label>
              </>
            ) : null}
          </fieldset>
        </form>
      </div>
    </main>
  );
}

function fitImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 900;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(encodePortrait(canvas, canvasHasTransparency(ctx, canvas.width, canvas.height)));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

function canvasHasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true;
  }
  return false;
}

function encodePortrait(canvas: HTMLCanvasElement, keepAlpha: boolean) {
  if (!keepAlpha) return canvas.toDataURL("image/jpeg", 0.82);
  let current = canvas;
  let png = current.toDataURL("image/png");
  let guard = 0;
  while (png.length > 1_600_000 && current.width > 360 && guard < 4) {
    guard += 1;
    const next = document.createElement("canvas");
    next.width = Math.max(360, Math.round(current.width * 0.75));
    next.height = Math.max(1, Math.round(current.height * (next.width / current.width)));
    const nctx = next.getContext("2d", { alpha: true });
    if (!nctx) break;
    nctx.clearRect(0, 0, next.width, next.height);
    nctx.drawImage(current, 0, 0, next.width, next.height);
    current = next;
    png = current.toDataURL("image/png");
  }
  return png;
}
