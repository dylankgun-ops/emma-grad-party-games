"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const questions = [
  {
    id: "favorite-color",
    type: "choice",
    question: "What is Emma's favorite color?",
    options: ["Blue", "Pink", "Green", "Purple"],
    answers: ["pink"]
  },
  {
    id: "college-major",
    type: "choice",
    question: "What was Emma's college major?",
    options: ["Politics", "English", "History", "Psychology"],
    answers: ["politics"]
  },
  {
    id: "broadway-show",
    type: "choice",
    question: "What Broadway show has Emma seen the most?",
    options: ["Hamilton", "Wicked", "Chicago", "The Lion King"],
    answers: ["wicked"]
  },
    {
    id: "teacher-three-years",
    type: "choice",
    question: "What teacher did Emma have for 4 years?",
    options: ["Mr. Elitzer", "Ms. Doyle", "Ms. Garratt", "Mr. Hinojosa"],
    answers: ["ms. doyle"]
  },
  {
    id: "allergy",
    type: "entry",
    question: "What food is Emma allergic to?",
    answers: ["bananas", "banana"]
  },
  {
    id: "favorite-book",
    type: "entry",
    question: "What is Emma's favorite book?",
    answers: [
      "seven husbands of evelyn hugo",
      "the seven husbands of evelyn hugo",
      "7 husbands of evelyn hugo",
      "the 7 husbands of evelyn hugo"
    ]
  },
  {
    id: "middle-name",
    type: "entry",
    question: "What is Emma's middle name?",
    answers: ["michelle"]
  },
  {
    id: "country",
    type: "entry",
    question: "What country does Emma want to visit this summer?",
    answers: ["japan"]
  },
  {
    id: "high-school-classes",
    type: "entry",
    question: "What were Emma's two favorite classes in High School?",
    answers: [
      "journalism and ap history",
      "ap history and journalism",
      "journalism ap history",
      "ap history journalism",
      "journalism and ap us history",
      "ap us history and journalism",
      "journalism ap history us",
      "ap us history journalism",
      "journalism and ap us",
      "ap us and journalism",
      "journalism ap us",
      "ap us journalism"
    ]
  },
  {
    id: "favorite-author",
    type: "entry",
    question: "Who is Emma's favorite author?",
    answers: ["emily henry"]
  },
  {
    id: "favorite-tv-show",
    type: "choice",
    question: "What is Emma's favorite TV Show?",
    options: ["New Girl", "Gilmore Girls", "Chopped", "Friends"],
    answers: ["gilmore girls"]
  },
    {
    id: "favorite-games",
    type: "entry",
    question: "What two games has Emma been obsessed with recently?",
    answers: [
      "chess and risk",
      "risk and chess",
      "chess risk",
      "risk chess"
    ]
  },
  {
    id: "interned-networks",
    type: "entry",
    question: "Which news networks has Emma interned for?",
    answers: [
      "cnn and abc",
      "abc and cnn",
      "cnn abc",
      "abc cnn"
    ]
  },
  {
    id: "newman-teachers",
    type: "entry",
    question: "What two teachers taught all 4 Newman girls at BHUSD?",
    answers: [
      "mr elitzer and ms garratt",
      "mr. elitzer and ms. garratt",
      "elitzer and garratt",
      "ms garratt and mr elitzer",
      "ms. garratt and mr. elitzer",
      "garratt and elitzer"
    ]
  }
];

function normalizeAnswer(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export default function EmmaQuiz() {
  const [player, setPlayer] = useState(null);
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [message, setMessage] = useState("");

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

  function alreadySubmitted() {
    return submissions.some((s) => s.game_type === "emma_quiz");
  }

  function isCorrect(question, value) {
    const normalized = normalizeAnswer(value);
    return question.answers.some((answer) => normalizeAnswer(answer) === normalized);
  }

  async function submitQuiz() {
    if (!player || alreadySubmitted()) return;

    let score = 0;

    questions.forEach((question) => {
      if (isCorrect(question, answers[question.id])) score += 1;
    });

    const { error } = await supabase.from("submissions").insert({
      player_id: player.id,
      game_type: "emma_quiz",
      round_id: "main",
      answer: answers,
      score,
      locked: true
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Submitted and locked. You scored ${score}/${questions.length}.`);
    loadSubmissions(player.id);
  }

  const emmaSubmission = submissions.find((s) => s.game_type === "emma_quiz");

  const currentScore = useMemo(() => {
    return emmaSubmission?.score || 0;
  }, [emmaSubmission]);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <Nav />

        <section style={styles.heroCard}>
          <div style={styles.badge}>💕 Emma Trivia Round</div>
          <h1 style={styles.title}>How Well Do You Know Emma?</h1>
          <p style={styles.subtitle}>
            This section is separate from the TV show games. Answers are not case
            sensitive and lock after submission.
          </p>
        </section>

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
              Start Emma Trivia
            </button>
          </section>
        )}

        {player && (
          <>
            <section style={styles.scoreCard}>
              <div style={styles.scoreLabel}>Emma Trivia Score</div>
              <div style={styles.score}>
                {alreadySubmitted() ? `${currentScore}/${questions.length}` : "Not Submitted"}
              </div>
            </section>

            <section style={styles.card}>
              {questions.map((question, idx) => {
                const locked = alreadySubmitted();
                const value = answers[question.id] || "";

                return (
                  <div key={question.id} style={styles.question}>
                    <div style={styles.questionNumber}>Question {idx + 1}</div>
                    <h3>{question.question}</h3>

                    {question.type === "choice" ? (
                      <select
                        disabled={locked}
                        style={styles.input}
                        value={value}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: e.target.value
                          }))
                        }
                      >
                        <option value="">Choose</option>
                        {question.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        disabled={locked}
                        style={styles.input}
                        value={value}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: e.target.value
                          }))
                        }
                        placeholder="Type your answer"
                      />
                    )}

                    {locked && (
                      <div
                        style={{
                          ...styles.answerResult,
                          color: isCorrect(question, value) ? "#15803d" : "#be123c"
                        }}
                      >
                        {isCorrect(question, value)
                          ? "Correct"
                          : `Answer: ${question.answers[0]}`}
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                disabled={alreadySubmitted()}
                style={styles.button}
                onClick={submitQuiz}
              >
                {alreadySubmitted() ? "Submitted & Locked" : "Submit Emma Trivia"}
              </button>
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
    boxShadow: "0 18px 45px rgba(65,35,55,.10)",
    backdropFilter: "blur(10px)"
  },
  scoreCard: {
    background: "rgba(255,255,255,.86)",
    borderRadius: 28,
    padding: 26,
    marginBottom: 22,
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
  score: { fontSize: 34, fontWeight: 900, marginTop: 10 },
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
  questionNumber: {
    color: "#be185d",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12
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
  answerResult: {
    marginTop: 10,
    fontWeight: 900
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