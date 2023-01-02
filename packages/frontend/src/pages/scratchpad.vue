<template>
<div class="iltifgqe">
	<div class="editor _panel _gap">
		<PrismEditor v-model="code" class="_code code" :highlight="highlighter" :line-numbers="false"/>
		<MkButton style="position: absolute; top: 8px; right: 8px;" primary @click="run()"><i class="ti ti-player-play"></i></MkButton>
	</div>

	<MkContainer :foldable="true" class="_gap">
		<template #header>{{ i18n.ts.output }}</template>
		<div class="bepmlvbi">
			<div v-for="log in logs" :key="log.id" class="log" :class="{ print: log.print }">{{ log.text }}</div>
		</div>
	</MkContainer>

	<div class="_gap">
		{{ i18n.ts.scratchpadDescription }}
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import 'prismjs';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-okaidia.css';
import { PrismEditor } from 'vue-prism-editor';
import 'vue-prism-editor/dist/prismeditor.min.css';
import { AiScript, parse, utils } from '@syuilo/aiscript';
import MkContainer from '@/components/MkContainer.vue';
import MkButton from '@/components/MkButton.vue';
import { createAiScriptEnv } from '@/scripts/aiscript/api';
import * as os from '@/os';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const code = ref('');
const logs = ref<any[]>([]);

const saved = localStorage.getItem('scratchpad');
if (saved) {
	code.value = saved;
}

watch(code, () => {
	localStorage.setItem('scratchpad', code.value);
});

async function run() {
	logs.value = [];
	const aiscript = new AiScript(createAiScriptEnv({
		storageKey: 'scratchpad',
		token: $i?.token,
	}), {
		in: (q) => {
			return new Promise(ok => {
				os.inputText({
					title: q,
				}).then(({ canceled, result: a }) => {
					ok(a);
				});
			});
		},
		out: (value) => {
			logs.value.push({
				id: Math.random(),
				text: value.type === 'str' ? value.value : utils.valToString(value),
				print: true,
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
		ast = parse(code.value);
	} catch (error) {
		os.alert({
			type: 'error',
			text: 'Syntax error :(',
		});
		return;
	}
	try {
		await aiscript.exec(ast);
	} catch (error: any) {
		os.alert({
			type: 'error',
			text: error.message,
		});
	}
}

function highlighter(code) {
	return highlight(code, languages.js, 'javascript');
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.scratchpad,
	icon: 'ti ti-terminal-2',
});
</script>

<style lang="scss" scoped>
.iltifgqe {
	padding: 16px;

	> .editor {
		position: relative;
	}
}

.bepmlvbi {
	padding: 16px;

	> .log {
		&:not(.print) {
			opacity: 0.7;
		}
	}
}
</style>
