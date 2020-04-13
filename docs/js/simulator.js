import { MonopolyEngine } from "./MonopolyEngine.mjs";

function track(eventName) {
	try {
		gtag('event', eventName);
	}
	catch (e) {
		console.error(e);
	}
}

const LUCKY_DICES = 'Lucky Dice';
const DICES = 'Dice';
const STARS = 'Stars';

const engine = new MonopolyEngine();

const indicatorDices = document.getElementById('dices');
const indicatorLuckyDices = document.getElementById('luckyDices');
const indicatorLastStep = document.getElementById('lastStep');
const indicatorResources = document.getElementById('resources');
const indicatorStars = document.getElementById('stars');
const indicatorEffect = document.getElementById('effect');

const refreshUi = () => {
	displayDices();
	refreshPosition();
	displayLastStep();
	displayResources();
	displayStars();
	displayEffect();
	displayLevels(engine.field);
};

const displayResources = () => {
	const resources = Object.entries(engine.resources)
		.map(([name, value]) => `${name}: ${value}`)
		.join('\n');
	const tiles = engine.field.map(tile => `${tile.name} ${'level' in tile ? `Lv. ${tile.level + 1}` : ''}`).join('\n');
	indicatorResources.innerText = [resources, tiles].join('\n-----------\n');
}

const displayLastStep = () => {
	indicatorLastStep.innerText = engine.lastStep;
};

const displayEffect = () => {
	indicatorEffect.innerText = `Current Effect: ${engine.effect}`;
};

const refreshPosition = () => {
	const newPostition = engine.position;
	const allTiles = document.getElementsByTagName('td');
	for (let i = 0; i < allTiles.length; i++)
		allTiles[i].classList.remove('active');
	const tile = document.getElementById(`tile${newPostition}`);
	tile.classList.add('active');
};

const displayDices = () => {
	indicatorDices.innerText = engine.resources[DICES];
	indicatorLuckyDices.innerText = engine.resources[LUCKY_DICES];
}

const displayStars = () => {
	indicatorStars.innerText = engine.resources[STARS];
}

const displayLevels = field => {
	field.forEach((tile, index) => {
		if ('level' in tile) {
			const td = document.getElementById(`tile${index}`);
			const div = td.getElementsByClassName('tile-level', td)[0];
			if (div)
				div.innerText = `LV: ${tile.level + 1}`;
		}
		if (typeof tile.getReward === 'function') {
			const td = document.getElementById(`tile${index}`);
			const div = td.getElementsByClassName('tile-reward', td)[0];
			if (div)
				div.innerText = tile.getReward();
		}
	});
}

const onRestart_Click = () => {
	engine.start();
	refreshUi();
}

const onNormalDice_Click = () => {
	const dicesLeft = engine.resources[DICES];
	const luckyDicesLeft = engine.resources[LUCKY_DICES];
	if (!dicesLeft && !luckyDicesLeft) {
		engine.start();
	}
	else {
		engine.step();
	}
	refreshUi();

	track('Normal Dice');
}

const onLuckyDice_Click = () => {
	if (engine.resources[LUCKY_DICES] <= 0)
		return;

	let nextStep = 0;
	while ((nextStep < 1 || nextStep > 6) && nextStep !== null)
		nextStep = prompt('Please enter desired step');

	if (nextStep === null)
		return;

	engine.step(Number(nextStep));
	refreshUi();

	track('Lucky Dice');
};

indicatorDices.onclick = onNormalDice_Click;
indicatorLuckyDices.onclick = onLuckyDice_Click;

onRestart_Click();