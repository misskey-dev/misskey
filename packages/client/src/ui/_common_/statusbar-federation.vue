<template>
<span v-if="!fetching" class="nmidsaqw">
	<template v-if="display === 'marquee'">
		<transition name="change" mode="default">
			<MarqueeText :key="key" :duration="marqueeDuration" :reverse="marqueeReverse">
				<span v-for="instance in instances" :key="instance.id" class="item" :class="{ colored }" :style="{ background: colored ? instance.themeColor : null }">
					<img v-if="instance.iconUrl" class="icon" :src="instance.iconUrl" alt=""/>
					<MkA :to="`/instance-info/${instance.host}`" class="host _monospace">
						{{ instance.host }}
					</MkA>
					<span class="divider"></span>
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
import * as misskey from 'misskey-js';
import MarqueeText from '@/components/MkMarquee.vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';
import { getNoteSummary } from '@/scripts/get-note-summary';
import { notePage } from '@/filters/note';

const props = defineProps<{
	display?: 'marquee' | 'oneByOne';
	colored?: boolean;
	marqueeDuration?: number;
	marqueeReverse?: boolean;
	oneByOneInterval?: number;
	refreshIntervalSec?: number;
}>();

const instances = ref<misskey.entities.Instance[]>([]);
const fetching = ref(true);
let key = $ref(0);

const tick = () => {
	os.api('federation/instances', {
		sort: '+lastCommunicatedAt',
		limit: 30,
	}).then(res => {
		instances.value = res;
		fetching.value = false;
		key++;
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

.nmidsaqw {
	display: inline-block;
	position: relative;

	::v-deep(.item) {
		display: inline-block;
		vertical-align: bottom;
		margin-right: 5em;

		> .icon {
			display: inline-block;
			height: var(--height);
			aspect-ratio: 1;
			vertical-align: bottom;
			margin-right: 1em;
		}

		> .host {
			vertical-align: bottom;
		}

		&.colored {
			padding-right: 1em;
			color: #fff;
		}
	}
}
</style>
