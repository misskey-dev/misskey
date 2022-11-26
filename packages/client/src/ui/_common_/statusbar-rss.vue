<template>
<span v-if="!fetching" class="xbhtxfms">
	<template v-if="display === 'marquee'">
		<transition name="change" mode="default">
			<MarqueeText :key="key" :duration="marqueeDuration" :reverse="marqueeReverse">
				<span v-for="item in items" class="item">
					<a class="link" :href="item.link" rel="nofollow noopener" target="_blank" :title="item.title">{{ item.title }}</a><span class="divider"></span>
				</span>
			</MarqueeText>
		</transition>
	</template>
	<template v-else-if="display === 'oneByOne'">
		<!-- TODO -->
	</template>
</span>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, toRef, watch } from 'vue';
import MarqueeText from '@/components/MkMarquee.vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';
import { shuffle } from '@/scripts/shuffle';

const props = defineProps<{
	url?: string;
	shuffle?: boolean;
	display?: 'marquee' | 'oneByOne';
	marqueeDuration?: number;
	marqueeReverse?: boolean;
	oneByOneInterval?: number;
	refreshIntervalSec?: number;
}>();

const items = ref([]);
const fetching = ref(true);
let key = $ref(0);

const tick = () => {
	fetch(`/api/fetch-rss?url=${props.url}`, {}).then(res => {
		res.json().then(feed => {
			if (props.shuffle) {
				shuffle(feed.items);
			}
			items.value = feed.items;
			fetching.value = false;
			key++;
		});
	});
};

useInterval(tick, Math.max(5000, props.refreshIntervalSec * 1000), {
	immediate: true,
	afterMounted: true,
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

.xbhtxfms {
	display: inline-block;
	position: relative;

	::v-deep(.item) {
		display: inline-flex;
		align-items: center;
		vertical-align: bottom;
		margin: 0;

		> .divider {
			display: inline-block;
			width: 0.5px;
			height: var(--height);
			margin: 0 3em;
			background: currentColor;
			opacity: 0.3;
		}
	}
}
</style>
