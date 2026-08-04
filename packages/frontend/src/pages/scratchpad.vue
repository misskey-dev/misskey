<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div class="_gaps">
			<div class="_gaps_s">
				<div :class="$style.editor" class="_panel">
					<MkCodeEditor v-model="code" lang="aiscript"/>
				</div>
				<MkButton primary @click="run()"><i class="ti ti-player-play"></i></MkButton>
			</div>

			<MkContainer v-if="root && components.length > 1" :key="uiKey" :foldable="true">
				<template #header>UI</template>
				<div :class="$style.ui">
					<MkAsUi :component="root" :components="components" size="small"/>
				</div>
			</MkContainer>

			<MkContainer :foldable="true" class="">
				<template #header>{{ i18n.ts.output }}</template>
				<div :class="$style.logs">
					<div v-for="log in logs" :key="log.id" class="log" :class="{ print: log.print }">{{ log.text }}</div>
				</div>
			</MkContainer>

			<MkContainer :foldable="true" :expanded="false">
				<template #header>{{ i18n.ts.uiInspector }}</template>
				<div :class="$style.uiInspector">
					<div v-for="c in components" :key="c.value.id" :class="{ [$style.uiInspectorUnShown]: !showns.has(c.value.id) }">
						<div :class="$style.uiInspectorType">{{ c.value.type }}</div>
						<div :class="$style.uiInspectorId">{{ c.value.id }}</div>
						<button :class="$style.uiInspectorPropsToggle" @click="() => uiInspectorOpenedComponents.set(c, !uiInspectorOpenedComponents.get(c))">
							<i v-if="uiInspectorOpenedComponents.get(c)" class="ti ti-chevron-up icon"></i>
							<i v-else class="ti ti-chevron-down icon"></i>
						</button>
						<div v-if="uiInspectorOpenedComponents.get(c)">
							<MkTextarea :modelValue="stringifyUiProps(c.value)" code readonly></MkTextarea>
						</div>
					</div>
					<div :class="$style.uiInspectorDescription">{{ i18n.ts.uiInspectorDescription }}</div>
				</div>
			</MkContainer>

			<div class="">
				{{ i18n.ts.scratchpadDescription }}
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { onDeactivated, onUnmounted, ref, watch, computed } from 'vue';
import { Interpreter, Parser, utils } from '@syuilo/aiscript';
import type { Ref } from 'vue';
import type { AsUiComponent } from '@/aiscript/ui.js';
import type { AsUiRoot } from '@/aiscript/ui.js';
import type { Value } from '@syuilo/aiscript/interpreter/value.js';
import MkContainer from '@/components/MkContainer.vue';
import MkButton from '@/components/MkButton.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkCodeEditor from '@/components/MkCodeEditor.vue';
import { aiScriptReadline, createAiScriptEnv } from '@/aiscript/api.js';
import * as os from '@/os.js';
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { registerAsUiLib } from '@/aiscript/ui.js';
import MkAsUi from '@/components/MkAsUi.vue';
import { miLocalStorage } from '@/local-storage.js';
import { claimAchievement } from '@/utility/achievements.js';

const parser = new Parser();
let aiscript: Interpreter;
const code = ref('');
const logs = ref<{
	id: number;
	text: string;
	print: boolean;
}[]>([]);
const root = ref<AsUiRoot | undefined>();
const components = ref<Ref<AsUiComponent>[]>([]);
const uiKey = ref(0);
const uiInspectorOpenedComponents = ref(new WeakMap<AsUiComponent | Ref<AsUiComponent>, boolean>);

const saved = miLocalStorage.getItem('scratchpad');
if (saved) {
	code.value = saved;
}

watch(code, () => {
	miLocalStorage.setItem('scratchpad', code.value);
});

function stringifyUiProps(uiProps: AsUiComponent) {
	return JSON.stringify(
		{ ...uiProps, type: undefined, id: undefined },
		(k, v) => typeof v === 'function' ? '<function>' : v,
		2,
	);
}

async function run() {
	if (aiscript) aiscript.abort();
	root.value = undefined;
	components.value = [];
	uiKey.value++;
	logs.value = [];
	aiscript = new Interpreter(({
		...createAiScriptEnv({
			storageKey: 'widget',
			token: $i?.token,
		}),
		...registerAsUiLib(components.value, (_root) => {
			root.value = _root.value;
		}),
	}), {
		in: aiScriptReadline,
		out: (value) => {
			if (value.type === 'str' && value.value.toLowerCase().replace(',', '').includes('hello world')) {
				claimAchievement('outputHelloWorldOnScratchpad');
			}
			logs.value.push({
				id: Math.random(),
				text: value.type === 'str' ? value.value : utils.valToString(value),
				print: true,
			});
		},
		err: (err) => {
			os.alert({
				type: 'error',
				title: 'AiScript Error',
				text: err.toString(),
			});
		},
		log: (type, params) => {
			switch (type) {
				case 'end': logs.value.push({
					id: Math.random(),
					text: utils.valToString(params.val as Value, true),
					print: false,
				}); break;
				default: break;
			}
		},
	});

	let ast;
	try {
		ast = parser.parse(code.value);
	} catch (err: any) {
		os.alert({
			type: 'error',
			title: 'Syntax Error',
			text: err.toString(),
		});
		return;
	}
	try {
		await aiscript.exec(ast);
	} catch (err: any) {
		// AiScript runtime errors should be processed by error callback function
		// so errors caught here are AiScript's internal errors.
		os.alert({
			type: 'error',
			title: 'Internal Error',
			text: err.toString(),
		});
	}
}

onDeactivated(() => {
	if (aiscript) aiscript.abort();
});

onUnmounted(() => {
	if (aiscript) aiscript.abort();
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

const showns = computed(() => {
	if (root.value == null) return new Set<string>();
	const result = new Set<string>();
	(function addChildrenToResult(c: AsUiComponent) {
		result.add(c.id);
		const children = c.children;
		if (children) {
			const childComponents = components.value.filter(v => children.includes(v.value.id));
			for (const child of childComponents) {
				addChildrenToResult(child.value);
			}
		}
	})(root.value);
	return result;
});

definePage(() => ({
	title: i18n.ts.scratchpad,
	icon: 'ti ti-terminal-2',
}));
</script>

<style lang="scss" module>
.root {
}

.editor {
	position: relative;
}

.code {
	background: #2d2d2d;
	color: #ccc;
	font-size: 14px;
	line-height: 1.5;
	padding: 5px;
}

.ui {
	padding: 32px;
}

.logs {
	padding: 16px;

	&:global {
		> .log {
			&:not(.print) {
				opacity: 0.7;
			}
		}
	}
}

.uiInspector {
	display: grid;
	gap: 8px;
	padding: 16px;
}

.uiInspectorUnShown {
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.5);
}

.uiInspectorType {
	display: inline-block;
	border: hidden;
	border-radius: 10px;
	background-color: var(--MI_THEME-panelHighlight);
	padding: 2px 8px;
	font-size: 12px;
}

.uiInspectorId {
	display: inline-block;
	padding-left: 8px;
}

.uiInspectorDescription {
	display: block;
	font-size: 12px;
	padding-top: 16px;
}

.uiInspectorPropsToggle {
	background: none;
	border: none;
}
</style>
