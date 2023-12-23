<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>

	<MkSpacer :contentMax="800">
		<div :class="$style.root">
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

			<div class="">
				{{ i18n.ts.scratchpadDescription }}
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { onDeactivated, onUnmounted, Ref, ref, watch, computed } from 'vue';
import { Interpreter, Parser, utils } from '@syuilo/aiscript';
import MkContainer from '@/components/MkContainer.vue';
import MkButton from '@/components/MkButton.vue';
import MkCodeEditor from '@/components/MkCodeEditor.vue';
import { createAiScriptEnv } from '@/scripts/aiscript/api.js';
import * as os from '@/os.js';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { AsUiComponent, AsUiRoot, registerAsUiLib } from '@/scripts/aiscript/ui.js';
import MkAsUi from '@/components/MkAsUi.vue';
import { miLocalStorage } from '@/local-storage.js';
import { claimAchievement } from '@/scripts/achievements.js';

const parser = new Parser();
let aiscript: Interpreter;
const code = ref('');
const logs = ref<any[]>([]);
const root = ref<AsUiRoot>();
const components = ref<Ref<AsUiComponent>[]>([]);
const uiKey = ref(0);

const saved = miLocalStorage.getItem('scratchpad');
if (saved) {
	code.value = saved;
}

watch(code, () => {
	miLocalStorage.setItem('scratchpad', code.value);
});

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
		in: (q) => {
			return new Promise(ok => {
				os.inputText({
					title: q,
				}).then(({ canceled, result: a }) => {
					if (canceled) {
						ok('');
					} else {
						ok(a);
					}
				});
			});
		},
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
					text: utils.valToString(params.val, true),
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

definePageMetadata({
	title: i18n.ts.scratchpad,
	icon: 'ti ti-terminal-2',
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: var(--margin);
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
</style>
