import randomInt from './randomInt.mjs';
import { TILE_NAME_PRINT_WIDTH, FREE_DICES, Effect } from './constants.mjs';
import printMap from './printMap.mjs';

const createField = () => ([
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
]);

const copyFieldLevels = (dest, src) => {
	if (dest.length !== src.length) throw new Error('Cannot apply field levels, field length is different');
	src.forEach((field, index) => {
		if ('level' in field)
			dest[index].level = field.level;
	});
}
class MonopolyEngine {

	constructor() {
		const field = createField();
		this.defaults = {
			effect: Effect.NONE,
			position: -1,
			lastStep: '',
			lastDice: '',
			field,
			resources: field.reduce((acc, tile) => Object.assign(acc, { [tile.name]: 0 }), {})
		};
		this.defaults.resources['Dice'] = FREE_DICES;
		this.reset();
	}

	reset() {
		this.effect = this.defaults.effect;
		this.position = this.defaults.position;
		this.lastStep = this.defaults.lastStep;
		this.lastDice = this.defaults.lastDice;
		this.field = createField();
		copyFieldLevels(this.field, this.defaults.field);
		this.resources = Object.assign({}, this.defaults.resources);
	}

	/**
	 *
	 * @param {number} diceCount
	 * @param {TStrategy} strategy
	 * @param {number} verbose
	 */
	play(diceCount, strategy, verbose, logger) {
		if (verbose)
			logger.log(`\nGambling with ${diceCount} dices on hands`);
		this.reset();
		this.resources['Dice'] = diceCount;
		// this.resources['Lucky Dice'] = 4;
		while (this.move(strategy, (verbose & 2) === 2, logger));

		if ((verbose & 1) === 1)
			this.printResources();
	}

	printResources() {
		printMap(this.resources);
	}

	/** @param {RewardTile} tile */
	addReward(tile) {
		if (typeof tile.getReward === 'function') {
			const coef = this.effect === Effect.DOUBLE_STARS && tile.name === 'Stars' ?
				2 : 1;
			this.resources[tile.name] += coef * tile.getReward();
		}
	}

	/** @param {number} */
	rollDice() {
		return randomInt(1, 6);
	}

	/**
	 *
	 * @param {TStrategy} strategy
	 * @param {boolean} verbose
	 * @param {{ log: (message: any) => void }} logger
	 */
	move(strategy, verbose, logger) {
		let dicesLeft = this.resources['Dice'];
		let luckyDicesLeft = this.resources['Lucky Dice'];
		const useLuckyDice = Boolean(luckyDicesLeft && strategy.useLucky(dicesLeft, luckyDicesLeft, this.position, this.field, this.effect));
		let nextStep = useLuckyDice &&
			strategy.rollLucky(dicesLeft, luckyDicesLeft, this.position, this.field, this.effect);

		const canContinue = this.step(nextStep);

		const landedOn = this.field[this.position];

		if (verbose)
			logger.log({
				position: this.position,
				landedOn,
				useLuckyDice,
				lastStep: this.lastStep,
				dicesLeft,
				luckyDicesLeft,
				effect: this.effect,
				stars: this.resources['Stars']
			});

		return canContinue;
	}

	step(nextStep) {
		let dicesLeft = this.resources['Dice'];
		let luckyDicesLeft = this.resources['Lucky Dice'];

		if ((dicesLeft <= 0 && !nextStep) || (luckyDicesLeft <= 0 && !!nextStep)) {
			return false;
		}

		const useLuckyDice = Boolean(nextStep);
		if (!nextStep)
			nextStep = this.rollDice();

		this.lastDice = nextStep;

		if (this.effect === Effect.COPYCAT || this.effect === Effect.DOUBLE_ROLL)
			nextStep *= 2;

		if ((this.effect === Effect.KARMA && (nextStep % 2 === 1)) || (this.effect === Effect.MOVE_BACK)) {
			this.position = (this.position - nextStep + this.field.length) % this.field.length; // step back without collecting or upgrading
			nextStep = -nextStep;
		}
		else {

			// collect Stars when passing Mushrooms
			for (let pointer = this.position + 1; pointer < this.position + nextStep; pointer++) {
				const passing = this.field[pointer % this.field.length];
				if (passing.name === 'Stars')
					this.addReward(passing);
			}
			this.position = (this.position + nextStep) % this.field.length;
		}

		this.lastStep = nextStep;

		const landedOn = this.field[this.position];

		if (this.effect !== Effect.EAT_RESOURCES && nextStep > 0)
			this.addReward(landedOn);

		if (nextStep > 0) //don't upgrade or cause effect on moving back
			landedOn.upgrade();

		this.effect = nextStep > 0 ? landedOn.getEffect() : Effect.NONE;

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

class Tile {

	/** @param {string} rewardName */
	constructor(rewardName) {
		this.name = rewardName;
	}

	getReward() { return 1; }
	toString() { return this.name.padStart(TILE_NAME_PRINT_WIDTH, ' '); }
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

	toString() { return `${this.name}[${this.level + 1}]`.padStart(TILE_NAME_PRINT_WIDTH, ' '); }

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
		// return Effect.MOVE_BACK;
		const allTarotEffects = Object.values(Effect).filter(e => e !== 'NONE' && e !== 'KARMA');
		const effectIdx = randomInt(0, allTarotEffects.length - 1);

		return allTarotEffects[effectIdx];
	}
}

export {
	MonopolyEngine
};
