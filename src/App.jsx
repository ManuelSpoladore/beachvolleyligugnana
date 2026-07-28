import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "./supabaseClient";

/* ============================================================
   SAN LORENZO BEACH VOLLEY — piattaforma gironi & classifiche
   (la classifica si inserisce direttamente: partite, punti,
   set vinti/persi, punti fatti/subiti. Quoz. set, quoz. punti
   e posizione finale sono calcolati in automatico)
   ============================================================ */

const GIRONE_COLORS = {
  A: "#2FA84F",
  B: "#2E6F9E",
  C: "#8B5FBF",
  D: "#E08A2E",
  E: "#1AA5A1",
};

const SCHEDULE = {
  A: {
    day: "Lunedì 27 luglio",
    matches: [
      { id: "A1", time: "19:30", team1: "GATTINI ESPLOSIVI", team2: "CHEI DI SIL" },
      { id: "A2", time: "20:00", team1: "H2NO", team2: "BATTE FORTE IN RETE" },
      { id: "A3", time: "20:30", team1: "GATTINI ESPLOSIVI", team2: "H2NO" },
      { id: "A4", time: "21:00", team1: "CHEI DI SIL", team2: "BATTE FORTE IN RETE" },
      { id: "A5", time: "21:30", team1: "GATTINI ESPLOSIVI", team2: "BATTE FORTE IN RETE" },
      { id: "A6", time: "22:00", team1: "CHEI DI SIL", team2: "H2NO" },
    ],
  },
  B: {
    day: "Martedì 28 luglio",
    matches: [
      { id: "B1", time: "19:30", team1: "UGABUGA", team2: "SMELINDROS" },
      { id: "B2", time: "20:00", team1: "PAUL COUNTRYSIDE & F.", team2: "QUASI RACCOMANDATI" },
      { id: "B3", time: "20:30", team1: "UGABUGA", team2: "PAUL COUNTRYSIDE & F." },
      { id: "B4", time: "21:00", team1: "SMELINDROS", team2: "QUASI RACCOMANDATI" },
      { id: "B5", time: "21:30", team1: "UGABUGA", team2: "QUASI RACCOMANDATI" },
      { id: "B6", time: "22:00", team1: "SMELINDROS", team2: "PAUL COUNTRYSIDE & F." },
    ],
  },
  C: {
    day: "Mercoledì 29 luglio",
    matches: [
      { id: "C1", time: "19:00", team1: "ZIO FABBIO", team2: "I QUAQUA" },
      { id: "C2", time: "19:30", team1: "CHEI DAL VINARS", team2: "TILACINI" },
      { id: "C3", time: "20:00", team1: "ZIO FABBIO", team2: "BARCEMONA" },
      { id: "C4", time: "20:30", team1: "I QUAQUA", team2: "CHEI DAL VINARS" },
      { id: "C5", time: "21:00", team1: "TILACINI", team2: "BARCEMONA" },
      { id: "C6", time: "21:30", team1: "ZIO FABBIO", team2: "CHEI DAL VINARS" },
      { id: "C7", time: "22:00", team1: "I QUAQUA", team2: "TILACINI" },
      { id: "C8", time: "22:30", team1: "CHEI DAL VINARS", team2: "BARCEMONA" },
      { id: "C9", time: "23:00", team1: "ZIO FABBIO", team2: "TILACINI" },
      { id: "C10", time: "23:30", team1: "I QUAQUA", team2: "BARCEMONA" },
    ],
  },
  D: {
    day: "Giovedì 30 luglio",
    matches: [
      { id: "D1", time: "19:30", team1: "SQUIRTONIC", team2: "LA CARICA DEI 104" },
      { id: "D2", time: "20:00", team1: "RICK & MORTI", team2: "CEV BOYZ" },
      { id: "D3", time: "20:30", team1: "SQUIRTONIC", team2: "RICK & MORTI" },
      { id: "D4", time: "21:00", team1: "LA CARICA DEI 104", team2: "CEV BOYZ" },
      { id: "D5", time: "21:30", team1: "SQUIRTONIC", team2: "CEV BOYZ" },
      { id: "D6", time: "22:00", team1: "LA CARICA DEI 104", team2: "RICK & MORTI" },
    ],
  },
  E: {
    day: "Venerdì 31 luglio",
    matches: [
      { id: "E1", time: "19:30", team1: "ENRICO CHI?", team2: "SAE KWAN TAEKWONDO" },
      { id: "E2", time: "20:00", team1: "SAE KWAN TAEKWONDO", team2: "SIVALETTO 2.0" },
      { id: "E3", time: "20:30", team1: "GENITORI IN FUGA", team2: "SAE KWAN TAEKWONDO" },
      { id: "E4", time: "21:00", team1: "ENRICO CHI?", team2: "SIVALETTO 2.0" },
      { id: "E5", time: "21:30", team1: "GENITORI IN FUGA", team2: "SIVALETTO 2.0" },
      { id: "E6", time: "22:00", team1: "GENITORI IN FUGA", team2: "ENRICO CHI?" },
    ],
  },
};

