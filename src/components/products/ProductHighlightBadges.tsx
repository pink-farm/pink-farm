"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, ThumbsUp, Sprout, Sparkles, ShieldCheck, Zap, Heart } from "lucide-react";

export interface BadgeItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  bgCircle: string;
}

interface ProductBadgesProps {
  category?: string;
  slug?: string;
  className?: string;
}

export function ProductBadges({ category = "", slug = "", className = "" }: ProductBadgesProps) {
  const cat = category.toLowerCase();
  const isMakhana = cat.includes("makhana") || slug.includes("makhana");
  const isNuts = cat.includes("nut") || slug.includes("almond") || slug.includes("cashew");
  const isOil = cat.includes("oil") || slug.includes("oil");

  let badges: BadgeItem[] = [];

  if (isMakhana) {
    badges = [
      {
        id: "no-palm-oil",
        label: "No Palm Oil",
        icon: (
          <div className="relative flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 md:w-4 md:h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2.7c-3.6 4.3-6.5 8.1-6.5 11.8a6.5 6.5 0 0 0 13 0c0-3.7-2.9-7.5-6.5-11.8z" />
              <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" strokeWidth="2.8" />
            </svg>
          </div>
        ),
        bgCircle: "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-xs",
      },
      {
        id: "roasted-not-fried",
        label: "Roasted Not Fried",
        icon: <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[2.4]" />,
        bgCircle: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xs",
      },
      {
        id: "plant-protein",
        label: "Plant Protein",
        icon: <Sprout className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[2.4]" />,
        bgCircle: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs",
      },
      {
        id: "cholesterol-free",
        label: "Cholesterol Free",
        icon: <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[2.4]" />,
        bgCircle: "bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-xs",
      },
    ];
  } else if (isNuts) {
    badges = [
      {
        id: "plant-protein",
        label: "Plant Protein",
        icon: <Sprout className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.4]" />,
        bgCircle: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs",
      },
      {
        id: "no-palm-oil",
        label: "No Palm Oil",
        icon: (
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 md:w-4.5 md:h-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2.7c-3.6 4.3-6.5 8.1-6.5 11.8a6.5 6.5 0 0 0 13 0c0-3.7-2.9-7.5-6.5-11.8z" />
            <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" strokeWidth="2.8" />
          </svg>
        ),
        bgCircle: "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-xs",
      },
      {
        id: "protein-rich",
        label: "Protein Rich",
        icon: <Zap className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.4]" />,
        bgCircle: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xs",
      },
      {
        id: "heart-healthy",
        label: "Heart Healthy",
        icon: <ShieldCheck className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.4]" />,
        bgCircle: "bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-xs",
      },
    ];
  } else if (isOil) {
    badges = [
      {
        id: "cold-pressed",
        label: "Cold Pressed",
        icon: <Sparkles className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.4]" />,
        bgCircle: "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-xs",
      },
      {
        id: "unrefined",
        label: "100% Pure",
        icon: <ThumbsUp className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.4]" />,
        bgCircle: "bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-xs",
      },
      {
        id: "no-chemicals",
        label: "Zero Chemicals",
        icon: <ShieldCheck className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.4]" />,
        bgCircle: "bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-xs",
      },
    ];
  } else {
    badges = [
      {
        id: "plant-protein",
        label: "Plant Protein",
        icon: <Sprout className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.4]" />,
        bgCircle: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs",
      },
      {
        id: "no-preservatives",
        label: "No Preservatives",
        icon: <ShieldCheck className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.4]" />,
        bgCircle: "bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-xs",
      },
      {
        id: "farm-fresh",
        label: "Farm Fresh",
        icon: <Sprout className="w-4 h-4 md:w-4.5 md:h-4.5 stroke-[2.4]" />,
        bgCircle: "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-xs",
      },
    ];
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 md:grid-cols-1 gap-1.5 w-full ${className}`}>
      {badges.map((badge, index) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ y: -2, scale: 1.02 }}
          className="group relative flex flex-col items-center justify-center py-1.5 px-1.5 md:py-2 md:px-1.5 rounded-xl bg-white/90 hover:bg-white border border-brand-pink-accent/30 hover:border-brand-pink-accent/60 shadow-[0_2px_8px_rgba(26,60,52,0.03)] hover:shadow-[0_4px_14px_rgba(26,60,52,0.06)] transition-all duration-200 text-center cursor-default"
        >
          {/* Compact Yogabar-style Circle Badge */}
          <div
            className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-110 shrink-0 ${badge.bgCircle}`}
          >
            {badge.icon}
          </div>

          {/* Clean concise title label */}
          <span className="font-serif font-bold text-[9.5px] md:text-[10.5px] text-brand-green mt-1 leading-tight tracking-tight text-center">
            {badge.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
