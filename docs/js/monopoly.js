'use strict';

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

const checkRandomIntIsUniform = () => {
	const rng = {};
	const ROUNDS = 100000;
	for (let i = 0; i < ROUNDS; i++) {
		const n = randomInt(1, 6);
		rng[n] = (rng[n] || 0) + 1;
	}
	Object.entries(rng).forEach(([n, amount]) => {
		console.log(`${n}:\t${amount / ROUNDS}`);
	});
};

const FREE_DICES = 78;

const main = () => {
	const avResults = {};
	const minResults = {};
	const maxResults = {};
	const engine = new MonopolyEngine();

	const N = 100000;
	const verbose = 0; // Flags: 1 - results of each run, 2 - steps of each run
	for (let i = 0; i < N; i++) {
		engine.play(FREE_DICES, new ReplicateDiceStrategy(), verbose);
		// engine.Play(FREE_DICES, new ReplicateDiceWhenFarEnoughStrategy(), verbose);
		// engine.Play(FREE_DICES, new UseLuckyDiceAtOnceStrategy(), verbose);

		mergeMaps(avResults, engine.resources, (a = 0, b = 0) => a + b); // sum
		mergeMaps(minResults, engine.resources, (a = Number.MAX_SAFE_INTEGER, b) => a > b ? b : a); // min
		mergeMaps(maxResults, engine.resources, (a = 0, b) => a < b ? b : a); // max
	}

	for (const key of Object.keys(avResults))
		avResults[key] = Math.round(avResults[key] / N);

	printMap(avResults, '\nAverage resources:', ['Stars']);
	printMap(minResults, '\nMin resources:', ['Stars']);
	printMap(maxResults, '\nMax resources:', ['Stars']);
};

class Tile {

	/** @param {string} rewardName */
	constructor(rewardName) {
		this.name = rewardName;
	}

	getReward() { return 1; }
	upgrade() { }
	downgrade() { }
	getEffect() { return Effect.NONE; }
}

class RewardTile extends Tile {

	/**
	 * @param {string} rewardName
	 * @param {number[]} rewardAmounts
	 */
	constructor(rewardName, rewardAmounts) {
		super(rewardName);
		this.amounts = rewardAmounts;
		this.level = 0;
	}

	/** @returns {number} */
	getReward() {
		return this.amounts[this.level];
	}

	upgrade() {
		if (this.level < this.amounts.length - 1)
			this.level += 1;
	}

	downgrade() {
		if (this.level > 0)
			this.level -= 1;
	}
}

class KarmaTile extends Tile {
	constructor() {
		super('Karma');
	}

	/** @returns {TEffect} */
	getEffect() {
		return Effect.KARMA;
	}
}

class TarotTile extends Tile {
	constructor() {
		super('Tarot Hut');
	}

	/** @returns {TEffect} */
	getEffect() {
		const allTarotEffects = Object.values(Effect).filter(e => e !== 'NONE' && e !== 'KARMA');
		const effectIdx = randomInt(0, allTarotEffects.length - 1);

		return allTarotEffects[effectIdx];
	}
}

class MonopolyEngine {

	constructor() {
		this.field = [];

		this.field = [
			new RewardTile('Spirit', [650000, 1300000, 2000000]),
			new RewardTile('Promotion Stones', [500, 1000, 1500]),
			new RewardTile('Magic Dust', [500, 1000, 1500]),
			new RewardTile('Stars', [3, 4, 5]),
			new Tile('Dice'),
			new RewardTile('3-star shards', [20, 40, 60]),
			new RewardTile('Spirit', [650000, 1300000, 2000000]),
			new RewardTile('Monster Souls', [500, 1000, 1500]),
			new RewardTile('Magic Dust', [500, 100, 1500]),
			new TarotTile(),
			new RewardTile('Stars', [3, 4, 5]),
			new RewardTile('Promotion Stones', [500, 1000, 1500]),
			new RewardTile('5-star shards', [10, 20, 30]),
			new RewardTile('Spirit', [650000, 1300000, 2000000]),
			new KarmaTile(),
			new RewardTile('Magic Dust', [500, 1000, 1500]),
			new RewardTile('4-star shards', [10, 20, 30]),
			new RewardTile('Stars', [3, 4, 5]),
			new RewardTile('Chaos Stones', [100, 200, 300]),
			new Tile('Lucky Dice')
		];

		this.reset();
	}

	reset() {
		this.effect = Effect.NONE;
		this.position = -1;
		this.resources = this.field.reduce((acc, tile) => Object.assign(acc, { [tile.name]: 0 }), {});
	}

