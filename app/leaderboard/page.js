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
      .select("score, players(name)");

    const { data: votes } = await supabase
      .from("judge_votes")
      .select("judge_score, basket_entries(players(name))");

    const grouped = {};

    (submissions || []).forEach((row) => {
      const name = row.players?.name || "Unknown";
      if (!grouped[name]) grouped[name] = { name, gameScore: 0, dishScore: 0 };
      grouped[name].gameScore += row.score || 0;
    });

    (votes || []).forEach((vote) => {
      const name = vote.basket_entries?.players?.name || "Unknown";
      if (!grouped[name]) grouped[name] = { name, gameScore: 0, dishScore: 0 };
      grouped[name].dishScore += vote.judge_score || 0;
    });

    const result = Object.values(grouped)
      .map((p) => ({
        ...p,
        total: p.gameScore + p.dishScore
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
            Scores include submitted game points and Mystery Basket judging votes.
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

            <div style={styles.breakdown}>
              <span>Game Score: {player.gameScore}</span>
              <span>Dish Score: {player.dishScore}</span>
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
      <a style={styles.navButton} href="/">
        🏠 Main Menu
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

  container: {
    maxWidth: 1000,
    margin: "0 auto"
  },

  navButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 22
  },

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

  subtitle: {
    color: "#6f6072",
    fontSize: 17,
    lineHeight: 1.6
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

  rank: {
    color: "#be185d",
    fontWeight: 900
  },

  name: {
    fontSize: "clamp(28px,5vw,42px)",
    margin: "6px 0"
  },

  total: {
    fontSize: 38,
    fontWeight: 900
  },

  breakdown: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    color: "#6f6072",
    fontWeight: 800
  }
};