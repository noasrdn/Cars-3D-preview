"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import { Mesh } from "three";

interface ModelProps {
  path: string;
  rotation?: [number, number, number];
  scale?: number;
}

export default function Model({ path, rotation = [0, -Math.PI / 5, 0], scale = 0.5 }: ModelProps) {
  // useGLTF charge le fichier .glb de manière asynchrone et le met en cache
  const { scene } = useGLTF(path);

  useEffect(() => {
    // On parcourt le modèle 3D pour s'assurer qu'il projette et reçoit des ombres
    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <primitive
      object={scene}
      position={[0, 0, 0]}
      scale={scale}
      rotation={rotation}
    />
  );
}

// Précharger tous les modèles pour éviter les saccades lors du changement
useGLTF.preload("/models/bmw_m4.glb");
useGLTF.preload("/models/GT3_RS.glb");
useGLTF.preload("/models/R35.glb");
useGLTF.preload("/models/martin.glb"); 