	/**
	 *
	 * @param {number} diceCount
	 * @param {TStrategy} strategy
	 * @param {number} verbose
	 */
	play(diceCount, strategy, verbose) {
		if (verbose)
			console.log(`\nGambling with ${diceCount} dices on hands`);
		this.reset();
		this.resources['Dice'] = diceCount;
		// this.resources['Lucky Dice'] = 4;
		while (this.move(strategy, (verbose & 2) === 2));

		if ((verbose & 1) === 1)
			this.printResources();
	}

	printResources() {
		printMap(this.resources);
	}

	/** @param {RewardTile} tile */
	addReward(tile) {
		if (typeof tile.getReward === 'function')
			this.resources[tile.name] += tile.getReward();
	}

	/** @param {number} */
	rollDice() {
		return randomInt(1, 6);
	}

	/**
	 *
	 * @param {TStrategy} strategy
	 * @param {boolean} verbose
	 */
	move(strategy, verbose) {
		let dicesLeft = this.resources['Dice'];
		let luckyDicesLeft = this.resources['Lucky Dice'];
		const useLuckyDice = luckyDicesLeft && strategy.useLucky(dicesLeft, luckyDicesLeft, this.position, this.field, this.effect);
		let nextStep = useLuckyDice ?
			strategy.rollLucky(dicesLeft, luckyDicesLeft, this.position, this.field, this.effect) :
			this.rollDice();

		if (this.effect === Effect.COPYCAT || this.effect === Effect.DOUBLE_ROLL)
			nextStep *= 2;

		if ((this.effect === Effect.KARMA && (nextStep % 2 === 1)) || (this.effect === Effect.MOVE_BACK)) {
			this.position = (this.position - nextStep) % this.field.length; // step back without collecting or upgrading
		}
		else {

			// collect Stars when passing Mushrooms
			for (let pointer = this.position + 1; pointer < this.position + nextStep - 1; pointer++) {
				const passing = this.field[pointer % this.field.length];
				if (passing.name === 'Stars')
					this.addReward(passing);
			}
			this.position = (this.position + nextStep) % this.field.length;
		}

		const landedOn = this.field[this.position];

		if (this.effect !== Effect.EAT_RESOURCES)
			this.addReward(landedOn);

		if (nextStep > 0) //don't upgrade on moving back
			landedOn.upgrade();

		this.effect = landedOn.getEffect();

		// immediate effects
		if (this.effect === Effect.UPGRADE) this.upgradeRandomReward();
		if (this.effect === Effect.DOWNGRADE) this.downgradeRandomReward();
		if (this.effect === Effect.RESET_POS) this.position = -1;

		// consume dice used for the move
		dicesLeft = this.resources['Dice'];
		luckyDicesLeft = this.resources['Lucky Dice'];
		if (useLuckyDice)
			this.resources['Lucky Dice'] = --luckyDicesLeft;
		else
			this.resources['Dice'] = --dicesLeft;

		if (verbose)
			console.log([
				`Tile[${this.position}]: ${landedOn.name.padString(17, ' ')}`,
				`usedLucky: ${useLuckyDice};`,
				`stepped: ${nextStep};`,
				`Dices: ${dicesLeft}, ${luckyDicesLeft};`,
				`Effect: ${this.effect};`,
				`Stars: ${this.resources['Stars']}`
			].join('\t'));

		return luckyDicesLeft > 0 || dicesLeft > 0; // report if we can continue to move
	}

	upgradeRandomReward() {
		const unupgraded = this.field.filter(tile => (tile instanceof RewardTile) && (tile.level < 3));
		if (!unupgraded.length)
			return;
		const idx = randomInt(0, unupgraded.length - 1);
		unupgraded[idx].upgrade();
	}

	downgradeRandomReward() {
		const upgraded = this.field.filter(tile => (tile instanceof RewardTile) && (tile.level > 1));
		if (!upgraded.length)
			return;
		const idx = randomInt(0, upgraded.length - 1);
		upgraded[idx].downgrade();
	}
}

/** @typedef {'NONE' | 'KARMA' | 'ENERGY' | 'EAT_RESOURCES' | 'DOUBLE_ROLL' | 'MOVE_BACK' | 'DOWNGRADE' | 'DOUBLE_STARS' | 'RESET_POS' | 'COPYCAT' | 'UPGRADE'} Effect */

/** @typedef {{ [key: Effect]: Effect }} */
const Effect = [
	'NONE',
	'KARMA',
	'ENERGY',
	'EAT_RESOURCES',
	'DOUBLE_ROLL',
	'MOVE_BACK',
	'DOWNGRADE',
	'DOUBLE_STARS',
	'RESET_POS',
	'COPYCAT',
	'UPGRADE'].reduce((acc, effect) => Object.assign(acc, { [effect]: effect }), {});

