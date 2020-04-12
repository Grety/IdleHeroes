
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

export default printMap;