const BRACKET_DEFAULT = [
  { id: "qf1", label: "Quarto 1", time: "19:00", teamA: "1°", teamB: "8°", score: "" },
  { id: "qf2", label: "Quarto 2", time: "19:30", teamA: "4°", teamB: "5°", score: "" },
  { id: "qf3", label: "Quarto 3", time: "20:00", teamA: "2°", teamB: "7°", score: "" },
  { id: "qf4", label: "Quarto 4", time: "20:30", teamA: "3°", teamB: "6°", score: "" },
  { id: "sf1", label: "Semifinale 1", time: "21:30", teamA: "Vinc. Q1", teamB: "Vinc. Q2", score: "" },
  { id: "sf2", label: "Semifinale 2", time: "21:30", teamA: "Vinc. Q3", teamB: "Vinc. Q4", score: "" },
  { id: "f34", label: "Finale 3°-4° posto", time: "22:00", teamA: "", teamB: "", score: "" },
  { id: "f12", label: "Finale 1°-2° posto", time: "22:30", teamA: "", teamB: "", score: "" },
];

const EMPTY_STAT = { partite: 0, punti: 0, setVinti: 0, setPersi: 0, puntiFatti: 0, puntiSubiti: 0 };

function teamsOfGirone(girone) {
  const set = new Set();
  SCHEDULE[girone].matches.forEach((m) => {
    set.add(m.team1);
    set.add(m.team2);
  });
  return Array.from(set);
}

function emptyStandingsState() {
  const state = {};
  Object.keys(SCHEDULE).forEach((g) => {
    teamsOfGirone(g).forEach((t) => {
      state[t] = { ...EMPTY_STAT };
    });
  });
  return state;
}

function fmtQ(n) {
  if (n === Infinity) return "—";
  return n.toFixed(2);
}

function withRatios(team, stat) {
  const setVinti = Number(stat?.setVinti) || 0;
  const setPersi = Number(stat?.setPersi) || 0;
  const puntiFatti = Number(stat?.puntiFatti) || 0;
  const puntiSubiti = Number(stat?.puntiSubiti) || 0;
  return {
    team,
    partite: Number(stat?.partite) || 0,
    punti: Number(stat?.punti) || 0,
    setVinti,
    setPersi,
    puntiFatti,
    puntiSubiti,
    quozSet: setPersi === 0 ? (setVinti > 0 ? Infinity : 0) : setVinti / setPersi,
    quozPunti: puntiSubiti === 0 ? (puntiFatti > 0 ? Infinity : 0) : puntiFatti / puntiSubiti,
  };
}

/* ---------- calcolo classifica (ordina, non aggrega più partite) ---------- */
function computeStandings(girone, standings) {
  const teams = teamsOfGirone(girone);
  const rows = teams.map((t) => withRatios(t, standings[t]));
  rows.sort((x, y) => {
    if (y.quozSet !== x.quozSet) return y.quozSet - x.quozSet;
    if (y.quozPunti !== x.quozPunti) return y.quozPunti - x.quozPunti;
    return x.team.localeCompare(y.team);
  });
  return rows;
}

/* ---------- elementi visivi ricorrenti ---------- */
function NetDivider({ color = "#F5B942" }) {
  return (
    <div className="net-divider" aria-hidden="true">
      <span className="net-post" style={{ background: color }} />
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="net-line">
        <line x1="0" y1="5" x2="100" y2="5" stroke={color} strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
      <span className="net-post" style={{ background: color }} />
    </div>
  );
}

