"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Admin() {
  const [entries, setEntries] = useState([]);
  const [votes, setVotes] = useState([]);
  const [judgeName, setJudgeName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: entriesData } = await supabase
      .from("basket_entries")
      .select("*, players(name)")
      .order("created_at", { ascending: false });

    const { data: votesData } = await supabase
      .from("judge_votes")
      .select("*")
      .order("created_at", { ascending: false });

    setEntries(entriesData || []);
    setVotes(votesData || []);
  }

  function getVotesForEntry(entryId) {
    return votes.filter((vote) => vote.basket_entry_id === entryId);
  }

  function judgeAlreadyVoted(entryId) {
    return votes.some(
      (vote) =>
        vote.basket_entry_id === entryId &&
        vote.judge_name.toLowerCase().trim() === judgeName.toLowerCase().trim()
    );
  }

  async function judge(entryId, verdict, score) {
    if (!judgeName.trim()) {
      setMessage("Enter your judge name first.");
      return;
    }

    const { error } = await supabase.from("judge_votes").insert({
      basket_entry_id: entryId,
      judge_name: judgeName.trim(),
      verdict,
      judge_score: score
    });

    if (error) {
      setMessage("You already judged this dish.");
      return;
    }

    setMessage("Vote saved!");
    load();
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <Nav />

        <section style={styles.heroCard}>
          <div style={styles.badge}>🔪 Chopped Judging Table</div>
          <h1 style={styles.title}>Judge the Mystery Basket Dishes</h1>
          <p style={styles.subtitle}>
            Each judge can vote once per dish. Top Dish = 3, Safe = 2,
            Chopped = 1.
          </p>

          <input
            style={styles.input}
            value={judgeName}
            onChange={(e) => setJudgeName(e.target.value)}
            placeholder="Enter judge name"
          />
        </section>

        {entries.map((entry) => {
          const entryVotes = getVotesForEntry(entry.id);
          const total = entryVotes.reduce((sum, vote) => sum + vote.judge_score, 0);
          const average = entryVotes.length ? (total / entryVotes.length).toFixed(1) : "0.0";
          const lockedForJudge = judgeAlreadyVoted(entry.id);

          return (
            <section key={entry.id} style={styles.card}>
              <h2 style={styles.sectionTitle}>{entry.dish_name}</h2>

              <p>
                Submitted by <strong>{entry.players?.name || "Unknown"}</strong>
              </p>

              <p style={styles.basketText}>
                Basket: {(entry.basket_items || []).join(", ")}
              </p>

              <div style={styles.voteStats}>
                <span>{entryVotes.length} judge vote(s)</span>
                <span>Total: {total}</span>
                <span>Average: {average}</span>
              </div>

              <div style={styles.buttonRow}>
                <button
                  disabled={lockedForJudge}
                  style={styles.button}
                  onClick={() => judge(entry.id, "Top Dish", 3)}
                >
                  Top Dish
                </button>

                <button
                  disabled={lockedForJudge}
                  style={styles.button}
                  onClick={() => judge(entry.id, "Safe", 2)}
                >
                  Safe
                </button>

                <button
                  disabled={lockedForJudge}
                  style={styles.button}
                  onClick={() => judge(entry.id, "Chopped", 1)}
                >
                  Chopped
                </button>
              </div>

              {lockedForJudge && judgeName.trim() && (
                <p style={styles.locked}>You already judged this dish.</p>
              )}

              {entryVotes.length > 0 && (
                <div style={styles.voteList}>
                  {entryVotes.map((vote) => (
                    <div key={vote.id} style={styles.vote}>
                      <strong>{vote.judge_name}</strong>: {vote.verdict} —{" "}
                      {vote.judge_score} pts
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        <Nav bottom />

        {message && <div style={styles.toast}>{message}</div>}
      </div>
    </main>
  );
}

function Nav({ bottom }) {
  return (
    <nav style={{ ...styles.navButtons, marginTop: bottom ? 24 : 0 }}>
      <a style={styles.navButton} href="/">🏠 Main Menu</a>
      <a style={styles.navButton} href="/emma">💕 How Well Do You Know Emma?</a>
      <a style={styles.navButton} href="/leaderboard">🏆 Party Leaderboard</a>
      <a style={styles.navButton} href="/admin">🔪 Judge Chopped Dishes</a>
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
  heroCard: {
    background: "rgba(255,255,255,.86)",
    borderRadius: 28,
    padding: 28,
    marginBottom: 22,
    border: "1px solid rgba(255,255,255,.8)",
    boxShadow: "0 18px 45px rgba(65,35,55,.10)"
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
  card: {
    background: "rgba(255,255,255,.86)",
    borderRadius: 28,
    padding: 26,
    marginBottom: 22,
    border: "1px solid rgba(255,255,255,.8)",
    boxShadow: "0 18px 45px rgba(65,35,55,.10)"
  },
  sectionTitle: {
    fontSize: "clamp(28px,5vw,42px)",
    lineHeight: 1,
    marginTop: 0
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
  basketText: { color: "#6f6072", lineHeight: 1.6 },
  voteStats: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 },
  buttonRow: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 },
  button: {
    padding: "12px 16px",
    borderRadius: 16,
    border: 0,
    background: "#3b2f3f",
    color: "white",
    fontWeight: 900,
    cursor: "pointer"
  },
  locked: { color: "#be123c", fontWeight: 800 },
  voteList: { marginTop: 18, display: "grid", gap: 8 },
  vote: {
    background: "#fff7fa",
    border: "1px solid #f2d5e0",
    borderRadius: 14,
    padding: 12
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