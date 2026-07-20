/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { finiteMedian } from 'diagnostics-shared/stats';
import { summarizeHeapSnapshotDataSamples } from 'diagnostics-shared/heap-snapshot';
import { summarizeBrowserDiagnostics } from './browser/diagnostics';
import type { BrowserMeasurement, BrowserMeasurementSample, BrowserMetricsReport, NetworkSummary } from './types';

export type SummarizeOptions = {
	url: string;
	heapSnapshotBreakdownTopN: number;
};

/**
 * 中央値に最も近いサンプルを1つ選ぶ。
 * largestRequests のように中央値を取れない項目は、代表サンプルの値をそのまま採用する。
 */
export function selectRepresentativeSample(samples: BrowserMeasurementSample[], getValue: (sample: BrowserMeasurementSample) => number) {
	const medianValue = finiteMedian(samples.map(getValue), 0);
	let selected: { sample: BrowserMeasurementSample; distance: number } | null = null;

	for (const sample of samples) {
		const value = getValue(sample);
		if (!Number.isFinite(value)) continue;
		const distance = Math.abs(value - medianValue);
		if (selected == null || distance < selected.distance || (distance === selected.distance && sample.round < selected.sample.round)) {
			selected = {
				sample,
				distance,
			};
		}
	}

	return selected?.sample ?? samples[0];
}

function summarizeResourceType(samples: BrowserMeasurementSample[], resourceType: string) {
	return {
		requests: finiteMedian(samples.map(sample => sample.network.byResourceType[resourceType]?.requests), 0),
		encodedBytes: finiteMedian(samples.map(sample => sample.network.byResourceType[resourceType]?.encodedBytes), 0),
		decodedBodyBytes: finiteMedian(samples.map(sample => sample.network.byResourceType[resourceType]?.decodedBodyBytes), 0),
	};
}

export function summarizeNetworkSamples(samples: BrowserMeasurementSample[]): NetworkSummary {
	const resourceTypes = new Set<string>();
	for (const sample of samples) {
		for (const resourceType of Object.keys(sample.network.byResourceType)) {
			resourceTypes.add(resourceType);
		}
	}

	const representative = selectRepresentativeSample(samples, sample => sample.network.totalEncodedBytes);
	const byResourceType = {} as NetworkSummary['byResourceType'];
	for (const resourceType of resourceTypes) {
		byResourceType[resourceType] = summarizeResourceType(samples, resourceType);
	}

	return {
		requestCount: finiteMedian(samples.map(sample => sample.network.requestCount), 0),
		webSocketConnectionCount: finiteMedian(samples.map(sample => sample.network.webSocketConnectionCount), 0),
		webSocketSentBytes: finiteMedian(samples.map(sample => sample.network.webSocketSentBytes), 0),
		webSocketReceivedBytes: finiteMedian(samples.map(sample => sample.network.webSocketReceivedBytes), 0),
		finishedRequestCount: finiteMedian(samples.map(sample => sample.network.finishedRequestCount), 0),
		failedRequestCount: finiteMedian(samples.map(sample => sample.network.failedRequestCount), 0),
		cachedRequestCount: finiteMedian(samples.map(sample => sample.network.cachedRequestCount), 0),
		serviceWorkerRequestCount: finiteMedian(samples.map(sample => sample.network.serviceWorkerRequestCount), 0),
		totalEncodedBytes: finiteMedian(samples.map(sample => sample.network.totalEncodedBytes), 0),
		totalDecodedBodyBytes: finiteMedian(samples.map(sample => sample.network.totalDecodedBodyBytes), 0),
		sameOriginEncodedBytes: finiteMedian(samples.map(sample => sample.network.sameOriginEncodedBytes), 0),
		thirdPartyEncodedBytes: finiteMedian(samples.map(sample => sample.network.thirdPartyEncodedBytes), 0),
		byResourceType,
		largestRequests: representative.network.largestRequests,
		failedRequests: representative.network.failedRequests,
	};
}

export function summarizePerformanceSamples(samples: BrowserMeasurementSample[]): BrowserMeasurement['performance'] {
	const cdpMetricKeys = new Set<string>();
	for (const sample of samples) {
		for (const key of Object.keys(sample.performance.cdpMetrics)) {
			cdpMetricKeys.add(key);
		}
	}

	const cdpMetrics = {} as Record<string, number>;
	for (const key of cdpMetricKeys) {
		cdpMetrics[key] = finiteMedian(samples.map(sample => sample.performance.cdpMetrics[key]), 0);
	}

	const webVitalKeys = [
		'firstPaintMs',
		'firstContentfulPaintMs',
		'domContentLoadedEventEndMs',
		'loadEventEndMs',
		'longTaskCount',
		'longTaskDurationMs',
		'maxLongTaskDurationMs',
		'resourceEntryCount',
		'domElements',
	] as const satisfies (keyof BrowserMeasurement['performance']['webVitals'])[];

	const webVitals = {} as BrowserMeasurement['performance']['webVitals'];
	for (const key of webVitalKeys) {
		webVitals[key] = finiteMedian(samples.map(sample => sample.performance.webVitals[key]), 0);
	}

	return {
		cdpMetrics,
		runtimeHeap: {
			usedSize: finiteMedian(samples.map(sample => sample.performance.runtimeHeap?.usedSize), 0),
			totalSize: finiteMedian(samples.map(sample => sample.performance.runtimeHeap?.totalSize), 0),
		},
		tabMemory: {
			totalBytes: finiteMedian(samples.map(sample => sample.performance.tabMemory.totalBytes), 0),
		},
		webVitals,
	};
}

export function summarizeHeapSnapshotSamples(samples: BrowserMeasurementSample[], breakdownTopN: number) {
	const summary = summarizeHeapSnapshotDataSamples(
		samples,
		sample => sample.heapSnapshot,
		{ breakdownTopN },
	);
	if (summary == null) throw new Error('No heap snapshot samples');
	return summary;
}

export function summarizeSamples(label: 'base' | 'head', samples: BrowserMeasurementSample[], options: SummarizeOptions): BrowserMetricsReport {
	if (samples.length === 0) throw new Error(`No browser metric samples for ${label}`);
	const representative = selectRepresentativeSample(samples, sample => sample.network.totalEncodedBytes);
	const summary: BrowserMeasurement = {
		label,
		timestamp: new Date().toISOString(),
		url: options.url,
		scenario: representative.scenario,
		diagnostics: summarizeBrowserDiagnostics(samples.map(sample => sample.diagnostics)),
		durationMs: finiteMedian(samples.map(sample => sample.durationMs), 0),
		network: summarizeNetworkSamples(samples),
		performance: summarizePerformanceSamples(samples),
		heapSnapshot: summarizeHeapSnapshotSamples(samples, options.heapSnapshotBreakdownTopN),
	};

	return {
		label,
		timestamp: new Date().toISOString(),
		url: options.url,
		scenario: representative.scenario,
		sampleCount: samples.length,
		aggregation: 'median',
		summary,
		samples,
	};
}
