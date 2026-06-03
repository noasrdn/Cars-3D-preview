"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface Interface2DProps {
  activeIndex: number;
  onNext: () => void;
  onPrev: () => void;
  isScrolled: boolean;
}

export default function Interface2D({ activeIndex, onNext, onPrev, isScrolled }: Interface2DProps) {
  const [mounted, setMounted] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setAnimationStarted(true);
    }, 1200); 
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none text-white font-sans">
      {/* === BRANCHES DE SAKURA (sortent du viewport au scroll) === */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: isScrolled ? 'translateY(-10vh)' : 'translateY(0)',
          opacity: isScrolled ? 0 : 1,
          transition: 'transform 0.8s cubic-bezier(0.7, 0, 0.3, 1), opacity 0.6s ease-out',
        }}
      >
      {/* Fleurs de cerisier - Top Left */}
      <div 
        className={`blur-[2px] absolute top-[-5%] left-[-5%] w-[35vw] h-[35vh] pointer-events-auto bg-contain bg-no-repeat bg-left-top ${
          animationStarted ? "animate-wind-tl-1" : ""
        }`}
        style={{ 
          backgroundImage: "url('/images/sakura_branch_v2.png')",
          ...(!animationStarted ? {
            transform: mounted ? "translate(0, 0)" : "translate(-110%, -110%)",
            transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          } : {})
        }}
      />
      <div 
        className={`absolute top-[15%] left-[-5%] w-[25vw] h-[25vh] pointer-events-auto bg-contain bg-no-repeat bg-left-top ${
          animationStarted ? "animate-wind-tl-2" : ""
        }`}
        style={{ 
          backgroundImage: "url('/images/sakura_branch_v2.png')",
          ...(!animationStarted ? {
            transform: mounted ? "translate(0, 0) rotate(35deg)" : "translate(-110%, -110%) rotate(35deg)",
            transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          } : {})
        }}
      />

      {/* Fleurs de cerisier - Top Right */}
      <div 
        className={`blur-[2px] absolute top-[-5%] right-[-10%] w-[35vw] h-[35vh] pointer-events-auto bg-contain bg-no-repeat bg-right-top scale-x-[-1] ${
          animationStarted ? "animate-wind-tr-1" : ""
        }`}
        style={{ 
          backgroundImage: "url('/images/sakura_branch_v2.png')",
          ...(!animationStarted ? {
            transform: mounted ? "translate(0, 0) scaleX(-1)" : "translate(110%, -110%) scaleX(-1)",
            transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          } : {})
        }}
      />
      <div 
        className={`absolute top-[-10%] right-[-10%] w-[35vw] h-[35vh] pointer-events-auto bg-contain bg-no-repeat bg-right-top scale-x-[-1] ${
          animationStarted ? "animate-wind-tr-2" : ""
        }`}
        style={{ 
          backgroundImage: "url('/images/sakura_branch_v2.png')",
          ...(!animationStarted ? {
            transform: mounted ? "translate(0, 0) scaleX(-1) rotate(5deg)" : "translate(110%, -110%) scaleX(-1) rotate(-45deg)",
            transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          } : {})
        }}
      />

      {/* Fleurs de cerisier - Bottom Corners */}
      <div 
        className={`blur-[2px] absolute bottom-[-20%] left-[-5%] w-[40vw] h-[40vh] pointer-events-auto bg-contain bg-no-repeat bg-left-bottom ${
          animationStarted ? "animate-wind-bl-1" : ""
        }`}
        style={{ 
          backgroundImage: "url('/images/sakura_branch_v2.png')",
          ...(!animationStarted ? {
            transform: mounted ? "translate(0, 0) rotate(45deg)" : "translate(-110%, 110%) rotate(45deg)",
            transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          } : {})
        }}
      />
      <div 
        className={`absolute bottom-[-20%] left-[15%] w-[40vw] h-[40vh] pointer-events-auto bg-contain bg-no-repeat bg-left-bottom ${
          animationStarted ? "animate-wind-bl-2" : ""
        }`}
        style={{ 
          backgroundImage: "url('/images/sakura_branch_v2.png')",
          ...(!animationStarted ? {
            transform: mounted ? "translate(0, 0) rotate(15deg)" : "translate(-110%, 110%) rotate(15deg)",
            transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          } : {})
        }}
      />

      <div 
        className={`blur-[2px] absolute bottom-[-10vh] right-[-10%] w-[40vw] h-[40vh] pointer-events-auto bg-contain bg-no-repeat bg-right-bottom scale-x-[-1] ${
          animationStarted ? "animate-wind-br-1" : ""
        }`}
        style={{ 
          backgroundImage: "url('/images/sakura_branch_v2.png')",
          ...(!animationStarted ? {
            transform: mounted ? "translate(0, 0) scaleX(-1) rotate(-45deg)" : "translate(110%, 110%) scaleX(-1) rotate(-45deg)",
            transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          } : {})
        }}
      />
      <div 
        className={`absolute bottom-0 right-[-10%] w-[30vw] h-[30vh] pointer-events-auto bg-contain bg-no-repeat bg-right-bottom scale-x-[-1] ${
          animationStarted ? "animate-wind-br-2" : ""
        }`}
        style={{ 
          backgroundImage: "url('/images/sakura_branch_v2.png')",
          ...(!animationStarted ? {
            transform: mounted ? "translate(0, 0) scaleX(-1)" : "translate(110%, 110%) scaleX(-1)",
            transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          } : {})
        }}
      />
      </div>{/* Fin du wrapper sakura */}

      {/* Contrôles du Carrousel (masqués au scroll) */}
      <div 
        className="absolute inset-y-0 left-5 flex items-center cursor-pointer select-none group"
        onClick={isScrolled ? undefined : onPrev}
        style={{
          opacity: isScrolled ? 0 : 1,
          pointerEvents: isScrolled ? 'none' : 'auto',
          transition: 'opacity 0.4s ease',
        }}
      >
        <div className="relative w-16 h-16 opacity-50 group-hover:opacity-100 transition-opacity rotate-180">
          <Image src="/images/arrow.svg" alt="Previous" fill sizes="64px" className="object-contain" />
        </div>
      </div>
      <div 
        className="absolute inset-y-0 right-5 flex items-center cursor-pointer select-none group"
        onClick={isScrolled ? undefined : onNext}
        style={{
          opacity: isScrolled ? 0 : 1,
          pointerEvents: isScrolled ? 'none' : 'auto',
          transition: 'opacity 0.4s ease',
        }}
      >
        <div className="relative w-16 h-16 opacity-50 group-hover:opacity-100 transition-opacity">
          <Image src="/images/arrow.svg" alt="Next" fill sizes="64px" className="object-contain" />
        </div>
      </div>

      {/* Logos des marques (BMW, Porsche, Nissan, etc.) */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 h-32 w-32 pointer-events-auto"
        style={{
          opacity: isScrolled ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
      >
        {activeIndex === 0 && (
          <Image src="/images/logo_bmw.webp" alt="BMW Logo" fill sizes="128px" className="object-contain" priority />
        )}
        {activeIndex === 1 && (
          <Image src="/images/logo_porsche.png" alt="Porsche Logo" fill sizes="128px" className="object-contain" priority />
        )}
        {activeIndex === 2 && (
          <Image src="/images/logo_nissan.svg" alt="Nissan Logo" fill sizes="128px" className="object-contain brightness-0 invert" priority />
        )}
        {activeIndex === 3 && (
          <Image src="/images/logo_cars.png" alt="Cars Logo" fill sizes="128px" className="object-contain" priority />
        )}
      </div>
    </div>
  );
}