"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("submissions")
      .select("score, players(name)")
      .order("score", { ascending: false });

    const grouped = {};

    (data || []).forEach((row) => {
      const name =
        row.players?.name || "Unknown";

      if (!grouped[name]) grouped[name] = 0;

      grouped[name] += row.score || 0;
    });

    const result = Object.entries(grouped)
      .map(([name, score]) => ({
        name,
        score
      }))
      .sort((a, b) => b.score - a.score);

    setPlayers(result);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "linear-gradient(135deg,#fff1f5,#fff8ed)",
        fontFamily: "Arial"
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto"
        }}
      >
        <h1
          style={{
            fontSize: 52,
            marginBottom: 24
          }}
        >
          Leaderboard 🏆
        </h1>

        {players.map((p, idx) => (
          <div
            key={p.name}
            style={{
              background: "white",
              borderRadius: 20,
              padding: 20,
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
              boxShadow:
                "0 8px 20px rgba(0,0,0,.06)"
            }}
          >
            <strong>
              #{idx + 1} {p.name}
            </strong>

            <div>{p.score} pts</div>
          </div>
        ))}
      </div>
    </main>
  );
}