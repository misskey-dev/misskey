<template>
<MkContainer :show-header="widgetProps.showHeader" :style="`height: ${widgetProps.height}px;`" :scrollable="true" class="mkw-timeline">
	<template #header>
		<button class="_button" @click="choose">
			<i v-if="widgetProps.src === 'home'" class="fas fa-home"></i>
			<i v-else-if="widgetProps.src === 'local'" class="fas fa-comments"></i>
			<i v-else-if="widgetProps.src === 'social'" class="fas fa-share-alt"></i>
			<i v-else-if="widgetProps.src === 'global'" class="fas fa-globe"></i>
			<i v-else-if="widgetProps.src === 'list'" class="fas fa-list-ul"></i>
			<i v-else-if="widgetProps.src === 'antenna'" class="fas fa-satellite"></i>
			<span style="margin-left: 8px;">{{ widgetProps.src === 'list' ? widgetProps.list.name : widgetProps.src === 'antenna' ? widgetProps.antenna.name : $t('_timelines.' + widgetProps.src) }}</span>
			<i :class="menuOpened ? 'fas fa-angle-up' : 'fas fa-angle-down'" style="margin-left: 8px;"></i>
		</button>
	</template>

	<div>
		<XTimeline :key="widgetProps.src === 'list' ? `list:${widgetProps.list.id}` : widgetProps.src === 'antenna' ? `antenna:${widgetProps.antenna.id}` : widgetProps.src" :src="widgetProps.src" :list="widgetProps.list ? widgetProps.list.id : null" :antenna="widgetProps.antenna ? widgetProps.antenna.id : null"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { GetFormResultType } from '@/scripts/form';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import * as os from '@/os';
import MkContainer from '@/components/MkContainer.vue';
import XTimeline from '@/components/MkTimeline.vue';
import { $i } from '@/account';
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
		os.api('users/lists/list')
	]);
	const antennaItems = antennas.map(antenna => ({
		text: antenna.name,
		icon: 'fas fa-satellite',
		action: () => {
			widgetProps.antenna = antenna;
			setSrc('antenna');
		}
	}));
	const listItems = lists.map(list => ({
		text: list.name,
		icon: 'fas fa-list-ul',
		action: () => {
			widgetProps.list = list;
			setSrc('list');
		}
	}));
	os.popupMenu([{
		text: i18n.ts._timelines.home,
		icon: 'fas fa-home',
		action: () => { setSrc('home'); }
	}, {
		text: i18n.ts._timelines.local,
		icon: 'fas fa-comments',
		action: () => { setSrc('local'); }
	}, {
		text: i18n.ts._timelines.social,
		icon: 'fas fa-share-alt',
		action: () => { setSrc('social'); }
	}, {
		text: i18n.ts._timelines.global,
		icon: 'fas fa-globe',
		action: () => { setSrc('global'); }
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
