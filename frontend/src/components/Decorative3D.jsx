import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";

const rings = [
  { pos: [-2.5, 0.5, -3], size: 0.6, speed: 0.3, color: "#D44333" },
  { pos: [2.8, -0.8, -4], size: 0.4, speed: 0.5, color: "#C8A24E" },
  { pos: [-1.8, -1.2, -2], size: 0.3, speed: 0.4, color: "#D44333" },
  { pos: [3, 1, -5], size: 0.5, speed: 0.35, color: "#C8A24E" },
];

function TorusKnot({ position, size, speed, color }) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * speed * 0.3;
    ref.current.rotation.y = state.clock.elapsedTime * speed * 0.5;
  });

  return (
    <mesh ref={ref} position={position} scale={size}>
      <torusKnotGeometry args={[1, 0.3, 64, 8]} />
      <MeshDistortMaterial
        color={color}
        transparent
        opacity={0.15}
        distort={0.2}
        speed={1.5}
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
}

function FloatingParticles() {
  const count = 30;
  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      pos.push((Math.random() - 0.5) * 10);
      pos.push((Math.random() - 0.5) * 6);
      pos.push((Math.random() - 0.5) * 6 - 2);
    }
    return new Float32Array(pos);
  }, []);

  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#C8A24E"
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
}

export default function Decorative3D() {
  return (
    <div className="decorative-3d" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 2], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[2, 2, 2]} intensity={0.3} />
        {rings.map((r, i) => (
          <Float key={i} speed={r.speed} rotationIntensity={0.3} floatIntensity={0.5}>
            <TorusKnot {...r} />
          </Float>
        ))}
        <FloatingParticles />
      </Canvas>
    </div>
  );
}
