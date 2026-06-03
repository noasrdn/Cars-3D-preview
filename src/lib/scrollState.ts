/**
 * État de scroll partagé entre CanvasContainer (React) et Scene3D (Three.js).
 * Module-level singleton — accessible côté client uniquement.
 */
export const scrollState = {
  /** Progression interpolée actuelle (0 = position initiale, 1 = position scrollée) */
  progress: 0,
  /** Cible de snap : 0 ou 1 */
  target: 0,
  /** Verrou pour ignorer les wheel events pendant l'animation */
  isAnimating: false,
};
