import React from 'react';

export function AnimatedLotusLogo({ className = "", variant = "green" }: { className?: string, variant?: "green" | "golden" }) {
  const isGolden = variant === "golden";
  const strokeClass = isGolden ? "stroke-[url(#golden-gradient)]" : "stroke-brand-green";
  const fillClass = isGolden ? "fill-[url(#golden-gradient)]" : "fill-brand-green";

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full ${strokeClass}`}
        style={{
          strokeWidth: isGolden ? 2 : 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          filter: isGolden ? 'drop-shadow(0px 4px 6px rgba(184, 134, 11, 0.4))' : 'none',
        }}
      >
        <defs>
          <linearGradient id="golden-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#BF953F" />
            <stop offset="25%" stopColor="#FCF6BA" />
            <stop offset="50%" stopColor="#B38728" />
            <stop offset="75%" stopColor="#FBF5B7" />
            <stop offset="100%" stopColor="#AA771C" />
          </linearGradient>
        </defs>

        {/* Central stem/flame rising up */}
        <path
          className="animate-draw-line delay-[0ms]"
          d="M50 85 C50 60, 40 50, 45 30 C50 15, 60 25, 50 10 C45 25, 60 40, 50 60 C55 70, 50 85, 50 85Z"
        />
        
        {/* Left petals */}
        <path
          className="animate-draw-line delay-[300ms]"
          d="M50 85 C35 80, 20 65, 25 45 C30 60, 40 70, 50 85Z"
        />
        <path
          className="animate-draw-line delay-[500ms]"
          d="M45 80 C25 75, 10 60, 10 40 C20 55, 30 65, 45 80Z"
        />
        <path
          className="animate-draw-line delay-[700ms]"
          d="M38 75 C18 70, 5 55, 2 35 C15 50, 25 60, 38 75Z"
        />

        {/* Right petals */}
        <path
          className="animate-draw-line delay-[300ms]"
          d="M50 85 C65 80, 80 65, 75 45 C70 60, 60 70, 50 85Z"
        />
        <path
          className="animate-draw-line delay-[500ms]"
          d="M55 80 C75 75, 90 60, 90 40 C80 55, 70 65, 55 80Z"
        />
        <path
          className="animate-draw-line delay-[700ms]"
          d="M62 75 C82 70, 95 55, 98 35 C85 50, 75 60, 62 75Z"
        />
        
        {/* Center dot/jewel */}
        <circle
          cx="55"
          cy="20"
          r="3"
          className={`animate-fade-in delay-[1500ms] opacity-0 ${fillClass} stroke-none`}
          style={{ animationFillMode: 'forwards' }}
        />
      </svg>
    </div>
  );
}
