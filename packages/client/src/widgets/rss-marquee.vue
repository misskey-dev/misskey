<template>
<MkContainer :naked="widgetProps.transparent" :show-header="widgetProps.showHeader" class="mkw-rss-marquee">
	<template #header><i class="fas fa-rss-square"></i>RSS</template>
	<template #func><button class="_button" @click="configure"><i class="fas fa-cog"></i></button></template>

	<div class="ekmkgxbk">
		<MkLoading v-if="fetching"/>
		<div v-else class="feed">
			<MarqueeText :key="key" :duration="widgetProps.speed" :reverse="widgetProps.reverse">
				<a v-for="item in items" class="item" :href="item.link" rel="nofollow noopener" target="_blank" :title="item.title">{{ item.title }}</a>
			</MarqueeText>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import MarqueeText from 'vue-marquee-text-component';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form';
import * as os from '@/os';
import MkContainer from '@/components/ui/container.vue';
import { useInterval } from '@/scripts/use-interval';

const name = 'rssMarquee';

const widgetPropsDef = {
	url: {
		type: 'string' as const,
		default: 'http://feeds.afpbb.com/rss/afpbb/afpbbnews',
	},
	showHeader: {
		type: 'boolean' as const,
		default: false,
	},
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
	speed: {
		type: 'radio' as const,
		default: 70,
		options: [{
			value: 170, label: 'very slow',
		}, {
			value: 100, label: 'slow',
		}, {
			value: 70, label: 'medium',
		}, {
			value: 40, label: 'fast',
		}, {
			value: 20, label: 'very fast',
		}],
	},
	reverse: {
		type: 'boolean' as const,
		default: false,
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
let key = $ref(0);

const tick = () => {
	fetch(`https://api.rss2json.com/v1/api.json?rss_url=${widgetProps.url}`, {}).then(res => {
		res.json().then(feed => {
			items.value = feed.items;
			fetching.value = false;
			key++;
		});
	});
};

watch(() => widgetProps.url, tick);

useInterval(tick, 60000, {
	immediate: true,
	afterMounted: true,
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.ekmkgxbk {
	> .feed {
		padding: 0;
		font-size: 0.9em;

		::v-deep(.item) {
			display: inline-block;
			color: var(--fg);
			margin: 12px 3em 12px 0;
		}
	}
}
</style>
