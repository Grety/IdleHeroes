import { Effect } from './constants.mjs';

/** @implements {IStrategy} */
class ReplicateDiceWhenFarEnoughStrategy {

	/** @param {number} minDistance */
	constructor(minDistance = 4) {
		if (minDistance < 1 || minDistance > 6)
			throw new Error('ReplicateDiceWhenFarEnoughStrategy. minDistance must be between 1 and 6');

		this.minDistance = minDistance;
	}

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

		if (position >= 13 && position < (20 - this.minDistance) && // if can reach Lucky Dice Hut in one roll
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

		if (this.canReachLuckyHut(position))
			return true;

		if (effect === Effect.COPYCAT || effect === Effect.DOUBLE_ROLL) // standing on Tarot and got 2x tiles next roll
			return true;

		return false;
	}

	canReachLuckyHut(position) {
		return position >= 13 && position < 19 && // if can reach Lucky Dice Hut in one roll
			position !== 14; // but is not on Karma Hut
	}

	canReachDiceHut(position) {
		return position >= 0 && position < 4;
	}

	/**
	 * @param {number} dices
	 * @param {number} luckyDices
	 * @param {number} position
	 * @param {Tile[]} field
	 * @param {Effect} effect
	 */
	rollLucky(dices, luckyDices, position, field, effect) {
		if (dices === 0) {
			if (this.canReachLuckyHut(position))
				return 19 - position;
			if (this.canReachDiceHut(position))
				return 4 - position;
			return 6;
		}

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

/** @implements {IStrategy} */
class UseLuckyDiceAtTheEndStrategy {
	/**
	 * @param {number} dices
	 * @param {number} luckyDices
	 * @param {number} position
	 * @param {Tile[]} field
	 * @param {Effect} effect
	 */
	useLucky(dices, luckyDices, position, field, effect) {
		return dices === 0;
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

export {
	UseLuckyDiceAtOnceStrategy,
	ReplicateDiceStrategy,
	ReplicateDiceWhenFarEnoughStrategy,
	UseLuckyDiceAtTheEndStrategy
};
