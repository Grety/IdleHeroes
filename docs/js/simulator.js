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
const btnEditProperties = document.getElementById('btnEditProperties');
const btnEditStartupProperties = document.getElementById('btnEditStartupProperties');
const propertiesDialog = document.getElementById('dlgProperties');
const btnSaveProperties = document.getElementById('btnSaveProperties');
const btnCancelProperties = document.getElementById('btnCancelProperties');

btnCancelProperties.onclick = () => {
	propertiesDialog.style.display = 'none';
};

const readEditableProperties = props => {
	props.position = Number(document.getElementById('txtPosition').value);
	props.resources["Dice"] = Number(document.getElementById('txtDices').value);
	props.resources["Lucky Dice"] = Number(document.getElementById('txtLuckyDices').value);
	props.resources["Stars"] = Number(document.getElementById('txtStars').value);
	props.field[3].level = document.getElementById('txtMushroom-03').value - 1;
	props.field[10].level = document.getElementById('txtMushroom-10').value - 1;
	props.field[17].level = document.getElementById('txtMushroom-17').value - 1;
}

const saveCurrentProperties = () => {
	readEditableProperties(engine);
	refreshUi();
	btnCancelProperties.onclick();
};

const saveStartupProperties = () => {
	readEditableProperties(engine.defaults);
	refreshUi();
	btnCancelProperties.onclick();
};

const displayEditableProperties = props => {
	document.getElementById('txtPosition').value = props.position;
	document.getElementById('txtDices').value = props.resources["Dice"];
	document.getElementById('txtLuckyDices').value = props.resources["Lucky Dice"];
	document.getElementById('txtStars').value = props.resources["Stars"];
	document.getElementById('txtMushroom-03').value = props.field[3].level + 1;
	document.getElementById('txtMushroom-10').value = props.field[10].level + 1;
	document.getElementById('txtMushroom-17').value = props.field[17].level + 1;
}

const displayDialogTitle = className => {
	for (const tag of propertiesDialog.getElementsByTagName("h3"))
		tag.style.display = tag.classList.contains(className) ? 'block' : 'none';
};

btnEditStartupProperties.onclick = () => {
	propertiesDialog.style.display = 'block';
	displayDialogTitle('startup');
	btnSaveProperties.onclick = saveStartupProperties;
	displayEditableProperties(engine.defaults);
};

btnEditProperties.onclick = () => {
	propertiesDialog.style.display = 'block';
	displayDialogTitle('current');
	btnSaveProperties.onclick = saveCurrentProperties;
	displayEditableProperties(engine);
};

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
	engine.reset();
	refreshUi();
}

const onNormalDice_Click = () => {
	const dicesLeft = engine.resources[DICES];
	const luckyDicesLeft = engine.resources[LUCKY_DICES];
	if (!dicesLeft && !luckyDicesLeft) {
		engine.reset();
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