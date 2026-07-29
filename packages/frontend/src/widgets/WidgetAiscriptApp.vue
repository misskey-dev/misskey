<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-aiscriptApp">
	<template #header>App</template>
	<div :class="$style.root">
		<div v-if="isSyntaxError">Syntax error :(</div>
		<MkAsUi v-else-if="root" :component="root" :components="components" size="small"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { Interpreter, Parser } from '@syuilo/aiscript';
import { useWidgetPropsManager } from './widget.js';
import type { Ref } from 'vue';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import type { AsUiComponent, AsUiRoot } from '@/aiscript/ui.js';
import * as os from '@/os.js';
import { aiScriptReadline, createAiScriptEnv } from '@/aiscript/api.js';
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';
import MkAsUi from '@/components/MkAsUi.vue';
import MkContainer from '@/components/MkContainer.vue';
import { registerAsUiLib } from '@/aiscript/ui.js';

const name = 'aiscriptApp';

const widgetPropsDef = {
	script: {
		type: 'string',
		label: i18n.ts.script,
		multiline: true,
		manualSave: true,
		default: '',
	},
	showHeader: {
		type: 'boolean',
		label: i18n.ts._widgetOptions.showHeader,
		default: true,
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

const root = ref<AsUiRoot>();
const components = ref<Ref<AsUiComponent>[]>([]);
const isSyntaxError = ref(false);

async function run() {
	isSyntaxError.value = false;

	const aiscript = new Interpreter({
		...createAiScriptEnv({
			storageKey: 'widget',
			token: $i?.token,
		}),
		...registerAsUiLib(components.value, (_root) => {
			root.value = _root.value;
		}),
	}, {
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
		isSyntaxError.value = true;
		return;
	}
	try {
		await aiscript.exec(ast);
	} catch (err) {
		os.alert({
			type: 'error',
			title: 'AiScript Error',
			text: err instanceof Error ? err.message : String(err),
		});
	}
}

watch(() => widgetProps.script, () => {
	run();
});

onMounted(() => {
	run();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	padding: 16px;
}
</style>
