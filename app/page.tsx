'use client';

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
} from "lucide-react";

// 🔐 Generate or get unique voter ID from localStorage
const getVoterId = (): string => {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("voter_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("voter_id", id);
  }
  return id;
};

export default function Home() {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [lastVoted, setLastVoted] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  useEffect(() => {
    fetchVotes();

    const channel = supabase
      .channel("votes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votes" },
        () => {
          fetchVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Local vote cache to enforce limits on same device
  const getStoredVotes = (key: string): string[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  };

  const storeVote = (key: string, id: string) => {
    const existing = getStoredVotes(key);
    const updated = [...existing, id];
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const handleVote = async (id: string, category: "mayor" | "councillor") => {
    const key = category === "mayor" ? "mayorVotes" : "councillorVotes";
    const maxVotes = category === "mayor" ? 2 : 7;
    const voterId = getVoterId();

    const stored = getStoredVotes(key);
    if (stored.includes(id)) {
      setMessage(`⚠️ You already voted for this ${category}.`);
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    if (stored.length >= maxVotes) {
      setMessage(`❌ You’ve already used your ${maxVotes} ${category} votes.`);
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    const { error } = await supabase
      .from("votes")
      .insert([{ candidate_id: id, category, voter_id: voterId }]);

    if (error) {
      console.error("Error saving vote:", error.message);
      setMessage("❌ Error saving vote");
      return;
    }

    storeVote(key, id);
    setLastVoted(id);
    setMessage("✅ Vote saved!");
    setTimeout(() => setMessage(null), 2000);
  };

  const mayorLeaderboard = initialCandidates
    .filter((c) => c.category === "mayor")
    .sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));

  const councillorLeaderboard = initialCandidates
    .filter((c) => c.category === "councillor" && c.id !== "katrin-wilson")
    .sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));

  const getWardIcon = (candidate: Candidate) => {
    if (candidate.category === "mayor") return <Crown className="w-4 h-4 text-white" />;
    if (candidate.ward.toLowerCase().includes("māori")) return <Feather className="w-4 h-4 text-white" />;
    if (candidate.ward.toLowerCase().includes("taup")) return <Droplet className="w-4 h-4 text-white" />;
    if (candidate.ward.toLowerCase().includes("turangi") || candidate.ward.toLowerCase().includes("tongariro")) return <TreePine className="w-4 h-4 text-white" />;
    if (candidate.ward.toLowerCase().includes("mangakino")) return <Mountain className="w-4 h-4 text-white" />;
    return null;
  };

  return (
    <main className="w-full">
      {/* your existing nav / hero / how to play / candidate / leaderboard / footer content */}
      {/* just keep what you already have here – you only needed to change the voting logic above */}
    </main>
  );
}
