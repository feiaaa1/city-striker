import React, { useMemo } from "react";
import * as THREE from "three";

interface WindowData {
	pos: [number, number, number];
	rot: [number, number, number];
}

interface BuildingData {
	id: number;
	x: number;
	z: number;
	w: number;
	h: number;
	d: number;
	windows: WindowData[];
}

const World: React.FC = () => {
	const buildings = useMemo(() => {
		const data: BuildingData[] = [];
		for (let i = 0; i < 60; i++) {
			const h = 5 + Math.random() * 25;
			const w = 4 + Math.random() * 6;
			const d = 4 + Math.random() * 6;
			const x = (Math.random() - 0.5) * 150;
			const z = (Math.random() - 0.5) * 150;

			// Avoid center area where player starts
			if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;

			// Pre-calculate windows for this building
			const windows: WindowData[] = [];
			const windowCount = 15 + Math.floor(Math.random() * 20);

			for (let j = 0; j < windowCount; j++) {
				const side = Math.floor(Math.random() * 4);
				const wx = (Math.random() - 0.5) * w * 0.8;
				const wy = (Math.random() - 0.5) * h * 0.8;
				const wz = (Math.random() - 0.5) * d * 0.8;

				if (side === 0) {
					// Front
					windows.push({ pos: [wx, wy, d / 2 + 0.02], rot: [0, 0, 0] });
				} else if (side === 1) {
					// Back
					windows.push({ pos: [wx, wy, -d / 2 - 0.02], rot: [0, Math.PI, 0] });
				} else if (side === 2) {
					// Right
					windows.push({
						pos: [w / 2 + 0.02, wy, wz],
						rot: [0, Math.PI / 2, 0],
					});
				} else {
					// Left
					windows.push({
						pos: [-w / 2 - 0.02, wy, wz],
						rot: [0, -Math.PI / 2, 0],
					});
				}
			}

			data.push({ x, z, w, h, d, id: i, windows });
		}
		return data;
	}, []);

	return (
		<group>
			{/* Ground */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[1000, 1000]} />
				<meshStandardMaterial color="#111111" />
			</mesh>

			{/* Ground Patterns (White stripes) */}
			<gridHelper
				args={[1000, 100, 0x444444, 0x222222]}
				position={[0, 0.01, 0]}
			/>

			{/* City markings */}
			{[-75, -50, -25, 0, 25, 50, 75].map((z) => (
				<mesh
					key={`h-stripe-${z}`}
					position={[0, 0.02, z]}
					rotation={[-Math.PI / 2, 0, 0]}
				>
					<planeGeometry args={[1000, 0.2]} />
					<meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
				</mesh>
			))}
			{[-75, -50, -25, 0, 25, 50, 75].map((x) => (
				<mesh
					key={`v-stripe-${x}`}
					position={[x, 0.02, 0]}
					rotation={[-Math.PI / 2, 0, Math.PI / 2]}
				>
					<planeGeometry args={[1000, 0.2]} />
					<meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
				</mesh>
			))}

			{/* Buildings - Adjusted color to #444444 (2 degrees lighter than previous #2a2a2a) */}
			{buildings.map((b) => (
				<group key={b.id} position={[b.x, b.h / 2, b.z]}>
					<mesh castShadow receiveShadow>
						<boxGeometry args={[b.w, b.h, b.d]} />
						<meshStandardMaterial
							color="#444444"
							roughness={0.7}
							metalness={0.1}
						/>
					</mesh>

					{/* Windows - Static positions */}
					{b.windows.map((win, idx) => (
						<mesh
							key={`${b.id}-win-${idx}`}
							position={win.pos}
							rotation={win.rot}
						>
							<planeGeometry args={[0.3, 0.2]} />
							<meshBasicMaterial
								color={idx % 2 === 0 ? "#ffffaa" : "#aaffff"}
								transparent
								opacity={0.9}
							/>
						</mesh>
					))}
				</group>
			))}
		</group>
	);
};

export default World;
