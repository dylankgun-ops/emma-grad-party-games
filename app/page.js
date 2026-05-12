"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const quotes = [
  {
    id: "gg-1",
    show: "Gilmore Girls",
    quote: "I smell snow.",
    options: ["Lorelai", "Rory", "Emily", "Sookie"],
    answer: "Lorelai"
  },
  {
    id: "ng-1",
    show: "New Girl",
    quote: "Are you the criminals?! From the statistics?!",
    options: ["Schmidt", "Nick", "Winston", "Coach"],
    answer: "Schmidt"
  },
  {
    id: "chopped-1",
    show: "Chopped",
    quote: "You've got 30 minutes on the clock, and your time starts now.",
    options: ["Ted Allen", "Scott Conant", "Alex Guarnaschelli", "Amanda Freitag"],
    answer: "Ted Allen"
  }
];

const scrambles = [
  { clue: "Gilmore Girls town", scrambled: "LWAOSTLSRHO", answer: "STARSHOLLOW" },
  { clue: "New Girl cat", scrambled: "UNOSFREGR", answer: "FERGUSON" },
  { clue: "Chopped challenge", scrambled: "YTSMREYASKBTE", answer: "MYSTERYBASKET" }
];

const ingredients = [
  "matcha", "pickles", "duck", "waffles", "goat cheese", "blueberries",
  "kimchi", "hot honey", "tofu", "sardines", "dark chocolate", "bacon"
];

