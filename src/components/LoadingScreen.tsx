"use client";

import { useProgress } from '@react-three/drei';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function LoadingScreen() {
    const { progress, active, loaded, total } = useProgress();
    const [isVisible, setIsVisible] = useState(true);
    const [hasStarted, setHasStarted] = useState(false);

    // Eviter les bugs d'Infinity lors du Fast Refresh
    const safeProgress = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : (total > 0 ? (loaded / total) * 100 : 0);

    // On s'assure qu'on a bien commencé à charger avant de pouvoir dire "c'est fini"
    useEffect(() => {
        if (active) setHasStarted(true);
    }, [active]);

    // Fade out smoothly once loading is 100% or loading has stopped after starting
    useEffect(() => {
        if ((!active && hasStarted) || safeProgress >= 100) {
            const timeout = setTimeout(() => {
                setIsVisible(false);
            }, 800); // Wait a bit before fully hiding to show 100% state
            return () => clearTimeout(timeout);
        } else if (active || safeProgress < 100) {
            setIsVisible(true);
        }
    }, [active, safeProgress, hasStarted]);

    // Ensure we don't render at all if it's completely hidden to save resources
    if (!isVisible && safeProgress >= 100) {
        // Wait another second before removing from DOM to allow transition to finish
        // Actually, we'll just let opacity-0 and pointer-events-none handle it
    }

    return (
        <div 
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#18181a] text-white transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
            <div className="flex flex-col items-center justify-center gap-12 w-full max-w-[600px] px-6">
                
                {/* Pourcentage */}
                <div 
                    className="text-4xl md:text-5xl font-black text-white/40 tracking-[0.2em]"
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                >
                    {Math.round(safeProgress)}%
                </div>

                {/* Silhouette SVG */}
                <div className="relative w-[300px] md:w-[450px] aspect-[2/1] my-4">
                    {/* Image de fond (Sombre) */}
                    <Image 
                        src="/images/loading_GT3.svg" 
                        alt="Loading Base" 
                        fill 
                        sizes="(max-width: 768px) 300px, 450px"
                        className="object-contain opacity-20"
                        priority
                    />
                    
                    {/* Image remplie (Claire) avec effet Clip-Path */}
                    <Image 
                        src="/images/loading_GT3.svg" 
                        alt="Loading Fill" 
                        fill 
                        sizes="(max-width: 768px) 300px, 450px"
                        className="object-contain transition-all duration-300 ease-out"
                        style={{ 
                            clipPath: `inset(0 ${100 - safeProgress}% 0 0)`,
                            
                        }}
                        priority
                    />
                </div>
                
                {/* Texte LOADING */}
                <div 
                    className="text-5xl md:text-6xl font-black text-white/40 tracking-[0.1em]"
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                >
                    LOADING...
                </div>
                <p className="text-red-500 text-center animate-pulse">If it doesn't start, please refresh the page</p>

            </div>
        </div>
    );
}
