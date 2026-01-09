export interface GameState {
	score: number;
	health: number;
	enemiesRemaining: number;
	ammo: number;
	maxAmmo: number;
	reserveAmmo: number;
	jetpackCharges: number;
	wave: number;
	enemiesKilled: number;
}

export interface BulletData {
	id: string;
	position: [number, number, number];
	velocity: [number, number, number];
	createdAt: number;
}

export interface EnemyData {
	id: string;
	position: [number, number, number];
	health: number;
	maxHealth: number;
	velocity?: [number, number, number];
	lastAttackTime?: number;
	attackCooldown?: number;
}
