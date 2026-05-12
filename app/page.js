"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const WORDLE_WORD = "LOFT";

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

export default function Home() {
  const [player, setPlayer] = useState(null);
  const [name, setName] = useState("");
  const [quoteAnswers, setQuoteAnswers] = useState({});
  const [scrambleAnswers, setScrambleAnswers] = useState({});
  const [wordleGuess, setWordleGuess] = useState("");
  const [wordleGuesses, setWordleGuesses] = useState([]);
  const [message, setMessage] = useState("");
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    if (player) {
      loadSubmissions(player.id);
    }
  }, [player]);

  async function createPlayer() {
    const { data, error } = await supabase
      .from("players")
      .insert({ name })
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

  function alreadySubmitted(type) {
    return submissions.some((s) => s.game_type === type);
  }

  async function submitQuotes() {
    if (alreadySubmitted("quotes")) return;

    let score = 0;

    quotes.forEach((q) => {
      if (quoteAnswers[q.id] === q.answer) score++;
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
      const guess = (scrambleAnswers[idx] || "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "");

      if (guess === s.answer) score += 2;
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

  function scoreWordleGuess(guess) {
    return guess.toUpperCase() === WORDLE_WORD;
  }

  async function submitWordle() {
    if (alreadySubmitted("wordle")) return;

    const correct = scoreWordleGuess(wordleGuess);

    await supabase.from("submissions").insert({
      player_id: player.id,
      game_type: "wordle",
      round_id: "main",
      answer: { guess: wordleGuess },
      score: correct ? 5 : 0,
      locked: true
    });

    setWordleGuesses([wordleGuess]);
    loadSubmissions(player.id);
  }

  const totalScore = useMemo(() => {
    return submissions.reduce((sum, s) => sum + (s.score || 0), 0);
  }, [submissions]);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.hero}>
          <div>
            <div style={styles.badge}>🎓 Pomona College Graduation Party</div>
            <h1 style={styles.title}>
              Emma’s TV-Themed Game Lounge
            </h1>
            <p style={styles.subtitle}>
              Gilmore Girls, New Girl, Chopped, and Wordle party games.
            </p>
          </div>

          <div style={styles.scoreCard}>
            <div style={styles.scoreLabel}>Score</div>
            <div style={styles.score}>{totalScore}</div>
          </div>
        </div>

        {!player && (
          <section style={styles.card}>
            <h2>Enter your name</h2>

            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />

            <button style={styles.button} onClick={createPlayer}>
              Start
            </button>
          </section>
        )}

        {player && (
          <>
            <section style={styles.card}>
              <h2>Who Said It?</h2>

              {quotes.map((q) => (
                <div key={q.id} style={styles.question}>
                  <strong>{q.show}</strong>
                  <p>{q.quote}</p>

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
                {alreadySubmitted("quotes")
                  ? "Submitted & Locked"
                  : "Submit Quotes"}
              </button>
            </section>

            <section style={styles.card}>
              <h2>Word Scramble</h2>

              {scrambles.map((s, idx) => (
                <div key={s.answer} style={styles.question}>
                  <strong>{s.clue}</strong>

                  <div style={styles.scramble}>
                    {s.scrambled}
                  </div>

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
              <h2>Mini Wordle</h2>

              <div style={styles.wordleRow}>
                {WORDLE_WORD.split("").map((_, idx) => {
                  const char = wordleGuess[idx] || "";

                  return (
                    <div key={idx} style={styles.wordleBox}>
                      {char}
                    </div>
                  );
                })}
              </div>

              <input
                disabled={alreadySubmitted("wordle")}
                style={styles.input}
                maxLength={4}
                value={wordleGuess}
                onChange={(e) =>
                  setWordleGuess(
                    e.target.value.toUpperCase()
                  )
                }
                placeholder="4-letter guess"
              />

              <button
                disabled={alreadySubmitted("wordle")}
                style={styles.button}
                onClick={submitWordle}
              >
                {alreadySubmitted("wordle")
                  ? "Submitted & Locked"
                  : "Submit Wordle"}
              </button>
            </section>

            <section style={styles.card}>
              <a href="/leaderboard">
                Leaderboard →
              </a>
              <br />
              <br />
              <a href="/admin">
                Admin Dashboard →
              </a>
            </section>
          </>
        )}

        {message && (
          <div style={styles.toast}>
            {message}
          </div>
        )}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#fff1f5,#fff8ed)",
    padding: 20,
    fontFamily: "Arial"
  },

  container: {
    maxWidth: 1100,
    margin: "0 auto"
  },

  hero: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(280px,1fr))",
    gap: 20,
    marginBottom: 20
  },

  badge: {
    display: "inline-block",
    background: "#ffe4ec",
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: 700
  },

  title: {
    fontSize: "clamp(32px,6vw,58px)",
    lineHeight: 1,
    marginTop: 15
  },

  subtitle: {
    color: "#666",
    fontSize: 18
  },

  scoreCard: {
    background: "white",
    borderRadius: 24,
    padding: 24,
    boxShadow:
      "0 10px 30px rgba(0,0,0,.08)"
  },

  scoreLabel: {
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12
  },

  score: {
    fontSize: 60,
    fontWeight: 900
  },

  card: {
    background: "rgba(255,255,255,.9)",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    boxShadow:
      "0 10px 30px rgba(0,0,0,.08)"
  },

  question: {
    background: "#fff7fa",
    padding: 16,
    borderRadius: 18,
    marginTop: 14
  },

  input: {
    width: "100%",
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    border: "1px solid #ddd",
    boxSizing: "border-box"
  },

  button: {
    marginTop: 16,
    padding: "14px 18px",
    borderRadius: 14,
    border: 0,
    background: "#111827",
    color: "white",
    fontWeight: 800,
    cursor: "pointer"
  },

  scramble: {
    fontSize: 24,
    letterSpacing: 4,
    fontWeight: 900,
    marginTop: 10
  },

  toast: {
    position: "fixed",
    bottom: 20,
    right: 20,
    background: "#111827",
    color: "white",
    padding: "12px 18px",
    borderRadius: 14
  },

  wordleRow: {
    display: "flex",
    gap: 10,
    marginTop: 18
  },

  wordleBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    background: "white",
    border: "2px solid #ddd",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 900,
    fontSize: 24
  }
};