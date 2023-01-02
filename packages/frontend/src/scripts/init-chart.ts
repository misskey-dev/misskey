import {
	Chart,
	ArcElement,
	LineElement,
	BarElement,
	PointElement,
	BarController,
	LineController,
	DoughnutController,
	CategoryScale,
	LinearScale,
	TimeScale,
	Legend,
	Title,
	Tooltip,
	SubTitle,
	Filler,
} from 'chart.js';
import gradient from 'chartjs-plugin-gradient';
import zoomPlugin from 'chartjs-plugin-zoom';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';

export function initChart() {
	Chart.register(
		ArcElement,
		LineElement,
		BarElement,
		PointElement,
		BarController,
		LineController,
		DoughnutController,
		CategoryScale,
		LinearScale,
		TimeScale,
		Legend,
		Title,
		Tooltip,
		SubTitle,
		Filler,
		MatrixController, MatrixElement,
		zoomPlugin,
		gradient,
	);
}
