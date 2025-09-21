"use client";

import { useState, useEffect } from "react";
import { candidates as initialCandidates } from "./data/candidates";
import type { Candidate } from "./data/candidates";
import CandidateCard from "./components/CandidateCard";
import { supabase } from "../lib/supabaseClient";
import { motion } from "framer-motion";
import '@fortawesome/fontawesome-free/css/all.min.css';

import {
  Crown,
  Feather,
  Droplet,
  TreePine,
  Mountain,
  Facebook,
  Rss,
} from "lucide-react";

export default function Home() {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [lastVoted, setLastVoted] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch + realtime votes
  useEffect(() => {
    const fetchVotes = async () => {
      const { data, error } = await supabase
        .from("votes")
        .select("candidate_id");
      if (error) {
        console.error("Error fetching votes:", error.message);
        return;
      }
      const voteMap: Record<string, number> = {};
      data?.forEach((row: any) => {
        voteMap[row.candidate_id] = (voteMap[row.candidate_id] || 0) + 1;
      });
      setVotes(voteMap);
    };
    fetchVotes();

    const channel = supabase
      .channel("votes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votes" },
        (payload) => {
          const candidateId = (payload.new as any).candidate_id;
          setVotes((prev) => ({
            ...prev,
            [candidateId]: (prev[candidateId] || 0) + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle vote
  const handleVote = async (id: string, category: "mayor" | "councillor") => {
    const { error } = await supabase
      .from("votes")
      .insert([{ candidate_id: id, category }])
      .select();

    if (error) {
      console.error("Error saving vote:", error.message, error.details);
      setMessage("❌ Error saving vote");
      return;
    }
    setLastVoted(id);
    setMessage("✅ Vote saved!");
    setTimeout(() => setMessage(null), 2000);
  };

  // Leaderboards
  const mayorLeaderboard = initialCandidates
    .filter((c) => c.category === "mayor")
    .sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));

  const councillorLeaderboard = initialCandidates
    .filter((c) => c.category === "councillor" && c.id !== "katrin-wilson")
    .sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));

  const getWardIcon = (candidate: Candidate) => {
    if (candidate.category === "mayor")
      return <Crown className="w-4 h-4 text-white" />;
    if (candidate.ward.toLowerCase().includes("māori"))
      return <Feather className="w-4 h-4 text-white" />;
    if (candidate.ward.toLowerCase().includes("taup"))
      return <Droplet className="w-4 h-4 text-white" />;
    if (
      candidate.ward.toLowerCase().includes("turangi") ||
      candidate.ward.toLowerCase().includes("tongariro")
    )
      return <TreePine className="w-4 h-4 text-white" />;
    if (candidate.ward.toLowerCase().includes("mangakino"))
      return <Mountain className="w-4 h-4 text-white" />;
    return null;
  };

  return (
    <main className="w-full">
      {/* NAVIGATION */}
      <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="font-extrabold text-xl">DemocraDeck</div>
        <ul className="hidden md:flex space-x-6 text-sm font-medium">
          <li><a href="#hero" className="hover:text-yellow-400">Home</a></li>
          <li><a href="#howto" className="hover:text-yellow-400">How to Play</a></li>
          <li><a href="#candidates" className="hover:text-yellow-400">Candidates</a></li>
          <li><a href="#leaderboard" className="hover:text-yellow-400">Leaderboard</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section id="hero" className="relative bg-gradient-to-r from-indigo-700 via-blue-600 to-teal-500 text-white min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-7xl sm:text-8xl font-extrabold mb-6 drop-shadow-lg">DemocraDeck</h1>
          <p className="text-2xl mb-4 leading-relaxed">A parody card game for the 2025 Taupō District Council election.</p>
          <p className="italic text-lg mb-10">Because democracy should be a little more like Pokémon.</p>
          <a href="#candidates" className="inline-block px-8 py-4 bg-yellow-400 text-black font-bold text-lg rounded-xl shadow-lg hover:bg-yellow-500 transition">Meet the Candidates</a>
        </div>
      </section>

      {/* MESSAGE */}
      {message && (
        <div className="my-6 px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold shadow text-center">
          {message}
        </div>
      )}

      {/* HOW TO PLAY */}
      <section id="howto" className="bg-gray-100 py-20 px-6 text-center border-t border-gray-200">
        <h2 className="text-5xl font-bold mb-6">How to Play</h2>
        <p className="max-w-3xl mx-auto text-gray-700 mb-12 text-lg">
          Read quotes, and vote for your favourites. Votes update live and leaderboards show who’s on top, just for fun!
        </p>
        <h3 className="text-3xl font-bold mb-6">Card Legend</h3>
        <ul className="max-w-xl mx-auto text-left space-y-3 text-gray-800 text-lg">
          <p className="text-xs text-gray-500 mt-6 italic text-center">
  Disclaimer: All HP numbers are randomly assigned for parody purposes and do not reflect candidate qualifications or abilities.
</p>

          <li>💖 <b>HP</b> = satirical power level</li>
          <li>💬 <b>Quote</b> = from candidate speeches (some paraphrased)</li>
          <li>🦉 <b>Totem</b> = symbolic animal/plant for fun</li>
          <li>🗳 <b>Votes</b> = live counter (not official results)</li>
        </ul>
      </section>

      {/* CANDIDATES + LEADERBOARD SIDE BY SIDE */}
      <section id="candidates" className="bg-white py-20 px-6 border-t border-gray-200 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Candidates */}
          <div className="lg:col-span-2">
            <h2 className="text-5xl font-bold text-center mb-12">Meet the Candidates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
              {initialCandidates
                .filter((c) => c.id !== "katrin-wilson")
                .map((candidate: Candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onVote={() => handleVote(candidate.id, candidate.category)}
                  />
                ))}
            </div>
          </div>

          {/* Leaderboard */}
          <aside className="lg:col-span-1">
            <section className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-center">Mayor Leaderboard</h2>
              <ul className="space-y-2">
                {mayorLeaderboard
                  .filter((c) => (votes[c.id] || 0) > 0)
                  .map((c, index) => (
                    <motion.li
                      key={c.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex justify-between items-center p-3 rounded-lg shadow-sm ${lastVoted === c.id ? "bg-yellow-100" : "bg-gray-50"}`}
                    >
                      <span className="font-semibold flex items-center gap-2">
                        {index === 0 && "👑"}
                        {index === 1 && "🥈"}
                        {index === 2 && "🥉"}
                        {getWardIcon(c)} {index + 1}. {c.name}
                      </span>
                      <span className="text-sm text-gray-600">{votes[c.id] || 0} votes</span>
                    </motion.li>
                  ))}
              </ul>
            </section>

            <section className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-center">Councillor Leaderboard</h2>
              <ul className="space-y-2">
                {councillorLeaderboard
                  .filter((c) => (votes[c.id] || 0) > 0)
                  .map((c, index) => (
                    <motion.li
                      key={c.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex justify-between items-center p-3 rounded-lg shadow-sm ${lastVoted === c.id ? "bg-yellow-100" : "bg-gray-50"}`}
                    >
                      <span className="font-semibold flex items-center gap-2">
                        {index === 0 && "👑"}
                        {index === 1 && "🥈"}
                        {index === 2 && "🥉"}
                        {getWardIcon(c)} {index + 1}. {c.name}
                      </span>
                      <span className="text-sm text-gray-600">{votes[c.id] || 0} votes</span>
                    </motion.li>
                  ))}
              </ul>
            </section>
          </aside>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-10 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm">© {new Date().getFullYear()} DemocraDeck — A parody project for civic fun ✨</p>
          <div className="flex space-x-6">

            <a href="https://epitomeofcoolness.com/" target="_blank" className="hover:text-white">
          <i className="fas fa-spa w-6 h-6 text-pink-500"></i> {/* flower-ish */}


            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
