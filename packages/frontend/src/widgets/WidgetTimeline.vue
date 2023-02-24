<template>
<MkContainer :show-header="widgetProps.showHeader" :style="`height: ${widgetProps.height}px;`" :scrollable="true" class="mkw-timeline data-cy-mkw-timeline">
	<template #icon>
		<i v-if="widgetProps.src === 'home'" class="ti ti-home"></i>
		<i v-else-if="widgetProps.src === 'local'" class="ti ti-planet"></i>
		<i v-else-if="widgetProps.src === 'social'" class="ti ti-rocket"></i>
		<i v-else-if="widgetProps.src === 'global'" class="ti ti-whirl"></i>
		<i v-else-if="widgetProps.src === 'list'" class="ti ti-list"></i>
		<i v-else-if="widgetProps.src === 'antenna'" class="ti ti-antenna"></i>
	</template>
	<template #header>
		<button class="_button" @click="choose">
			<span>{{ widgetProps.src === 'list' ? widgetProps.list.name : widgetProps.src === 'antenna' ? widgetProps.antenna.name : $t('_timelines.' + widgetProps.src) }}</span>
			<i :class="menuOpened ? 'ti ti-chevron-up' : 'ti ti-chevron-down'" style="margin-left: 8px;"></i>
		</button>
	</template>

	<div>
		<MkTimeline :key="widgetProps.src === 'list' ? `list:${widgetProps.list.id}` : widgetProps.src === 'antenna' ? `antenna:${widgetProps.antenna.id}` : widgetProps.src" :src="widgetProps.src" :list="widgetProps.list ? widgetProps.list.id : null" :antenna="widgetProps.antenna ? widgetProps.antenna.id : null"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentExpose } from './widget';
import { GetFormResultType } from '@/scripts/form';
import * as os from '@/os';
import MkContainer from '@/components/MkContainer.vue';
import MkTimeline from '@/components/MkTimeline.vue';
import { i18n } from '@/i18n';

const name = 'timeline';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	height: {
		type: 'number' as const,
		default: 300,
	},
	src: {
		type: 'string' as const,
		default: 'home',
		hidden: true,
	},
	antenna: {
		type: 'object' as const,
		default: null,
		hidden: true,
	},
	list: {
		type: 'object' as const,
		default: null,
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

const menuOpened = ref(false);

const setSrc = (src) => {
	widgetProps.src = src;
	save();
};

const choose = async (ev) => {
	menuOpened.value = true;
	const [antennas, lists] = await Promise.all([
		os.api('antennas/list'),
		os.api('users/lists/list'),
	]);
	const antennaItems = antennas.map(antenna => ({
		text: antenna.name,
		icon: 'ti ti-antenna',
		action: () => {
			widgetProps.antenna = antenna;
			setSrc('antenna');
		},
	}));
	const listItems = lists.map(list => ({
		text: list.name,
		icon: 'ti ti-list',
		action: () => {
			widgetProps.list = list;
			setSrc('list');
		},
	}));
	os.popupMenu([{
		text: i18n.ts._timelines.home,
		icon: 'ti ti-home',
		action: () => { setSrc('home'); },
	}, {
		text: i18n.ts._timelines.local,
		icon: 'ti ti-planet',
		action: () => { setSrc('local'); },
	}, {
		text: i18n.ts._timelines.social,
		icon: 'ti ti-rocket',
		action: () => { setSrc('social'); },
	}, {
		text: i18n.ts._timelines.global,
		icon: 'ti ti-whirl',
		action: () => { setSrc('global'); },
	}, antennaItems.length > 0 ? null : undefined, ...antennaItems, listItems.length > 0 ? null : undefined, ...listItems], ev.currentTarget ?? ev.target).then(() => {
		menuOpened.value = false;
	});
};

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
