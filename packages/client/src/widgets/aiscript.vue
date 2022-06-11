<template>
<MkContainer :show-header="widgetProps.showHeader" class="mkw-aiscript">
	<template #header><i class="fas fa-terminal"></i>{{ $ts._widgets.aiscript }}</template>

	<div class="uylguesu _monospace">
		<textarea v-model="widgetProps.script" placeholder="(1 + 1)"></textarea>
		<button class="_buttonPrimary" @click="run">RUN</button>
		<div class="logs">
			<div v-for="log in logs" :key="log.id" class="log" :class="{ print: log.print }">{{ log.text }}</div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { GetFormResultType } from '@/scripts/form';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import * as os from '@/os';
import MkContainer from '@/components/ui/container.vue';
import { AiScript, parse, utils } from '@syuilo/aiscript';
import { createAiScriptEnv } from '@/scripts/aiscript/api';
import { $i } from '@/account';

const name = 'aiscript';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	script: {
		type: 'string' as const,
		multiline: true,
		default: '(1 + 1)',
		hidden: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

// 現時点ではvueの制限によりimportしたtypeをジェネリックに渡せない
//const props = defineProps<WidgetComponentProps<WidgetProps>>();
//const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const props = defineProps<{ widget?: Widget<WidgetProps>; }>();
const emit = defineEmits<{ (ev: 'updateProps', props: WidgetProps); }>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const logs = ref<{
	id: string;
	text: string;
	print: boolean;
}[]>([]);

const run = async () => {
	logs.value = [];
	const aiscript = new AiScript(createAiScriptEnv({
		storageKey: 'widget',
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
				id: Math.random().toString(),
				text: value.type === 'str' ? value.value : utils.valToString(value),
				print: true,
			});
		},
		log: (type, params) => {
			switch (type) {
				case 'end': logs.value.push({
					id: Math.random().toString(),
					text: utils.valToString(params.val, true),
					print: false,
				}); break;
				default: break;
			}
		}
	});

	let ast;
	try {
		ast = parse(widgetProps.script);
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
			text: err,
		});
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
		color: var(--fg);
		background: transparent;
		border: none;
		border-bottom: solid 0.5px var(--divider);
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
		border-top: solid 0.5px var(--divider);
		text-align: left;
		padding: 16px;

		&:empty {
			display: none;
		}

		> .log {
			&:not(.print) {
				opacity: 0.7;
			}
		}
	}
}
</style>
