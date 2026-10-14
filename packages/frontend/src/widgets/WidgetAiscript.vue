<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-testid="mkw-aiscript" class="mkw-aiscript">
	<template #icon><i class="ti ti-terminal-2"></i></template>
	<template #header>{{ i18n.ts._widgets.aiscript }}</template>

	<div class="uylguesu _monospace">
		<textarea v-model="widgetProps.script" placeholder="(1 + 1)"></textarea>
		<button class="_buttonPrimary" @click="run">RUN</button>
		<div class="logs">
			<div v-for="log in logs" :key="log.id" class="log" :class="log.type">{{ log.text }}</div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Interpreter, Parser, utils } from '@syuilo/aiscript';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import type { Value } from '@syuilo/aiscript/interpreter/value.js';
import * as os from '@/os.js';
import MkContainer from '@/components/MkContainer.vue';
import { aiScriptReadline, createAiScriptEnv } from '@/aiscript/api.js';
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';
import { genId } from '@/utility/id.js';

const name = 'aiscript';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: i18n.ts._widgetOptions.showHeader,
		default: true,
	},
	script: {
		type: 'string',
		label: i18n.ts.script,
		multiline: true,
		default: '(1 + 1)',
		hidden: true,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const parser = new Parser();
let aiscript: Interpreter;

const logs = ref<{
	id: string;
	text: string;
	type: 'print' | 'end' | 'error';
}[]>([]);

function pushLog(type: 'print' | 'end' | 'error', text: string): void {
	logs.value.push({ id: genId(), text, type });
}

function processError(title: string, err: unknown): void {
	const text = String(err);
	pushLog('error', text);
	os.alert({ type: 'error', title, text });
}

const run = async () => {
	logs.value = [];

	const aiscript = new Interpreter(createAiScriptEnv({
		storageKey: 'widget',
		token: $i?.token,
	}), {
		in: aiScriptReadline,
		out: (value) => {
			pushLog('print', value.type === 'str' ? value.value : utils.valToString(value));
		},
		err: (err) => {
			processError('AiScript Error', err);
		},
		log: (type, params) => {
			if (type === 'end') {
				pushLog('end', utils.valToString(params.val as Value, true));
			}
		},
	});

	let ast;
	try {
		ast = parser.parse(widgetProps.script);
	} catch (err: any) {
		processError('Syntax Error', err);
		return;
	}
	try {
		await aiscript.exec(ast);
	} catch (err: any) {
		processError('AiScript Internal Error', err);
	}
};

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.uylguesu {
	text-align: right;

	> textarea {
		display: block;
		width: 100%;
		max-width: 100%;
		min-width: 100%;
		padding: 16px;
		color: var(--MI_THEME-fg);
		background: transparent;
		border: none;
		border-bottom: solid 0.5px var(--MI_THEME-divider);
		border-radius: 0;
		box-sizing: border-box;
		font: inherit;

		&:focus-visible {
			outline: none;
		}
	}

	> button {
		display: inline-block;
		margin: 8px;
		padding: 0 10px;
		height: 28px;
		outline: none;
		border-radius: 4px;

		&:disabled {
			opacity: 0.7;
			cursor: default;
		}
	}

	> .logs {
		border-top: solid 0.5px var(--MI_THEME-divider);
		text-align: left;
		padding: 16px;

		&:empty {
			display: none;
		}

		> .log.print {
		}
		> .log.end {
			opacity: 0.7;
		}
		> .log.error {
			color: var(--MI_THEME-error);
		}
	}
}
</style>
