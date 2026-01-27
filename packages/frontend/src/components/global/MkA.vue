<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<a ref="el" :href="to" :class="active ? activeClass : null" @click="nav" @contextmenu.prevent.stop="onContextmenu">
	<slot></slot>
</a>
</template>

<script lang="ts">
export type MkABehavior = 'window' | 'browser' | null;
</script>

<script lang="ts" setup>
import { computed, inject, useTemplateRef } from 'vue';
import { url } from '@@/js/config.js';
import * as os from '@/os.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { i18n } from '@/i18n.js';
import { useRouter } from '@/router.js';

const props = withDefaults(defineProps<{
	to: string;
	activeClass?: null | string;
	behavior?: MkABehavior;
}>(), {
	activeClass: null,
	behavior: null,
});

const behavior = props.behavior ?? inject<MkABehavior>('linkNavigationBehavior', null);

const el = useTemplateRef('el');

defineExpose({ $el: el });

const router = useRouter();

const active = computed(() => {
	if (props.activeClass == null) return false;
	const resolved = router.resolve(props.to);
	if (resolved == null) return false;
	if (resolved.route.path === router.currentRoute.value.path) return true;
	if (resolved.route.name == null) return false;
	if (router.currentRoute.value.name == null) return false;
	return resolved.route.name === router.currentRoute.value.name;
});

function onContextmenu(ev: PointerEvent) {
	const selection = window.getSelection();
	if (selection && selection.toString() !== '') return;
	os.contextMenu([{
		type: 'label',
		text: props.to,
	}, {
		icon: 'ti ti-app-window',
		text: i18n.ts.openInWindow,
		action: () => {
			os.pageWindow(props.to);
		},
	}, {
		icon: 'ti ti-player-eject',
		text: i18n.ts.showInPage,
		action: () => {
			router.pushByPath(props.to, 'forcePage');
		},
	}, { type: 'divider' }, {
		icon: 'ti ti-external-link',
		text: i18n.ts.openInNewTab,
		action: () => {
			window.open(props.to, '_blank', 'noopener');
		},
	}, {
		icon: 'ti ti-link',
		text: i18n.ts.copyLink,
		action: () => {
			copyToClipboard(`${url}${props.to}`);
		},
	}], ev);
}

function openWindow() {
	os.pageWindow(props.to);
}

function nav(ev: PointerEvent) {
	// 制御キーとの組み合わせは無視（shiftを除く）
	if (ev.metaKey || ev.altKey || ev.ctrlKey) return;

	ev.preventDefault();

	if (behavior === 'browser') {
		window.location.href = props.to;
		return;
	}

	if (behavior === 'window') {
		return openWindow();
	}

	if (ev.shiftKey) {
		return openWindow();
	}

	router.pushByPath(props.to, ev.ctrlKey ? 'forcePage' : null);
}
</script>
