import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";

/* ───────────────────────── BRASSBOOK ─ design tokens ───────────────────────── */
const T = {
  paper: "#ECEFE4",      // sage ledger paper
  card: "#FBFBF5",       // page white
  ink: "#15241C",        // banknote ink
  inkSoft: "#5A6A5F",
  line: "#D4DBC8",
  green: "#1E6B4F",      // credit / income
  greenDeep: "#0F3A2C",  // header vault green
  red: "#B3402F",        // debit / over budget
  brass: "#A87F22",      // coin brass
  brassLight: "#E9C967",
  cream: "#F3EBD3",
  display: "'Fraunces', Georgia, 'Times New Roman', serif",
  body: "'Public Sans', system-ui, -apple-system, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace",
};

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,650;9..144,800&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
* { box-sizing: border-box; }
body { margin: 0; }
button { font-family: inherit; cursor: pointer; }
input, select, textarea { font-family: inherit; }
::selection { background: ${T.brassLight}; }
@keyframes bbpop { 0% { transform: scale(.6); opacity: 0 } 70% { transform: scale(1.06) } 100% { transform: scale(1); opacity: 1 } }
@keyframes bbrise { from { transform: translateY(10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important } }
button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid ${T.brass}; outline-offset: 2px; }
`;

/* ───────────────────────── categories & catalogue ───────────────────────── */
const EXP_CATS = {
  "Groceries":          { e: "🛒", kind: "need", tip: "Shop with a written list and eat before you go — unplanned items quietly add 20%+ to grocery bills." },
  "Food & Dining":      { e: "🍽️", kind: "want", tip: "Swapping 3 takeout meals a week for home cooking typically saves 30–40% of dining spend. Batch-cook on Sundays." },
  "Transport":          { e: "🚌", kind: "need", tip: "Price a monthly transit pass against per-ride costs, and bundle errands into a single trip to cut fuel spend." },
  "Housing & Rent":     { e: "🏠", kind: "need", tip: "Housing above ~30% of income squeezes everything else. Negotiate at renewal — landlords prefer keeping good tenants." },
  "Utilities & Bills":  { e: "💡", kind: "need", tip: "Call providers once a year and ask for retention discounts. It works far more often than people expect." },
  "Subscriptions":      { e: "🔁", kind: "want", tip: "List every subscription and cancel anything untouched in 30 days. Rotate streaming services instead of stacking them." },
  "Shopping":           { e: "🛍️", kind: "want", tip: "Use the 48-hour rule: park items on a wishlist and buy only if you still want them two days later." },
  "Entertainment":      { e: "🎬", kind: "want", tip: "Set a fixed monthly 'fun budget' in cash or a separate pot — fun is essential, unlimited fun isn't." },
  "Health":             { e: "🩺", kind: "need", tip: "Ask about generic medication options and preventive checkups — small costs now prevent big ones later." },
  "Education":          { e: "📚", kind: "need", tip: "Check libraries and free course platforms before paying — many paid courses have free equivalents." },
  "Travel":             { e: "✈️", kind: "want", tip: "Book flights 6–8 weeks ahead, travel midweek, and set fare alerts instead of buying on impulse." },
  "Personal Care":      { e: "🧴", kind: "want", tip: "Buy refills and multi-use products; brand-name and store-brand basics are often the same formula." },
  "Gifts & Donations":  { e: "🎁", kind: "want", tip: "Set a yearly gift budget in January and shop sales ahead of occasions instead of last-minute." },
  "Other":              { e: "📦", kind: "want", tip: "Recurring 'Other' spending is a sign a category is hiding — name it and it becomes manageable." },
};
const INC_CATS = {
  "Salary": "💼", "Freelance": "🧑‍💻", "Business": "🏪", "Investments": "📈",
  "Gifts Received": "🎀", "Refunds": "↩️", "Other Income": "➕",
};
const PIE_COLORS = ["#1E6B4F", "#A87F22", "#B3402F", "#3E6E8E", "#7A6FD0", "#8C7035", "#5A8A5E", "#C06A8A", "#4FA3A5", "#9A6A45", "#6B7F4F", "#B08968", "#557", "#885"];

const BADGES = [
  { id: "copper-sprout",  name: "Copper Sprout",   cost: 100,  glyph: "🌱", c1: "#B07B52", c2: "#7A4E2E", blurb: "Your first saved-more month. Every fortune starts here." },
  { id: "bronze-piggy",   name: "Bronze Piggy",    cost: 200,  glyph: "🐖", c1: "#9C7A3C", c2: "#6B5226", blurb: "The piggy bank approves. Momentum is building." },
  { id: "silver-stash",   name: "Silver Stash",    cost: 350,  glyph: "🪙", c1: "#B9C2C9", c2: "#7C868E", blurb: "A proper stash now. Compounding has entered the chat." },
  { id: "golden-goose",   name: "Golden Goose",    cost: 500,  glyph: "🪿", c1: "#D9B445", c2: "#A87F22", blurb: "Steady saver, golden eggs. You make it look easy." },
  { id: "platinum-vault", name: "Platinum Vault",  cost: 750,  glyph: "🏦", c1: "#C8D2D9", c2: "#8B98A1", blurb: "Discipline of steel, vault of platinum." },
  { id: "diamond-ledger", name: "Diamond Ledger",  cost: 1000, glyph: "💎", c1: "#9FD8E2", c2: "#5BA7B5", blurb: "A thousand points of pure financial polish." },
  { id: "comet-saver",    name: "Comet Saver",     cost: 1500, glyph: "☄️", c1: "#9C92E0", c2: "#5F54B8", blurb: "Savings trajectory: astronomical." },
  { id: "mythic-master",  name: "Mythic Money Master", cost: 2500, glyph: "🐉", c1: "#4FA37C", c2: "#1E6B4F", blurb: "The rarest seal in the guild. Legends keep ledgers too." },
];

/* ───────────────────────── helpers ───────────────────────── */
const todayStr = () => new Date().toISOString().slice(0, 10);
const mk = (d) => d.slice(0, 7);
const curMonth = () => todayStr().slice(0, 7);
const prevMonthKey = (key) => {
  const [y, m] = key.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
};
const monthLabel = (key, long) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 2).toLocaleString("en", { month: long ? "long" : "short", year: long ? "numeric" : "2-digit" });
};
const monthsBack = (n) => { let k = curMonth(); const out = [k]; for (let i = 0; i < n - 1; i++) { k = prevMonthKey(k); out.unshift(k); } return out; };
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

const STORAGE_KEY = "brassbook-data-v1";
const EMPTY = { currency: "$", transactions: [], budgets: {}, goals: [], points: 0, lifetimePoints: 0, awards: {}, redeemed: [] };

function sampleData() {
  const [m2, m1, m0] = monthsBack(3); // two completed-ish months + current
  const tx = [];
  const add = (mo, day, type, amount, category, note) =>
    tx.push({ id: uid(), type, amount, category, date: `${mo}-${String(day).padStart(2, "0")}`, note });
  // month -2 : saved 400
  add(m2, 1, "income", 3200, "Salary", "Monthly salary");
  add(m2, 3, "expense", 1100, "Housing & Rent", "Rent");
  add(m2, 5, "expense", 420, "Groceries", "Weekly shops");
  add(m2, 8, "expense", 310, "Food & Dining", "Restaurants");
  add(m2, 10, "expense", 160, "Transport", "Transit + fuel");
  add(m2, 12, "expense", 180, "Utilities & Bills", "Power + internet");
  add(m2, 15, "expense", 65, "Subscriptions", "Streaming x3");
  add(m2, 18, "expense", 240, "Shopping", "Clothes");
  add(m2, 21, "expense", 145, "Entertainment", "Concert");
  add(m2, 25, "expense", 12, "Food & Dining", "Coffee");
  add(m2, 27, "expense", 168, "Other", "Misc");
  // month -1 : saved 705 (improved!)
  add(m1, 1, "income", 3200, "Salary", "Monthly salary");
  add(m1, 6, "income", 250, "Freelance", "Logo gig");
  add(m1, 3, "expense", 1100, "Housing & Rent", "Rent");
  add(m1, 5, "expense", 390, "Groceries", "Weekly shops");
  add(m1, 9, "expense", 220, "Food & Dining", "Restaurants");
  add(m1, 11, "expense", 150, "Transport", "Transit + fuel");
  add(m1, 13, "expense", 175, "Utilities & Bills", "Power + internet");
  add(m1, 15, "expense", 52, "Subscriptions", "Cancelled one!");
  add(m1, 19, "expense", 130, "Shopping", "Gift");
  add(m1, 22, "expense", 95, "Entertainment", "Cinema + games");
  add(m1, 24, "expense", 14, "Food & Dining", "Coffee");
  add(m1, 26, "expense", 419, "Health", "Dentist");
  // current month so far
  add(m0, 1, "income", 3200, "Salary", "Monthly salary");
  add(m0, 3, "expense", 1100, "Housing & Rent", "Rent");
  add(m0, 5, "expense", 210, "Groceries", "Weekly shop");
  add(m0, 7, "expense", 48, "Food & Dining", "Brunch");
  add(m0, 9, "expense", 60, "Transport", "Transit pass");
  add(m0, 10, "expense", 52, "Subscriptions", "Streaming x2");
  return {
    ...EMPTY,
    transactions: tx,
    budgets: { "Groceries": 400, "Food & Dining": 250, "Shopping": 200, "Entertainment": 120, "Subscriptions": 60 },
    goals: [
      { id: uid(), name: "Emergency fund", target: 5000, saved: 1850, deadline: "", emoji: "🛟" },
      { id: uid(), name: "Japan trip", target: 2400, saved: 600, deadline: `${curMonth().slice(0, 4)}-12-15`, emoji: "🗻" },
    ],
  };
}

/* ───────────────────────── tiny UI kit ───────────────────────── */
const Card = ({ children, style, pad = 16 }) => (
  <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: pad, boxShadow: "0 1px 2px rgba(21,36,28,.05)", ...style }}>{children}</div>
);
const Eyebrow = ({ children, color = T.inkSoft }) => (
  <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color }}>{children}</div>
);
const H = ({ children, size = 22, style }) => (
  <div style={{ fontFamily: T.display, fontWeight: 650, fontSize: size, color: T.ink, lineHeight: 1.15, ...style }}>{children}</div>
);
const Btn = ({ children, onClick, kind = "primary", small, style, disabled, title }) => {
  const base = { borderRadius: 10, fontWeight: 600, fontSize: small ? 13 : 14, padding: small ? "7px 12px" : "10px 16px", border: "1px solid transparent", transition: "transform .08s ease, opacity .15s", opacity: disabled ? 0.5 : 1 };
  const kinds = {
    primary: { background: T.greenDeep, color: T.cream },
    brass: { background: `linear-gradient(180deg, ${T.brassLight}, ${T.brass})`, color: "#3A2C08", border: `1px solid ${T.brass}` },
    ghost: { background: "transparent", color: T.ink, border: `1px solid ${T.line}` },
    danger: { background: "transparent", color: T.red, border: `1px solid ${T.red}44` },
  };
  return <button title={title} disabled={disabled} onClick={onClick} style={{ ...base, ...kinds[kind], ...style }}
    onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(.97)")}
    onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>{children}</button>;
};
const Field = ({ label, children }) => (
  <label style={{ display: "block", marginBottom: 12 }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 5 }}>{label}</div>
    {children}
  </label>
);
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.line}`, background: "#fff", fontSize: 15, color: T.ink };
const ProgressBar = ({ pct, color }) => (
  <div style={{ height: 8, borderRadius: 99, background: "#E3E7D8", overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: 99, transition: "width .4s ease" }} />
  </div>
);
const Modal = ({ title, onClose, children, wide }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,30,22,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50, padding: 12 }}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, borderRadius: 18, width: "100%", maxWidth: wide ? 520 : 440, maxHeight: "88vh", overflowY: "auto", padding: 20, animation: "bbrise .25s ease", marginBottom: "4vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <H size={19}>{title}</H>
        <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", fontSize: 22, color: T.inkSoft, lineHeight: 1 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

