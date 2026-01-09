import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import World from "./World";
import Enemy from "./Enemy";
import WeaponModel from "./WeaponModel";
import { GameState, BulletData, EnemyData } from "../types";
import { audioManager } from "../utils/audio";

interface GameSceneProps {
	gameState: GameState;
	updateGameState: (updater: (prev: GameState) => GameState) => void;
	isGameOver: boolean;
	isReloading: boolean;
	setIsReloading: (value: boolean) => void;
}

const GameScene: React.FC<GameSceneProps> = ({
	gameState,
	updateGameState,
	isGameOver,
	isReloading,
	setIsReloading,
}) => {
	const { camera, raycaster, scene } = useThree();
	const [bullets, setBullets] = useState<BulletData[]>([]);
	const [enemies, setEnemies] = useState<EnemyData[]>([]);

	// Player state
	const velocity = useRef(new THREE.Vector3());
	const keys = useRef<Record<string, boolean>>({});
	const isJetpackActive = useRef(false);
	const jetpackStartTime = useRef(0);
	const jetpackDuration = 2000; // 2 seconds per charge

	// Generate enemies
	useEffect(() => {
		const initialEnemies: EnemyData[] = [];
		for (let i = 0; i < 5; i++) {
			initialEnemies.push({
				id: Math.random().toString(),
				position: [(Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40],
				health: 100,
				maxHealth: 100,
				velocity: [0, 0, 0],
				lastAttackTime: 0,
				attackCooldown: 2000, // 2 seconds between attacks
			});
		}
		setEnemies(initialEnemies);
		updateGameState((s) => ({
			...s,
			enemiesRemaining: 5,
		}));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const reload = useCallback(() => {
		if (
			isReloading ||
			gameState.reserveAmmo <= 0 ||
			gameState.ammo >= gameState.maxAmmo
		)
			return;

		setIsReloading(true);
		audioManager.playReloadSound();

		// Reload takes 1.5 seconds
		setTimeout(() => {
			updateGameState((prev) => {
				const ammoNeeded = prev.maxAmmo - prev.ammo;
				const ammoToTake = Math.min(ammoNeeded, prev.reserveAmmo);
				return {
					...prev,
					ammo: prev.ammo + ammoToTake,
					reserveAmmo: prev.reserveAmmo - ammoToTake,
				};
			});
			setIsReloading(false);
		}, 1500);
	}, [isReloading, gameState.reserveAmmo, gameState.ammo, gameState.maxAmmo, updateGameState]);

	// Controls
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			keys.current[e.code] = true;
			// Handle reload key
			if (e.code === "KeyR" && document.pointerLockElement) {
				reload();
			}
			// Handle jetpack activation
			if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
				if (
					gameState.jetpackCharges > 0 &&
					!isJetpackActive.current &&
					document.pointerLockElement
				) {
					isJetpackActive.current = true;
					jetpackStartTime.current = Date.now();
					updateGameState((prev) => ({
						...prev,
						jetpackCharges: prev.jetpackCharges - 1,
					}));
				}
			}
		};
		const handleKeyUp = (e: KeyboardEvent) => {
			keys.current[e.code] = false;
			// Handle jetpack deactivation
			if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
				isJetpackActive.current = false;
			}
		};
		const handleMouseDown = () => {
			// Only shoot if the pointer is actually locked
			if (document.pointerLockElement) {
				shoot();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);
		window.addEventListener("mousedown", handleMouseDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
			window.removeEventListener("mousedown", handleMouseDown);
		};
	}, [gameState.ammo, gameState.jetpackCharges, isGameOver, isReloading, reload, updateGameState]);

	const shoot = () => {
		if (isGameOver || isReloading || gameState.ammo <= 0) {
			// Auto reload when ammo is empty
			if (gameState.ammo <= 0 && !isReloading && gameState.reserveAmmo > 0) {
				reload();
			}
			return;
		}

		updateGameState((prev) => ({ ...prev, ammo: prev.ammo - 1 }));
		audioManager.playShootSound();

		const direction = new THREE.Vector3();
		camera.getWorldDirection(direction);

		const bullet: BulletData = {
			id: Math.random().toString(),
			position: [camera.position.x, camera.position.y - 0.2, camera.position.z],
			velocity: [direction.x * 2, direction.y * 2, direction.z * 2],
			createdAt: Date.now(),
		};

		setBullets((prev) => [...prev, bullet]);
	};

	useFrame((state, delta) => {
		if (isGameOver) return;

		// Movement logic - Reduce speed to 1/3 of current value
		const moveSpeed = 27.8 / 3;
		const direction = new THREE.Vector3();
		const frontVector = new THREE.Vector3(
			0,
			0,
			Number(keys.current["KeyS"] || 0) - Number(keys.current["KeyW"] || 0)
		);
		const sideVector = new THREE.Vector3(
			Number(keys.current["KeyA"] || 0) - Number(keys.current["KeyD"] || 0),
			0,
			0
		);

		direction
			.subVectors(frontVector, sideVector)
			.normalize()
			.multiplyScalar(moveSpeed)
			.applyEuler(camera.rotation);

		// X and Z movement (horizontal)
		velocity.current.x = direction.x;
		velocity.current.z = direction.z;

		// Jumping / Gravity
		if (keys.current["Space"] && camera.position.y <= 2.1) {
			velocity.current.y = 10; // Adjusted jump slightly for the lower speed
		}

		// Jetpack system
		if (isJetpackActive.current) {
			const elapsed = Date.now() - jetpackStartTime.current;
			if (elapsed < jetpackDuration) {
				// Apply upward thrust
				velocity.current.y += 15 * delta; // Strong upward force
			} else {
				// Jetpack charge expired
				isJetpackActive.current = false;
			}
		}

		velocity.current.y -= 25 * delta; // Gravity

		// Final position update applying delta once
		camera.position.add(velocity.current.clone().multiplyScalar(delta));

		if (camera.position.y < 2) {
			camera.position.y = 2;
			velocity.current.y = 0;
		}

		// Bullet movement and cleanup
		setBullets((prev) => {
			const nextBullets: BulletData[] = [];
			const now = Date.now();

			prev.forEach((bullet) => {
				if (now - bullet.createdAt < 3000) {
					const newPos: [number, number, number] = [
						bullet.position[0] + bullet.velocity[0],
						bullet.position[1] + bullet.velocity[1],
						bullet.position[2] + bullet.velocity[2],
					];

					// Collision Check
					let hit = false;
					setEnemies((prevEnemies) => {
						return prevEnemies.map((enemy) => {
							const dx = enemy.position[0] - newPos[0];
							const dy = enemy.position[1] + 1 - newPos[1];
							const dz = enemy.position[2] - newPos[2];
							const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

							if (dist < 1 && enemy.health > 0) {
								hit = true;
								audioManager.playHitSound();
								const newHealth = enemy.health - 25;
								if (newHealth <= 0) {
									updateGameState((s) => ({
										...s,
										score: s.score + 25,
										enemiesKilled: s.enemiesKilled + 1,
									}));
								} else {
									updateGameState((s) => ({ ...s, score: s.score + 25 }));
								}
								return { ...enemy, health: newHealth };
							}
							return enemy;
						});
					});

					if (!hit) {
						nextBullets.push({ ...bullet, position: newPos });
					}
				}
			});
			return nextBullets;
		});

		// Enemy AI: Movement and Attack
		const now = Date.now();
		setEnemies((prev) => {
			return prev.map((enemy) => {
				if (enemy.health <= 0) return enemy;

				const dx = camera.position.x - enemy.position[0];
				const dz = camera.position.z - enemy.position[2];
				const dist = Math.sqrt(dx * dx + dz * dz);

				// Move towards player if far away
				const moveSpeed = 3 * delta;
				let newPos: [number, number, number] = [...enemy.position];
				let newVel: [number, number, number] = enemy.velocity || [0, 0, 0];

				if (dist > 5) {
					// Move towards player
					const dirX = (dx / dist) * moveSpeed;
					const dirZ = (dz / dist) * moveSpeed;
					newPos = [
						enemy.position[0] + dirX,
						enemy.position[1],
						enemy.position[2] + dirZ,
					];
					newVel = [dirX / delta, 0, dirZ / delta];
				} else if (dist < 3) {
					// Move away from player if too close
					const dirX = (-dx / dist) * moveSpeed * 0.5;
					const dirZ = (-dz / dist) * moveSpeed * 0.5;
					newPos = [
						enemy.position[0] + dirX,
						enemy.position[1],
						enemy.position[2] + dirZ,
					];
					newVel = [dirX / delta, 0, dirZ / delta];
				}

				// Attack player if in range
				const canAttack =
					dist < 8 &&
					now - (enemy.lastAttackTime || 0) > (enemy.attackCooldown || 2000);

				if (canAttack) {
					// Damage player
					audioManager.playEnemyAttackSound();
					audioManager.playDamageSound();
					updateGameState((s) => ({
						...s,
						health: Math.max(0, s.health - 10),
					}));
					return {
						...enemy,
						position: newPos,
						velocity: newVel,
						lastAttackTime: now,
					};
				}

				return {
					...enemy,
					position: newPos,
					velocity: newVel,
				};
			});
		});

		// Wave system: Check if all enemies are dead, spawn next wave
		setEnemies((prev) => {
			const alive = prev.filter((e) => e.health > 0);
			const totalEnemies = prev.length;

			// If all enemies are dead, spawn next wave
			if (alive.length === 0 && totalEnemies > 0) {
				const currentWave = gameState.wave;
				const nextWave = currentWave + 1;
				const enemiesPerWave = 5 + (nextWave - 1) * 2; // Increase enemies per wave
				const newEnemies: EnemyData[] = [];

				// Increase difficulty: faster attack, more health
				const enemyHealth = 100 + (nextWave - 1) * 20;
				const attackCooldown = Math.max(1000, 2000 - (nextWave - 1) * 100);

				for (let i = 0; i < enemiesPerWave; i++) {
					newEnemies.push({
						id: Math.random().toString(),
						position: [
							(Math.random() - 0.5) * 50,
							0,
							(Math.random() - 0.5) * 50,
						],
						health: enemyHealth,
						maxHealth: enemyHealth,
						velocity: [0, 0, 0],
						lastAttackTime: 0,
						attackCooldown: attackCooldown,
					});
				}

				updateGameState((s) => ({
					...s,
					wave: nextWave,
					enemiesRemaining: enemiesPerWave,
					// Reward player: restore health and ammo
					health: Math.min(100, s.health + 20),
					ammo: s.maxAmmo,
					reserveAmmo: s.reserveAmmo + 30,
					jetpackCharges: Math.min(5, s.jetpackCharges + 1),
				}));

				return newEnemies;
			}

			// Normal respawn logic: maintain minimum enemies
			const deadCount = prev.filter((e) => e.health <= 0).length;
			if (deadCount > 0) {
				updateGameState((s) => ({
					...s,
					enemiesRemaining: Math.max(0, alive.length),
				}));

				// Spawn new enemies to maintain minimum count
				const minEnemies = 5;
				while (alive.length < minEnemies && gameState.enemiesRemaining > alive.length) {
					alive.push({
						id: Math.random().toString(),
						position: [
							(Math.random() - 0.5) * 50,
							0,
							(Math.random() - 0.5) * 50,
						],
						health: 100 + (gameState.wave - 1) * 20,
						maxHealth: 100 + (gameState.wave - 1) * 20,
						velocity: [0, 0, 0],
						lastAttackTime: 0,
						attackCooldown: Math.max(1000, 2000 - (gameState.wave - 1) * 100),
					});
				}
				return alive;
			}
			return prev;
		});
	});

	return (
		<>
			<World />

			{enemies.map((enemy) => (
				<Enemy key={enemy.id} data={enemy} />
			))}

			{bullets.map((bullet) => (
				<mesh key={bullet.id} position={bullet.position}>
					<sphereGeometry args={[0.05, 8, 8]} />
					<meshBasicMaterial color="#ffff00" />
				</mesh>
			))}

			<WeaponModel isReloading={isReloading} />
		</>
	);
};

export default GameScene;