export default function Home() {
  const [player, setPlayer] = useState(null);
  const [name, setName] = useState("");
  const [quoteAnswers, setQuoteAnswers] = useState({});
  const [scrambleAnswers, setScrambleAnswers] = useState({});
  const [lockedRounds, setLockedRounds] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [basket, setBasket] = useState(["matcha", "pickles", "duck", "waffles"]);
  const [dishName, setDishName] = useState("");
  const [basketEntries, setBasketEntries] = useState([]);
  const [message, setMessage] = useState("");

  const totalScore = useMemo(() => {
    return submissions.reduce((sum, item) => sum + (item.score || 0), 0);
  }, [submissions]);

  useEffect(() => {
    loadBasketEntries();
  }, []);

  async function createPlayer() {
    if (!name.trim()) return;

    const { data, error } = await supabase
      .from("players")
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setPlayer(data);
    setMessage(`Welcome, ${data.name}!`);
    loadPlayerSubmissions(data.id);
  }

  async function loadPlayerSubmissions(playerId) {
    const { data } = await supabase
      .from("submissions")
      .select("*")
      .eq("player_id", playerId);

    const locks = {};
    (data || []).forEach((sub) => {
      locks[`${sub.game_type}-${sub.round_id}`] = true;
    });

    setSubmissions(data || []);
    setLockedRounds(locks);
  }

  async function submitQuotes() {
    if (!player) return;

    let score = 0;
    quotes.forEach((q) => {
      if (quoteAnswers[q.id] === q.answer) score += 1;
    });

    await submitLockedRound("quotes", "main", quoteAnswers, score);
  }

  async function submitScrambles() {
    if (!player) return;

    let score = 0;
    scrambles.forEach((s, idx) => {
      const answer = (scrambleAnswers[idx] || "").toUpperCase().replace(/[^A-Z]/g, "");
      if (answer === s.answer) score += 2;
    });

    await submitLockedRound("scramble", "main", scrambleAnswers, score);
  }

  async function submitLockedRound(gameType, roundId, answer, score) {
    const key = `${gameType}-${roundId}`;

    if (lockedRounds[key]) {
      setMessage("This round is already submitted and locked.");
      return;
    }

    const { error } = await supabase.from("submissions").insert({
      player_id: player.id,
      game_type: gameType,
      round_id: roundId,
      answer,
      score,
      locked: true
    });

    if (error) {
      setMessage("Already submitted or error: " + error.message);
      return;
    }

    setLockedRounds((prev) => ({ ...prev, [key]: true }));
    setMessage(`Submitted and locked. Score: ${score}`);
    loadPlayerSubmissions(player.id);
  }

  function generateBasket() {
    const shuffled = [...ingredients].sort(() => Math.random() - 0.5);
    setBasket(shuffled.slice(0, 4));
  }

  async function submitDish() {
    if (!player || !dishName.trim()) return;

    const { error } = await supabase.from("basket_entries").insert({
      player_id: player.id,
      basket_items: basket,
      dish_name: dishName.trim()
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setDishName("");
    setMessage("Dish submitted!");
    loadBasketEntries();
  }

  async function loadBasketEntries() {
    const { data } = await supabase
      .from("basket_entries")
      .select("*, players(name)")
      .order("created_at", { ascending: false });

    setBasketEntries(data || []);
  }

  async function judgeDish(id, verdict, judge_score) {
    await supabase
      .from("basket_entries")
      .update({ verdict, judge_score })
      .eq("id", id);

    loadBasketEntries();
  }

  const quoteLocked = lockedRounds["quotes-main"];
  const scrambleLocked = lockedRounds["scramble-main"];

  return (
    <main style={styles.page}>
      <style>{`
        button:hover { transform: translateY(-1px); }
        input, select { font-size: 16px; }
      `}</style>

      <section style={styles.hero}>
        <div>
          <div style={styles.badge}>🎓 Pomona College Graduation Party</div>
          <h1 style={styles.title}>Emma’s TV-Themed Grad Party Game Lounge</h1>
          <p style={styles.subtitle}>
            Gilmore Girls, New Girl, and Chopped games with saved scores and locked submissions.
          </p>
        </div>

        <div style={styles.scoreCard}>
          <div style={styles.scoreLabel}>Your Score</div>
          <div style={styles.score}>{totalScore}</div>
        </div>
      </section>

      {!player && (
        <section style={styles.card}>
          <h2>Enter your name or team</h2>
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Example: Emma's Team"
          />
          <button style={styles.primaryButton} onClick={createPlayer}>
            Start Playing
          </button>
        </section>
      )}

      {player && (
        <>
          <section style={styles.card}>
            <h2>Who Said It?</h2>
            <p>Once submitted, your answers lock.</p>

            {quotes.map((q) => (
              <div key={q.id} style={styles.question}>
                <strong>{q.show}</strong>
                <p>“{q.quote}”</p>
                <select
                  style={styles.input}
                  disabled={quoteLocked}
                  value={quoteAnswers[q.id] || ""}
                  onChange={(e) =>
                    setQuoteAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                >
                  <option value="">Choose one</option>
                  {q.options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}

            <button disabled={quoteLocked} style={styles.primaryButton} onClick={submitQuotes}>
              {quoteLocked ? "Submitted & Locked" : "Submit Quotes"}
            </button>
          </section>

          <section style={styles.card}>
            <h2>Challenging Word Scramble</h2>

            {scrambles.map((s, idx) => (
              <div key={s.answer} style={styles.question}>
                <strong>{s.clue}</strong>
                <div style={styles.scramble}>{s.scrambled}</div>
                <input
                  style={styles.input}
                  disabled={scrambleLocked}
                  value={scrambleAnswers[idx] || ""}
                  onChange={(e) =>
                    setScrambleAnswers((prev) => ({ ...prev, [idx]: e.target.value }))
                  }
                  placeholder="No spaces"
                />
              </div>
            ))}

            <button disabled={scrambleLocked} style={styles.primaryButton} onClick={submitScrambles}>
              {scrambleLocked ? "Submitted & Locked" : "Submit Scrambles"}
            </button>
          </section>

          <section style={styles.card}>
            <h2>Mystery Basket</h2>
            <div style={styles.basket}>
              {basket.map((item) => (
                <div key={item} style={styles.ingredient}>{item}</div>
              ))}
            </div>

            <button style={styles.secondaryButton} onClick={generateBasket}>
              Generate New Basket
            </button>

            <input
              style={styles.input}
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="Enter your dish idea"
            />

            <button style={styles.primaryButton} onClick={submitDish}>
              Submit Dish
            </button>
          </section>

          <section style={styles.card}>
            <h2>Judge Entries</h2>
            {basketEntries.map((entry) => (
              <div key={entry.id} style={styles.entry}>
                <strong>{entry.players?.name || "Unknown"}</strong>
                <p>{entry.dish_name}</p>
                <small>Basket: {(entry.basket_items || []).join(", ")}</small>
                <div style={{ marginTop: 10 }}>
                  <button style={styles.smallButton} onClick={() => judgeDish(entry.id, "Top Dish", 10)}>
                    Top Dish
                  </button>
                  <button style={styles.smallButton} onClick={() => judgeDish(entry.id, "Safe", 7)}>
                    Safe
                  </button>
                  <button style={styles.smallButton} onClick={() => judgeDish(entry.id, "Chopped", 3)}>
                    Chopped
                  </button>
                </div>
                {entry.verdict && <p><b>{entry.verdict}</b> — {entry.judge_score} pts</p>}
              </div>
            ))}
          </section>
        </>
      )}

      {message && <div style={styles.toast}>{message}</div>}
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fff1f5, #fff8ed)",
    padding: 24,
    fontFamily: "Arial, sans-serif",
    color: "#231f20"
  },
  hero: {
    maxWidth: 1100,
    margin: "0 auto 24px",
    display: "grid",
    gridTemplateColumns: "1.5fr .5fr",
    gap: 18
  },
  badge: {
    display: "inline-block",
    background: "#ffe4ec",
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: 700,
    color: "#9f1239"
  },
  title: {
    fontSize: 48,
    lineHeight: 1.05,
    margin: "18px 0 10px"
  },
  subtitle: {
    fontSize: 18,
    color: "#6b5f63"
  },
  scoreCard: {
    background: "white",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 12px 35px rgba(0,0,0,.08)"
  },
  scoreLabel: {
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 2,
    color: "#777"
  },
  score: {
    fontSize: 56,
    fontWeight: 900
  },
  card: {
    maxWidth: 1100,
    margin: "18px auto",
    background: "rgba(255,255,255,.92)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 12px 35px rgba(0,0,0,.08)"
  },
  question: {
    background: "#fff7fa",
    border: "1px solid #f5d4df",
    borderRadius: 18,
    padding: 16,
    margin: "14px 0"
  },
  input: {
    width: "100%",
    padding: 13,
    borderRadius: 14,
    border: "1px solid #ddd",
    marginTop: 10,
    boxSizing: "border-box"
  },
  primaryButton: {
    marginTop: 14,
    background: "#111827",
    color: "white",
    border: 0,
    borderRadius: 14,
    padding: "13px 18px",
    fontWeight: 800,
    cursor: "pointer"
  },
  secondaryButton: {
    marginTop: 14,
    marginRight: 10,
    background: "white",
    border: "1px solid #ddd",
    borderRadius: 14,
    padding: "13px 18px",
    fontWeight: 800,
    cursor: "pointer"
  },
  smallButton: {
    marginRight: 8,
    background: "#fb7185",
    color: "white",
    border: 0,
    borderRadius: 10,
    padding: "9px 12px",
    fontWeight: 700,
    cursor: "pointer"
  },
  scramble: {
    fontSize: 24,
    letterSpacing: 5,
    fontWeight: 900,
    marginTop: 8
  },
  basket: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10
  },
  ingredient: {
    background: "#fff1c7",
    padding: 16,
    borderRadius: 16,
    textAlign: "center",
    fontWeight: 800,
    textTransform: "capitalize"
  },
  entry: {
    background: "#f9fafb",
    borderRadius: 16,
    padding: 16,
    margin: "12px 0"
  },
  toast: {
    position: "fixed",
    bottom: 20,
    right: 20,
    background: "#111827",
    color: "white",
    padding: "12px 16px",
    borderRadius: 14
  }
};