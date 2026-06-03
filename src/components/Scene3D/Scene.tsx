"use client";

import { Environment, OrbitControls, useTexture, Text, ContactShadows, MeshReflectorMaterial, Html } from "@react-three/drei";
import { Color, AdditiveBlending, MathUtils, Group, Vector3 } from "three";
import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import Model from "./Model";
import { CARS } from "../CanvasContainer";
import { scrollState } from "@/lib/scrollState";

// Interpolation radiale pour une caméra orbitale fluide
function slerpVectorAroundY(v1: Vector3, v2: Vector3, t: number, out: Vector3) {
    const r1 = Math.sqrt(v1.x * v1.x + v1.z * v1.z);
    const r2 = Math.sqrt(v2.x * v2.x + v2.z * v2.z);
    const r = MathUtils.lerp(r1, r2, t);

    const angle1 = Math.atan2(v1.z, v1.x);
    let angle2 = Math.atan2(v2.z, v2.x);

    // Prendre le chemin le plus court
    if (angle2 - angle1 > Math.PI) angle2 -= Math.PI * 2;
    if (angle1 - angle2 > Math.PI) angle2 += Math.PI * 2;

    const angle = MathUtils.lerp(angle1, angle2, t);
    const y = MathUtils.lerp(v1.y, v2.y, t);

    out.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
}

// Shaders pour la lueur diffuse réaliste (effet Fresnel / Falloff)
const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  uniform vec3 color;
  uniform float glowPower;
  uniform float glowIntensity;
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float intensity = pow(max(dot(normal, viewDir), 0.0), glowPower);
    gl_FragColor = vec4(color, intensity * glowIntensity);
  }
