const byId = id => document.getElementById(id);

function track(eventName) {
	if (window.location.host.startsWith('localhost'))
		return;
	try {
		gtag('event', eventName);
	}
	catch (e) {
		console.error(e);
	}
}

let chartsInitialized;

const showHistogram = (containerId, dataPoints, columnNames, options) => {
	if (!dataPoints.length)
		return;
	if (!chartsInitialized) {
		document.getElementById(containerId).innerText = 'Google Charts not loaded yet';
		return;
	}
	const dataTable = google.visualization.arrayToDataTable([
		columnNames,
		...dataPoints.map(point => Array.isArray(point) ? point : [point])
	])
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

const showGraph = (containerId, data, graphName, options) => {
	if (!data.length)
		return;
	if (!chartsInitialized) {
		document.getElementById(containerId).innerText = 'Google Charts not loaded yet';
		return;
	}
	const dataTable = google.visualization.arrayToDataTable(data)

	const chart = new google.visualization[graphName](document.getElementById(containerId));
	chart.draw(dataTable, options);
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
	showHistogram,
	initCharts,
	showBars,
	showGraph
};