/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Ref } from 'vue';
import * as os from '@/os.js';

const MAX_LAYERS = 3;

// レイヤー操作用のComposable
export function useDrawingLayers(deps: {
	ctx: Ref<CanvasRenderingContext2D | null>;
	canvasWidth: Ref<number>;
	canvasHeight: Ref<number>;
	currentLayer: Ref<number>;
	strokeHistory: Ref<any[]>;
	layerStrokeHistory: Ref<any[][]>;
	redrawCanvasFromHistory: () => void;
}) {
	async function showLayerMenu() {
		const { canceled, result } = await os.select({
			title: 'レイヤー操作',
			items: [
				{ label: 'レイヤーを結合', value: 'merge' },
				{ label: 'レイヤーを移動', value: 'move' },
				{ label: 'レイヤーをクリア', value: 'clear' },
			]
		});

		if (canceled || !result) return;

		switch (result) {
			case 'merge':
				await mergeLayersDialog();
				break;
			case 'move':
				await moveLayerDialog();
				break;
			case 'clear':
				await clearLayerDialog();
				break;
		}
	}

	async function mergeLayersDialog() {
		const { canceled, result } = await os.select({
			title: 'レイヤー結合',
			items: [
				{ label: 'レイヤー1とレイヤー2を結合', value: 0 },
				{ label: 'レイヤー2とレイヤー3を結合', value: 1 },
			]
		});

		if (canceled || result === undefined || result === null) return;

		const layerIndex = typeof result === 'number' ? result : 0;
		await mergeLayers(layerIndex, layerIndex + 1);
	}

	async function mergeLayers(fromLayer: number, toLayer: number) {
		if (fromLayer < 0 || fromLayer >= MAX_LAYERS || toLayer < 0 || toLayer >= MAX_LAYERS) return;
		if (fromLayer === toLayer) return;

		// fromLayerの内容をtoLayerに結合
		deps.layerStrokeHistory.value[toLayer] = [
			...deps.layerStrokeHistory.value[toLayer],
			...deps.layerStrokeHistory.value[fromLayer]
		];

		// fromLayerをクリア
		deps.layerStrokeHistory.value[fromLayer] = [];

		// 現在のレイヤーを再描画
		if (deps.currentLayer.value === fromLayer || deps.currentLayer.value === toLayer) {
			deps.strokeHistory.value = deps.layerStrokeHistory.value[deps.currentLayer.value];
			if (deps.ctx.value) {
				deps.ctx.value.clearRect(0, 0, deps.canvasWidth.value, deps.canvasHeight.value);
				deps.redrawCanvasFromHistory();
			}
		}

		os.toast(`レイヤー${fromLayer + 1}とレイヤー${toLayer + 1}を結合しました`);
		console.log('🎨 [LAYER] Merged layers', { from: fromLayer, to: toLayer });
	}

	async function moveLayerDialog() {
		const { canceled, result } = await os.select({
			title: 'レイヤー移動',
			items: [
				{ label: 'レイヤー1の内容をレイヤー2に移動', value: '0-1' },
				{ label: 'レイヤー1の内容をレイヤー3に移動', value: '0-2' },
				{ label: 'レイヤー2の内容をレイヤー1に移動', value: '1-0' },
				{ label: 'レイヤー2の内容をレイヤー3に移動', value: '1-2' },
				{ label: 'レイヤー3の内容をレイヤー1に移動', value: '2-0' },
				{ label: 'レイヤー3の内容をレイヤー2に移動', value: '2-1' },
			]
		});

		if (canceled || !result) return;

		const [from, to] = (typeof result === 'string' ? result : '0-1').split('-').map(Number);
		await moveLayer(from, to);
	}

	async function moveLayer(fromLayer: number, toLayer: number) {
		if (fromLayer < 0 || fromLayer >= MAX_LAYERS || toLayer < 0 || toLayer >= MAX_LAYERS) return;
		if (fromLayer === toLayer) return;

		// fromLayerの内容をtoLayerに移動
		deps.layerStrokeHistory.value[toLayer] = [...deps.layerStrokeHistory.value[fromLayer]];
		deps.layerStrokeHistory.value[fromLayer] = [];

		// 現在のレイヤーを再描画
		if (deps.currentLayer.value === fromLayer || deps.currentLayer.value === toLayer) {
			deps.strokeHistory.value = deps.layerStrokeHistory.value[deps.currentLayer.value];
			if (deps.ctx.value) {
				deps.ctx.value.clearRect(0, 0, deps.canvasWidth.value, deps.canvasHeight.value);
				deps.redrawCanvasFromHistory();
			}
		}

		os.toast(`レイヤー${fromLayer + 1}の内容をレイヤー${toLayer + 1}に移動しました`);
		console.log('🎨 [LAYER] Moved layer', { from: fromLayer, to: toLayer });
	}

	async function clearLayerDialog() {
		const { canceled, result } = await os.select({
			title: 'レイヤークリア',
			items: [
				{ label: 'レイヤー1をクリア', value: 0 },
				{ label: 'レイヤー2をクリア', value: 1 },
				{ label: 'レイヤー3をクリア', value: 2 },
			]
		});

		if (canceled || result === undefined || result === null) return;

		const layerIndex = typeof result === 'number' ? result : 0;

		const { canceled: confirmCanceled } = await os.confirm({
			type: 'warning',
			text: `レイヤー${layerIndex + 1}の内容をすべて削除しますか？`
		});

		if (confirmCanceled) return;

		clearLayer(layerIndex);
	}

	function clearLayer(layerIndex: number) {
		if (layerIndex < 0 || layerIndex >= MAX_LAYERS) return;

		deps.layerStrokeHistory.value[layerIndex] = [];

		if (deps.currentLayer.value === layerIndex) {
			deps.strokeHistory.value = [];
			if (deps.ctx.value) {
				deps.ctx.value.clearRect(0, 0, deps.canvasWidth.value, deps.canvasHeight.value);
			}
		}

		os.toast(`レイヤー${layerIndex + 1}をクリアしました`);
		console.log('🎨 [LAYER] Cleared layer', layerIndex);
	}

	function switchLayer(layerIndex: number) {
		if (layerIndex < 0 || layerIndex >= MAX_LAYERS) return;
		if (layerIndex === deps.currentLayer.value) return;

		// 現在のレイヤーのストローク履歴を保存
		deps.layerStrokeHistory.value[deps.currentLayer.value] = [...deps.strokeHistory.value];

		// 新しいレイヤーに切り替え
		deps.currentLayer.value = layerIndex;
		deps.strokeHistory.value = [...deps.layerStrokeHistory.value[layerIndex]];

		// キャンバスを再描画
		if (deps.ctx.value) {
			deps.ctx.value.clearRect(0, 0, deps.canvasWidth.value, deps.canvasHeight.value);
			deps.redrawCanvasFromHistory();
		}

		os.toast(`レイヤー${layerIndex + 1}に切り替えました`);
		console.log('🎨 [LAYER] Switched to layer', layerIndex);
	}

	return {
		showLayerMenu,
		mergeLayersDialog,
		mergeLayers,
		moveLayerDialog,
		moveLayer,
		clearLayerDialog,
		clearLayer,
		switchLayer
	};
}
