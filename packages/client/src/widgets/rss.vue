<template>
<MkContainer :show-header="widgetProps.showHeader" class="mkw-rss">
	<template #header><i class="fas fa-rss-square"></i>RSS</template>
	<template #func><button class="_button" @click="configure"><i class="fas fa-cog"></i></button></template>

	<div class="ekmkgxbj">
		<MkLoading v-if="fetching"/>
		<div v-else class="feed">
			<a v-for="item in items" :href="item.link" rel="nofollow noopener" target="_blank" :title="item.title">{{ item.title }}</a>
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

const name = 'rss';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	url: {
		type: 'string' as const,
		default: 'http://feeds.afpbb.com/rss/afpbb/afpbbnews',
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

const items = ref([]);
const fetching = ref(true);

const tick = () => {
	fetch(`https://api.rss2json.com/v1/api.json?rss_url=${widgetProps.url}`, {}).then(res => {
		res.json().then(feed => {
			items.value = feed.items;
			fetching.value = false;
		});
	});
};

watch(() => widgetProps.url, tick);

onMounted(() => {
	tick();
	const intervalId = window.setInterval(tick, 60000);
	onUnmounted(() => {
		window.clearInterval(intervalId);
	});
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.ekmkgxbj {
	> .feed {
		padding: 0;
		font-size: 0.9em;

		> a {
			display: block;
			padding: 8px 16px;
			color: var(--fg);
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;

			&:nth-child(even) {
				background: rgba(#000, 0.05);
			}
		}
	}
}
</style>
