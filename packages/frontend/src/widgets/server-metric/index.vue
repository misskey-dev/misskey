<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<MkContainer :showHeader="widgetProps.showHeader" :naked="widgetProps.transparent">
		<template #icon><i class="ti ti-server"></i></template>
		<template #header>{{ i18n.ts._widgets.serverMetric }}</template>

		<div v-if="meta" data-cy-mkw-serverMetric class="mkw-serverMetric">
			<XCpu :connection="connection" :meta="meta" />
			<XMemory :connection="connection" :meta="meta" />
			<XDisk :connection="connection" :meta="meta" />
			<XNet :connection="connection" :meta="meta" />
		</div>
	</MkContainer>
</template>

<script lang="ts" setup>
import { onUnmounted, ref } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentExpose } from '../widget';
import XNet from './net.vue';
import XCpu from './cpu.vue';
import XMemory from './mem.vue';
import XDisk from './disk.vue';
import MkContainer from '@/components/MkContainer.vue';
import { GetFormResultType } from '@/scripts/form.js';
import * as os from '@/os.js';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';

const name = 'serverMetric';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
	view: {
		type: 'number' as const,
		default: 0,
		hidden: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

// 現時点ではvueの制限によりimportしたtypeをジェネリックに渡せない
//const props = defineProps<WidgetComponentProps<WidgetProps>>();
//const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const props = defineProps<{ widget?: Widget<WidgetProps>; }>();
const emit = defineEmits<{ (ev: 'updateProps', props: WidgetProps); }>();

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const meta = ref(null);

os.apiGet('server-info', {}).then(res => {
	meta.value = res;
});

const toggleView = () => {
	if (widgetProps.view === 4) {
		widgetProps.view = 0;
	} else {
		widgetProps.view++;
	}
	save();
};

const connection = useStream().useChannel('serverStats');
onUnmounted(() => {
	connection.dispose();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
