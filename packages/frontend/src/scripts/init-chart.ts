/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
import { defaultStore } from '@/store';
import 'chartjs-adapter-date-fns';

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

	// フォントカラー
	Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--fg');

	Chart.defaults.borderColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

	Chart.defaults.animation = false;
}
