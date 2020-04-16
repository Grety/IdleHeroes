import { MonopolyEngine } from "./MonopolyEngine.mjs";
import { track, byId, showHistogram, showBars, initCharts, showGraph } from './uiUtils.mjs';
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
	track('test randomInt');
};

byId('btnBuildSimulation').onclick = () => {
	const type = byId('selSimulationDetails').value;
	const strategyClassName = byId('selStrategy').value;
	const dicesCount = Number(byId('numDiceCount').value);

	if (type === 'single-detailed') {
		byId('tblLogs').parentNode.classList.remove('hidden');
		byId('tblLogs').innerHTML = '<tr><th>Step</th><th>Position</th><th>Tile[level]</th><th>Used LD</th><th>Stepped</th><th>Dices Left</th><th>LD Left</th><th>Effect</th><th>Stars</th></tr>';
	}

	if (type === 'single-detailed') {
		const logger = {
			step: 1,
			log: message => {
				if (typeof message === 'string')
					return;
				const { position, landedOn, useLuckyDice, lastStep, dicesLeft, luckyDicesLeft, effect, stars } = message;
				byId('tblLogs').innerHTML += (`<tr><td>${logger.step++}</td><td>${position + 1}</td><td>${landedOn ? landedOn.toString() : 'start'}</td><td>${useLuckyDice ? 'yes' : ''}</td><td>${lastStep}</td><td>${dicesLeft}</td><td>${luckyDicesLeft}</td><td>${effect !== Effect.NONE ? effect : ''}</td><td>${stars}</td></tr>`)
			}
		};

		engine.play(dicesCount, new Strategies[strategyClassName](), 3, logger);

		byId('graphSimulations').classList.add('hidden');
		track('test single detailed');
	}

	if (type === 'multi') {
		const runsCount = Number(byId('numSimulationRuns').value);
		byId('tblLogs').parentNode.classList.add('hidden');
		const btnLabel = byId('btnBuildSimulation').innerText;
		byId('btnBuildSimulation').innerText = 'Building...';

		setTimeout(() => {
			const logger = {
				steps: 0,
				gotFirstLuckyAt: undefined,
				log: message => {
					if (typeof message === 'string')
						return;
					const { position, landedOn, useLuckyDice, lastStep, dicesLeft, luckyDicesLeft, effect, stars } = message;
					logger.steps++;
					if (logger.gotFirstLuckyAt === undefined && luckyDicesLeft > 0)
						logger.gotFirstLuckyAt = logger.steps;
				}
			};
			const totalStarsHistory = [];
			const firstLuckyHistory = [];
			const totalStepsHistory = [];
			for (let i = 0; i < runsCount; i++) {
				logger.steps = 0;
				logger.gotFirstLuckyAt = undefined;
				engine.play(dicesCount, new Strategies[strategyClassName](), 2, logger);

				totalStarsHistory.push(engine.resources[RESOURCES.STARS]);
				totalStepsHistory.push(logger.steps);
				firstLuckyHistory.push(logger.gotFirstLuckyAt);
			}

			const histOptions = {
				title: `${runsCount} runs with ${strategyClassName}`,
				legend: { position: 'none' },
				histogram: { bucketSize: 1 },
				pointSize: 1
			};
			showHistogram('graphStars', totalStarsHistory, ['Stars'], Object.assign({}, histOptions, { hAxis: { title: 'Total stars' } }));
			showHistogram('graphSteps', totalStepsHistory, ['Total Steps'], Object.assign({}, histOptions, { hAxis: { title: 'Total steps' } }));
			showHistogram('graphFirstLucky', firstLuckyHistory, ['Total Steps'], Object.assign({}, histOptions, { hAxis: { title: 'First Lucky Dice at step' } }));
			showGraph('graphStepsToStars',
				[['Total Steps', 'Total Stars'], ...totalStepsHistory.map((step, i) => [step, totalStarsHistory[i]])],
				'ScatterChart',
				Object.assign({}, histOptions, { hAxis: { title: 'Total steps' }, vAxis: { title: 'Total stars' } })
			);
			showGraph('graphFirstLuckyToStars',
				[['First Lucky at step', 'Total Stars'], ...firstLuckyHistory.map((step, i) => [step, totalStarsHistory[i]])],
				'ScatterChart',
				Object.assign({}, histOptions, { hAxis: { title: 'First Lucky at step' }, vAxis: { title: 'Total stars' } })
			);

			setTimeout(() => {
				byId('btnBuildSimulation').innerText = btnLabel;
			}, 1000);

			track('test multi run');
		}, 10);
	}
};
