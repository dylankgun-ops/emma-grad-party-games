"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: submissions } = await supabase
      .from("submissions")
      .select("game_type, score, players(name)");

    const { data: votes } = await supabase
      .from("judge_votes")
      .select("judge_score, basket_entries(players(name))");

    const grouped = {};

    function ensurePlayer(name) {
      if (!grouped[name]) {
        grouped[name] = {
          name,
          tvGameScore: 0,
          emmaTriviaScore: 0,
          dishScore: 0
        };
      }
    }

    (submissions || []).forEach((row) => {
      const name = row.players?.name || "Unknown";
      ensurePlayer(name);

      if (row.game_type === "emma_quiz") {
        grouped[name].emmaTriviaScore += row.score || 0;
      } else {
        grouped[name].tvGameScore += row.score || 0;
      }
    });

    (votes || []).forEach((vote) => {
      const name = vote.basket_entries?.players?.name || "Unknown";
      ensurePlayer(name);

      grouped[name].dishScore += vote.judge_score || 0;
    });

    const result = Object.values(grouped)
      .map((p) => ({
        ...p,
        total: p.tvGameScore + p.emmaTriviaScore + p.dishScore
      }))
      .sort((a, b) => b.total - a.total);

    setPlayers(result);
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <Nav />

        <section style={styles.heroCard}>
          <div style={styles.badge}>🏆 Emma’s Grad Party</div>
          <h1 style={styles.title}>Party Leaderboard</h1>
          <p style={styles.subtitle}>
            Scores are separated by TV games, Emma trivia, and Mystery Basket judging.
          </p>

          <button style={styles.button} onClick={load}>
            Refresh Scores
          </button>
        </section>

        {players.map((player, idx) => (
          <section key={player.name} style={styles.card}>
            <div style={styles.rankRow}>
              <div>
                <div style={styles.rank}>#{idx + 1}</div>
                <h2 style={styles.name}>{player.name}</h2>
              </div>

              <div style={styles.total}>{player.total} pts</div>
            </div>

            <div style={styles.scoreGrid}>
              <div style={styles.scoreBox}>
                <div style={styles.scoreLabel}>TV Games</div>
                <div style={styles.scoreValue}>{player.tvGameScore}</div>
              </div>

              <div style={styles.scoreBox}>
                <div style={styles.scoreLabel}>Emma Trivia</div>
                <div style={styles.scoreValue}>{player.emmaTriviaScore}</div>
              </div>

              <div style={styles.scoreBox}>
                <div style={styles.scoreLabel}>Dish Judging</div>
                <div style={styles.scoreValue}>{player.dishScore}</div>
              </div>
            </div>
          </section>
        ))}

        <Nav bottom />
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
  container: { maxWidth: 1000, margin: "0 auto" },
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
    letterSpacing: "-2px"
  },
  subtitle: { color: "#6f6072", fontSize: 17, lineHeight: 1.6 },
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
  card: {
    background: "rgba(255,255,255,.86)",
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
    border: "1px solid rgba(255,255,255,.8)",
    boxShadow: "0 18px 45px rgba(65,35,55,.10)"
  },
  rankRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap"
  },
  rank: { color: "#be185d", fontWeight: 900 },
  name: { fontSize: "clamp(28px,5vw,42px)", margin: "6px 0" },
  total: { fontSize: 38, fontWeight: 900 },
  scoreGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
    gap: 12,
    marginTop: 18
  },
  scoreBox: {
    background: "#fff7fa",
    border: "1px solid #f2d5e0",
    borderRadius: 18,
    padding: 16
  },
  scoreLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#9b879b",
    fontWeight: 900
  },
  scoreValue: {
    fontSize: 34,
    fontWeight: 900,
    marginTop: 6
  }
};