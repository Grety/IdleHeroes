'use strict';

import { MonopolyEngine, ReplicateDiceStrategy } from './MonopolyEngine';

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
