<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div data-cy-mkw-button class="mkw-button">
	<MkButton :primary="widgetProps.colored" full @click="run">
		{{ widgetProps.label }}
	</MkButton>
</div>
</template>

<script lang="ts" setup>
import { Interpreter, Parser } from '@syuilo/aiscript';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import * as os from '@/os.js';
import { aiScriptReadline, createAiScriptEnv } from '@/aiscript/api.js';
import { $i } from '@/i.js';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';

const name = 'button';

const widgetPropsDef = {
	label: {
		type: 'string',
		label: i18n.ts.label,
		default: 'BUTTON',
	},
	colored: {
		type: 'boolean',
		label: i18n.ts._widgetOptions._button.colored,
		default: true,
	},
	script: {
		type: 'string',
		label: i18n.ts.script,
		multiline: true,
		default: 'Mk:dialog("hello", "world")',
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

async function run() {
	const aiscript = new Interpreter(createAiScriptEnv({
		storageKey: 'widget',
		token: $i?.token,
	}), {
		in: aiScriptReadline,
		out: (value) => {
			// nop
		},
		log: (type, params) => {
			// nop
		},
	});

	let ast;
	try {
		ast = parser.parse(widgetProps.script);
	} catch (err) {
		os.alert({
			type: 'error',
			text: 'Syntax error :(',
		});
		return;
	}
	try {
		await aiscript.exec(ast);
	} catch (err) {
		os.alert({
			type: 'error',
			text: err instanceof Error ? err.message : String(err),
		});
	}
}

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
