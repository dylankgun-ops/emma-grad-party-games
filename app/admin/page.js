"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Admin() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("basket_entries")
      .select("*, players(name)")
      .order("created_at", {
        ascending: false
      });

    setEntries(data || []);
  }

  async function judge(
    id,
    verdict,
    score
  ) {
    await supabase
      .from("basket_entries")
      .update({
        verdict,
        judge_score: score
      })
      .eq("id", id);

    load();
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
          maxWidth: 1000,
          margin: "0 auto"
        }}
      >
        <h1
          style={{
            fontSize: 52,
            marginBottom: 24
          }}
        >
          Admin Dashboard 🎛️
        </h1>

        {entries.map((entry) => (
          <div
            key={entry.id}
            style={{
              background: "white",
              borderRadius: 20,
              padding: 20,
              marginBottom: 20,
              boxShadow:
                "0 8px 20px rgba(0,0,0,.06)"
            }}
          >
            <strong>
              {entry.players?.name}
            </strong>

            <p>{entry.dish_name}</p>

            <small>
              {(entry.basket_items || []).join(
                ", "
              )}
            </small>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 10,
                flexWrap: "wrap"
              }}
            >
              <button
                onClick={() =>
                  judge(
                    entry.id,
                    "Top Dish",
                    10
                  )
                }
              >
                Top Dish
              </button>

              <button
                onClick={() =>
                  judge(
                    entry.id,
                    "Safe",
                    7
                  )
                }
              >
                Safe
              </button>

              <button
                onClick={() =>
                  judge(
                    entry.id,
                    "Chopped",
                    3
                  )
                }
              >
                Chopped
              </button>
            </div>

            {entry.verdict && (
              <p>
                <strong>
                  {entry.verdict}
                </strong>{" "}
                — {entry.judge_score} pts
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}