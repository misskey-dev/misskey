<template>
<MkContainer :show-header="widgetProps.showHeader" class="mkw-trends">
	<template #header><i class="fas fa-hashtag"></i>{{ $ts._widgets.trends }}</template>

	<div class="wbrkwala">
		<MkLoading v-if="fetching"/>
		<transition-group v-else tag="div" :name="$store.state.animation ? 'chart' : ''" class="tags">
			<div v-for="stat in stats" :key="stat.tag">
				<div class="tag">
					<MkA class="a" :to="`/tags/${ encodeURIComponent(stat.tag) }`" :title="stat.tag">#{{ stat.tag }}</MkA>
					<p>{{ $t('nUsersMentioned', { n: stat.usersCount }) }}</p>
				</div>
				<MkMiniChart class="chart" :src="stat.chart"/>
			</div>
		</transition-group>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { GetFormResultType } from '@/scripts/form';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import MkContainer from '@/components/ui/container.vue';
import MkMiniChart from '@/components/mini-chart.vue';
import * as os from '@/os';

const name = 'hashtags';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
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

const stats = ref([]);
const fetching = ref(true);

const fetch = () => {
	os.api('hashtags/trend').then(res => {
		stats.value = res;
		fetching.value = false;
	});
};

onMounted(() => {
	fetch();
	const intervalId = window.setInterval(fetch, 1000 * 60);
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
.wbrkwala {
	height: (62px + 1px) + (62px + 1px) + (62px + 1px) + (62px + 1px) + 62px;
	overflow: hidden;

	> .tags {
		.chart-move {
			transition: transform 1s ease;
		}

		> div {
			display: flex;
			align-items: center;
			padding: 14px 16px;
			border-bottom: solid 0.5px var(--divider);

			> .tag {
				flex: 1;
				overflow: hidden;
				font-size: 0.9em;
				color: var(--fg);

				> .a {
					display: block;
					width: 100%;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					line-height: 18px;
				}

				> p {
					margin: 0;
					font-size: 75%;
					opacity: 0.7;
					line-height: 16px;
				}
			}

			> .chart {
				height: 30px;
			}
		}
	}
}
</style>
