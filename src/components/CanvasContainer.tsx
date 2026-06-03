"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Suspense, useState, useEffect, useRef } from "react";
import Scene3D from "./Scene3D/Scene";
import Interface2D from "./Interface2D/Interface";
import { scrollState } from "@/lib/scrollState";

export interface CarAnnotation {
  position: [number, number, number];
  title: string;
  description: string;
  align?: 'left' | 'right';
}

export interface CarInfo {
  path: string;
  brand: string;
  model: string;
  rotation: [number, number, number];
  scale: number;
  brandFontSize?: number;
  modelFontSize?: number;
  annotations?: CarAnnotation[];
}

export const CARS: CarInfo[] = [
  { 
    path: "/models/bmw_m4.glb", brand: "BMW", model: "M4 COMPETITION", rotation: [0, -Math.PI / 5, 0], scale: 0.5, brandFontSize: 6.2, modelFontSize: 2.5,
    annotations: [
      { position: [-2.1, 0.4, 0.2], title: "19\" M FORGED", description: "Lightweight alloy wheels", align: 'left' },
      { position: [-1.0, 1.4, 2.1], title: "LASERLIGHT", description: "Adaptive light signature", align: 'right' },
      { position: [2.0, -1, -2.2], title: "QUAD EXHAUST", description: "M Sport exhaust system", align: 'left' }
    ]
  },
  { 
    path: "/models/GT3_RS.glb", brand: "PORSCHE", model: "911 GT3 RS", rotation: [0, -Math.PI / 5, 0], scale: 2.5, brandFontSize: 3.8, modelFontSize: 1.8,
    annotations: [
      { position: [-1.8, 0.4, 0.0], title: "CENTER LOCK", description: "Forged magnesium wheels", align: 'left' },
      { position: [-1.0, 1.4, 2.1], title: "PDLS PLUS", description: "Porsche Dynamic Light System", align: 'right' },
      { position: [3.3, 0.5, -3.7], title: "TITANIUM", description: "Lightweight sport exhaust", align: 'right' }
    ]
  },
  { 
    path: "/models/R35.glb", brand: "NISSAN", model: "GT-R R35", rotation: [0, -Math.PI / 5, 0], scale: 2.5, brandFontSize: 4.8, modelFontSize: 2.0,
    annotations: [
      { position: [-2.2, 0.4, 0.1], title: "20\" RAYS R6", description: "Forged aluminum wheels", align: 'left' },
      { position: [-1.0, 1.4, 2.1], title: "LIGHTNING", description: "LED signature illumination", align: 'right' },
      { position: [1, -1, -2.5], title: "TITANIUM", description: "Handbuilt exhaust system", align: 'left' }
    ]
  },
  { 
    path: "/models/martin.glb", brand: "ASTON", model: "MARTIN", rotation: [0, -Math.PI / 5, 0], scale: 1, brandFontSize: 3.8, modelFontSize: 2.2,
    annotations: [
      { position: [-2.0, 0.4, 1.2], title: "AERO WHEELS", description: "Give 200hp, for real", align: 'left' },
      { position: [0.5, 1.8, 1.3], title: "Candle light", description: "Cause Martin is Shinning ", align: 'right' },
      { position: [1, 0.8, -2.1], title: "Exhaust ?", description: "Full tube for sure", align: 'left' }
    ]
  },
];

export default function CanvasContainer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isScrolled, setIsScrolled] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const ANIM_DURATION_MS = 1100; // Durée du verrou entre deux snaps

    // Suppress specific THREE deprecation warnings from R3F internals
    const originalWarn = console.warn;
    console.warn = (...args) => {
        if (args[0] && typeof args[0] === 'string') {
            if (args[0].includes('THREE.Clock')) return;
            if (args[0].includes('PCFSoftShadowMap')) return;
        }
        originalWarn.apply(console, args);
    };

    const handleWheel = (e: WheelEvent) => {
      // Ignorer les petits mouvements accidentels
      if (Math.abs(e.deltaY) < 10) return;
      // Ignorer si une animation snap est déjà en cours
      if (scrollState.isAnimating) return;

      if (e.deltaY > 0) {
        // Scroll vers le bas
        if (scrollState.target < 3) {
            scrollState.target++;
        } else if (scrollState.target === 3) {
            scrollState.target = 4; // État de boucle vers showroom
        }
        scrollState.isAnimating = true;
        // isScrolled est faux si on retourne au showroom (état 4)
        setIsScrolled(scrollState.target !== 4);
        setTimeout(() => { scrollState.isAnimating = false; }, ANIM_DURATION_MS);
      } else if (e.deltaY < 0) {
        // Scroll vers le haut
        if (scrollState.target > 0) {
            scrollState.target--;
        } else if (scrollState.target === 0) {
            scrollState.target = -1; // État de boucle vers exhausts
        }
        scrollState.isAnimating = true;
        // isScrolled est vrai si on n'est pas au showroom (donc pas 0, mais -1 est vrai car on va vers exhausts)
        setIsScrolled(scrollState.target !== 0);
        setTimeout(() => { scrollState.isAnimating = false; }, ANIM_DURATION_MS);
      }
    };

    // capture: true = on intercepte AVANT que R3F ne capture l'événement
    window.addEventListener('wheel', handleWheel, { capture: true, passive: true });
    return () => window.removeEventListener('wheel', handleWheel, true);
  }, []);

  const handleNext = () => {
    setDirection("next");
    setActiveIndex((prev) => (prev + 1) % CARS.length);
  };

  const handlePrev = () => {
    setDirection("prev");
    setActiveIndex((prev) => (prev - 1 + CARS.length) % CARS.length);
  };

  return (
    <>
      <div className="fixed inset-0 z-10 h-screen w-screen bg-zinc-950">
        <Canvas
          camera={{ position: [-0.56, 4.63, 14.18], fov: 40 }}
          shadows
          gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
        >
          <Suspense fallback={null}>
            <Scene3D activeIndex={activeIndex} direction={direction} />
          </Suspense>
        </Canvas>
      </div>

      {/* Superposition de l'interface et du contenu 2D */}
      <Interface2D
        activeIndex={activeIndex}
        onNext={handleNext}
        onPrev={handlePrev}
        isScrolled={isScrolled}
      />
    </>
  );
}