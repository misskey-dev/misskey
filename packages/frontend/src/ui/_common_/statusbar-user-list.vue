<template>
<span v-if="!fetching" class="osdsvwzy">
	<template v-if="display === 'marquee'">
		<Transition name="change" mode="default">
			<MarqueeText :key="key" :duration="marqueeDuration" :reverse="marqueeReverse">
				<span v-for="note in notes" :key="note.id" class="item">
					<img class="avatar" :src="note.user.avatarUrl" decoding="async"/>
					<MkA class="text" :to="notePage(note)">
						<Mfm class="text" :text="getNoteSummary(note)" :plain="true" :nowrap="true"/>
					</MkA>
					<span class="divider"></span>
				</span>
			</MarqueeText>
		</Transition>
	</template>
	<template v-else-if="display === 'oneByOne'">
		<!-- TODO -->
	</template>
</span>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import * as misskey from 'misskey-js';
import MarqueeText from '@/components/MkMarquee.vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';
import { getNoteSummary } from '@/scripts/get-note-summary';
import { notePage } from '@/filters/note';

const props = defineProps<{
	userListId?: string;
	display?: 'marquee' | 'oneByOne';
	marqueeDuration?: number;
	marqueeReverse?: boolean;
	oneByOneInterval?: number;
	refreshIntervalSec?: number;
}>();

const notes = ref<misskey.entities.Note[]>([]);
const fetching = ref(true);
let key = $ref(0);

const tick = () => {
	if (props.userListId == null) return;
	os.api('notes/user-list-timeline', {
		listId: props.userListId,
	}).then(res => {
		notes.value = res;
		fetching.value = false;
		key++;
	});
};

watch(() => props.userListId, tick);

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

.osdsvwzy {
	display: inline-block;
	position: relative;

	::v-deep(.item) {
		display: inline-flex;
		align-items: center;
		vertical-align: bottom;
		margin: 0;

		> .avatar {
			display: inline-block;
			height: var(--height);
			aspect-ratio: 1;
			vertical-align: bottom;
			margin-right: 8px;
		}

		> .text {
			> .text {
				display: inline-block;
				vertical-align: bottom;
			}
		}

		> .divider {
			display: inline-block;
			width: 0.5px;
			height: 16px;
			margin: 0 3em;
			background: currentColor;
			opacity: 0;
		}
	}
}
</style>
