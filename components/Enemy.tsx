import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { EnemyData } from "../types";

interface EnemyProps {
	data: EnemyData;
}

const Enemy: React.FC<EnemyProps> = ({ data }) => {
	const meshRef = useRef<THREE.Group>(null);

	useFrame((state) => {
		if (meshRef.current) {
			// Slow rotation or simple behavior
			meshRef.current.lookAt(
				state.camera.position.x,
				0,
				state.camera.position.z
			);
		}
	});

	if (data.health <= 0) return null;

	return (
		<group position={data.position} ref={meshRef}>
			{/* Humanoid Body */}
			{/* Legs */}
			<mesh position={[-0.2, 0.4, 0]}>
				<boxGeometry args={[0.15, 0.8, 0.15]} />
				<meshStandardMaterial color="#ccc" />
			</mesh>
			<mesh position={[0.2, 0.4, 0]}>
				<boxGeometry args={[0.15, 0.8, 0.15]} />
				<meshStandardMaterial color="#ccc" />
			</mesh>
			{/* Torso */}
			<mesh position={[0, 1.2, 0]}>
				<boxGeometry args={[0.6, 0.8, 0.3]} />
				<meshStandardMaterial color="#888" />
			</mesh>
			{/* Head */}
			<mesh position={[0, 1.8, 0]}>
				<boxGeometry args={[0.3, 0.3, 0.3]} />
				<meshStandardMaterial color="#fff" />
			</mesh>
			{/* Arms */}
			<mesh position={[-0.4, 1.3, 0]}>
				<boxGeometry args={[0.15, 0.6, 0.15]} />
				<meshStandardMaterial color="#aaa" />
			</mesh>
			<mesh position={[0.4, 1.3, 0]}>
				<boxGeometry args={[0.15, 0.6, 0.15]} />
				<meshStandardMaterial color="#aaa" />
			</mesh>

			{/* Floating Health Bar */}
			<Html position={[0, 2.2, 0]} center>
				<div className="w-16 h-1 bg-black/50 border border-green-900 rounded overflow-hidden">
					<div
						className="h-full bg-green-400"
						style={{ width: `${(data.health / data.maxHealth) * 100}%` }}
					/>
				</div>
			</Html>
		</group>
	);
};

export default Enemy;
