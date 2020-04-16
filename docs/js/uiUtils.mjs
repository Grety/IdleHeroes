const byId = id => document.getElementById(id);

function track(eventName) {
	try {
		gtag('event', eventName);
	}
	catch (e) {
		console.error(e);
	}
}

let chartsInitialized;

const showHistorgram = (containerId, title, dataPoints, columnNames) => {
	if (!dataPoints.length)
		return;
	if (!chartsInitialized) {
		document.getElementById(containerId).innerText = 'Google Charts not loaded yet';
		return;
	}
	const dataTable = google.visualization.arrayToDataTable([
		columnNames,
		...dataPoints.map(point => [, point])
	])
	const options = {
		title,
		// legend: { position: 'none' },
	};
	const chart = new google.visualization.Histogram(document.getElementById(containerId));
	chart.draw(dataTable, options);
};

const showBars = (containerId, { title, hAxisTitle, vAxisTitle }, dataPoints, columnNames) => {
	if (!dataPoints.length)
		return;
	if (!chartsInitialized) {
		document.getElementById(containerId).innerText = 'Google Charts not loaded yet';
		return;
	}
	const dataTable = google.visualization.arrayToDataTable([
		columnNames,
		...dataPoints
	])

	var materialOptions = {
		chart: { title },
		hAxis: { title: hAxisTitle },
		vAxis: { title: vAxisTitle, minValue: 0 },
		bars: 'vertical',
		legend: { position: 'none' }
	};
	var materialChart = new google.visualization.ColumnChart(document.getElementById(containerId));
	materialChart.draw(dataTable, materialOptions);
};

const initCharts = () => {
	google.charts.load('current', { packages: ['corechart'] })
	google.charts.setOnLoadCallback(() => {
		chartsInitialized = true;
		console.log('Google Charts initialized');
	});
};

export {
	track,
	byId,
	showHistorgram,
	initCharts,
	showBars
};