import React from "react";
import { GameState } from "../types";

interface UIOverlayProps {
	gameState: GameState;
	isGameOver: boolean;
	isReloading: boolean;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
	gameState,
	isGameOver,
	isReloading,
}) => {
	return (
		<div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
			{/* Top Section */}
			<div className="flex justify-between items-start">
				<div className="space-y-2">
					<div className="bg-black/60 border border-green-900 px-4 py-1 rounded-md min-w-[140px]">
						<span className="text-green-400 text-sm font-bold">
							Health: {gameState.health}
						</span>
					</div>
					<div className="bg-black/60 border border-green-900 px-4 py-1 rounded-md min-w-[140px]">
						<span className="text-green-400 text-sm font-bold">
							Jetpack: {gameState.jetpackCharges}
						</span>
					</div>
				</div>

				<div className="space-y-2 text-right">
					<div className="bg-black/60 border border-green-900 px-4 py-1 rounded-md min-w-[140px]">
						<span className="text-green-400 text-sm font-bold">
							Score: {gameState.score}
						</span>
					</div>
					<div className="bg-black/60 border border-green-900 px-4 py-1 rounded-md min-w-[140px]">
						<span className="text-green-400 text-sm font-bold">
							Wave: {gameState.wave}
						</span>
					</div>
					<div className="bg-black/60 border border-green-900 px-4 py-1 rounded-md min-w-[140px]">
						<span className="text-green-400 text-sm font-bold">
							Enemies: {gameState.enemiesRemaining}
						</span>
					</div>
				</div>
			</div>

			{/* Middle Alerts */}
			<div className="flex-grow flex items-center justify-center flex-col gap-2">
				{isReloading && (
					<div className="bg-black/60 border border-yellow-400/30 px-3 py-1 text-yellow-300 font-bold text-xs animate-pulse">
						RELOADING...
					</div>
				)}
				{gameState.score > 0 && !isReloading && (
					<div className="bg-black/60 border border-green-400/30 px-3 py-1 text-green-300 font-bold text-xs animate-pulse">
						HIT +25
					</div>
				)}
			</div>

			{/* Bottom Section */}
			<div className="flex flex-col items-center gap-4">
				{/* Central Health Bar */}
				<div className="w-1/3 h-4 bg-green-950/50 rounded-full border border-green-900 overflow-hidden relative">
					<div
						className="h-full bg-green-400 transition-all duration-300"
						style={{ width: `${gameState.health}%` }}
					/>
				</div>

				<div className="w-full flex justify-end">
					<div className="bg-black/60 border border-green-900 p-4 rounded-md min-w-[200px]">
						<h2 className="text-green-400 font-black text-xl italic tracking-widest text-right">
							ASSAULT RIFLE
						</h2>
						<div className="flex justify-end gap-2 text-green-300 font-mono text-lg mt-1">
							<span
								className={isReloading ? "text-yellow-400 animate-pulse" : ""}
							>
								{gameState.ammo.toString().padStart(2, "0")}
							</span>
							<span>/</span>
							<span className="opacity-60">
								{gameState.reserveAmmo.toString().padStart(3, "0")}
							</span>
						</div>
						{isReloading && (
							<div className="text-yellow-400 text-xs font-mono text-right mt-1 animate-pulse">
								[ PRESS R TO RELOAD ]
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default UIOverlay;
