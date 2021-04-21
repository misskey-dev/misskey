<template>
<div class="cmuxhskf _root" v-hotkey.global="keymap">
	<XTutorial v-if="$store.reactiveState.tutorial.value != -1" class="tutorial _block"/>
	<XPostForm v-if="$store.reactiveState.showFixedPostForm.value" class="post-form _block" fixed/>
	<div class="tabs _block">
		<div class="left">
			<button class="_button tab" @click="() => { src = 'home'; saveSrc(); }" :class="{ active: src === 'home' }" v-tooltip="$ts._timelines.home"><i class="fas fa-home"></i></button>
			<button class="_button tab" @click="() => { src = 'local'; saveSrc(); }" :class="{ active: src === 'local' }" v-tooltip="$ts._timelines.local" v-if="isLocalTimelineAvailable"><i class="fas fa-comments"></i></button>
			<button class="_button tab" @click="() => { src = 'social'; saveSrc(); }" :class="{ active: src === 'social' }" v-tooltip="$ts._timelines.social" v-if="isLocalTimelineAvailable"><i class="fas fa-share-alt"></i></button>
			<button class="_button tab" @click="() => { src = 'global'; saveSrc(); }" :class="{ active: src === 'global' }" v-tooltip="$ts._timelines.global" v-if="isGlobalTimelineAvailable"><i class="fas fa-globe"></i></button>
			<span class="divider"></span>
			<button class="_button tab" @click="() => { src = 'mentions'; saveSrc(); }" :class="{ active: src === 'mentions' }" v-tooltip="$ts.mentions"><i class="fas fa-at"></i><i v-if="$i.hasUnreadMentions" class="fas fa-circle i"></i></button>
			<button class="_button tab" @click="() => { src = 'directs'; saveSrc(); }" :class="{ active: src === 'directs' }" v-tooltip="$ts.directNotes"><i class="fas fa-envelope"></i><i v-if="$i.hasUnreadSpecifiedNotes" class="fas fa-circle i"></i></button>
		</div>
		<div class="right">
			<button class="_button tab" @click="chooseChannel" :class="{ active: src === 'channel' }" v-tooltip="$ts.channel"><i class="fas fa-satellite-dish"></i><i v-if="$i.hasUnreadChannel" class="fas fa-circle i"></i></button>
			<button class="_button tab" @click="chooseAntenna" :class="{ active: src === 'antenna' }" v-tooltip="$ts.antennas"><i class="fas fa-satellite"></i><i v-if="$i.hasUnreadAntenna" class="fas fa-circle i"></i></button>
			<button class="_button tab" @click="chooseList" :class="{ active: src === 'list' }" v-tooltip="$ts.lists"><i class="fas fa-list-ul"></i></button>
		</div>
	</div>
	<XTimeline ref="tl"
		class="_gap"
		:key="src === 'list' ? `list:${list.id}` : src === 'antenna' ? `antenna:${antenna.id}` : src === 'channel' ? `channel:${channel.id}` : src"
		:src="src"
		:list="list ? list.id : null"
		:antenna="antenna ? antenna.id : null"
		:channel="channel ? channel.id : null"
		:sound="true"
		@before="before()"
		@after="after()"
		@queue="queueUpdated"
	/>
	<div class="new" v-if="queue > 0"><button class="_buttonPrimary" @click="top()">{{ $ts.newNoteRecived }}</button></div>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent, computed } from 'vue';
import Progress from '@client/scripts/loading';
import XTimeline from '@client/components/timeline.vue';
import XPostForm from '@client/components/post-form.vue';
import { scroll } from '@client/scripts/scroll';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

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
			list: null,
			antenna: null,
			channel: null,
			menuOpened: false,
			queue: 0,
			[symbols.PAGE_INFO]: computed(() => ({
				title: this.$ts.timeline,
				icon: this.src === 'local' ? 'fas fa-comments' : this.src === 'social' ? 'fas fa-share-alt' : this.src === 'global' ? 'fas fa-globe' : 'fas fa-home',
				actions: [{
					icon: 'fas fa-calendar-alt',
					text: this.$ts.jumpToSpecifiedDate,
					handler: this.timetravel
				}]
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
		list(x) {
			this.showNav = false;
			if (x != null) this.antenna = null;
			if (x != null) this.channel = null;
		},
		antenna(x) {
			this.showNav = false;
			if (x != null) this.list = null;
			if (x != null) this.channel = null;
		},
		channel(x) {
			this.showNav = false;
			if (x != null) this.antenna = null;
			if (x != null) this.list = null;
		},
	},

	created() {
		this.src = this.$store.state.tl.src;
		if (this.src === 'list') {
			this.list = this.$store.state.tl.arg;
		} else if (this.src === 'antenna') {
			this.antenna = this.$store.state.tl.arg;
		} else if (this.src === 'channel') {
			this.channel = this.$store.state.tl.arg;
		}
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
			scroll(this.$el, 0);
		},

		async chooseList(ev) {
			const lists = await os.api('users/lists/list');
			const items = lists.map(list => ({
				text: list.name,
				action: () => {
					this.list = list;
					this.src = 'list';
					this.saveSrc();
				}
			}));
			os.modalMenu(items, ev.currentTarget || ev.target);
		},

		async chooseAntenna(ev) {
			const antennas = await os.api('antennas/list');
			const items = antennas.map(antenna => ({
				text: antenna.name,
				indicate: antenna.hasUnreadNote,
				action: () => {
					this.antenna = antenna;
					this.src = 'antenna';
					this.saveSrc();
				}
			}));
			os.modalMenu(items, ev.currentTarget || ev.target);
		},

		async chooseChannel(ev) {
			const channels = await os.api('channels/followed');
			const items = channels.map(channel => ({
				text: channel.name,
				indicate: channel.hasUnreadNote,
				action: () => {
					// NOTE: チャンネルタイムラインをこのコンポーネントで表示するようにすると投稿フォームはどうするかなどの問題が生じるのでとりあえずページ遷移で
					//this.channel = channel;
					//this.src = 'channel';
					//this.saveSrc();
					this.$router.push(`/channels/${channel.id}`);
				}
			}));
			os.modalMenu(items, ev.currentTarget || ev.target);
		},

		saveSrc() {
			this.$store.set('tl', {
				src: this.src,
				arg:
					this.src === 'list' ? this.list :
					this.src === 'antenna' ? this.antenna :
					this.channel
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

	> .tabs {
		display: flex;
		box-sizing: border-box;
		padding: 0 8px;
		white-space: nowrap;
		overflow: auto;

		// 影の都合上
		position: relative;

		> .right {
			margin-left: auto;
		}

		> .left, > .right {
			> .tab {
				position: relative;
				height: 50px;
				padding: 0 12px;

				&:hover {
					color: var(--fgHighlighted);
				}

				&.active {
					color: var(--fgHighlighted);

					&:after {
						content: "";
						display: block;
						position: absolute;
						bottom: 0;
						left: 0;
						right: 0;
						margin: 0 auto;
						width: calc(100% - 16px);
						height: 4px;
						background: var(--accent);
						border-radius: 8px 8px 0 0;
					}
				}

				> .i {
					position: absolute;
					top: 16px;
					right: 8px;
					color: var(--indicator);
					font-size: 8px;
					animation: blink 1s infinite;
				}
			}

			> .divider {
				display: inline-block;
				width: 1px;
				height: 28px;
				vertical-align: middle;
				margin: 0 8px;
				background: var(--divider);
			}
		}
	}
}
</style>