/** @implements {IStrategy} */
class ReplicateDiceWhenFarEnoughStrategy {
	/**
	 * @param {number} dices
	 * @param {number} luckyDices
	 * @param {number} position
	 * @param {Tile[]} field
	 * @param {Effect} effect
	 */
	useLucky(dices, luckyDices, position, field, effect) {
		if (dices === 0)
			return true;

		if (position >= 13 && position < 16 && // if can reach Lucky Dice Hut in one roll
			position !== 14) // but is not on Karma Hut
			return true;

		if (luckyDices > 1 && position === 14)
			return true; // save our ass from that Karma

		if (effect === Effect.COPYCAT || effect === Effect.DOUBLE_ROLL) // standing on Tarot and got 2x tiles next roll
			return true;

		if (luckyDices > 1 && (
			this.isInProximityAndCanUpgrade(position, field, 3) ||
			this.isInProximityAndCanUpgrade(position, field, 10) ||
			this.isInProximityAndCanUpgrade(position, field, 17)
		))
			return true;

		return false;
	}

	/**
	 *
	 * @param {number} position
	 * @param {Tile[]} field
	 * @param {number} tileNo
	 */
	isInProximityAndCanUpgrade(position, field, tileNo) {
		const distance = ((tileNo - position) % field.length);
		return (distance > 1 && distance <= 6 && (field[tileNo]).level < 3);
	}

	/**
	 * @param {number} dices
	 * @param {number} luckyDices
	 * @param {number} position
	 * @param {Tile[]} field
	 * @param {Effect} effect
	 */
	rollLucky(dices, luckyDices, position, field, effect) {
		if (dices === 0)
			return 6;

		if (luckyDices > 1 && position === 14)
			return 6; // save our ass from that Karma

		if (effect === Effect.COPYCAT || effect === Effect.DOUBLE_ROLL)
			return 5;

		// upgrade mushrooms if we have abundance of lucky dices
		if (luckyDices > 1 && this.isInProximityAndCanUpgrade(position, field, 3))
			return (3 - position) % field.length;

		if (luckyDices > 1 && this.isInProximityAndCanUpgrade(position, field, 10))
			return (10 - position) % field.length;

		if (luckyDices > 1 && this.isInProximityAndCanUpgrade(position, field, 17))
			return (17 - position) % field.length;

		return 19 - position;
	}
}

/** @implements {IStrategy} */
class ReplicateDiceStrategy {
	/**
	 * @param {number} dices
	 * @param {number} luckyDices
	 * @param {number} position
	 * @param {Tile[]} field
	 * @param {Effect} effect
	 */
	useLucky(dices, luckyDices, position, field, effect) {
		if (dices === 0)
			return true;

		if (position >= 13 && position < 19 && // if can reach Lucky Dice Hut in one roll
			position !== 14) // but is not on Karma Hut
			return true;

		if (effect === Effect.COPYCAT || effect === Effect.DOUBLE_ROLL) // standing on Tarot and got 2x tiles next roll
			return true;

		return false;
	}

	/**
	 * @param {number} dices
	 * @param {number} luckyDices
	 * @param {number} position
	 * @param {Tile[]} field
	 * @param {Effect} effect
	 */
	rollLucky(dices, luckyDices, position, field, effect) {
		if (dices === 0)
			return 6;

		if (effect === Effect.COPYCAT || effect === Effect.DOUBLE_ROLL)
			return 5;

		return 19 - position;
	}
}

/** @implements {IStrategy} */
class UseLuckyDiceAtOnceStrategy {
	/**
	 * @param {number} dices
	 * @param {number} luckyDices
	 * @param {number} position
	 * @param {Tile[]} field
	 * @param {Effect} effect
	 */
	useLucky(dices, luckyDices, position, field, effect) {
		return true;
	}

	/**
	 * @param {number} dices
	 * @param {number} luckyDices
	 * @param {number} position
	 * @param {Tile[]} field
	 * @param {Effect} effect
	 */
	rollLucky(dices, luckyDices, position, field, effect) {
		return 6;
	}
}

/**
 * @typedef {object} IStrategy
 * @member {(dices: number, luckyDices: number, position: number, field: Tile[], effect: Effect) => boolean} useLucky
 * @member {(dices: number, luckyDices: number, position: number, field: Tile[], effect: Effect) => number} rollLucky
 */

/**
 *
 * @param {{ [key: string]: number }} a
 * @param {{ [key: string]: number }} b
 * @param {(number, number) => number} predicate
 */
const mergeMaps = (a, b, predicate) => {
	Object.entries(b).forEach(([key, bValue]) => {
		a[key] = predicate(a[key], bValue);
	});
};

/**
 * @param {{ [key: string]: number }} map
 * @param {string} [title]
 * @param {string[]} [keysOnly]
 */
const printMap = (map, title, keysOnly = []) => {
	if (title)
		console.log(title);

	Object.entries(map).forEach(([key, value]) => {
		if (!keysOnly || keysOnly.includes(key))
			console.log(key + ': ' + value);
	});
};

main();
