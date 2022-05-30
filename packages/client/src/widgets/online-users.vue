<template>
<div class="mkw-onlineUsers" :class="{ _panel: !widgetProps.transparent, pad: !widgetProps.transparent }">
	<I18n v-if="onlineUsersCount" :src="$ts.onlineUsersCount" text-tag="span" class="text">
		<template #n><b>{{ onlineUsersCount }}</b></template>
	</I18n>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { GetFormResultType } from '@/scripts/form';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import * as os from '@/os';

const name = 'onlineUsers';

const widgetPropsDef = {
	transparent: {
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

const onlineUsersCount = ref(0);

const tick = () => {
	os.api('get-online-users-count').then(res => {
		onlineUsersCount.value = res.count;
	});
};

onMounted(() => {
	tick();
	const intervalId = window.setInterval(tick, 1000 * 15);
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
.mkw-onlineUsers {
	text-align: center;

	&.pad {
		padding: 16px 0;
	}

	> .text {
		::v-deep(b) {
			color: #41b781;
		}

		::v-deep(span) {
			opacity: 0.7;
		}
	}
}
</style>
