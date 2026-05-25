"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

function BodyModel({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);
  const breathe = useRef(0);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.08;
      breathe.current += delta * 1.2;
      const s = 1 + Math.sin(breathe.current) * 0.012;
      group.current.scale.setScalar(1.2 * s);
    }
  });

  const cloned = scene.clone();
  cloned.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mesh.material = mats.map((m) => {
        if (!m) return m;
        const tex = (m as THREE.MeshStandardMaterial).map;
        if (tex) {
          return new THREE.MeshStandardMaterial({
            map: tex,
            transparent: true,
            alphaTest: 0.05,
            side: THREE.DoubleSide,
            metalness: 0.08,
            roughness: 0.72,
          });
        }
        if ("metalness" in m) {
          (m as THREE.MeshStandardMaterial).metalness = 0.05;
          (m as THREE.MeshStandardMaterial).roughness = 0.65;
        }
        return m;
      });
      if (Array.isArray(mesh.material) && mesh.material.length === 1) {
        mesh.material = mesh.material[0];
      }
    }
  });

  return (
    <group ref={group} position={[0, -1, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

interface AvatarViewer3DProps {
  modelUrl: string;
  className?: string;
}

export function AvatarViewer3D({ modelUrl, className = "" }: AvatarViewer3DProps) {
  return (
    <div className={`w-full h-full min-h-[320px] ${className}`}>
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Loading your digital twin...
          </div>
        }
      >
        <Canvas camera={{ position: [0, 0.4, 3.2], fov: 42 }} className="rounded-2xl" shadows>
          <ambientLight intensity={0.55} />
          <directionalLight position={[5, 10, 5]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-5, 4, -4]} intensity={0.45} color="#c4b5fd" />
          <spotLight position={[0, 5, 2]} intensity={0.35} angle={0.4} penumbra={0.5} color="#67e8f9" />
          <BodyModel url={modelUrl} />
          <ContactShadows position={[0, -1.05, 0]} opacity={0.6} scale={12} blur={2.8} far={4} />
          <Environment preset="city" />
          <OrbitControls
            enablePan={false}
            minDistance={1.8}
            maxDistance={5.5}
            minPolarAngle={Math.PI / 5}
            maxPolarAngle={Math.PI / 1.75}
            autoRotate
            autoRotateSpeed={0.6}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