/* ───────────────────────── badge medallion (SVG) ───────────────────────── */
const Medallion = React.forwardRef(({ badge, size = 150, locked }, ref) => {
  const { id, name, glyph, c1, c2 } = badge;
  return (
    <svg ref={ref} viewBox="0 0 240 240" width={size} height={size} style={{ filter: locked ? "grayscale(.9) opacity(.55)" : "drop-shadow(0 4px 10px rgba(21,36,28,.25))" }} role="img" aria-label={`${name} badge`}>
      <defs>
        <radialGradient id={`core-${id}`} cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor={c1} /><stop offset="100%" stopColor={c2} />
        </radialGradient>
        <linearGradient id={`rim-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.brassLight} /><stop offset="55%" stopColor={T.brass} /><stop offset="100%" stopColor="#6E5114" />
        </linearGradient>
        <path id={`top-${id}`} d="M 38,120 A 82,82 0 0 1 202,120" fill="none" />
        <path id={`bot-${id}`} d="M 30,120 A 90,90 0 0 0 210,120" fill="none" />
      </defs>
      <circle cx="120" cy="120" r="114" fill={`url(#rim-${id})`} />
      <circle cx="120" cy="120" r="104" fill="none" stroke="#FFF6DC" strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="3 4" />
      <circle cx="120" cy="120" r="98" fill={`url(#core-${id})`} stroke="#3A2C08" strokeOpacity=".35" strokeWidth="1" />
      <circle cx="120" cy="120" r="62" fill="rgba(255,250,235,.16)" stroke="#FFF6DC" strokeOpacity=".45" strokeWidth="1" strokeDasharray="2 3" />
      <text fontFamily={T.body} fontWeight="700" fontSize="12.5" letterSpacing="2.5" fill="#FFF6DC">
        <textPath href={`#top-${id}`} startOffset="50%" textAnchor="middle">{name.toUpperCase()}</textPath>
      </text>
      <text fontFamily={T.body} fontWeight="600" fontSize="9.5" letterSpacing="2.2" fill="#FFF6DC" opacity=".85">
        <textPath href={`#bot-${id}`} startOffset="50%" textAnchor="middle">BRASSBOOK · SAVER'S GUILD</textPath>
      </text>
      <text x="120" y="138" textAnchor="middle" fontSize="52">{locked ? "🔒" : glyph}</text>
      <text x="120" y="172" textAnchor="middle" fontFamily={T.mono} fontSize="12" letterSpacing="1.5" fill="#FFF6DC" opacity=".9">{badge.cost} PTS</text>
    </svg>
  );
});

/* ───────────────────────── main app ───────────────────────── */
export default function BrassBook() {
  const [data, setData] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null); // {kind:'tx'|'goal'|'fund'|'share'|'reset', payload}
  const [viewMonth, setViewMonth] = useState(curMonth());
  const [txFilter, setTxFilter] = useState("all");
  const [search, setSearch] = useState("");
  const shareSvgRef = useRef(null);

  /* load + save */
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage?.get(STORAGE_KEY);
        if (r?.value) setData({ ...EMPTY, ...JSON.parse(r.value) });
      } catch (e) { /* no saved data yet */ }
      setLoaded(true);
    })();
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(async () => {
      try { await window.storage?.set(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.error("save failed", e); }
    }, 500);
    return () => clearTimeout(t);
  }, [data, loaded]);

  const showToast = (msg, brass) => { setToast({ msg, brass }); setTimeout(() => setToast(null), 3200); };

  /* monthly aggregates */
  const byMonth = useMemo(() => {
    const m = {};
    for (const t of data.transactions) {
      const k = mk(t.date);
      m[k] = m[k] || { income: 0, expense: 0 };
      m[k][t.type] += Number(t.amount) || 0;
    }
    return m;
  }, [data.transactions]);
  const savingsOf = (k) => (byMonth[k] ? byMonth[k].income - byMonth[k].expense : 0);

  /* award points for completed months where savings beat the previous month */
  useEffect(() => {
    if (!loaded) return;
    const now = curMonth();
    const done = [...new Set(data.transactions.map((t) => mk(t.date)))].filter((k) => k < now).sort();
    let gained = 0; const newAwards = {};
    for (const m of done) {
      if (data.awards[m]) continue;
      const s = savingsOf(m), ps = savingsOf(prevMonthKey(m));
      if (s > ps && s > 0) {
        const bonus = ps > 0 ? Math.min(100, Math.round(((s - ps) / ps) * 100)) : 50;
        const pts = 100 + bonus;
        newAwards[m] = { pts, savings: s, prev: ps };
        gained += pts;
      }
    }
    if (gained > 0) {
      setData((d) => ({ ...d, points: d.points + gained, lifetimePoints: (d.lifetimePoints || 0) + gained, awards: { ...d.awards, ...newAwards } }));
      showToast(`🏅 +${gained} points — you saved more than the month before!`, true);
    }
  }, [loaded, data.transactions]); // eslint-disable-line

  /* derived for views */
  const sym = data.currency;
  const fmt = (n, signed) => {
    const v = Number(n) || 0;
    const s = `${sym}${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
    return signed ? (v < 0 ? `−${s}` : `+${s}`) : (v < 0 ? `−${s}` : s);
  };
  const cm = curMonth();
  const thisM = byMonth[cm] || { income: 0, expense: 0 };
  const lastM = byMonth[prevMonthKey(cm)] || { income: 0, expense: 0 };
  const balance = data.transactions.reduce((a, t) => a + (t.type === "income" ? 1 : -1) * Number(t.amount), 0);
  const savedThis = thisM.income - thisM.expense;
  const savingsRate = thisM.income > 0 ? Math.round((savedThis / thisM.income) * 100) : null;

  const trend = useMemo(() => monthsBack(6).map((k) => ({
    name: monthLabel(k), Income: byMonth[k]?.income || 0, Expenses: byMonth[k]?.expense || 0, Saved: savingsOf(k),
  })), [byMonth]);

  const catSpend = useMemo(() => {
    const m = {};
    data.transactions.filter((t) => t.type === "expense" && mk(t.date) === viewMonthForPie()).forEach((t) => { m[t.category] = (m[t.category] || 0) + Number(t.amount); });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data.transactions]);
  function viewMonthForPie() { return cm; }

  const monthTx = useMemo(() => data.transactions
    .filter((t) => mk(t.date) === viewMonth)
    .filter((t) => txFilter === "all" || t.type === txFilter)
    .filter((t) => !search || (t.note + t.category).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date)), [data.transactions, viewMonth, txFilter, search]);

  /* advice engine */
  const tips = useMemo(() => {
    const out = [];
    if (data.transactions.length === 0) return out;
    if (thisM.income === 0 && thisM.expense > 0) out.push({ sev: "med", t: "No income logged this month", b: "Add your salary or other income so BrassBook can compute your savings rate and award points fairly." });
    if (savingsRate !== null) {
      if (savedThis < 0) out.push({ sev: "high", t: "Spending exceeds income", b: `You're ${fmt(-savedThis)} in the red this month. Pause non-essential categories and review the three biggest expenses below — trimming each by 20% usually closes most gaps.` });
      else if (savingsRate < 10) out.push({ sev: "med", t: `Savings rate: ${savingsRate}%`, b: "Aim for 20%. The easiest path: automate a transfer to savings on payday so it never reaches the spending account — pay yourself first." });
      else if (savingsRate >= 20) out.push({ sev: "good", t: `Strong savings rate: ${savingsRate}%`, b: "You're beating the classic 20% target. Consider parking surplus in a high-yield account or low-cost index fund so saved money earns too." });
    }
    if (catSpend[0] && thisM.expense > 0) {
      const top = catSpend[0]; const pct = Math.round((top.value / thisM.expense) * 100);
      const meta = EXP_CATS[top.name];
      if (pct >= 25 && top.name !== "Housing & Rent") out.push({ sev: "med", t: `${meta?.e || ""} ${top.name} is ${pct}% of your spending`, b: meta?.tip || "Look for one recurring cost here you can shrink." });
    }
    Object.entries(data.budgets).forEach(([cat, lim]) => {
      const spent = (catSpend.find((c) => c.name === cat) || {}).value || 0;
      if (lim > 0 && spent > lim) out.push({ sev: "high", t: `Over budget: ${cat}`, b: `Spent ${fmt(spent)} of a ${fmt(lim)} budget (${Math.round((spent / lim) * 100)}%). ${EXP_CATS[cat]?.tip || ""}` });
      else if (lim > 0 && spent > lim * 0.85) out.push({ sev: "med", t: `Approaching budget: ${cat}`, b: `At ${Math.round((spent / lim) * 100)}% with the month still running. Slow down here to finish under.` });
    });
    // 50/30/20
    if (thisM.income > 0 && thisM.expense > 0) {
      let needs = 0, wants = 0;
      data.transactions.filter((t) => t.type === "expense" && mk(t.date) === cm).forEach((t) => {
        (EXP_CATS[t.category]?.kind === "need" ? (needs += +t.amount) : (wants += +t.amount));
      });
      const nP = Math.round((needs / thisM.income) * 100), wP = Math.round((wants / thisM.income) * 100), sP = Math.max(0, 100 - nP - wP);
      out.push({ sev: wP > 30 ? "med" : "good", t: `Your 50/30/20 split: ${nP} / ${wP} / ${sP}`, b: `Rule of thumb: ≤50% needs, ≤30% wants, ≥20% saved. ${wP > 30 ? "Wants are above 30% — that's the most flexible place to trim." : "Your split is healthy. Keep the ratio as income grows."}` });
    }
    // latte factor
    const small = data.transactions.filter((t) => t.type === "expense" && mk(t.date) === cm && +t.amount <= 15);
    if (small.length >= 4) {
      const sum = small.reduce((a, t) => a + +t.amount, 0);
      out.push({ sev: "med", t: `${small.length} small purchases = ${fmt(sum)}`, b: `Tiny swipes add up: at this pace that's ~${fmt(sum * 12)} a year. Try a weekly "small treats" cap instead of cutting them entirely.` });
    }
    // subscriptions
    const subs = (catSpend.find((c) => c.name === "Subscriptions") || {}).value || 0;
    if (subs > 0) out.push({ sev: "good", t: `Subscriptions: ${fmt(subs)}/month → ${fmt(subs * 12)}/year`, b: "Seeing the yearly number changes decisions. Cancel one unused service and you've given yourself a raise." });
    // goal pacing
    data.goals.forEach((g) => {
      if (!g.deadline || g.saved >= g.target) return;
      const months = Math.max(1, Math.ceil((new Date(g.deadline) - new Date()) / (30.44 * 864e5)));
      out.push({ sev: "med", t: `${g.emoji} ${g.name}: needs ${fmt((g.target - g.saved) / months)}/month`, b: `${fmt(g.target - g.saved)} to go with ~${months} month${months > 1 ? "s" : ""} left. Automate that amount right after payday.` });
    });
    // MoM spending
    if (lastM.expense > 0 && thisM.expense > 0) {
      const diff = Math.round(((thisM.expense - lastM.expense) / lastM.expense) * 100);
      if (diff <= -10) out.push({ sev: "good", t: `Spending down ${-diff}% vs last month`, b: "Whatever you changed — keep doing it. Lower spending is the fastest route to next month's points." });
      else if (diff >= 15) out.push({ sev: "med", t: `Spending up ${diff}% vs last month`, b: "Check the category pie for what grew. One-off costs are fine; new habits deserve a second look." });
    }
    out.push({ sev: "good", t: "Build a 3–6 month emergency fund", b: "Before aggressive investing, stash 3–6 months of essential expenses in an instant-access account. It turns crises into inconveniences." });
    const order = { high: 0, med: 1, good: 2 };
    return out.sort((a, b) => order[a.sev] - order[b.sev]);
  }, [data, byMonth]); // eslint-disable-line

  /* actions */
  const saveTx = (tx) => {
    setData((d) => {
      const ex = d.transactions.find((t) => t.id === tx.id);
      return { ...d, transactions: ex ? d.transactions.map((t) => (t.id === tx.id ? tx : t)) : [...d.transactions, tx] };
    });
    setModal(null); showToast(tx.type === "income" ? "Income recorded ✓" : "Expense recorded ✓");
  };
  const delTx = (id) => { setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) })); showToast("Entry deleted"); };
  const redeem = (b) => {
    if (data.points < b.cost || data.redeemed.includes(b.id)) return;
    setData((d) => ({ ...d, points: d.points - b.cost, redeemed: [...d.redeemed, b.id] }));
    setModal({ kind: "share", payload: b });
    showToast(`🏅 ${b.name} unlocked!`, true);
  };
  const shareText = (b) => `I just unlocked the “${b.name}” badge on BrassBook 🏅 — earned by saving more money than last month. ${data.lifetimePoints || data.points} saver points and counting! 💰`;
  const nativeShare = async (b) => {
    const text = shareText(b);
    try { if (navigator.share) { await navigator.share({ title: "BrassBook badge", text }); return; } } catch (e) {}
    try { await navigator.clipboard.writeText(text); showToast("Copied — paste it anywhere!"); } catch (e) { showToast("Couldn't copy automatically"); }
  };
  const downloadPng = (b) => {
    const svg = shareSvgRef.current; if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = 800; c.height = 800;
      const ctx = c.getContext("2d");
      ctx.fillStyle = T.greenDeep; ctx.fillRect(0, 0, 800, 800);
      ctx.drawImage(img, 60, 60, 680, 680);
      c.toBlob((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = `brassbook-${b.id}.png`; a.click();
        URL.revokeObjectURL(a.href);
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  /* ── render pieces ── */
  const sevColor = { high: T.red, med: T.brass, good: T.green };

  const StatCard = ({ label, value, sub, color }) => (
    <Card pad={14} style={{ minWidth: 0 }}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 22, color: color || T.ink, marginTop: 6, overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 3 }}>{sub}</div>}
    </Card>
  );

  const TxRow = ({ t, editable }) => {
    const meta = t.type === "expense" ? EXP_CATS[t.category] : null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 2px", borderBottom: `1px dashed ${T.line}` }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: t.type === "income" ? "#E2EFE7" : "#F4E9E0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
          {t.type === "income" ? INC_CATS[t.category] || "➕" : meta?.e || "📦"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.note || t.category}</div>
          <div style={{ fontSize: 12, color: T.inkSoft }}>{t.category} · {new Date(t.date + "T12:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
        </div>
        <div style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 14, color: t.type === "income" ? T.green : T.red, whiteSpace: "nowrap" }}>
          {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
        </div>
        {editable && (
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => setModal({ kind: "tx", payload: t })} aria-label="Edit" style={{ border: "none", background: "none", fontSize: 14, color: T.inkSoft }}>✏️</button>
            <button onClick={() => delTx(t.id)} aria-label="Delete" style={{ border: "none", background: "none", fontSize: 14, color: T.inkSoft }}>🗑️</button>
          </div>
        )}
      </div>
    );
  };

  /* ── tabs ── */
  const TABS = [
    ["overview", "Overview"], ["money", "Money"], ["budgets", "Budgets"],
    ["goals", "Goals"], ["coach", "Coach"], ["rewards", "Rewards"],
  ];

  const empty = data.transactions.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: T.paper, fontFamily: T.body, color: T.ink }}>
      <style>{FONT_CSS}</style>

      {/* header */}
      <header style={{ background: T.greenDeep, color: T.cream, padding: "16px 16px 0" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: T.display, fontWeight: 800, fontSize: 26, letterSpacing: .3 }}>Brass<span style={{ color: T.brassLight }}>Book</span></div>
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.8, opacity: .75, textTransform: "uppercase" }}>Every penny accounted · every win rewarded</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div title="Saver points" style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(0,0,0,.25)", border: `1px solid ${T.brass}`, borderRadius: 99, padding: "6px 14px" }}>
                <span style={{ width: 18, height: 18, borderRadius: 99, background: `radial-gradient(circle at 35% 30%, ${T.brassLight}, ${T.brass})`, border: "1px solid #6E5114", display: "inline-block" }} />
                <span style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 15, color: T.brassLight }}>{data.points.toLocaleString()}</span>
                <span style={{ fontSize: 11, opacity: .8 }}>pts</span>
              </div>
              <select aria-label="Currency" value={data.currency} onChange={(e) => setData((d) => ({ ...d, currency: e.target.value }))}
                style={{ background: "rgba(0,0,0,.25)", color: T.cream, border: "1px solid rgba(243,235,211,.3)", borderRadius: 99, padding: "6px 8px", fontSize: 14 }}>
                {["$", "€", "£", "₹", "¥", "R", "₩", "A$"].map((c) => <option key={c} style={{ color: "#000" }}>{c}</option>)}
              </select>
            </div>
          </div>
          {/* tabs */}
          <nav style={{ display: "flex", gap: 4, marginTop: 14, overflowX: "auto", paddingBottom: 0 }}>
            {TABS.map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                border: "none", padding: "10px 14px", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap",
                background: tab === k ? T.paper : "transparent", color: tab === k ? T.greenDeep : T.cream,
                borderRadius: "12px 12px 0 0", opacity: tab === k ? 1 : .85,
              }}>{label}{k === "rewards" && data.points >= (BADGES.find((b) => !data.redeemed.includes(b.id))?.cost || Infinity) ? " ●" : ""}</button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "18px 14px 90px" }}>
        {/* ── empty state ── */}
        {empty && (
          <Card style={{ textAlign: "center", padding: 32, animation: "bbrise .3s ease" }}>
            <div style={{ fontSize: 44 }}>📒</div>
            <H size={24} style={{ margin: "10px 0 6px" }}>Open your ledger</H>
            <p style={{ color: T.inkSoft, maxWidth: 420, margin: "0 auto 18px", fontSize: 14.5, lineHeight: 1.55 }}>
              Track every bit of money in and out, set budgets and goals, get tailored advice — and earn brass points whenever you save more than the month before.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Btn kind="brass" onClick={() => setModal({ kind: "tx" })}>+ First entry</Btn>
              <Btn kind="ghost" onClick={() => { setData(sampleData()); showToast("Sample ledger loaded — explore!"); }}>Load sample data</Btn>
            </div>
          </Card>
        )}

        {/* ── OVERVIEW ── */}
        {!empty && tab === "overview" && (
          <div style={{ display: "grid", gap: 14, animation: "bbrise .25s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              <StatCard label="Net balance" value={fmt(balance)} sub="all time" color={balance < 0 ? T.red : T.ink} />
              <StatCard label="Income · this month" value={fmt(thisM.income)} color={T.green} />
              <StatCard label="Spent · this month" value={fmt(thisM.expense)} color={T.red} />
              <StatCard label="Saved · this month" value={fmt(savedThis, true)} color={savedThis >= 0 ? T.green : T.red}
                sub={savingsRate !== null ? `${savingsRate}% savings rate` : "add income to see rate"} />
            </div>

            {/* beat-last-month meter */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
                <H size={17}>Beat last month, earn points</H>
                <span style={{ fontFamily: T.mono, fontSize: 12, color: T.inkSoft }}>last month saved: {fmt(lastM.income - lastM.expense)}</span>
              </div>
              <div style={{ margin: "10px 0 6px" }}>
                <ProgressBar pct={lastM.income - lastM.expense > 0 ? (savedThis / (lastM.income - lastM.expense)) * 100 : savedThis > 0 ? 100 : 0}
                  color={savedThis > lastM.income - lastM.expense ? T.brass : T.green} />
              </div>
              <div style={{ fontSize: 13, color: T.inkSoft }}>
                {savedThis > (lastM.income - lastM.expense)
                  ? <>🏅 You're ahead of last month — finish the month like this and <b style={{ color: T.brass }}>100+ pts</b> land in your vault.</>
                  : <>Save <b>{fmt(Math.max(0, lastM.income - lastM.expense - savedThis + 1))}</b> more than you have so far to beat last month and earn points.</>}
              </div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              <Card>
                <Eyebrow>6-month flow</Eyebrow>
                <div style={{ height: 220, marginTop: 8 }}>
                  <ResponsiveContainer>
                    <ComposedChart data={trend} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke={T.line} strokeDasharray="3 5" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.inkSoft }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: T.inkSoft }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 12 }} />
                      <Bar dataKey="Income" fill={T.green} radius={[4, 4, 0, 0]} maxBarSize={22} />
                      <Bar dataKey="Expenses" fill={T.red} radius={[4, 4, 0, 0]} maxBarSize={22} opacity={.85} />
                      <Line dataKey="Saved" stroke={T.brass} strokeWidth={2.5} dot={{ r: 3, fill: T.brass }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card>
                <Eyebrow>Where this month went</Eyebrow>
                {catSpend.length === 0 ? <div style={{ color: T.inkSoft, fontSize: 13, marginTop: 12 }}>No expenses yet this month.</div> : (
                  <div style={{ height: 220, marginTop: 8 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={catSpend} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                          {catSpend.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke={T.card} />)}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} iconSize={9} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </div>

            {tips[0] && (
              <Card style={{ borderLeft: `4px solid ${sevColor[tips[0].sev]}` }}>
                <Eyebrow color={sevColor[tips[0].sev]}>Coach's top tip</Eyebrow>
                <div style={{ fontWeight: 700, marginTop: 5 }}>{tips[0].t}</div>
                <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 4, lineHeight: 1.5 }}>{tips[0].b}</div>
                <Btn small kind="ghost" style={{ marginTop: 10 }} onClick={() => setTab("coach")}>All advice →</Btn>
              </Card>
            )}

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <H size={17}>Recent entries</H>
                <Btn small kind="ghost" onClick={() => setTab("money")}>View ledger</Btn>
              </div>
              <div style={{ marginTop: 4 }}>
                {[...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((t) => <TxRow key={t.id} t={t} />)}
              </div>
            </Card>
          </div>
        )}

        {/* ── MONEY / ledger ── */}
        {!empty && tab === "money" && (
          <div style={{ display: "grid", gap: 12, animation: "bbrise .25s ease" }}>
            <Card pad={12}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Btn small kind="ghost" onClick={() => setViewMonth(prevMonthKey(viewMonth))}>←</Btn>
                <H size={17}>{monthLabel(viewMonth, true)}</H>
                <Btn small kind="ghost" disabled={viewMonth >= cm} onClick={() => { const [y, m] = viewMonth.split("-").map(Number); setViewMonth(m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`); }}>→</Btn>
              </div>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 8, fontFamily: T.mono, fontSize: 13 }}>
                <span style={{ color: T.green }}>+{fmt(byMonth[viewMonth]?.income || 0)}</span>
                <span style={{ color: T.red }}>−{fmt(byMonth[viewMonth]?.expense || 0)}</span>
                <span style={{ color: T.brass, fontWeight: 600 }}>net {fmt(savingsOf(viewMonth), true)}</span>
              </div>
            </Card>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {["all", "expense", "income"].map((f) => (
                <button key={f} onClick={() => setTxFilter(f)} style={{
                  borderRadius: 99, padding: "6px 14px", fontSize: 13, fontWeight: 600, border: `1px solid ${txFilter === f ? T.greenDeep : T.line}`,
                  background: txFilter === f ? T.greenDeep : T.card, color: txFilter === f ? T.cream : T.ink,
                }}>{f === "all" ? "All" : f === "expense" ? "Expenses" : "Income"}</button>
              ))}
              <input placeholder="Search notes…" value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ ...inputStyle, width: "auto", flex: 1, minWidth: 130, padding: "7px 12px", fontSize: 13, borderRadius: 99 }} />
            </div>
            <Card>
              {monthTx.length === 0
                ? <div style={{ color: T.inkSoft, fontSize: 14, textAlign: "center", padding: 18 }}>Nothing recorded for this view yet.</div>
                : monthTx.map((t) => <TxRow key={t.id} t={t} editable />)}
            </Card>
          </div>
        )}

        {/* ── BUDGETS ── */}
        {!empty && tab === "budgets" && (
          <div style={{ display: "grid", gap: 12, animation: "bbrise .25s ease" }}>
            <Card>
              <H size={18}>Monthly budgets</H>
              <p style={{ fontSize: 13, color: T.inkSoft, margin: "4px 0 14px" }}>Set a ceiling per category. The Coach warns you before you blow through it.</p>
              {Object.keys(data.budgets).length === 0 && <div style={{ fontSize: 13.5, color: T.inkSoft, marginBottom: 10 }}>No budgets yet — add your first below.</div>}
              {Object.entries(data.budgets).map(([cat, lim]) => {
                const spent = (catSpend.find((c) => c.name === cat) || {}).value || 0;
                const pct = lim > 0 ? (spent / lim) * 100 : 0;
                const col = pct > 100 ? T.red : pct > 85 ? T.brass : T.green;
                return (
                  <div key={cat} style={{ padding: "10px 0", borderBottom: `1px dashed ${T.line}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{EXP_CATS[cat]?.e} {cat}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: T.mono, fontSize: 12.5, color: col }}>{fmt(spent)} / {fmt(lim)}</span>
                        <button aria-label={`Remove ${cat} budget`} onClick={() => setData((d) => { const b = { ...d.budgets }; delete b[cat]; return { ...d, budgets: b }; })}
                          style={{ border: "none", background: "none", color: T.inkSoft, fontSize: 13 }}>✕</button>
                      </div>
                    </div>
                    <ProgressBar pct={pct} color={col} />
                  </div>
                );
              })}
              <BudgetAdder data={data} setData={setData} sym={sym} />
            </Card>
          </div>
        )}

        {/* ── GOALS ── */}
        {!empty && tab === "goals" && (
          <div style={{ display: "grid", gap: 12, animation: "bbrise .25s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <H size={18}>Savings goals</H>
              <Btn small kind="brass" onClick={() => setModal({ kind: "goal" })}>+ New goal</Btn>
            </div>
            {data.goals.length === 0 && <Card style={{ textAlign: "center", color: T.inkSoft, fontSize: 14 }}>Give your savings a destination — an emergency fund is the classic first goal. 🛟</Card>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
              {data.goals.map((g) => {
                const pct = g.target > 0 ? (g.saved / g.target) * 100 : 0;
                const done = g.saved >= g.target;
                return (
                  <Card key={g.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 26 }}>{g.emoji || "🎯"}</div>
                      <button aria-label="Delete goal" onClick={() => setData((d) => ({ ...d, goals: d.goals.filter((x) => x.id !== g.id) }))}
                        style={{ border: "none", background: "none", color: T.inkSoft }}>✕</button>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{g.name}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 13, color: T.inkSoft, margin: "6px 0 8px" }}>
                      {fmt(g.saved)} <span style={{ opacity: .6 }}>of {fmt(g.target)}</span>
                      {g.deadline && <span style={{ fontSize: 11 }}> · by {new Date(g.deadline + "T12:00").toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>}
                    </div>
                    <ProgressBar pct={pct} color={done ? T.brass : T.green} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                      <span style={{ fontSize: 12, color: done ? T.brass : T.inkSoft, fontWeight: done ? 700 : 400 }}>{done ? "🎉 Funded!" : `${Math.round(pct)}%`}</span>
                      {!done && <Btn small kind="ghost" onClick={() => setModal({ kind: "fund", payload: g })}>Add funds</Btn>}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── COACH ── */}
        {!empty && tab === "coach" && (
          <div style={{ display: "grid", gap: 10, animation: "bbrise .25s ease" }}>
            <H size={18}>Money coach</H>
            <p style={{ fontSize: 13, color: T.inkSoft, margin: "-4px 0 4px" }}>Advice generated from your own ledger — it updates as you log.</p>
            {tips.map((tip, i) => (
              <Card key={i} style={{ borderLeft: `4px solid ${sevColor[tip.sev]}` }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <span style={{ fontSize: 15 }}>{tip.sev === "high" ? "⚠️" : tip.sev === "med" ? "💡" : "✅"}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{tip.t}</div>
                    <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 3, lineHeight: 1.55 }}>{tip.b}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── REWARDS ── */}
        {!empty && tab === "rewards" && (
          <div style={{ display: "grid", gap: 14, animation: "bbrise .25s ease" }}>
            <Card style={{ background: T.greenDeep, border: "none", color: T.cream }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <div>
                  <Eyebrow color={T.brassLight}>Saver points</Eyebrow>
                  <div style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 34, color: T.brassLight }}>{data.points.toLocaleString()}</div>
                  <div style={{ fontSize: 12, opacity: .8 }}>lifetime earned: {(data.lifetimePoints || 0).toLocaleString()} pts</div>
                </div>
                <div style={{ fontSize: 12.5, maxWidth: 280, lineHeight: 1.55, opacity: .9 }}>
                  Finish a month having saved <b>more than the previous month</b> and you earn <b style={{ color: T.brassLight }}>100 pts + a bonus</b> for how much you improved. Spend points to mint badges below.
                </div>
              </div>
            </Card>

            {Object.keys(data.awards).length > 0 && (
              <Card>
                <H size={16}>Savings wins</H>
                {Object.entries(data.awards).sort((a, b) => b[0].localeCompare(a[0])).map(([m, a]) => (
                  <div key={m} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px dashed ${T.line}`, fontSize: 13.5 }}>
                    <span>🏅 {monthLabel(m, true)} — saved {fmt(a.savings)} (prev {fmt(a.prev)})</span>
                    <span style={{ fontFamily: T.mono, color: T.brass, fontWeight: 600 }}>+{a.pts}</span>
                  </div>
                ))}
              </Card>
            )}

            <div>
              <H size={18} style={{ marginBottom: 4 }}>Badge mint</H>
              <p style={{ fontSize: 13, color: T.inkSoft, margin: "0 0 12px" }}>Redeem points for guild medallions, then share them anywhere.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 12 }}>
                {BADGES.map((b) => {
                  const owned = data.redeemed.includes(b.id);
                  const afford = data.points >= b.cost;
                  return (
                    <Card key={b.id} pad={12} style={{ textAlign: "center", border: owned ? `1.5px solid ${T.brass}` : `1px solid ${T.line}` }}>
                      <Medallion badge={b} size={120} locked={!owned} />
                      <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 6 }}>{b.name}</div>
                      <div style={{ fontSize: 11.5, color: T.inkSoft, minHeight: 30, lineHeight: 1.4, margin: "2px 0 8px" }}>{b.blurb}</div>
                      {owned
                        ? <Btn small kind="brass" style={{ width: "100%" }} onClick={() => setModal({ kind: "share", payload: b })}>Share 📣</Btn>
                        : <Btn small kind={afford ? "primary" : "ghost"} disabled={!afford} style={{ width: "100%" }} onClick={() => redeem(b)}>
                            {afford ? `Redeem · ${b.cost} pts` : `${b.cost} pts`}
                          </Btn>}
                    </Card>
                  );
                })}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <Btn small kind="danger" onClick={() => setModal({ kind: "reset" })}>Reset all data</Btn>
            </div>
          </div>
        )}
      </main>

      {/* floating add button */}
      {!empty && (
        <button onClick={() => setModal({ kind: "tx" })} aria-label="Add entry" style={{
          position: "fixed", right: 18, bottom: 18, width: 58, height: 58, borderRadius: 99, border: `2px solid ${T.brass}`,
          background: `linear-gradient(180deg, ${T.brassLight}, ${T.brass})`, color: "#3A2C08", fontSize: 28, fontWeight: 700,
          boxShadow: "0 6px 16px rgba(21,36,28,.35)", zIndex: 40,
        }}>+</button>
      )}

      {/* toast */}
      {toast && (
        <div style={{
          position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 88, zIndex: 60, animation: "bbpop .3s ease",
          background: toast.brass ? `linear-gradient(180deg, ${T.brassLight}, ${T.brass})` : T.greenDeep,
          color: toast.brass ? "#3A2C08" : T.cream, fontWeight: 600, fontSize: 13.5, padding: "10px 18px", borderRadius: 99,
          boxShadow: "0 6px 16px rgba(21,36,28,.3)", maxWidth: "90vw", textAlign: "center",
        }}>{toast.msg}</div>
      )}

      {/* modals */}
      {modal?.kind === "tx" && <TxModal initial={modal.payload} sym={sym} onSave={saveTx} onClose={() => setModal(null)} />}
      {modal?.kind === "goal" && <GoalModal onClose={() => setModal(null)} onSave={(g) => { setData((d) => ({ ...d, goals: [...d.goals, g] })); setModal(null); showToast("Goal created 🎯"); }} />}
      {modal?.kind === "fund" && <FundModal goal={modal.payload} sym={sym} onClose={() => setModal(null)}
        onSave={(amt) => { setData((d) => ({ ...d, goals: d.goals.map((g) => g.id === modal.payload.id ? { ...g, saved: g.saved + amt } : g) })); setModal(null); showToast("Funds added 💪"); }} />}
      {modal?.kind === "reset" && (
        <Modal title="Reset everything?" onClose={() => setModal(null)}>
          <p style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.55 }}>This permanently deletes all transactions, budgets, goals, points and badges. There's no undo.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn kind="ghost" onClick={() => setModal(null)}>Keep my data</Btn>
            <Btn kind="danger" onClick={async () => { setData(EMPTY); setModal(null); try { await window.storage?.delete(STORAGE_KEY); } catch (e) {} showToast("Ledger cleared"); }}>Reset</Btn>
          </div>
        </Modal>
      )}
      {modal?.kind === "share" && (
        <Modal title="Share your badge" onClose={() => setModal(null)} wide>
          <div style={{ textAlign: "center" }}>
            <div style={{ background: T.greenDeep, borderRadius: 14, padding: 20, display: "inline-block" }}>
              <Medallion ref={shareSvgRef} badge={modal.payload} size={200} />
            </div>
            <div style={{ fontWeight: 700, margin: "12px 0 2px" }}>{modal.payload.name}</div>
            <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 14 }}>{modal.payload.blurb}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <Btn small kind="brass" onClick={() => nativeShare(modal.payload)}>📣 Share</Btn>
              <Btn small kind="ghost" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText(modal.payload))}`, "_blank")}>𝕏 Post</Btn>
              <Btn small kind="ghost" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText(modal.payload))}`, "_blank")}>WhatsApp</Btn>
              <Btn small kind="ghost" onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent("https://claude.ai")}&text=${encodeURIComponent(shareText(modal.payload))}`, "_blank")}>Telegram</Btn>
              <Btn small kind="ghost" onClick={() => downloadPng(modal.payload)}>⬇︎ PNG for socials</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ───────────────────────── sub-forms ───────────────────────── */
function BudgetAdder({ data, setData, sym }) {
  const [cat, setCat] = useState("");
  const [amt, setAmt] = useState("");
  const free = Object.keys(EXP_CATS).filter((c) => !(c in data.budgets));
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
      <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ ...inputStyle, flex: 2, minWidth: 140 }}>
        <option value="">Choose category…</option>
        {free.map((c) => <option key={c} value={c}>{EXP_CATS[c].e} {c}</option>)}
      </select>
      <input type="number" min="1" placeholder={`${sym} limit`} value={amt} onChange={(e) => setAmt(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 90 }} />
      <Btn kind="primary" disabled={!cat || !(+amt > 0)} onClick={() => { setData((d) => ({ ...d, budgets: { ...d.budgets, [cat]: +amt } })); setCat(""); setAmt(""); }}>Set</Btn>
    </div>
  );
}

function TxModal({ initial, sym, onSave, onClose }) {
  const [type, setType] = useState(initial?.type || "expense");
  const [amount, setAmount] = useState(initial?.amount || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [date, setDate] = useState(initial?.date || todayStr());
  const [note, setNote] = useState(initial?.note || "");
  const cats = type === "expense" ? Object.keys(EXP_CATS) : Object.keys(INC_CATS);
  const valid = +amount > 0 && category && date;
  return (
    <Modal title={initial ? "Edit entry" : "New entry"} onClose={onClose}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["expense", "income"].map((tp) => (
          <button key={tp} onClick={() => { setType(tp); setCategory(""); }} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, fontWeight: 700, fontSize: 14,
            border: `1.5px solid ${type === tp ? (tp === "income" ? T.green : T.red) : T.line}`,
            background: type === tp ? (tp === "income" ? "#E2EFE7" : "#F4E9E0") : "#fff",
            color: type === tp ? (tp === "income" ? T.green : T.red) : T.inkSoft,
          }}>{tp === "income" ? "↑ Income" : "↓ Expense"}</button>
        ))}
      </div>
      <Field label={`Amount (${sym})`}>
        <input type="number" min="0" step="0.01" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...inputStyle, fontFamily: T.mono, fontSize: 18 }} placeholder="0.00" />
      </Field>
      <Field label="Category">
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
          <option value="">Select…</option>
          {cats.map((c) => <option key={c} value={c}>{(type === "expense" ? EXP_CATS[c].e : INC_CATS[c])} {c}</option>)}
        </select>
      </Field>
      <Field label="Date"><input type="date" max={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} /></Field>
      <Field label="Note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={60} style={inputStyle} placeholder="e.g. Friday groceries" /></Field>
      <Btn kind="brass" disabled={!valid} style={{ width: "100%" }}
        onClick={() => onSave({ id: initial?.id || uid(), type, amount: +amount, category, date, note: note.trim() })}>
        {initial ? "Save changes" : "Record it"}
      </Btn>
    </Modal>
  );
}

function GoalModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  return (
    <Modal title="New savings goal" onClose={onClose}>
      <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="e.g. Emergency fund" maxLength={32} /></Field>
      <Field label="Target amount"><input type="number" min="1" value={target} onChange={(e) => setTarget(e.target.value)} style={{ ...inputStyle, fontFamily: T.mono }} /></Field>
      <Field label="Deadline (optional)"><input type="date" min={todayStr()} value={deadline} onChange={(e) => setDeadline(e.target.value)} style={inputStyle} /></Field>
      <Field label="Icon">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["🎯", "🛟", "🏠", "🚗", "✈️", "💍", "🎓", "💻", "🐾", "🗻"].map((e) => (
            <button key={e} onClick={() => setEmoji(e)} style={{ fontSize: 20, padding: 6, borderRadius: 8, border: `1.5px solid ${emoji === e ? T.brass : T.line}`, background: emoji === e ? "#FBF3DC" : "#fff" }}>{e}</button>
          ))}
        </div>
      </Field>
      <Btn kind="brass" disabled={!name.trim() || !(+target > 0)} style={{ width: "100%" }}
        onClick={() => onSave({ id: uid(), name: name.trim(), target: +target, saved: 0, deadline, emoji })}>Create goal</Btn>
    </Modal>
  );
}

function FundModal({ goal, sym, onSave, onClose }) {
  const [amt, setAmt] = useState("");
  const left = goal.target - goal.saved;
  return (
    <Modal title={`Add to ${goal.emoji} ${goal.name}`} onClose={onClose}>
      <p style={{ fontSize: 13, color: T.inkSoft, marginTop: 0 }}>{`${sym}${left.toLocaleString()} left to reach the target.`}</p>
      <Field label={`Amount (${sym})`}>
        <input type="number" min="0.01" step="0.01" autoFocus value={amt} onChange={(e) => setAmt(e.target.value)} style={{ ...inputStyle, fontFamily: T.mono, fontSize: 18 }} />
      </Field>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[25, 50, 100].map((q) => <Btn key={q} small kind="ghost" onClick={() => setAmt(String(q))}>{sym}{q}</Btn>)}
        <Btn small kind="ghost" onClick={() => setAmt(String(left))}>Fill it</Btn>
      </div>
      <Btn kind="brass" disabled={!(+amt > 0)} style={{ width: "100%" }} onClick={() => onSave(+amt)}>Add funds</Btn>
    </Modal>
  );
}
