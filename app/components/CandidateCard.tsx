'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import type { Candidate } from "../data/candidates";

const wardPastels: Record<string, string> = {
  mayor: "bg-white border-indigo-800",
  "maori ward": "bg-pink-100 border-red-600",
  "taupo east rural": "bg-blue-100 border-teal-600",
  "mangakino-pouakani": "bg-green-100 border-green-600",
  "turangi-tongariro": "bg-yellow-100 border-amber-600",
  "taupo ward": "bg-orange-100 border-gray-600",
};

export default function CandidateCard({
  candidate,
  onVote,
}: {
  candidate: Candidate;
  onVote: () => void;
}) {
  const [flipped, setFlipped] = useState(false);

  const normalisedWard = candidate.ward
    .toLowerCase()
    .replaceAll("ā", "a")
    .trim();

  const wardStyle = wardPastels[normalisedWard] || "bg-gray-100 border-gray-400";

  const handleVote = () => {
    onVote();
    setFlipped(true);
    setTimeout(() => setFlipped(false), 1500);
  };

  return (
    <div className="w-64 h-96 [perspective:1000px]">
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full h-full rounded-2xl shadow-2xl border-4 [transform-style:preserve-3d]"
      >
        {/* FRONT FACE */}
        <div className={`absolute w-full h-full backface-hidden p-4 flex flex-col justify-between ${wardStyle}`}>
          <div>
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold">HP {candidate.hp}</span>
              <h2 className="text-md font-extrabold text-center flex-1">{candidate.name}</h2>
              <span className="text-xs font-semibold capitalize">{candidate.category}</span>
            </div>

            {/* Image */}
            <div className="flex justify-center mb-3">
              <img
                src={candidate.image}
                alt={candidate.name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover bg-gray-200"
              />
            </div>

            {/* Ward & Vibe */}
            <div className="text-center mb-3">
              <p className="text-xs uppercase tracking-wide text-gray-700">{candidate.ward}</p>
              <p className="text-sm italic text-gray-600">{candidate.vibe}</p>
            </div>

            {/* Quote */}
            <div className="bg-white rounded-md p-2 mb-2 shadow-inner">
              <p className="text-xs italic text-gray-800 text-center">
                “{candidate.quote || "Silent type"}”
              </p>
            </div>

            {/* Totem */}
            <div className="bg-gray-100 rounded-lg p-2 shadow-inner mb-3">
              <p className="font-bold text-sm mb-1">Totem</p>
              <p className="text-sm text-center">{candidate.totem || "—"}</p>
            </div>
          </div>

          {/* Vote Button */}
          <div className="flex justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVote();
              }}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg shadow-md"
            >
              Vote for me!
            </button>
          </div>
        </div>

        {/* BACK FACE */}
        <div className="absolute w-full h-full backface-hidden rotateY-180 bg-green-100 border-4 border-green-500 text-green-900 rounded-2xl flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-3xl font-bold">✅</p>
            <p className="text-md font-semibold mt-2">Vote Saved!</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
