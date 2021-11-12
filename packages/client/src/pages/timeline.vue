<template>
<div class="cmuxhskf" v-size="{ min: [800] }" v-hotkey.global="keymap">
	<XTutorial v-if="$store.reactiveState.tutorial.value != -1" class="tutorial _block"/>
	<XPostForm v-if="$store.reactiveState.showFixedPostForm.value" class="post-form _block" fixed/>

	<div class="new" v-if="queue > 0"><button class="_buttonPrimary" @click="top()">{{ $ts.newNoteRecived }}</button></div>
	<div class="tl _block">
		<XTimeline ref="tl" class="tl"
			:key="src"
			:src="src"
			:sound="true"
			@before="before()"
			@after="after()"
			@queue="queueUpdated"
		/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent, computed } from 'vue';
import Progress from '@/scripts/loading';
import XTimeline from '@/components/timeline.vue';
import XPostForm from '@/components/post-form.vue';
import { scroll } from '@/scripts/scroll';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	name: 'timeline',

	components: {
		XTimeline,
		XTutorial: defineAsyncComponent(() => import('./timeline.tutorial.vue')),
		XPostForm,
	},

	data() {
		return {
			src: 'home',
			queue: 0,
			[symbols.PAGE_INFO]: computed(() => ({
				title: this.$ts.timeline,
				icon: this.src === 'local' ? 'fas fa-comments' : this.src === 'social' ? 'fas fa-share-alt' : this.src === 'global' ? 'fas fa-globe' : 'fas fa-home',
				bg: 'var(--bg)',
				actions: [{
					icon: 'fas fa-list-ul',
					text: this.$ts.lists,
					handler: this.chooseList
				}, {
					icon: 'fas fa-satellite',
					text: this.$ts.antennas,
					handler: this.chooseAntenna
				}, {
					icon: 'fas fa-satellite-dish',
					text: this.$ts.channel,
					handler: this.chooseChannel
				}, {
					icon: 'fas fa-calendar-alt',
					text: this.$ts.jumpToSpecifiedDate,
					handler: this.timetravel
				}],
				tabs: [{
					active: this.src === 'home',
					title: this.$ts._timelines.home,
					icon: 'fas fa-home',
					iconOnly: true,
					onClick: () => { this.src = 'home'; this.saveSrc(); },
				}, {
					active: this.src === 'local',
					title: this.$ts._timelines.local,
					icon: 'fas fa-comments',
					iconOnly: true,
					onClick: () => { this.src = 'local'; this.saveSrc(); },
				}, {
					active: this.src === 'social',
					title: this.$ts._timelines.social,
					icon: 'fas fa-share-alt',
					iconOnly: true,
					onClick: () => { this.src = 'social'; this.saveSrc(); },
				}, {
					active: this.src === 'global',
					title: this.$ts._timelines.global,
					icon: 'fas fa-globe',
					iconOnly: true,
					onClick: () => { this.src = 'global'; this.saveSrc(); },
				}],
			})),
		};
	},

	computed: {
		keymap(): any {
			return {
				't': this.focus
			};
		},

		isLocalTimelineAvailable(): boolean {
			return !this.$instance.disableLocalTimeline || this.$i.isModerator || this.$i.isAdmin;
		},

		isGlobalTimelineAvailable(): boolean {
			return !this.$instance.disableGlobalTimeline || this.$i.isModerator || this.$i.isAdmin;
		},
	},

	watch: {
		src() {
			this.showNav = false;
		},
	},

	created() {
		this.src = this.$store.state.tl.src;
	},

	methods: {
		before() {
			Progress.start();
		},

		after() {
			Progress.done();
		},

		queueUpdated(q) {
			this.queue = q;
		},

		top() {
			scroll(this.$el, { top: 0 });
		},

		async chooseList(ev) {
			const lists = await os.api('users/lists/list');
			const items = lists.map(list => ({
				type: 'link',
				text: list.name,
				to: `/timeline/list/${list.id}`
			}));
			os.popupMenu(items, ev.currentTarget || ev.target);
		},

		async chooseAntenna(ev) {
			const antennas = await os.api('antennas/list');
			const items = antennas.map(antenna => ({
				type: 'link',
				text: antenna.name,
				indicate: antenna.hasUnreadNote,
				to: `/timeline/antenna/${antenna.id}`
			}));
			os.popupMenu(items, ev.currentTarget || ev.target);
		},

		async chooseChannel(ev) {
			const channels = await os.api('channels/followed');
			const items = channels.map(channel => ({
				type: 'link',
				text: channel.name,
				indicate: channel.hasUnreadNote,
				to: `/channels/${channel.id}`
			}));
			os.popupMenu(items, ev.currentTarget || ev.target);
		},

		saveSrc() {
			this.$store.set('tl', {
				src: this.src,
			});
		},

		async timetravel() {
			const { canceled, result: date } = await os.dialog({
				title: this.$ts.date,
				input: {
					type: 'date'
				}
			});
			if (canceled) return;

			this.$refs.tl.timetravel(new Date(date));
		},

		focus() {
			(this.$refs.tl as any).focus();
		}
	}
});
</script>

<style lang="scss" scoped>
.cmuxhskf {
	padding: var(--margin);

	> .new {
		position: sticky;
		top: calc(var(--stickyTop, 0px) + 16px);
		z-index: 1000;
		width: 100%;

		> button {
			display: block;
			margin: var(--margin) auto 0 auto;
			padding: 8px 16px;
			border-radius: 32px;
		}
	}

	> .post-form {
		border-radius: var(--radius);
	}

	> .tl {
		background: var(--bg);
		border-radius: var(--radius);
		overflow: clip;
	}

	&.min-width_800px {
		max-width: 800px;
		margin: 0 auto;
	}
}
</style>
