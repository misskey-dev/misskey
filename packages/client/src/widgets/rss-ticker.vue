<template>
<MkContainer :naked="widgetProps.transparent" :show-header="widgetProps.showHeader" class="mkw-rss-ticker">
	<template #header><i class="fas fa-rss-square"></i>RSS</template>
	<template #func><button class="_button" @click="configure"><i class="fas fa-cog"></i></button></template>

	<div class="ekmkgxbk">
		<MkLoading v-if="fetching"/>
		<div v-else class="feed">
			<transition name="change" mode="default">
				<MarqueeText :key="key" :duration="widgetProps.duration" :reverse="widgetProps.reverse">
					<span v-for="item in items" class="item">
						<a class="link" :href="item.link" rel="nofollow noopener" target="_blank" :title="item.title">{{ item.title }}</a><span class="divider"></span>
					</span>
				</MarqueeText>
			</transition>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import MarqueeText from '@/components/MkMarquee.vue';
import { GetFormResultType } from '@/scripts/form';
import * as os from '@/os';
import MkContainer from '@/components/MkContainer.vue';
import { useInterval } from '@/scripts/use-interval';
import { shuffle } from '@/scripts/shuffle';

const name = 'rssTicker';

const widgetPropsDef = {
	url: {
		type: 'string' as const,
		default: 'http://feeds.afpbb.com/rss/afpbb/afpbbnews',
	},
	shuffle: {
		type: 'boolean' as const,
		default: true,
	},
	refreshIntervalSec: {
		type: 'number' as const,
		default: 60,
	},
	duration: {
		type: 'range' as const,
		default: 70,
		step: 1,
		min: 5,
		max: 200,
	},
	reverse: {
		type: 'boolean' as const,
		default: false,
	},
	showHeader: {
		type: 'boolean' as const,
		default: false,
	},
	transparent: {
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
	fetch(`/api/fetch-rss?url=${widgetProps.url}`, {}).then(res => {
		res.json().then(feed => {
			if (widgetProps.shuffle) {
				shuffle(feed.items);
			}
			items.value = feed.items;
			fetching.value = false;
			key++;
		});
	});
};

watch(() => widgetProps.url, tick);

useInterval(tick, Math.max(10000, widgetProps.refreshIntervalSec * 1000), {
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
.change-enter-active, .change-leave-active {
	position: absolute;
	top: 0;
  transition: all 1s ease;
}
.change-enter-from {
  opacity: 0;
	transform: translateY(-100%);
}
.change-leave-to {
  opacity: 0;
	transform: translateY(100%);
}

.ekmkgxbk {
	> .feed {
		--height: 42px;
		padding: 0;
		font-size: 0.9em;
		line-height: var(--height);
		height: var(--height);
		contain: strict;

		::v-deep(.item) {
			display: inline-flex;
			align-items: center;
			vertical-align: bottom;
			color: var(--fg);

			> .divider {
				display: inline-block;
				width: 0.5px;
				height: 16px;
				margin: 0 1em;
				background: var(--divider);
			}
		}
	}
}
</style>
