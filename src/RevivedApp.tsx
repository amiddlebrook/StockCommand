import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, BrainCircuit, CheckCircle2, ChevronDown, CircleAlert, Clock3, Command, ExternalLink, Layers3, LoaderCircle, Plus, RefreshCcw, Search, ShieldCheck, Sparkles, Trash2, TrendingUp, Wallet, X } from "lucide-react";
import "./revived.css";

type Candle = { date: string; close: number };
type Quote = { symbol: string; name: string; price: number; change: number; changePercent: number; previousClose: number; history: Candle[]; asOf: string; source: string; delayed: boolean };
type Position = { symbol: string; shares: number; cost: number };
type View = "overview" | "portfolio" | "research";
type Brief = { narrative: string; aiUsed: boolean; indicators: { sma20: number | null; sma50: number | null; rsi14: number | null }; quote: Quote };
const START_SYMBOLS = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "TSLA"];
const formatUSD = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
const compact = (n: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
const signed = (n: number) => (n > 0 ? "+" : "") + n.toFixed(2) + "%";
const fmtDate = (iso: string) => { const d = new Date(iso + "T12:00:00Z"); return Number.isNaN(d.valueOf()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }); };
function useSaved<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : initial; } catch { return initial; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue];
}
const PriceChange = ({ value }: { value: number }) => <span className={value >= 0 ? "positive" : "negative"}>{value >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{signed(value)}</span>;
const Empty = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => <div className="empty">{icon}<strong>{title}</strong><p>{text}</p></div>;
function App() {
  const [watch, setWatch] = useSaved<string[]>("stockcommand.watch.v3", START_SYMBOLS);
  const [positions, setPositions] = useSaved<Position[]>("stockcommand.paper.v3", []);
  const [view, setView] = useState<View>("overview");
  const [active, setActive] = useState("AAPL");
  const [input, setInput] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [cost, setCost] = useState("");
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [refreshed, setRefreshed] = useState<Date | null>(null);
  const [range, setRange] = useState<"1M" | "3M" | "1Y">("3M");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [briefPending, setBriefPending] = useState(false);
  const [briefError, setBriefError] = useState("");
  const [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const allSymbols = useMemo(() => [...new Set([...watch, ...positions.map(p => p.symbol), active])].slice(0, 12), [watch, positions, active]);
  const symbolKey = allSymbols.join(",");
  const refresh = useCallback(async () => {
    if (!symbolKey) return;
    setPending(true);
    try {
      const response = await fetch("/api/market?symbols=" + encodeURIComponent(symbolKey));
      if (!response.ok) throw new Error("Market API returned " + response.status);
      const payload = await response.json() as { quotes?: Record<string, Quote>; errors?: Record<string, string> };
      setQuotes(prev => ({ ...prev, ...payload.quotes }));
      setErrors(payload.errors || {});
      setRefreshed(new Date());
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to fetch market data");
    } finally { setPending(false); }
  }, [symbolKey]);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key === "Escape") searchRef.current?.blur();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  useEffect(() => { setBrief(null); setBriefError(""); }, [active]);
  const selected = quotes[active];
  const ordered = watch.filter(s => typeof s === "string");
  const data = useMemo(() => {
    if (!selected?.history) return [];
    const days = range === "1M" ? 31 : range === "3M" ? 93 : 370;
    const cutoff = Date.now() - days * 86400000;
    return selected.history.filter(p => Date.parse(p.date + "T00:00:00Z") >= cutoff);
  }, [selected, range]);
  const firstPrice = data[0]?.close;
  const periodChange = selected && firstPrice ? (selected.price - firstPrice) / firstPrice * 100 : null;
  const valuation = positions.reduce((sum, p) => sum + (quotes[p.symbol]?.price || 0) * p.shares, 0);
  const invested = positions.reduce((sum, p) => sum + p.shares * p.cost, 0);
  const pnl = valuation - invested;
  const pricedPositions = positions.filter(p => quotes[p.symbol]);
  const resolved = ordered.filter(s => quotes[s]).length;
  const gainers = ordered.filter(s => quotes[s]).sort((a, b) => quotes[b].changePercent - quotes[a].changePercent);
  function addSymbol(value = input) {
    const next = value.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(next)) { setNotice("Enter a valid ticker, such as AAPL or MSFT."); return; }
    if (!watch.includes(next) && watch.length >= 12) { setNotice("Watchlist supports up to 12 symbols on the free dashboard."); return; }
    if (!watch.includes(next)) setWatch(previous => [...previous, next]);
    setActive(next); setInput(""); setNotice("");
  }
  function addPosition(event: React.FormEvent) {
    event.preventDefault();
    const symbol = active.toUpperCase();
    const shares = Number(quantity), price = Number(cost);
    if (!Number.isFinite(shares) || shares <= 0 || !Number.isFinite(price) || price <= 0) { setNotice("Enter positive shares and purchase price."); return; }
    setPositions(previous => {
      const matching = previous.find(p => p.symbol === symbol);
      if (!matching) return [...previous, { symbol, shares, cost: price }];
      const combined = matching.shares + shares;
      return previous.map(p => p.symbol === symbol ? { symbol, shares: combined, cost: (matching.shares * matching.cost + shares * price) / combined } : p);
    });
    if (!watch.includes(symbol) && watch.length < 12) setWatch(prev => [...prev, symbol]);
    setCost(""); setNotice("Paper position saved locally.");
  }
  async function analyze(symbol = active) {
    setBriefPending(true); setBriefError(""); setBrief(null);
    try {
      const response = await fetch("/api/brief", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ symbol }) });
      const payload = await response.json() as Brief & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Research API unavailable");
      setBrief(payload);
    } catch (error) { setBriefError(error instanceof Error ? error.message : "Unable to generate brief"); }
    finally { setBriefPending(false); }
  }
  const NavButton = ({ id, label, icon }: { id: View; label: string; icon: React.ReactNode }) => <button className={"nav-button " + (view === id ? "is-active" : "")} onClick={() => setView(id)}>{icon}<span>{label}</span>{view === id && <span className="nav-indicator" />}</button>;
  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => setView("overview")} aria-label="StockCommand home"><div className="brand-mark"><Activity size={23} strokeWidth={2.5} /></div><div><strong>StockCommand</strong><small>MARKET INTELLIGENCE</small></div></button>
      <div className="side-section">WORKSPACE</div>
      <nav aria-label="Primary navigation">
        <NavButton id="overview" label="Overview" icon={<BarChart3 size={18} />} />
        <NavButton id="portfolio" label="Paper Portfolio" icon={<Wallet size={18} />} />
        <NavButton id="research" label="AI Research" icon={<BrainCircuit size={18} />} />
      </nav>
      <div className="side-section side-section-watch">MY WATCHLIST <span>{watch.length}/12</span></div>
      <div className="side-watch">
        {ordered.map(symbol => <button key={symbol} className={"side-symbol " + (active === symbol ? "is-selected" : "")} onClick={() => { setActive(symbol); setView("overview"); }}><span className="symbol-avatar">{symbol.slice(0, 1)}</span><span>{symbol}</span>{quotes[symbol] && <span className={quotes[symbol].changePercent >= 0 ? "small-positive" : "small-negative"}>{signed(quotes[symbol].changePercent)}</span>}</button>)}
      </div>
      <div className="sidebar-bottom"><div className="service-pill"><span className="online-dot" /> CLOUDFLARE EDGE</div><p>Zero subscription fees. Paper positions stay on this device.</p><a href="https://github.com/amiddlebrook/StockCommand" target="_blank" rel="noreferrer">Source on GitHub <ExternalLink size={13} /></a></div>
    </aside>
    <div className="main">
      <header className="topbar">
        <div className="breadcrumbs"><span>Workspace</span><span className="slash">/</span><strong>{view === "overview" ? "Market overview" : view === "portfolio" ? "Paper portfolio" : "AI research"}</strong></div>
        <div className="top-actions"><div className="top-search"><Search size={16} /><input ref={searchRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addSymbol()} placeholder="Add ticker..." aria-label="Add ticker" /><kbd>⌘ K</kbd><button title="Add ticker to watchlist" onClick={() => addSymbol()}><Plus size={17} /></button></div><button className="icon-btn refresh-btn" onClick={() => void refresh()} aria-label="Refresh market data" title="Refresh market data" disabled={pending}><RefreshCw size={18} className={pending ? "spinning" : ""} /></button></div>
      </header>
      <main className="content">
        {notice && <div className="notice" role="status"><CircleAlert size={16} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={15} /></button></div>}
        {view === "overview" && <>
          <div className="page-heading"><div><div className="eyebrow"><span className="blue-dot" /> YOUR TRADING WORKSPACE</div><h1>Market overview<span className="heading-period">.</span></h1><p>Follow the market. See the signal. Do your own research.</p></div><button className="btn primary" onClick={() => { setView("research"); void analyze(); }}><Sparkles size={16} /> Generate brief <ArrowRight size={16} /></button></div>
          <div className="stats-grid">
            <div className="stat-card"><span className="stat-label"><Layers3 size={16} /> Tracked assets</span><strong>{watch.length.toString().padStart(2, "0")}</strong><div className="stat-footer">{resolved} with available market data</div></div>
            <div className="stat-card"><span className="stat-label"><TrendingUp size={16} /> Top mover</span><strong>{gainers[0] && quotes[gainers[0]] ? gainers[0] : "—"}</strong><div className="stat-footer">{gainers[0] && quotes[gainers[0]] ? <PriceChange value={quotes[gainers[0]].changePercent} /> : "Waiting for prices"}</div></div>
            <div className="stat-card"><span className="stat-label"><Wallet size={16} /> Paper portfolio</span><strong>{pricedPositions.length ? formatUSD(valuation) : positions.length ? "Unavailable" : "No positions"}</strong><div className="stat-footer">{positions.length} saved position{positions.length === 1 ? "" : "s"}</div></div>
            <div className="stat-card"><span className="stat-label"><ShieldCheck size={16} /> Data integrity</span><strong className="status-value">DELAYED</strong><div className="stat-footer">Source-attributed, no simulated prices</div></div>
          </div>
          <div className="dashboard-grid">
            <section className="panel chart-panel">
              <div className="panel-head"><div><span className="eyebrow">PRICE HISTORY</span><div className="chart-title"><h2>{selected?.name || active}</h2><span className="symbol-chip">{active}</span></div></div><div className="time-tabs">{(["1M", "3M", "1Y"] as const).map(r => <button key={r} className={range === r ? "selected" : ""} onClick={() => setRange(r)}>{r}</button>)}</div></div>
              <div className="price-line"><strong>{selected ? formatUSD(selected.price) : "Price unavailable"}</strong>{selected && <PriceChange value={selected.changePercent} />}</div>
              <div className="price-meta">{selected ? "As of " + fmtDate(selected.asOf) + " · " + selected.source : errors[active] ? "The public feed is temporarily unavailable." : "Fetching prices from free sources..."}</div>
              <div className="chart-space">{data.length > 1 ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 18, right: 5, left: -17, bottom: 3 }}><defs><linearGradient id="price-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3c83ff" stopOpacity={0.23} /><stop offset="95%" stopColor="#3c83ff" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#222b3b" strokeDasharray="3 6" vertical={false} /><XAxis dataKey="date" tickFormatter={fmtDate} minTickGap={27} tickLine={false} axisLine={false} tick={{ fill: "#8190a7", fontSize: 11 }} /><YAxis domain={["auto", "auto"]} tickFormatter={v => "$" + v.toFixed(0)} tickLine={false} axisLine={false} tick={{ fill: "#8190a7", fontSize: 11 }} width={65} /><Tooltip contentStyle={{ background: "#141e2e", border: "1px solid #2b3c56", borderRadius: 10, color: "#f7f9fd" }} formatter={v => [formatUSD(Number(v)), "Close"]} labelFormatter={fmtDate} /><Area type="monotone" dataKey="close" stroke="#5795ff" strokeWidth={2.6} fill="url(#price-area)" isAnimationActive={false} /></AreaChart></ResponsiveContainer> : <Empty icon={<BarChart3 size={27} />} title="Chart waiting for data" text={errors[active] ? "Both free market feeds are unavailable for this symbol." : "The price series will appear when a provider responds."} />}</div>
              <div className="chart-foot"><span><Clock3 size={13} /> Historical daily closes · not real-time</span><span>{periodChange === null ? "—" : signed(periodChange)} {range} performance</span></div>
            </section>
            <section className="panel focus-panel"><div className="panel-head"><div><span className="eyebrow">RESEARCH DESK</span><h2>Asset focus</h2></div><BrainCircuit size={19} className="subtle-icon" /></div>
              <div className="focus-badge">{active.slice(0, 2)}</div><h3>{selected?.name || active}</h3><p>Daily pricing, watchlist activity, and quantitative indicators in one focused view.</p>
              <div className="focus-stats"><div><span>Latest close</span><strong>{selected ? formatUSD(selected.price) : "—"}</strong></div><div><span>Daily movement</span><strong>{selected ? signed(selected.changePercent) : "—"}</strong></div><div><span>Previous close</span><strong>{selected ? formatUSD(selected.previousClose) : "—"}</strong></div><div><span>Price source</span><strong>{selected ? selected.source.split(" (")[0] : "Offline"}</strong></div></div>
              <button className="btn outlined full" onClick={() => { setView("research"); void analyze(); }}><Sparkles size={16} /> Analyze {active} <ArrowRight size={15} /></button>
            </section>
          </div>
          <section className="panel watch-panel"><div className="panel-head"><div><span className="eyebrow">CUSTOM MONITOR</span><h2>Watchlist</h2></div><span className="panel-helper">{refreshed ? "Updated " + refreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Checking market feeds..."}</span></div>
            <div className="table-scroll"><table className="stock-table"><thead><tr><th>Asset</th><th>Last price</th><th>Change</th><th>Last session</th><th>Source</th><th className="right">Actions</th></tr></thead><tbody>{ordered.map(symbol => { const q = quotes[symbol]; return <tr key={symbol} className={active === symbol ? "highlight-row" : ""} onClick={() => setActive(symbol)}><td><div className="cell-symbol"><span className="symbol-avatar">{symbol.slice(0, 1)}</span><span><strong>{symbol}</strong><small>{q?.name || (errors[symbol] ? "Feed unavailable" : "Fetching...")}</small></span></div></td><td className="price-cell">{q ? formatUSD(q.price) : "—"}</td><td>{q ? <PriceChange value={q.changePercent} /> : <span className="muted">—</span>}</td><td className="muted">{q ? fmtDate(q.asOf) : "—"}</td><td className="muted">{q ? q.source.split(" (")[0] : "—"}</td><td className="right"><button className="tiny-button" onClick={e => { e.stopPropagation(); setActive(symbol); setView("research"); void analyze(symbol); }} title={"Research " + symbol}><Sparkles size={15} /></button><button className="tiny-button" onClick={e => { e.stopPropagation(); setWatch(prev => prev.filter(s => s !== symbol)); }} title={"Remove " + symbol}><X size={15} /></button></td></tr>; })}</tbody></table></div>
          </section>
        </>}
        {view === "portfolio" && <>
          <div className="page-heading"><div><div className="eyebrow"><span className="blue-dot" /> LOCAL SIMULATION</div><h1>Paper portfolio<span className="heading-period">.</span></h1><p>Track hypothetical positions. Nothing here places a real trade.</p></div></div>
          <div className="stats-grid portfolio-stats"><div className="stat-card"><span className="stat-label">Market value</span><strong>{pricedPositions.length ? formatUSD(valuation) : "—"}</strong><div className="stat-footer">Delayed indicative pricing</div></div><div className="stat-card"><span className="stat-label">Cost basis</span><strong>{positions.length ? formatUSD(invested) : "—"}</strong><div className="stat-footer">Original average purchase prices</div></div><div className="stat-card"><span className="stat-label">Unrealized P/L</span><strong className={pnl >= 0 ? "gain" : "loss"}>{pricedPositions.length === positions.length && positions.length ? formatUSD(pnl) : "—"}</strong><div className="stat-footer">Excludes fees and taxes</div></div><div className="stat-card"><span className="stat-label">Positions</span><strong>{positions.length}</strong><div className="stat-footer">Saved in browser storage</div></div></div>
          <div className="portfolio-grid"><section className="panel"><div className="panel-head"><div><span className="eyebrow">SIMULATED HOLDINGS</span><h2>Positions</h2></div></div>{positions.length ? <div className="table-scroll"><table className="stock-table"><thead><tr><th>Symbol</th><th>Shares</th><th>Cost / share</th><th>Market price</th><th>P/L</th><th></th></tr></thead><tbody>{positions.map(p => { const q = quotes[p.symbol]; const value = q ? (q.price - p.cost) * p.shares : null; return <tr key={p.symbol}><td><strong>{p.symbol}</strong></td><td>{compact(p.shares)}</td><td>{formatUSD(p.cost)}</td><td>{q ? formatUSD(q.price) : "—"}</td><td>{value === null ? "—" : <span className={value >= 0 ? "positive" : "negative"}>{formatUSD(value)}</span>}</td><td><button className="tiny-button" onClick={() => setPositions(previous => previous.filter(x => x.symbol !== p.symbol))} aria-label={"Remove " + p.symbol}><Trash2 size={15} /></button></td></tr>; })}</tbody></table></div> : <Empty icon={<Wallet size={28} />} title="No paper positions yet" text="Add a hypothetical position to see cost basis and mark-to-market performance." />}</section>
            <section className="panel"><div className="panel-head"><div><span className="eyebrow">PAPER TRADE</span><h2>Add position</h2></div></div><form className="position-form" onSubmit={addPosition}><label>Selected ticker<select value={active} onChange={e => setActive(e.target.value)}>{allSymbols.map(s => <option key={s}>{s}</option>)}</select></label><label>Number of shares<input type="number" min="0.000001" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} required /></label><label>Average purchase price (USD)<input type="number" min="0.01" step="any" value={cost} onChange={e => setCost(e.target.value)} placeholder="e.g. 175.50" required /></label><button className="btn primary full" type="submit"><Plus size={16} /> Save paper trade</button></form><p className="muted micro-note">Local-only demo. No brokerage connection, orders, or trading permissions.</p></section>
          </div>
        </>}
        {view === "research" && <>
          <div className="page-heading"><div><div className="eyebrow"><span className="blue-dot" /> CLOUDFLARE WORKERS AI</div><h1>Research terminal<span className="heading-period">.</span></h1><p>Evidence-first market analysis. Never a fabricated quote or promise of returns.</p></div></div>
          <div className="research-grid"><section className="panel"><div className="panel-head"><div><span className="eyebrow">TARGET ASSET</span><h2>Generate a market brief</h2></div><Sparkles size={20} className="subtle-icon" /></div><div className="research-selector"><select value={active} onChange={e => setActive(e.target.value)}>{allSymbols.map(s => <option key={s} value={s}>{s}{quotes[s] ? " · " + quotes[s].name : ""}</option>)}</select><button className="btn primary" disabled={briefPending} onClick={() => void analyze()}>{briefPending ? <LoaderCircle size={16} className="spinning" /> : <BrainCircuit size={16} />}{briefPending ? "Analyzing..." : "Run analysis"}</button></div><div className="research-note"><ShieldCheck size={19} /><p>Research uses delayed, source-attributed market data and rule-based technical indicators. Cloudflare AI adds a written explanation when available within its free daily quota.</p></div>
            {briefError && <div className="inline-error"><CircleAlert size={17} />{briefError}</div>}
            {brief ? <div className="brief-output"><div className="brief-heading"><span className="signal-label">{brief.aiUsed ? "AI ASSISTED" : "DETERMINISTIC ANALYSIS"}</span><span className="muted">{brief.quote.asOf}</span></div><h3>{brief.quote.symbol} — market briefing</h3><p>{brief.narrative}</p><div className="indicator-row"><div><span>SMA 20</span><strong>{brief.indicators.sma20 === null ? "—" : formatUSD(brief.indicators.sma20)}</strong></div><div><span>SMA 50</span><strong>{brief.indicators.sma50 === null ? "—" : formatUSD(brief.indicators.sma50)}</strong></div><div><span>RSI 14</span><strong>{brief.indicators.rsi14 ?? "—"}</strong></div></div><div className="research-source">Data: {brief.quote.source} · Historical closes through {brief.quote.asOf}</div></div> : !briefPending && !briefError && <Empty icon={<BrainCircuit size={30} />} title="Ready when you are" text="Select a symbol and generate a briefing. No account or paid API key needed." />}</section>
            <section className="panel research-aside"><div className="panel-head"><div><span className="eyebrow">HOW IT WORKS</span><h2>Transparent by design</h2></div></div><div className="steps"><div><span>01</span><section><strong>Fetch price history</strong><p>Try public sources; report outages instead of guessing.</p></section></div><div><span>02</span><section><strong>Calculate indicators</strong><p>Moving averages, session change, and 14-session RSI.</p></section></div><div><span>03</span><section><strong>Explain the evidence</strong><p>Free-tier Workers AI generates a short summary when available.</p></section></div></div><div className="info-card"><CircleAlert size={19} /><p>Educational research, not financial advice. Quotes may be delayed or unavailable. Verify with an authorized exchange or broker before trading.</p></div></section>
          </div>
        </>}
        <footer><span><span className="online-dot" /> StockCommand · Open-source market workspace</span><span>{pending ? "Refreshing market data..." : "Free Cloudflare-native infrastructure"} · <a href="https://github.com/amiddlebrook/StockCommand" target="_blank" rel="noreferrer">GitHub <ExternalLink size={12} /></a></span></footer>
      </main>
    </div>
  </div>;
}
export default App;
