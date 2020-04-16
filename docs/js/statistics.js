import { MonopolyEngine } from "./MonopolyEngine.mjs";
import { track, byId, showHistorgram, showBars, initCharts } from './uiUtils.mjs';
import { RESOURCES, Effect } from './constants.mjs';
import randomInt from './randomInt.mjs';
import * as Strategies from './Strategies.mjs';

const engine = new MonopolyEngine();

document.body.onload = () => {
	initCharts();
};

const checkRandomIntIsUniform = rounds => {
	const diceCounts = {};
	for (let i = 0; i < rounds; i++) {
		const n = randomInt(1, 6);
		diceCounts[n] = (diceCounts[n] || 0) + 1;
	}
	return diceCounts;
};

byId('btnBuildRandomInt').onclick = () => {
	const runsCount = Number(byId('numRandomIntRuns').value);
	const diceRollsCounts = checkRandomIntIsUniform(runsCount);
	const data = Object.entries(diceRollsCounts).map(([dice, rollsCount]) => ([dice, rollsCount]));
	const titles = {
		title: 'Dice RNG distribution',
		vAxisTitle: 'Rolls',
		hAxisTitle: 'Dice'
	};
	showBars('graphRandomInt', titles, data, ['Dice', 'Rolls']);
};

byId('btnBuildSimulation').onclick = () => {
	const type = byId('selSimulationDetails').value;
	const strategyClassName = byId('selStrategy').value;
	const dicesCount = Number(byId('numDiceCount').value);

	if (type === 'single-detailed') {
		byId('tblLogs').parentNode.classList.remove('hidden');
		byId('tblLogs').innerHTML = '<tr><th>Step</th><th>Position</th><th>Tile[level]</th><th>Used LD</th><th>Stepped</th><th>Dices Left</th><th>LD Left</th><th>Effect</th><th>Stars</th></tr>';
	}
	const logger = {
		step: 1,
		log: message => {
			if (typeof message === 'string')
				return;
			const { position, landedOn, useLuckyDice, lastStep, dicesLeft, luckyDicesLeft, effect, stars } = message;
			byId('tblLogs').innerHTML += (`<tr><td>${logger.step++}</td><td>${position + 1}</td><td>${landedOn ? landedOn.toString() : 'start'}</td><td>${useLuckyDice ? 'yes' : ''}</td><td>${lastStep}</td><td>${dicesLeft}</td><td>${luckyDicesLeft}</td><td>${effect !== Effect.NONE ? effect : ''}</td><td>${stars}</td></tr>`)
		}
	};

	if (type === 'single-detailed') {
		engine.play(dicesCount, new Strategies[strategyClassName](), 3, logger);

		byId('graphSimulations').classList.add('hidden');
	}
	if (type === 'multi') {
		const runsCount = Number(byId('numSimulationRuns').value);
	}
};
