const FREE_DICES = 78;
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

const RESOURCES = {
	LUCKY_DICES: 'Lucky Dice',
	DICES: 'Dice',
	STARS: 'Stars'
}

const TILE_NAME_PRINT_WIDTH = 17;

export {
	FREE_DICES,
	TILE_NAME_PRINT_WIDTH,
	Effect,
	RESOURCES
};
