'use strict';

import {
	MonopolyEngine
} from './MonopolyEngine';

import {
	UseLuckyDiceAtOnceStrategy,
	ReplicateDiceStrategy,
	ReplicateDiceWhenFarEnoughStrategy,
	UseLuckyDiceAtTheEndStrategy
} from './Strategies.mjs';

import randomInt from './randomInt';
import printMap from './printMap';

import { FREE_DICES } from './constants';

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

const main = () => {
	const avResults = {};
	const minResults = {};
	const maxResults = {};
	const engine = new MonopolyEngine();

	const N = 100000;
	const verbose = 0; // Flags: 1 - results of each run, 2 - steps of each run
	for (let i = 0; i < N; i++) {
		engine.play(FREE_DICES, new ReplicateDiceStrategy(), verbose);
		// engine.play(FREE_DICES, new ReplicateDiceWhenFarEnoughStrategy(1), verbose);
		// engine.play(FREE_DICES, new UseLuckyDiceAtOnceStrategy(), verbose);
		// engine.play(FREE_DICES, new UseLuckyDiceAtTheEndStrategy(), verbose);

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

main();
