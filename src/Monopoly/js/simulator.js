function test_onClick() {
	const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

	const newPostition = randomInt(0, 19);
	const allTiles = document.getElementsByTagName('td');
	for (let i = 0; i < allTiles.length; i++)
		allTiles[i].classList.remove('active');
	const tile = document.getElementById(`tile${newPostition}`);
	tile.classList.add('active');
}

function grid_onClick() {
	const field = document.getElementById('field');
	const className = 'highlighted';
	if (field.classList.contains(className))
		field.classList.remove(className);
	else
		field.classList.add(className);
}