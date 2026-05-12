"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const quotes = [
  {
    id: "gg1",
    show: "Gilmore Girls",
    quote: "I smell snow.",
    options: ["Lorelai", "Rory", "Emily", "Sookie"],
    answer: "Lorelai"
  },
  {
    id: "ng1",
    show: "New Girl",
    quote: "Are you the criminals?! From the statistics?!",
    options: ["Schmidt", "Nick", "Coach", "Winston"],
    answer: "Schmidt"
  }
];

const scrambles = [
  {
    clue: "Gilmore Girls town",
    scrambled: "LWAOSTLSRHO",
    answer: "STARSHOLLOW"
  },
  {
    clue: "New Girl cat",
    scrambled: "UNOSFREGR",
    answer: "FERGUSON"
  }
];

const ingredients = [
  "matcha",
  "pickles",
  "duck",
  "waffles",
  "goat cheese",
  "blueberries",
  "kimchi",
  "hot honey",
  "tofu",
  "sardines",
  "dark chocolate",
  "bacon",
  "pineapple",
  "mushrooms"
];

const WORDLE_WORD = "BREAD";
const WORDLE_MAX_GUESSES = 6;

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export default function Home() {
  const [player, setPlayer] = useState(null);
  const [name, setName] = useState("");
  const [quoteAnswers, setQuoteAnswers] = useState({});
  const [scrambleAnswers, setScrambleAnswers] = useState({});
  const [wordleGuess, setWordleGuess] = useState("");
  const [wordleGuesses, setWordleGuesses] = useState([]);
  const [basket, setBasket] = useState(["matcha", "pickles", "duck", "waffles"]);
  const [dishName, setDishName] = useState("");
  const [basketEntries, setBasketEntries] = useState([]);
  const [message, setMessage] = useState("");
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    loadBasketEntries();
  }, []);

  useEffect(() => {
    if (player) loadSubmissions(player.id);
  }, [player]);

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
  }

  async function loadSubmissions(playerId) {
    const { data } = await supabase
      .from("submissions")
      .select("*")
      .eq("player_id", playerId);

    setSubmissions(data || []);
  }

  async function loadBasketEntries() {
    const { data } = await supabase
      .from("basket_entries")
      .select("*, players(name)")
      .order("created_at", { ascending: false });

    setBasketEntries(data || []);
  }

  function alreadySubmitted(type) {
    return submissions.some((s) => s.game_type === type);
  }

  async function submitQuotes() {
    if (alreadySubmitted("quotes")) return;

    let score = 0;
    quotes.forEach((q) => {
      if (normalizeText(quoteAnswers[q.id]) === normalizeText(q.answer)) score++;
    });

    await supabase.from("submissions").insert({
      player_id: player.id,
      game_type: "quotes",
      round_id: "main",
      answer: quoteAnswers,
      score,
      locked: true
    });

    loadSubmissions(player.id);
  }

  async function submitScrambles() {
    if (alreadySubmitted("scramble")) return;

    let score = 0;
    scrambles.forEach((s, idx) => {
      if (normalizeText(scrambleAnswers[idx]) === normalizeText(s.answer)) score += 2;
    });

    await supabase.from("submissions").insert({
      player_id: player.id,
      game_type: "scramble",
      round_id: "main",
      answer: scrambleAnswers,
      score,
      locked: true
    });

    loadSubmissions(player.id);
  }

  function getWordleMarks(guess) {
    const target = WORDLE_WORD.split("");
    const letters = guess.split("");
    const marks = Array(WORDLE_WORD.length).fill("absent");
    const used = Array(WORDLE_WORD.length).fill(false);

    for (let i = 0; i < WORDLE_WORD.length; i++) {
      if (letters[i] === target[i]) {
        marks[i] = "correct";
        used[i] = true;
      }
    }

    for (let i = 0; i < WORDLE_WORD.length; i++) {
      if (marks[i] === "correct") continue;

      const found = target.findIndex(
        (letter, idx) => letter === letters[i] && !used[idx]
      );

      if (found !== -1) {
        marks[i] = "present";
        used[found] = true;
      }
    }

    return marks;
  }

  async function addWordleGuess() {
    if (alreadySubmitted("wordle")) return;

    const guess = wordleGuess.toUpperCase().replace(/[^A-Z]/g, "");

    if (guess.length !== WORDLE_WORD.length) {
      setMessage(`Guess must be ${WORDLE_WORD.length} letters`);
      return;
    }

    if (wordleGuesses.length >= WORDLE_MAX_GUESSES) return;

    const next = [...wordleGuesses, { guess, marks: getWordleMarks(guess) }];

    setWordleGuesses(next);
    setWordleGuess("");

    const solved = guess === WORDLE_WORD;

    if (solved || next.length >= WORDLE_MAX_GUESSES) {
      const score = solved ? Math.max(1, 7 - next.length) : 0;

      await supabase.from("submissions").insert({
        player_id: player.id,
        game_type: "wordle",
        round_id: "main",
        answer: next,
        score,
        locked: true
      });

      loadSubmissions(player.id);
    }
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

  const totalScore = useMemo(() => {
    return submissions.reduce((sum, s) => sum + (s.score || 0), 0);
  }, [submissions]);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <Nav />

        <div style={styles.hero}>
          <section style={styles.heroCard}>
            <div style={styles.badge}>🎓 Pomona College Graduation Party for Emma</div>
            <h1 style={styles.title}>Emma’s TV-Themed Grad Party Game Lounge</h1>
            <p style={styles.subtitle}>
              Cute, competitive, and a little chaotic. Play Gilmore Girls, New Girl,
              Chopped, and Wordle party games with locked submissions and live results.
            </p>
          </section>

          <section style={styles.scoreCard}>
            <div style={styles.scoreLabel}>Party Score</div>
            <div style={styles.score}>{totalScore}</div>
            <p style={styles.subtitle}>Your saved score from submitted rounds.</p>
          </section>
        </div>

        {!player && (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Enter your name or team</h2>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: Team Emma"
            />
            <button style={styles.button} onClick={createPlayer}>
              Start Playing
            </button>
          </section>
        )}

        {player && (
          <>
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Who Said It?</h2>

              {quotes.map((q) => (
                <div key={q.id} style={styles.question}>
                  <strong>{q.show}</strong>
                  <p style={styles.quote}>“{q.quote}”</p>

                  <select
                    disabled={alreadySubmitted("quotes")}
                    style={styles.input}
                    value={quoteAnswers[q.id] || ""}
                    onChange={(e) =>
                      setQuoteAnswers((prev) => ({
                        ...prev,
                        [q.id]: e.target.value
                      }))
                    }
                  >
                    <option value="">Choose</option>
                    {q.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              ))}

              <button
                disabled={alreadySubmitted("quotes")}
                style={styles.button}
                onClick={submitQuotes}
              >
                {alreadySubmitted("quotes") ? "Submitted & Locked" : "Submit Quotes"}
              </button>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Challenging Word Scramble</h2>

              {scrambles.map((s, idx) => (
                <div key={s.answer} style={styles.question}>
                  <strong>{s.clue}</strong>
                  <div style={styles.scramble}>{s.scrambled}</div>

                  <input
                    disabled={alreadySubmitted("scramble")}
                    style={styles.input}
                    value={scrambleAnswers[idx] || ""}
                    onChange={(e) =>
                      setScrambleAnswers((prev) => ({
                        ...prev,
                        [idx]: e.target.value
                      }))
                    }
                    placeholder="No spaces"
                  />
                </div>
              ))}

              <button
                disabled={alreadySubmitted("scramble")}
                style={styles.button}
                onClick={submitScrambles}
              >
                {alreadySubmitted("scramble")
                  ? "Submitted & Locked"
                  : "Submit Scrambles"}
              </button>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Mini Wordle</h2>
              <p>Guess the 5-letter word in 6 tries.</p>

              <div style={styles.wordleGrid}>
                {Array.from({ length: WORDLE_MAX_GUESSES }).map((_, rowIdx) => {
                  const row = wordleGuesses[rowIdx];
                  const letters = row
                    ? row.guess.split("")
                    : Array(WORDLE_WORD.length).fill("");
                  const marks = row
                    ? row.marks
                    : Array(WORDLE_WORD.length).fill("empty");

                  return (
                    <div key={rowIdx} style={styles.wordleRow}>
                      {letters.map((letter, cellIdx) => {
                        const mark = marks[cellIdx];

                        let background = "white";
                        let color = "#3b2f3f";
                        let border = "2px solid #ead2df";

                        if (mark === "correct") {
                          background = "#22c55e";
                          color = "white";
                          border = "2px solid #22c55e";
                        }

                        if (mark === "present") {
                          background = "#eab308";
                          color = "white";
                          border = "2px solid #eab308";
                        }

                        if (mark === "absent") {
                          background = "#9ca3af";
                          color = "white";
                          border = "2px solid #9ca3af";
                        }

                        return (
                          <div
                            key={cellIdx}
                            style={{ ...styles.wordleBox, background, color, border }}
                          >
                            {letter}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <input
                disabled={alreadySubmitted("wordle")}
                style={styles.input}
                maxLength={5}
                value={wordleGuess}
                onChange={(e) =>
                  setWordleGuess(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))
                }
                placeholder="5-letter guess"
              />

              <button
                disabled={alreadySubmitted("wordle")}
                style={styles.button}
                onClick={addWordleGuess}
              >
                {alreadySubmitted("wordle") ? "Submitted & Locked" : "Submit Guess"}
              </button>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Mystery Basket</h2>
              <p>Generate a basket, create a dish, then submit it for judging.</p>

              <div style={styles.basketGrid}>
                {basket.map((item) => (
                  <div key={item} style={styles.ingredient}>
                    {item}
                  </div>
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

              <button style={styles.button} onClick={submitDish}>
                Submit Dish
              </button>

              <h3 style={{ marginTop: 28 }}>Submitted Dishes</h3>

              {basketEntries.length === 0 && <p>No dishes submitted yet.</p>}

              {basketEntries.slice(0, 8).map((entry) => (
                <div key={entry.id} style={styles.entry}>
                  <strong>{entry.players?.name || "Unknown"}</strong>
                  <p>{entry.dish_name}</p>
                  <small>Basket: {(entry.basket_items || []).join(", ")}</small>
                </div>
              ))}
            </section>
          </>
        )}

        <Nav bottom />

        {message && <div style={styles.toast}>{message}</div>}
      </div>
    </main>
  );
}

function Nav({ bottom }) {
  return (
    <nav style={{ ...styles.navButtons, marginTop: bottom ? 24 : 0 }}>
      <a style={styles.navButton} href="/">
        🏠 Main Menu
      </a>

      <a style={styles.navButton} href="/emma">
        💕 How Well Do You Know Emma?
      </a>

      <a style={styles.navButton} href="/leaderboard">
        🏆 Party Leaderboard
      </a>

      <a style={styles.navButton} href="/admin">
        🔪 Judge Chopped Dishes
      </a>
    </nav>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, #ffd6e7 0, transparent 32%), radial-gradient(circle at top right, #ffe4bf 0, transparent 34%), linear-gradient(135deg,#fff1f7,#fff3df)",
    padding: 16,
    fontFamily: "Georgia, 'Times New Roman', serif",
    color: "#3b2f3f"
  },
  container: { maxWidth: 1120, margin: "0 auto" },
  navButtons: { display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 22 },
  navButton: {
    display: "inline-block",
    background: "rgba(255,255,255,.9)",
    color: "#3b2f3f",
    textDecoration: "none",
    padding: "12px 16px",
    borderRadius: 999,
    fontWeight: 800,
    border: "1px solid #f2cddd",
    boxShadow: "0 8px 20px rgba(0,0,0,.06)"
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
    gap: 20,
    marginBottom: 20
  },
  heroCard: {
    background: "rgba(255,255,255,.86)",
    borderRadius: 28,
    padding: 28,
    border: "1px solid rgba(255,255,255,.8)",
    boxShadow: "0 18px 45px rgba(65,35,55,.10)",
    backdropFilter: "blur(10px)"
  },
  badge: {
    display: "inline-block",
    background: "#ffe4b8",
    color: "#8a5200",
    padding: "8px 14px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 14
  },
  title: {
    fontSize: "clamp(42px,7vw,76px)",
    lineHeight: ".92",
    marginTop: 18,
    marginBottom: 18,
    letterSpacing: "-2px",
    color: "#3b2f3f"
  },
  subtitle: { color: "#6f6072", fontSize: 17, lineHeight: 1.6 },
  scoreCard: {
    background: "rgba(255,255,255,.86)",
    borderRadius: 28,
    padding: 28,
    border: "1px solid rgba(255,255,255,.8)",
    boxShadow: "0 18px 45px rgba(65,35,55,.10)"
  },
  scoreLabel: {
    textTransform: "uppercase",
    letterSpacing: 3,
    fontSize: 13,
    color: "#9b879b",
    fontWeight: 900
  },
  score: { fontSize: 68, fontWeight: 900, marginTop: 10 },
  card: {
    background: "rgba(255,255,255,.86)",
    borderRadius: 28,
    padding: 26,
    marginBottom: 22,
    border: "1px solid rgba(255,255,255,.8)",
    boxShadow: "0 18px 45px rgba(65,35,55,.10)",
    backdropFilter: "blur(10px)"
  },
  sectionTitle: {
    fontSize: "clamp(30px,5vw,42px)",
    lineHeight: 1,
    marginTop: 0
  },
  question: {
    background: "rgba(255,247,250,.9)",
    padding: 18,
    borderRadius: 20,
    marginTop: 16,
    border: "1px solid #f2d5e0"
  },
  quote: {
    background: "#fff1f7",
    borderLeft: "4px solid #ef7aa8",
    padding: 14,
    borderRadius: 14,
    fontStyle: "italic"
  },
  input: {
    width: "100%",
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    border: "1px solid #e6ccd8",
    boxSizing: "border-box",
    fontSize: 16,
    background: "white",
    color: "#3b2f3f"
  },
  button: {
    marginTop: 16,
    padding: "14px 18px",
    borderRadius: 16,
    border: 0,
    background: "#3b2f3f",
    color: "white",
    fontWeight: 900,
    cursor: "pointer"
  },
  secondaryButton: {
    marginTop: 16,
    padding: "14px 18px",
    borderRadius: 16,
    border: "1px solid #e6ccd8",
    background: "white",
    color: "#3b2f3f",
    fontWeight: 900,
    cursor: "pointer"
  },
  scramble: {
    fontSize: 24,
    letterSpacing: 6,
    fontWeight: 900,
    marginTop: 10,
    wordBreak: "break-word"
  },
  wordleGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 20,
    overflowX: "auto"
  },
  wordleRow: { display: "flex", gap: 8, flexWrap: "nowrap" },
  wordleBox: {
    width: "clamp(44px,12vw,58px)",
    height: "clamp(44px,12vw,58px)",
    borderRadius: 14,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 900,
    fontSize: 24,
    flexShrink: 0
  },
  basketGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
    gap: 10,
    marginTop: 16
  },
  ingredient: {
    background: "#fff1c7",
    padding: 16,
    borderRadius: 16,
    textAlign: "center",
    fontWeight: 900,
    textTransform: "capitalize",
    border: "1px solid #ffe2a3"
  },
  entry: {
    background: "#fff7fa",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    border: "1px solid #f2d5e0"
  },
  toast: {
    position: "fixed",
    bottom: 20,
    right: 20,
    background: "#3b2f3f",
    color: "white",
    padding: "12px 18px",
    borderRadius: 14,
    maxWidth: "calc(100vw - 40px)"
  }
};