`;

interface NeonGlowProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    length: number;
}

function NeonGlow({ position, rotation, length }: NeonGlowProps) {
    return (
        <group position={position} rotation={rotation}>
            {/* 1. Noyau interne blanc très brillant */}
            <mesh>
                <cylinderGeometry args={[0.015, 0.015, length, 16]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* 2. Tube de couleur néon saturé */}
            <mesh>
                <cylinderGeometry args={[0.04, 0.04, length, 16]} />
                <meshBasicMaterial color="#00e5ff" />
            </mesh>

            {/* 3. Lueur diffuse externe (Fresnel Shader avec AdditiveBlending) */}
            <mesh>
                <cylinderGeometry args={[0.45, 0.45, length, 16]} />
                <shaderMaterial
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    transparent={true}
                    blending={AdditiveBlending}
                    depthWrite={false}
                    uniforms={{
                        color: { value: new Color("#00e5ff") },
                        glowPower: { value: 4.5 },
                        glowIntensity: { value: 0.65 }
                    }}
                />
            </mesh>
        </group>
    );
}

interface CarouselItemProps {
    index: number;
    activeIndex: number;
    direction: "next" | "prev";
    car: typeof CARS[number];
}

function CarouselItem({ index, activeIndex, direction, car }: CarouselItemProps) {
    const groupRef = useRef<Group>(null);

    // Position X initiale constante pour éviter que React n'écrase la position lors du rerender
    const [initialX] = useState(index === activeIndex ? 0 : 20);

    // Position X cible de la voiture
    const targetXRef = useRef(index === activeIndex ? 0 : 20);

    // Conserver trace du précédent index actif
    const prevActiveRef = useRef(activeIndex);
    // Conserver la direction pour le useEffect
    const directionRef = useRef(direction);
    directionRef.current = direction;

    useEffect(() => {
        const prevActive = prevActiveRef.current;
        // +20 = hors écran à droite, -20 = hors écran à gauche
        const offscreenEntry = directionRef.current === "next" ? 20 : -20;
        const offscreenExit = directionRef.current === "next" ? -20 : 20;

        if (index === activeIndex && prevActive !== index) {
            // Cet item vient d'être activé : snap hors écran du côté entrée, glisse vers le centre
            if (groupRef.current) {
                groupRef.current.position.x = offscreenEntry;
            }
            targetXRef.current = 0;
        } else if (prevActive === index && activeIndex !== index) {
            // Cet item vient d'être désactivé : glisse vers le côté de sortie
            targetXRef.current = offscreenExit;
        } else if (index !== activeIndex && prevActive !== index) {
            // Inactif avant et après : reste hors écran côté entrée (prêt à entrer)
            if (groupRef.current) {
                groupRef.current.position.x = offscreenEntry;
            }
            targetXRef.current = offscreenEntry;
        }

        prevActiveRef.current = activeIndex;
    }, [activeIndex, index]);

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.position.x = MathUtils.lerp(
                groupRef.current.position.x,
                targetXRef.current,
                0.08
            );
        }

        // Gérer l'opacité des annotations sans provoquer de re-rendu React
        if (groupRef.current) {
            const elements = document.querySelectorAll(`[data-annotation="${index}"]`);
            elements.forEach((el) => {
                const htmlEl = el as HTMLElement;
                const stateAttr = htmlEl.getAttribute("data-target-state");
                const targetState = stateAttr ? parseInt(stateAttr) : 1;
                const isActiveAndDetail = index === activeIndex && scrollState.target === targetState;

                if (isActiveAndDetail) {
                    htmlEl.style.opacity = '1';
                    htmlEl.style.pointerEvents = 'auto';
                } else {
                    htmlEl.style.opacity = '0';
                    htmlEl.style.pointerEvents = 'none';
                }
            });
        }
    });

    return (
        <group ref={groupRef} position={[initialX, 0, 0]}>
            {/* CHARGEMENT DU MODÈLE 3D DE LA VOITURE */}
            <Model path={car.path} rotation={car.rotation} scale={car.scale} />

            {/* ANNOTATIONS 3D */}
            {car.annotations?.map((anno, i) => (
                <group key={i} position={anno.position}>
                    <Html center distanceFactor={15} zIndexRange={[100, 0]}>
                        <div
                            className="car-annotation"
                            style={{
                                transition: 'opacity 0.3s ease, transform 0.3s ease',
                                opacity: 0, // Default 0, will be animated in useFrame
                                pointerEvents: 'none',
                            }}
                            data-annotation={index}
                            data-target-state={i + 1}
                            data-align={anno.align || 'left'}
                        >
                            <div className="annotation-content">
                                <div className="annotation-title">{anno.title}</div>
                                <div className="annotation-desc">{anno.description}</div>
                            </div>
                            {anno.align === 'right' ? (
                                <svg className="annotation-svg align-right" viewBox="0 0 200 80">
                                    {/* start at bottom-left (dot), diagonal to top-right, then horizontal */}
                                    <path d="M 0 80 L 100 0 L 200 0" fill="none" stroke="white" strokeWidth="1.5" />
                                    <circle cx="0" cy="80" r="6" fill="rgba(255,255,255,0.2)" />
                                    <circle cx="0" cy="80" r="3" fill="white" />
                                </svg>
                            ) : (
                                <svg className="annotation-svg align-left" viewBox="0 0 200 80">
                                    <path d="M 0 0 L 100 0 L 200 80" fill="none" stroke="white" strokeWidth="1.5" />
                                    <circle cx="200" cy="80" r="6" fill="rgba(255,255,255,0.2)" />
                                    <circle cx="200" cy="80" r="3" fill="white" />
                                </svg>
                            )}
                        </div>
                    </Html>
                </group>
            ))}
        </group>
    );
}

interface Scene3DProps {
    activeIndex: number;
    direction: "next" | "prev";
}

export default function Scene3D({ activeIndex, direction }: Scene3DProps) {
    const { camera } = useThree();
    const controlsRef = useRef<any>(null);

    // Positions caméra : initiale (showroom) → latérale (détail) → avant (lumières) → arrière (exhaust)
    const CAM_POS_0 = useMemo(() => new Vector3(-0.56, 4.63, 14.18), []);
    const CAM_POS_1 = useMemo(() => new Vector3(9.04, 1.57, -2.28), []);
    const CAM_POS_2 = useMemo(() => new Vector3(-8.71, 1.87, 3.63), []);
    const CAM_POS_3 = useMemo(() => new Vector3(3.07, 3.32, -9.52), []);

    const TARGET_0 = useMemo(() => new Vector3(-0.49, 1.48, -0.39), []);
    const TARGET_1 = useMemo(() => new Vector3(-2.27, 0.76, -0.17), []);
    const TARGET_2 = useMemo(() => new Vector3(5.80, -0.15, 0.88), []);
    const TARGET_3 = useMemo(() => new Vector3(0.04, -1.32, 4.32), []);
    // Vecteur de cible courante (muté chaque frame)
    const currentTarget = useMemo(() => new Vector3(-0.49, 1.48, -0.39), []);
    const tempCam = useMemo(() => new Vector3(), []);
    const tempTarget = useMemo(() => new Vector3(), []);

    // Activer/désactiver OrbitControls selon le scroll
    const [orbitEnabled, setOrbitEnabled] = useState(true);
    useEffect(() => {
        const onScroll = () => {
            setOrbitEnabled(window.scrollY < window.innerHeight * 0.15);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    const marbleTextures = useTexture({
        map: "/textures/marble_color.jpg",
        normalMap: "/textures/marble_normal.jpg",
        roughnessMap: "/textures/marble_roughness.jpg",
    });

    const [displayedIndex, setDisplayedIndex] = useState(activeIndex);
    const textGroupRef = useRef<Group>(null);
    const parallaxGroupRef = useRef<Group>(null);
    const brandTextRef = useRef<any>(null);
    const modelTextRef = useRef<any>(null);

    const opacityRef = useRef(1.0);
    const targetOpacityRef = useRef(1.0);
    const targetYRef = useRef(0.0);
    const isTransitioningRef = useRef(false);

    useEffect(() => {
        // Début de la transition : on lance le fade-out et le slide-up
        targetOpacityRef.current = 0.0;
        targetYRef.current = 2.0;
        isTransitioningRef.current = true;
    }, [activeIndex]);

    useFrame(() => {
        // Lerp de l'opacité et de la position Y du groupe de texte
        opacityRef.current = MathUtils.lerp(opacityRef.current, targetOpacityRef.current, 0.12);

        if (textGroupRef.current) {
            textGroupRef.current.position.y = MathUtils.lerp(
                textGroupRef.current.position.y,
                targetYRef.current,
                0.12
            );
        }

        // Appliquer l'opacité de manière performante
        if (brandTextRef.current) {
            brandTextRef.current.outlineOpacity = opacityRef.current;
        }
        if (modelTextRef.current) {
            modelTextRef.current.fillOpacity = opacityRef.current;
        }

        // Une fois le texte complètement estompé, on change le texte et on le fait glisser depuis le bas
        if (isTransitioningRef.current && targetOpacityRef.current === 0.0 && opacityRef.current < 0.05) {
            setDisplayedIndex(activeIndex);

            // Snap la position en bas
            if (textGroupRef.current) {
                textGroupRef.current.position.y = -2.0;
            }

            targetYRef.current = 0.0;
            targetOpacityRef.current = 1.0;
            isTransitioningRef.current = false;
        }
    });

    // Animation caméra pilotée par le scroll (custom snap via scrollState)
    useFrame((state) => {
        // --- Parallaxe au mouvement de la souris ---
        if (parallaxGroupRef.current) {
            // Mouvement très léger (0.03 radian max)
            const targetRotY = state.pointer.x * 0.03;
            const targetRotX = -state.pointer.y * 0.03;
            parallaxGroupRef.current.rotation.y = MathUtils.lerp(parallaxGroupRef.current.rotation.y, targetRotY, 0.1);
            parallaxGroupRef.current.rotation.x = MathUtils.lerp(parallaxGroupRef.current.rotation.x, targetRotX, 0.1);
        }

        // Lerp fluide de la progression de scroll vers la cible snap (0 ou 1)
        scrollState.progress = MathUtils.lerp(scrollState.progress, scrollState.target, 0.055);

        // Si on est en train d'animer, on prend le contrôle de la caméra
        const isAnimating = Math.abs(scrollState.progress - scrollState.target) > 0.001;

        if (isAnimating) {
            // Positions désirées interpolées selon la progression (-1 à 4)
            if (scrollState.progress < 0) {
                // De 0 (showroom) à -1 (exhausts) en remontant
                const t = scrollState.progress + 1;
                slerpVectorAroundY(CAM_POS_3, CAM_POS_0, t, tempCam);
                tempTarget.lerpVectors(TARGET_3, TARGET_0, t);
            } else if (scrollState.progress < 1) {
                // Du showroom (0) à la jante (1) : interpolation linéaire simple
                tempCam.lerpVectors(CAM_POS_0, CAM_POS_1, scrollState.progress);
                tempTarget.lerpVectors(TARGET_0, TARGET_1, scrollState.progress);
            } else if (scrollState.progress < 2) {
                // De la jante (1) à l'avant (2) : interpolation orbitale autour de la voiture
                const t = scrollState.progress - 1;
                slerpVectorAroundY(CAM_POS_1, CAM_POS_2, t, tempCam);
                tempTarget.lerpVectors(TARGET_1, TARGET_2, t);
            } else if (scrollState.progress < 3) {
                // De l'avant (2) à l'arrière (3)
                const t = scrollState.progress - 2;
                slerpVectorAroundY(CAM_POS_2, CAM_POS_3, t, tempCam);
                tempTarget.lerpVectors(TARGET_2, TARGET_3, t);
            } else {
                // De l'arrière (3) au showroom (4) pour reboucler
                const t = scrollState.progress - 3;
                slerpVectorAroundY(CAM_POS_3, CAM_POS_0, t, tempCam);
                tempTarget.lerpVectors(TARGET_3, TARGET_0, t);
            }

            // Appliquer la position
            state.camera.position.copy(tempCam);

            if (controlsRef.current) {
                controlsRef.current.target.copy(tempTarget);
            } else {
                currentTarget.copy(tempTarget);
                state.camera.lookAt(currentTarget);
            }
        } else {
            // Si l'animation est terminée et qu'on a atteint un état de boucle, on réinitialise silencieusement
            if (scrollState.target === 4) {
                scrollState.target = 0;
                scrollState.progress = 0;
            } else if (scrollState.target === -1) {
                scrollState.target = 3;
                scrollState.progress = 3;
            }
        }
    });

    return (
        <>

            <OrbitControls
                ref={controlsRef}
                makeDefault
                enableRotate={false}
                enablePan={false}
                enableZoom={false}
                target={[-0.49, 1.48, -0.39]}
                enableDamping={true}
                dampingFactor={0.05}
            />

            <group ref={parallaxGroupRef}>
                {/* ÉCLAIRAGE GLOBAL */}
                <ambientLight intensity={0.25} />
                <directionalLight
                    position={[8, 12, 8]}
                    intensity={2.5}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-bias={-0.0001}
                />

                {/* REFLETS STUDIO ET RENDERER ENV */}
                <Environment preset="studio" />

                {/* --- PANNEAUX DE LUMIÈRE DE STUDIO --- */}
                <mesh position={[0, 9.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[6, 12]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
                </mesh>
                <mesh position={[-6, 9.8, -3]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[2, 8]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
                </mesh>
                <mesh position={[6, 9.8, -3]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[2, 8]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
                </mesh>

                {/* LE SOL (MARBRE SOMBRE POLI AVEC RÉFLEXIONS RÉELLES) */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                    <planeGeometry args={[30, 30]} />
                    <MeshReflectorMaterial
                        blur={[400, 100]}
                        resolution={1024}
                        mixBlur={1}
                        mixStrength={25}
                        depthScale={1}
                        minDepthThreshold={0.85}
                        maxDepthThreshold={1}
                        color="#151515"
                        metalness={0.7}
                        roughness={0.15}
                        map={marbleTextures.map}
                        normalMap={marbleTextures.normalMap}
                        roughnessMap={marbleTextures.roughnessMap}
                    />
                </mesh>

                {/* --- LES MURS (STRUCTURE DE LA PIÈCE EN PANNEAUX ARCHITECTURAUX ROUGH PLASTER) --- */}

                {/* Mur de fond (Z = -15) */}
                {[-11.8, -5.9, 0, 5.9, 11.8].map((x, i) => (
                    <mesh key={`wall-back-${i}`} position={[x, 5, -15]} receiveShadow castShadow>
                        <boxGeometry args={[5.8, 10, 0.2]} />
                        <meshStandardMaterial
                            color={new Color("#ffffff")}
                            roughness={0.05}
                            metalness={0.1}
                        />
                    </mesh>
                ))}

                {/* Mur gauche (X = -15) */}
                {[-11.8, -5.9, 0, 5.9, 11.8].map((z, i) => (
                    <mesh key={`wall-left-${i}`} position={[-15, 5, z]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
                        <boxGeometry args={[5.8, 10, 0.2]} />
                        <meshStandardMaterial
                            color={new Color("#ffffff")}
                            roughness={0.05}
                            metalness={0.1}
                        />
                    </mesh>
                ))}

                {/* Mur droit (X = 15) */}
                {[-11.8, -5.9, 0, 5.9, 11.8].map((z, i) => (
                    <mesh key={`wall-right-${i}`} position={[15, 5, z]} rotation={[0, -Math.PI / 2, 0]} receiveShadow castShadow>
                        <boxGeometry args={[5.8, 10, 0.2]} />
                        <meshStandardMaterial
                            color={new Color("#ffffff")}
                            roughness={0.05}
                            metalness={0.1}
                        />
                    </mesh>
                ))}

                {/* Mur avant (Z = 15) */}
                {[-11.8, -5.9, 0, 5.9, 11.8].map((x, i) => (
                    <mesh key={`wall-front-${i}`} position={[x, 5, 15]} rotation={[0, Math.PI, 0]} receiveShadow castShadow>
                        <boxGeometry args={[5.8, 10, 0.2]} />
                        <meshStandardMaterial
                            color={new Color("#ffffff")}
                            roughness={0.05}
                            metalness={0.1}
                        />
                    </mesh>
                ))}

                {/* --- PLINTHES / BASEBOARDS --- */}
                {/* Plinthe fond */}
                <mesh position={[0, 0.2, -14.85]}>
                    <boxGeometry args={[30, 0.4, 0.22]} />
                    <meshStandardMaterial color={new Color("#1a1a1d")} metalness={0.8} roughness={0.3} />
                </mesh>
                {/* Plinthe gauche */}
                <mesh position={[-14.85, 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[30, 0.4, 0.22]} />
                    <meshStandardMaterial color={new Color("#1a1a1d")} metalness={0.8} roughness={0.3} />
                </mesh>
                {/* Plinthe droite */}
                <mesh position={[14.85, 0.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
                    <boxGeometry args={[30, 0.4, 0.22]} />
                    <meshStandardMaterial color={new Color("#1a1a1d")} metalness={0.8} roughness={0.3} />
                </mesh>
                {/* Plinthe avant */}
                <mesh position={[0, 0.2, 14.85]} rotation={[0, Math.PI, 0]}>
                    <boxGeometry args={[30, 0.4, 0.22]} />
                    <meshStandardMaterial color={new Color("#1a1a1d")} metalness={0.8} roughness={0.3} />
                </mesh>

                {/* --- PILIERS DÉCORATIFS POUR AJOUTER DU RELIEF --- */}

                {/* Piliers du mur de fond */}
                <mesh position={[-10, 5, -14.85]} receiveShadow castShadow>
                    <boxGeometry args={[0.8, 10, 0.3]} />
                    <meshStandardMaterial color={new Color("#18181b")} roughness={0.7} metalness={0.3} />
                </mesh>
                <mesh position={[0, 5, -14.85]} receiveShadow castShadow>
                    <boxGeometry args={[0.8, 10, 0.3]} />
                    <meshStandardMaterial color={new Color("#18181b")} roughness={0.7} metalness={0.3} />
                </mesh>
                <mesh position={[10, 5, -14.85]} receiveShadow castShadow>
                    <boxGeometry args={[0.8, 10, 0.3]} />
                    <meshStandardMaterial color={new Color("#18181b")} roughness={0.7} metalness={0.3} />
                </mesh>

                {/* Piliers du mur gauche */}
                <mesh position={[-14.85, 5, -10]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
                    <boxGeometry args={[0.8, 10, 0.3]} />
                    <meshStandardMaterial color={new Color("#18181b")} roughness={0.7} metalness={0.3} />
                </mesh>
                <mesh position={[-14.85, 5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
                    <boxGeometry args={[0.8, 10, 0.3]} />
                    <meshStandardMaterial color={new Color("#18181b")} roughness={0.7} metalness={0.3} />
                </mesh>
                <mesh position={[-14.85, 5, 10]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
                    <boxGeometry args={[0.8, 10, 0.3]} />
                    <meshStandardMaterial color={new Color("#18181b")} roughness={0.7} metalness={0.3} />
                </mesh>

                {/* Piliers du mur droit */}
                <mesh position={[14.85, 5, -10]} rotation={[0, -Math.PI / 2, 0]} receiveShadow castShadow>
                    <boxGeometry args={[0.8, 10, 0.3]} />
                    <meshStandardMaterial color={new Color("#18181b")} roughness={0.7} metalness={0.3} />
                </mesh>
                <mesh position={[14.85, 5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow castShadow>
                    <boxGeometry args={[0.8, 10, 0.3]} />
                    <meshStandardMaterial color={new Color("#18181b")} roughness={0.7} metalness={0.3} />
                </mesh>
                <mesh position={[14.85, 5, 10]} rotation={[0, -Math.PI / 2, 0]} receiveShadow castShadow>
                    <boxGeometry args={[0.8, 10, 0.3]} />
                    <meshStandardMaterial color={new Color("#18181b")} roughness={0.7} metalness={0.3} />
                </mesh>

                {/* --- TUBE NÉON ET LUEURS CYLINDRIQUES DIFFUSES --- */}

                {/* LED mur de fond */}
                <group>
                    <NeonGlow position={[0, 7.5, -14.8]} rotation={[0, 0, Math.PI / 2]} length={30} />
                    {/* Lumières projetées distribuées */}
                    <pointLight position={[-10, 7.5, -14.4]} color={new Color("#00e5ff")} intensity={2.0} distance={12} decay={1.8} />
                    <pointLight position={[0, 7.5, -14.4]} color={new Color("#00e5ff")} intensity={2.0} distance={12} decay={1.8} />
                    <pointLight position={[10, 7.5, -14.4]} color={new Color("#00e5ff")} intensity={2.0} distance={12} decay={1.8} />
                </group>

                {/* LED mur gauche */}
                <group>
                    <NeonGlow position={[-14.8, 7.5, 0]} rotation={[Math.PI / 2, 0, 0]} length={30} />
                    {/* Lumières projetées distribuées */}
                    <pointLight position={[-14.4, 7.5, -10]} color={new Color("#00e5ff")} intensity={2.0} distance={12} decay={1.8} />
                    <pointLight position={[-14.4, 7.5, 0]} color={new Color("#00e5ff")} intensity={2.0} distance={12} decay={1.8} />
                    <pointLight position={[-14.4, 7.5, 10]} color={new Color("#00e5ff")} intensity={2.0} distance={12} decay={1.8} />
                </group>

                {/* LED mur droit */}
                <group>
                    <NeonGlow position={[14.8, 7.5, 0]} rotation={[Math.PI / 2, 0, 0]} length={30} />
                    {/* Lumières projetées distribuées */}
                    <pointLight position={[14.4, 7.5, -10]} color={new Color("#00e5ff")} intensity={2.0} distance={12} decay={1.8} />
                    <pointLight position={[14.4, 7.5, 0]} color={new Color("#00e5ff")} intensity={2.0} distance={12} decay={1.8} />
                    <pointLight position={[14.4, 7.5, 10]} color={new Color("#00e5ff")} intensity={2.0} distance={12} decay={1.8} />
                </group>

                {/* LED mur avant */}
                <group>
                    <NeonGlow position={[0, 7.5, 14.8]} rotation={[0, 0, Math.PI / 2]} length={30} />
                    {/* Lumières projetées distribuées */}
                    <pointLight position={[-10, 7.5, 14.4]} color={new Color("#00e5ff")} intensity={2.0} distance={12} decay={1.8} />
                    <pointLight position={[0, 7.5, 14.4]} color={new Color("#00e5ff")} intensity={2.0} distance={12} decay={1.8} />
                    <pointLight position={[10, 7.5, 14.4]} color={new Color("#00e5ff")} intensity={2.0} distance={12} decay={1.8} />
                </group>

                {/* TEXTES DE MARQUE SANS MOUVEMENT (Reste au centre de la scène, seul le contenu change avec transition) */}
                <group ref={textGroupRef}>
                    <Text
                        ref={brandTextRef}
                        font="/fonts/Akira.woff"
                        fontSize={CARS[displayedIndex].brandFontSize ?? 8.2}
                        position={[-0.49, 5.2, -13.0]}
                        anchorX="center"
                        anchorY="middle"
                        fillOpacity={0}
                        outlineWidth={0.01}
                        outlineColor="#eca7ba"
                        letterSpacing={0.15}
                    >
                        {CARS[displayedIndex].brand}
                    </Text>

                    <Text
                        ref={modelTextRef}
                        font="/fonts/Outfit-Black.woff"
                        fontSize={CARS[displayedIndex].modelFontSize ?? 2.5}
                        position={[-0.49, 2.6, -12.9]}
                        anchorX="center"
                        anchorY="middle"
                        color="#000000"
                        letterSpacing={0.08}
                    >
                        {CARS[displayedIndex].model}
                    </Text>
                </group>

                {/* CAROUSEL DE VOITURES (Glissement horizontal automatique) */}
                {CARS.map((car, index) => (
                    <CarouselItem
                        key={car.path}
                        index={index}
                        activeIndex={activeIndex}
                        direction={direction}
                        car={car}
                    />
                ))}
            </group>
        </>
    );
}