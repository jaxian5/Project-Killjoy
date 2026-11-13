import { type Ref } from "react";
import {
  Anchor,
  BookOpen,
  Brain,
  Crosshair,
  Dice5,
  Flag,
  Flame,
  HeartHandshake,
  Info,
  Landmark,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  SlidersHorizontal,
  Skull,
  Sparkles,
  Target,
  Theater,
  User,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { IconKey, RoleCard } from "@/lib/card";

const ICONS: Record<IconKey, LucideIcon> = {
  // Standard
  offensive: Flame,
  defensive: Shield,
  supportive: HeartHandshake,
  investigative: Search,
  political: Landmark,
  disruptive: Zap,
  deceptive: Theater,
  conversion: RefreshCw,
  suicidal: Skull,
  restorative: Sparkles,
  reactive: RotateCcw,
  trapping: Anchor,
  informative: Info,
  control: SlidersHorizontal,
  // Additional faction categories
  survival: Brain,
  targeted: Crosshair,
  conditional: Target,
  opportunistic: Dice5,
  independent: User,
  elimination: Skull,
  mission: Flag,
  majority: Users,
};

export function RoleCardView({
  card,
  onMove,
  onScale,
  rootRef,
}: {
  card: RoleCard;
  onMove?: (x: number, y: number) => void;
  onScale?: (scale: number) => void;
  rootRef?: Ref<HTMLElement>;
}) {
  const art = card.avatar;
  return (
    <article
      ref={rootRef}
      className={`rolecard tone-${card.factionTone}`}
      style={{ backgroundImage: `url(/factions/${card.factionTone}.jpg)` }}
      aria-label={`${card.role} role card`}
    >
      <header className="rolecard-top">
        <ul className="rolecard-icons">
          {card.icons.slice(0, 3).map((key) => {
            const Icon = ICONS[key];
            return (
              <li key={key}>
                <Icon strokeWidth={1.6} />
              </li>
            );
          })}
        </ul>
        <div className="rolecard-titles">
          <h2 className="role-name">{card.role || "Role"}</h2>
          <p className="faction">{card.faction || "Faction"}</p>
          <p className="addenda">{card.abilityMode}</p>
        </div>
        <div className="rolecard-who">
          <p className="avatar-name">{card.avatarName}</p>
          <p className="avatar-taken">{card.avatarTaken}</p>
        </div>
      </header>

      <div
        className={`rolecard-art${onMove ? " is-live" : ""}`}
        onPointerDown={(e) => {
          if (!onMove || !card.avatarImage) return;
          const well = e.currentTarget;
          const startX = e.clientX;
          const startY = e.clientY;
          const ox = art.x;
          const oy = art.y;
          well.setPointerCapture(e.pointerId);
          const move = (ev: PointerEvent) => {
            const rect = well.getBoundingClientRect();
            const x = Math.max(-80, Math.min(80, ox + ((ev.clientX - startX) / rect.width) * 100));
            const y = Math.max(-80, Math.min(80, oy + ((ev.clientY - startY) / rect.height) * 100));
            onMove(x, y);
          };
          const up = () => {
            well.removeEventListener("pointermove", move);
            well.removeEventListener("pointerup", up);
          };
          well.addEventListener("pointermove", move);
          well.addEventListener("pointerup", up);
        }}
        onWheel={(e) => {
          if (!onScale || !card.avatarImage) return;
          const next = Math.max(0.4, Math.min(2.6, art.scale + (e.deltaY > 0 ? -0.06 : 0.06)));
          onScale(next);
        }}
      >
        {card.avatarImage ? (
          <img
            src={card.avatarImage}
            alt=""
            style={{
              transform: `translate(calc(-50% + ${art.x}%), calc(-50% + ${art.y}%)) scale(${art.scale}) rotate(${art.rotate}deg)`,
            }}
          />
        ) : null}
      </div>

      {card.quote ? <p className="rolecard-quote">“{card.quote}”</p> : null}

      <section className={`rolecard-desc${card.secondAbility ? " is-split" : ""}`}>
        <div>
          <h3>{card.abilityLabel || "Ability"}</h3>
          <p>{card.ability}</p>
        </div>
        {card.secondAbility ? (
          <div>
            <h3>{card.abilityLabel2 || "Ability"}</h3>
            <p>{card.ability2}</p>
          </div>
        ) : null}
        <div className="value-badge">
          <span className="value-num">{card.value || "0"}</span>
          <span className="value-label">{card.valueLabel || "Value"}</span>
        </div>
      </section>
    </article>
  );
}