function PositionFlag({ pos }) {
  const palette = { 1: "#F5B942", 2: "#C9C2B4", 3: "#FF6B4A" };
  const bg = palette[pos] || "rgba(244,236,218,0.12)";
  const dark = pos <= 3;
  return (
    <span className="pos-flag" style={{ background: bg, color: dark ? "#0E3B43" : "#100b00" }}>
      {pos}
    </span>
  );
}

/* ---------- tabella classifica (vista pubblica) ---------- */
function StandingsTable({ rows, color }) {
  return (
    <div className="standings-wrap">
      <table className="standings">
        <thead>
          <tr>
            <th></th>
            <th>Squadra</th>
            <th>PG</th>
            <th>Pt</th>
            <th>Set</th>
            <th>Q.Set</th>
            <th>Pti F/S</th>
            <th>Q.Pti</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.team}>
              <td>
                <PositionFlag pos={i + 1} />
              </td>
              <td className="team-name" style={{ borderColor: color }}>
                {r.team}
              </td>
              <td>{r.partite}</td>
              <td className="strong">{r.punti}</td>
              <td>
                {r.setVinti}-{r.setPersi}
              </td>
              <td>{fmtQ(r.quozSet)}</td>
              <td>
                {r.puntiFatti}-{r.puntiSubiti}
              </td>
              <td>{fmtQ(r.quozPunti)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- riga editabile per l'admin (una squadra) ---------- */
const STAT_FIELDS = [
  { key: "partite", label: "PG" },
  { key: "punti", label: "Punti" },
  { key: "setVinti", label: "Set V" },
  { key: "setPersi", label: "Set P" },
  { key: "puntiFatti", label: "Pti Fatti" },
  { key: "puntiSubiti", label: "Pti Subiti" },
];

function StatEditorRow({ team, stat, onCommit }) {
  const [local, setLocal] = useState(stat);

  useEffect(() => {
    setLocal(stat);
  }, [stat]);

  function commit(field, value) {
    const num = value === "" ? 0 : Number(value);
    if (Number.isNaN(num)) return;
    if (num !== stat[field]) onCommit(team, { [field]: num });
  }

  return (
    <div className="stat-editor-row">
      <span className="stat-team">{team}</span>
      <div className="stat-inputs">
        {STAT_FIELDS.map((f) => (
          <label key={f.key} className="stat-input">
            <span>{f.label}</span>
            <input
              type="number"
              min="0"
              value={local[f.key]}
              onChange={(e) => setLocal({ ...local, [f.key]: e.target.value })}
              onBlur={(e) => commit(f.key, e.target.value)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function StandingsEditor({ girone, standings, onCommit }) {
  const teams = teamsOfGirone(girone);
  return (
    <div className="stat-editor">
      <div className="stat-editor-title">Inserisci / modifica classifica — Girone {girone}</div>
      {teams.map((t) => (
        <StatEditorRow key={t} team={t} stat={standings[t] || EMPTY_STAT} onCommit={onCommit} />
      ))}
    </div>
  );
}

/* ---------- calendario partite (solo informativo) ---------- */
function ScheduleList({ girone }) {
  return (
    <div className="matches-list">
      {SCHEDULE[girone].matches.map((m) => (
        <div className="match-row" key={m.id}>
          <div className="match-row-main">
            <span className="match-time">{m.time}</span>
            <span className="match-team">{m.team1}</span>
            <span className="match-vs">vs</span>
            <span className="match-team right">{m.team2}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- vista girone ---------- */
function GironeView({ girone, standings, isAdmin, onCommit }) {
  const color = GIRONE_COLORS[girone];
  const rows = useMemo(() => computeStandings(girone, standings), [girone, standings]);
  return (
    <div>
      <div className="section-head" style={{ borderColor: color }}>
        <h2>
          Girone {girone} <span className="day-label">— {SCHEDULE[girone].day}</span>
        </h2>
      </div>
      <StandingsTable rows={rows} color={color} />
      <NetDivider color={color} />
      {isAdmin && (
        <>
          <StandingsEditor girone={girone} standings={standings} onCommit={onCommit} />
          <NetDivider color={color} />
        </>
      )}
      <ScheduleList girone={girone} />
    </div>
  );
}

/* ---------- classifica generale ---------- */
function GeneraleView({ standings }) {
  const all = Object.keys(SCHEDULE).flatMap((g) =>
    computeStandings(g, standings).map((r) => ({ ...r, girone: g }))
  );
  all.sort((x, y) => {
    if (y.quozSet !== x.quozSet) return y.quozSet - x.quozSet;
    if (y.quozPunti !== x.quozPunti) return y.quozPunti - x.quozPunti;
    return x.team.localeCompare(y.team);
  });
  return (
    <div>
      <div className="section-head" style={{ borderColor: "#F5B942" }}>
        <h2>Classifica generale</h2>
      </div>
      <div className="standings-wrap">
        <table className="standings">
          <thead>
            <tr>
              <th></th>
              <th>Squadra</th>
              <th>Girone</th>
              <th>PG</th>
              <th>Pt</th>
              <th>Set</th>
              <th>Q.Set</th>
              <th>Pti F/S</th>
              <th>Q.Pti</th>
            </tr>
          </thead>
          <tbody>
            {all.map((r, i) => (
              <tr key={r.team}>
                <td>
                  <PositionFlag pos={i + 1} />
                </td>
                <td className="team-name" style={{ borderColor: GIRONE_COLORS[r.girone] }}>
                  {r.team}
                </td>
                <td>
                  <span className="girone-chip" style={{ background: GIRONE_COLORS[r.girone] }}>
                    {r.girone}
                  </span>
                </td>
                <td>{r.partite}</td>
                <td className="strong">{r.punti}</td>
                <td>
                  {r.setVinti}-{r.setPersi}
                </td>
                <td>{fmtQ(r.quozSet)}</td>
                <td>
                  {r.puntiFatti}-{r.puntiSubiti}
                </td>
                <td>{fmtQ(r.quozPunti)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- riga tabellone finali (edit on blur) ---------- */
function BracketCard({ slot, isAdmin, onUpdate }) {
  const [local, setLocal] = useState(slot);

  useEffect(() => {
    setLocal(slot);
  }, [slot]);

  function commit(field, value) {
    if (value !== slot[field]) {
      onUpdate(slot.id, { [field]: value });
    }
  }

  return (
    <div className="bracket-card">
      <div className="bracket-top">
        <span className="bracket-label">{slot.label}</span>
        <span className="bracket-time">{slot.time}</span>
      </div>
      {isAdmin ? (
        <div className="bracket-edit">
          <input
            value={local.teamA}
            placeholder="Squadra A"
            onChange={(e) => setLocal({ ...local, teamA: e.target.value })}
            onBlur={(e) => commit("teamA", e.target.value)}
          />
          <span className="match-vs">vs</span>
          <input
            value={local.teamB}
            placeholder="Squadra B"
            onChange={(e) => setLocal({ ...local, teamB: e.target.value })}
            onBlur={(e) => commit("teamB", e.target.value)}
          />
          <input
            className="score-input"
            value={local.score}
            placeholder="Risultato"
            onChange={(e) => setLocal({ ...local, score: e.target.value })}
            onBlur={(e) => commit("score", e.target.value)}
          />
        </div>
      ) : (
        <div className="bracket-view">
          <span>{slot.teamA || "—"}</span>
          <span className="match-vs">{slot.score || "vs"}</span>
          <span>{slot.teamB || "—"}</span>
        </div>
      )}
    </div>
  );
}

/* ---------- tabellone finali ---------- */
function FinaliView({ bracket, isAdmin, onUpdate }) {
  return (
    <div>
      <div className="section-head" style={{ borderColor: "#FF6B4A" }}>
        <h2>
          Finali <span className="day-label">— Sabato 1 agosto</span>
        </h2>
      </div>
      <div className="bracket-list">
        {bracket.map((slot) => (
          <BracketCard key={slot.id} slot={slot} isAdmin={isAdmin} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
}

/* ============================================================ */
export default function App() {
  const [view, setView] = useState("girone");
  const [selectedGirone, setSelectedGirone] = useState("A");
  const [standings, setStandings] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [pwInput, setPwInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [saveError, setSaveError] = useState(false);

  // sessione admin
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAdmin(!!data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // caricamento dati torneo
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data, error } = await supabase.from("standings").select("*");
        if (error) throw error;
        const base = emptyStandingsState();
        (data || []).forEach((row) => {
          if (base[row.team]) {
            base[row.team] = {
              partite: row.partite,
              punti: row.punti,
              setVinti: row.set_vinti,
              setPersi: row.set_persi,
              puntiFatti: row.punti_fatti,
              puntiSubiti: row.punti_subiti,
            };
          }
        });
        if (!cancelled) setStandings(base);
      } catch (e) {
        if (!cancelled) setStandings(emptyStandingsState());
      }
      try {
        const { data, error } = await supabase.from("bracket").select("*");
        if (error) throw error;
        const byId = Object.fromEntries((data || []).map((r) => [r.id, r]));
        const merged = BRACKET_DEFAULT.map((slot) => {
          const row = byId[slot.id];
          return row
            ? { ...slot, teamA: row.team_a, teamB: row.team_b, score: row.score }
            : slot;
        });
        if (!cancelled) setBracket(merged);
      } catch (e) {
        if (!cancelled) setBracket(BRACKET_DEFAULT);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveStat = useCallback(async (team, patch) => {
    setStandings((prev) => ({ ...prev, [team]: { ...prev[team], ...patch } }));
    const dbPatch = { team };
    if ("partite" in patch) dbPatch.partite = patch.partite;
    if ("punti" in patch) dbPatch.punti = patch.punti;
    if ("setVinti" in patch) dbPatch.set_vinti = patch.setVinti;
    if ("setPersi" in patch) dbPatch.set_persi = patch.setPersi;
    if ("puntiFatti" in patch) dbPatch.punti_fatti = patch.puntiFatti;
    if ("puntiSubiti" in patch) dbPatch.punti_subiti = patch.puntiSubiti;
    try {
      const { error } = await supabase.from("standings").upsert(dbPatch);
      if (error) setSaveError(true);
    } catch (e) {
      setSaveError(true);
    }
  }, []);

  const updateBracketSlot = useCallback(async (id, patch) => {
    setBracket((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const dbPatch = { id };
    if ("teamA" in patch) dbPatch.team_a = patch.teamA;
    if ("teamB" in patch) dbPatch.team_b = patch.teamB;
    if ("score" in patch) dbPatch.score = patch.score;
    try {
      const { error } = await supabase.from("bracket").upsert(dbPatch);
      if (error) setSaveError(true);
    } catch (e) {
      setSaveError(true);
    }
  }, []);

  async function tryLogin() {
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwInput });
    if (error) {
      setLoginError("Credenziali non valide");
    } else {
      setShowLogin(false);
      setPwInput("");
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');

        .app-root {
          --bg-deep: #0E3B43;
          --bg-deep2: #123F49;
          --card: #FFF8EA;
          --ink: #12333A;
          --ink-soft: rgba(18,51,58,0.62);
          --sun: #F5B942;
          --coral: #FF6B4A;
          --line: rgba(18,51,58,0.14);
          --paper-line: rgba(244,236,218,0.16);
          font-family: 'Inter', sans-serif;
          background: radial-gradient(ellipse at top, var(--bg-deep2), var(--bg-deep) 70%);
          color: #F4ECDA;
          min-height: 100vh;
          padding: 28px 16px 60px;
          box-sizing: border-box;
        }
        .app-root * { box-sizing: border-box; }
        .app-root h1, .app-root h2, .app-root h3 {
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin: 0;
        }

        .header { max-width: 880px; margin: 0 auto 8px; text-align: center; }
        .header .eyebrow {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.25em;
          color: var(--sun);
          text-transform: uppercase;
        }
        .header h1 {
          font-size: clamp(32px, 6vw, 54px);
          font-weight: 700;
          line-height: 1.05;
          margin-top: 6px;
          color: #FFFDF6;
        }
        .header h1 span { color: var(--sun); }
        .header p { color: rgba(244,236,218,0.7); font-size: 14px; margin-top: 8px; }

        .net-divider { display: flex; align-items: center; gap: 6px; max-width: 880px; margin: 22px auto; }
        .net-post { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .net-line { flex: 1; height: 10px; }

        .nav { max-width: 880px; margin: 0 auto 18px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
        .nav button {
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-size: 13px;
          padding: 9px 16px;
          border-radius: 999px;
          border: 1px solid var(--paper-line);
          background: rgba(244,236,218,0.05);
          color: #F4ECDA;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .nav button:hover { background: rgba(244,236,218,0.12); }
        .nav button.active { background: var(--sun); color: var(--bg-deep); border-color: var(--sun); }

        .girone-tabs { max-width: 880px; margin: 0 auto 22px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .girone-tabs button {
          width: 42px; height: 42px;
          border-radius: 10px;
          border: 2px solid transparent;
          font-family: 'Oswald', sans-serif;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          color: #FFFDF6;
          opacity: 0.55;
        }
        .girone-tabs button.active { opacity: 1; border-color: #FFFDF6; }

        .content { max-width: 880px; margin: 0 auto; }

        .section-head { border-left: 4px solid; padding-left: 12px; margin-bottom: 14px; }
        .section-head h2 { font-size: 20px; color: #FFFDF6; }
        .day-label { font-size: 13px; color: rgba(244,236,218,0.55); text-transform: none; letter-spacing: 0; font-family: 'Inter', sans-serif; }

        .standings-wrap { background: var(--card); border-radius: 14px; overflow-x: auto; box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
        table.standings { width: 100%; border-collapse: collapse; font-size: 13px; color: var(--ink); min-width: 560px; }
        table.standings thead th {
          font-family: 'Space Mono', monospace;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.08em;
          color: var(--ink-soft);
          text-align: left;
          padding: 12px 10px 8px;
          border-bottom: 1px solid var(--line);
        }
        table.standings td { padding: 10px; border-bottom: 1px solid var(--line); font-family: 'Space Mono', monospace; }
        table.standings tr:last-child td { border-bottom: none; }
        .team-name { font-family: 'Inter', sans-serif; font-weight: 600; border-left: 3px solid; padding-left: 10px !important; }
        .strong { font-weight: 700; color: var(--coral); }
        .pos-flag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px; height: 20px;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          clip-path: polygon(0 0, 80% 0, 100% 50%, 80% 100%, 0 100%);
        }
        .girone-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px; height: 22px;
          border-radius: 6px;
          color: #fff;
          font-weight: 700;
          font-size: 11px;
        }

        .matches-list { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
        .match-row { background: rgba(244,236,218,0.06); border: 1px solid var(--paper-line); border-radius: 10px; padding: 10px 14px; }
        .match-row-main { display: grid; grid-template-columns: 46px 1fr auto 1fr; align-items: center; gap: 10px; font-size: 13px; }
        .match-time { font-family: 'Space Mono', monospace; color: var(--sun); font-size: 12px; }
        .match-team { font-weight: 500; }
        .match-team.right { text-align: right; }
        .match-vs { text-align: center; font-family: 'Space Mono', monospace; font-size: 12px; color: rgba(244,236,218,0.6); white-space: nowrap; }

        .stat-editor {
          margin-top: 16px;
          background: rgba(244,236,218,0.06);
          border: 1px solid var(--paper-line);
          border-radius: 12px;
          padding: 14px;
        }
        .stat-editor-title {
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          font-size: 13px;
          letter-spacing: 0.03em;
          color: var(--sun);
          margin-bottom: 10px;
        }
        .stat-editor-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px dashed var(--paper-line);
        }
        .stat-editor-row:last-child { border-bottom: none; }
        .stat-team { font-weight: 600; font-size: 13px; min-width: 160px; }
        .stat-inputs { display: flex; flex-wrap: wrap; gap: 10px; }
        .stat-input { display: flex; flex-direction: column; font-size: 10px; color: rgba(244,236,218,0.6); gap: 3px; text-transform: uppercase; letter-spacing: 0.04em; }
        .stat-input input {
          width: 60px;
          padding: 5px 6px;
          border-radius: 6px;
          border: 1px solid var(--paper-line);
          background: rgba(0,0,0,0.2);
          color: #FFFDF6;
          font-family: 'Space Mono', monospace;
          text-align: center;
        }

        .btn-ghost, .btn-solid {
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.04em;
          padding: 6px 12px;
          border-radius: 7px;
          cursor: pointer;
          border: 1px solid var(--paper-line);
          background: transparent;
          color: #F4ECDA;
        }
        .btn-solid { background: var(--sun); color: var(--bg-deep); border-color: var(--sun); font-weight: 700; }

        .bracket-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); gap: 10px; }
        .bracket-card { background: rgba(244,236,218,0.06); border: 1px solid var(--paper-line); border-radius: 10px; padding: 12px 14px; }
        .bracket-top { display: flex; justify-content: space-between; font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(244,236,218,0.6); margin-bottom: 8px; }
        .bracket-view { display: flex; align-items: center; justify-content: space-between; font-weight: 600; font-size: 14px; }
        .bracket-edit { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .bracket-edit input {
          flex: 1; min-width: 80px;
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid var(--paper-line);
          background: rgba(0,0,0,0.2);
          color: #FFFDF6;
          font-size: 12px;
        }
        .score-input { flex-basis: 100%; margin-top: 4px; }

        .admin-bar { max-width: 880px; margin: 0 auto 18px; display: flex; justify-content: flex-end; gap: 8px; }
        .admin-tag { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--sun); border: 1px solid var(--sun); border-radius: 999px; padding: 4px 10px; }
        .login-box {
          max-width: 320px;
          margin: 0 auto 18px;
          background: var(--card);
          color: var(--ink);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .login-box input { padding: 8px 10px; border-radius: 7px; border: 1px solid var(--line); font-family: 'Inter', sans-serif; }
        .login-error { color: var(--coral); font-size: 12px; }
        .save-toast {
          max-width: 880px;
          margin: 0 auto 14px;
          background: rgba(255,107,74,0.15);
          border: 1px solid var(--coral);
          color: #FFD9CC;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
        }
        .loading-state { text-align: center; padding: 60px 0; font-family: 'Space Mono', monospace; color: rgba(244,236,218,0.6); }
      `}</style>

      <div className="header">
        <div className="eyebrow">San Lorenzo</div>
        <h1>
          Beach Volley <span>3vs3</span>
        </h1>
        <p>Qualificazioni 27–31 luglio · Finali 1 agosto</p>
      </div>

      <NetDivider />

      <div className="admin-bar">
        {isAdmin ? (
          <span className="admin-tag">Modalità admin attiva</span>
        ) : (
          <button className="btn-ghost" onClick={() => setShowLogin((s) => !s)}>
            Accesso admin
          </button>
        )}
        {isAdmin && (
          <button className="btn-ghost" onClick={logout}>
            Esci
          </button>
        )}
      </div>

      {showLogin && !isAdmin && (
        <div className="login-box">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryLogin()}
          />
          <button className="btn-solid" onClick={tryLogin}>
            Entra
          </button>
          {loginError && <span className="login-error">{loginError}</span>}
        </div>
      )}

      {saveError && (
        <div className="save-toast">
          Non sono riuscito a salvare l'ultima modifica. Controlla la connessione e riprova.
        </div>
      )}

      <div className="nav">
        <button className={view === "girone" ? "active" : ""} onClick={() => setView("girone")}>
          Gironi
        </button>
        <button className={view === "generale" ? "active" : ""} onClick={() => setView("generale")}>
          Classifica generale
        </button>
        <button className={view === "finali" ? "active" : ""} onClick={() => setView("finali")}>
          Finali
        </button>
      </div>

      {view === "girone" && (
        <div className="girone-tabs">
          {Object.keys(SCHEDULE).map((g) => (
            <button
              key={g}
              className={selectedGirone === g ? "active" : ""}
              style={{ background: GIRONE_COLORS[g] }}
              onClick={() => setSelectedGirone(g)}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      <div className="content">
        {loading || !standings || !bracket ? (
          <div className="loading-state">Carico i dati del torneo…</div>
        ) : (
          <>
            {view === "girone" && (
              <GironeView
                girone={selectedGirone}
                standings={standings}
                isAdmin={isAdmin}
                onCommit={saveStat}
              />
            )}
            {view === "generale" && <GeneraleView standings={standings} />}
            {view === "finali" && (
              <FinaliView bracket={bracket} isAdmin={isAdmin} onUpdate={updateBracketSlot} />
            )}
          </>
        )}
      </div>
    </div>
  );
}