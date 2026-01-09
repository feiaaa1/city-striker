import React, { useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { PointerLockControls, Sky, Stars } from "@react-three/drei";
import GameScene from "./components/GameScene";
import UIOverlay from "./components/UIOverlay";
import { GameState } from "./types";
import { audioManager } from "./utils/audio";

const App: React.FC = () => {
	const [gameState, setGameState] = useState<GameState>({
		score: 0,
		health: 100,
		enemiesRemaining: 5,
		ammo: 26,
		maxAmmo: 30,
		reserveAmmo: 120,
		jetpackCharges: 3,
		wave: 1,
		enemiesKilled: 0,
	});

	const [isGameOver, setIsGameOver] = useState(false);
	const [gameStarted, setGameStarted] = useState(false);
	const [isReloading, setIsReloading] = useState(false);

	const updateGameState = useCallback(
		(updater: (prev: GameState) => GameState) => {
			setGameState((prev) => {
				const next = updater(prev);
				if (next.health <= 0 && !isGameOver) {
					setIsGameOver(true);
				}
				return next;
			});
		},
		[isGameOver]
	);

	const handleStartGame = () => {
		// Initialize audio system
		audioManager.init();
		setGameStarted(true);
	};

	return (
		<div className="relative w-full h-full overflow-hidden bg-black select-none">
			{/* HUD Layers */}
			{gameStarted && (
				<UIOverlay
					gameState={gameState}
					isGameOver={isGameOver}
					isReloading={isReloading}
				/>
			)}

			<Canvas
				shadows
				camera={{ fov: 75, position: [0, 2, 5] }}
				gl={{ antialias: true }}
			>
				<Sky sunPosition={[100, 20, 100]} />
				<Stars
					radius={100}
					depth={50}
					count={5000}
					factor={4}
					saturation={0}
					fade
					speed={1}
				/>

				{/* Enhanced Lighting Configuration */}
				<ambientLight intensity={2.5} />
				<directionalLight
					position={[0, 100, 0]}
					intensity={5.0}
					castShadow
					shadow-mapSize={[2048, 2048]}
				/>
				<pointLight position={[10, 20, 10]} intensity={3} color="#ffffff" />
				<pointLight position={[-10, 20, -10]} intensity={2} color="#ffffff" />

				{gameStarted && (
					<GameScene
						gameState={gameState}
						updateGameState={updateGameState}
						isGameOver={isGameOver}
						isReloading={isReloading}
						setIsReloading={setIsReloading}
					/>
				)}

				{gameStarted && !isGameOver && <PointerLockControls />}
			</Canvas>

			{/* Start Screen Overlay */}
			{!gameStarted && (
				<div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-4 text-center">
					<div className="max-w-md">
						<h1 className="text-5xl font-black text-green-400 mb-2 italic tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
							City Striker 3D
						</h1>
						<p className="text-green-300/60 mb-8 font-mono text-sm tracking-widest uppercase">
							System Initialization: Ready
						</p>

						<div className="grid grid-cols-2 gap-4 mb-10 text-left">
							<div className="bg-green-950/20 border border-green-900/50 p-3 rounded">
								<p className="text-green-500 font-bold text-xs uppercase mb-1">
									Movement
								</p>
								<p className="text-white text-sm">WASD + Space</p>
							</div>
							<div className="bg-green-950/20 border border-green-900/50 p-3 rounded">
								<p className="text-green-500 font-bold text-xs uppercase mb-1">
									Combat
								</p>
								<p className="text-white text-sm">Mouse Left Click</p>
							</div>
							<div className="bg-green-950/20 border border-green-900/50 p-3 rounded">
								<p className="text-green-500 font-bold text-xs uppercase mb-1">
									Reload
								</p>
								<p className="text-white text-sm">Press R</p>
							</div>
						</div>

						<button
							onClick={handleStartGame}
							className="group relative px-12 py-4 bg-green-500 hover:bg-green-400 text-black font-black rounded-sm transition-all transform hover:scale-105 active:scale-95"
						>
							<span className="relative z-10 text-xl italic tracking-widest">
								INITIATE MISSION
							</span>
							<div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
						</button>
						<p className="mt-4 text-green-700 font-mono text-[10px] animate-pulse">
							[ WAITING FOR OPERATOR AUTHORIZATION ]
						</p>
					</div>
				</div>
			)}

			{gameStarted && !isGameOver && (
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
					<div className="w-4 h-4 border-2 border-green-400 rounded-full opacity-50"></div>
					<div className="w-0.5 h-0.5 bg-green-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
				</div>
			)}

			{isGameOver && (
				<div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
					<h1 className="text-6xl font-black text-red-500 mb-4 italic tracking-tighter animate-bounce">
						MISSION FAILED
					</h1>
					<p className="text-xl text-white mb-8 font-mono">
						Final Tactical Score: {gameState.score}
					</p>
					<button
						onClick={() => window.location.reload()}
						className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-sm border-b-4 border-red-900 transition-colors"
					>
						RETRY MISSION
					</button>
				</div>
			)}
		</div>
	);
};

export default App;
