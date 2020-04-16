import { MonopolyEngine } from './MonopolyEngine.mjs';
import { track, byId, showHistogram, initCharts } from './uiUtils.mjs';
import { RESOURCES } from './constants.mjs';

const engine = new MonopolyEngine();

byId('btnCancelProperties').onclick = () => {
	byId('dlgProperties').style.display = 'none';
};

const readEditableProperties = props => {
	props.position = Number(document.getElementById('txtPosition').value);
	props.resources[RESOURCES.DICES] = Number(document.getElementById('txtDices').value);
	props.resources[RESOURCES.LUCKY_DICES] = Number(document.getElementById('txtLuckyDices').value);
	props.resources[RESOURCES.STARS] = Number(document.getElementById('txtStars').value);
	props.field[3].level = document.getElementById('txtMushroom-03').value - 1;
	props.field[10].level = document.getElementById('txtMushroom-10').value - 1;
	props.field[17].level = document.getElementById('txtMushroom-17').value - 1;
}

const saveCurrentProperties = () => {
	readEditableProperties(engine);
	refreshUi();
	btnCancelProperties.onclick();
	track('Save properties');
};

const saveStartupProperties = () => {
	readEditableProperties(engine.defaults);
	refreshUi();
	btnCancelProperties.onclick();
	track('Save Start properties');
};

const displayEditableProperties = props => {
	document.getElementById('txtPosition').value = props.position;
	document.getElementById('txtDices').value = props.resources[RESOURCES.DICES];
	document.getElementById('txtLuckyDices').value = props.resources[RESOURCES.LUCKY_DICES];
	document.getElementById('txtStars').value = props.resources[RESOURCES.STARS];
	document.getElementById('txtMushroom-03').value = props.field[3].level + 1;
	document.getElementById('txtMushroom-10').value = props.field[10].level + 1;
	document.getElementById('txtMushroom-17').value = props.field[17].level + 1;
}

const displayDialogTitle = className => {
	const propertiesDialog = byId('dlgProperties');
	for (const tag of propertiesDialog.getElementsByTagName("h3"))
		tag.style.display = tag.classList.contains(className) ? 'block' : 'none';
};

byId('btnEditStartupProperties').onclick = () => {
	byId('dlgProperties').style.display = 'block';
	displayDialogTitle('startup');
	byId('btnSaveProperties').onclick = saveStartupProperties;
	displayEditableProperties(engine.defaults);
	track('Edit Start properties');
};

byId('btnEditProperties').onclick = () => {
	byId('dlgProperties').style.display = 'block';
	displayDialogTitle('current');
	byId('btnSaveProperties').onclick = saveCurrentProperties;
	displayEditableProperties(engine);
	track('Edit properties');
};

const diceRolls = [];
const positionHistory = [];

const refreshUi = () => {
	displayDices();
	refreshPosition();
	displayLastStep();
	displayResources();
	displayStars();
	displayEffect();
	displayLevels(engine.field);
	displayDiceStatistics(diceRolls);
	displayTilesStatistics(positionHistory);
};

const displayResources = () => {
	const resources = Object.entries(engine.resources)
		.map(([name, value]) => `${name}: ${value}`)
		.join('\n');
	const tiles = engine.field.map(tile => `${tile.name} ${'level' in tile ? `Lv. ${tile.level + 1}` : ''}`).join('\n');
	byId('resources').innerText = [resources, tiles].join('\n-----------\n');
}

const displayLastStep = () => {
	byId('lastStep').innerText = engine.lastStep;
};

const displayEffect = () => {
	byId('effect').innerText = `Current Effect: ${engine.effect}`;
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
	byId('dices').innerText = engine.resources[RESOURCES.DICES];
	byId('luckyDices').innerText = engine.resources[RESOURCES.LUCKY_DICES];
}

const displayStars = () => {
	byId('stars').innerText = engine.resources[RESOURCES.STARS];
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

const displayDiceStatistics = lastStepData => {
	const options = { title: 'Dice rolls histogram of your latest run', histogram: { bucketSize: 1 } };
	showHistogram('dice_statistics', lastStepData, ['Dice number'], options);
};

const displayTilesStatistics = tilesHitData => {
	const options = { title: 'Position histogram of your latest run', histogram: { bucketSize: 1 } };
	showHistogram('tiles_statistics', tilesHitData, ['Position'], options);
};

const onRestart_Click = () => {
	engine.reset();
	refreshUi();
}

const onNormalDice_Click = () => {
	const dicesLeft = engine.resources[RESOURCES.DICES];
	const luckyDicesLeft = engine.resources[RESOURCES.LUCKY_DICES];
	if (!dicesLeft && !luckyDicesLeft) {
		engine.reset();
		diceRolls.length = 0;
		positionHistory.length = 0;
	}
	else {
		engine.step();
		if (dicesLeft)
			diceRolls.push(engine.lastDice);
		positionHistory.push(engine.position);
	}
	refreshUi();

	track('Normal Dice');
}

const onLuckyDice_Click = () => {
	if (engine.resources[RESOURCES.LUCKY_DICES] <= 0)
		return;

	let nextStep = 0;
	while ((nextStep < 1 || nextStep > 6) && nextStep !== null)
		nextStep = prompt('Please enter desired step');

	if (nextStep === null)
		return;

	engine.step(Number(nextStep));
	positionHistory.push(engine.position);
	refreshUi();

	track('Lucky Dice');
};

byId('dices').onclick = onNormalDice_Click;
byId('luckyDices').onclick = onLuckyDice_Click;

document.body.onload = () => {
	onRestart_Click();
	initCharts();
};
