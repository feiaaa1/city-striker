import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface WeaponModelProps {
	isReloading?: boolean;
}

const WeaponModel: React.FC<WeaponModelProps> = ({ isReloading = false }) => {
	const group = useRef<THREE.Group>(null);
	const { camera } = useThree();
	const reloadAnimationTime = useRef(0);

	useEffect(() => {
		if (isReloading) {
			reloadAnimationTime.current = 0;
		}
	}, [isReloading]);

	useFrame((state, delta) => {
		if (group.current) {
			// Sync weapon with camera movement with a slight lag for feel
			const targetPos = new THREE.Vector3(0.5, -0.4, -0.8);
			targetPos.applyQuaternion(camera.quaternion);
			targetPos.add(camera.position);

			group.current.position.lerp(targetPos, 0.3);
			group.current.quaternion.slerp(camera.quaternion, 0.3);

			// Reload animation
			if (isReloading) {
				reloadAnimationTime.current += delta;
				const progress = Math.min(reloadAnimationTime.current / 1.5, 1); // 1.5s reload time
				
				// Rotate weapon down and back during reload
				const reloadRotation = Math.sin(progress * Math.PI) * 0.3;
				group.current.rotation.x = reloadRotation;
				group.current.position.y -= reloadRotation * 0.2;
			} else {
				// Weapon sway/bob (breathing effect)
				const t = state.clock.getElapsedTime();
				group.current.position.y += Math.sin(t * 4) * 0.002;
				group.current.rotation.x = 0;
			}
		}
	});

	return (
		<group ref={group}>
			{/* Assault Rifle Barrel */}
			<mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.08, 0.08, 1, 16]} />
				<meshStandardMaterial color="#333" roughness={0.2} metalness={0.8} />
			</mesh>
			{/* Assault Rifle Body */}
			<mesh position={[0, -0.05, 0.1]}>
				<boxGeometry args={[0.15, 0.25, 0.6]} />
				<meshStandardMaterial color="#444" roughness={0.3} metalness={0.6} />
			</mesh>
			{/* Assault Rifle Stock */}
			<mesh position={[0, -0.1, 0.5]}>
				<boxGeometry args={[0.1, 0.3, 0.4]} />
				<meshStandardMaterial color="#222" roughness={0.4} metalness={0.5} />
			</mesh>
			{/* Muzzle Glow */}
			<mesh position={[0, 0, -0.8]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
				<meshBasicMaterial color="#aaffff" transparent opacity={0.3} />
			</mesh>
		</group>
	);
};

export default WeaponModel;
