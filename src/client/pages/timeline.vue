<template>
<div class="cmuxhskf" v-hotkey.global="keymap">
	<div class="new" v-if="queue > 0" :style="{ width: width + 'px' }"><button class="_buttonPrimary" @click="top()">{{ $ts.newNoteRecived }}</button></div>

	<div class="_section">
		<XTutorial v-if="$store.reactiveState.tutorial.value != -1" class="tutorial _content _vMargin"/>
		<XPostForm v-if="$store.reactiveState.showFixedPostForm.value" class="post-form _panel _content _vMargin" fixed/>
		<div class="tabs _panel _vMargin">
			<div class="left">
				<button class="_button tab" @click="() => { src = 'home'; saveSrc(); }" :class="{ active: src === 'home' }" v-tooltip="$ts._timelines.home"><Fa :icon="faHome"/></button>
				<button class="_button tab" @click="() => { src = 'local'; saveSrc(); }" :class="{ active: src === 'local' }" v-tooltip="$ts._timelines.local" v-if="isLocalTimelineAvailable"><Fa :icon="faComments"/></button>
				<button class="_button tab" @click="() => { src = 'social'; saveSrc(); }" :class="{ active: src === 'social' }" v-tooltip="$ts._timelines.social" v-if="isLocalTimelineAvailable"><Fa :icon="faShareAlt"/></button>
				<button class="_button tab" @click="() => { src = 'global'; saveSrc(); }" :class="{ active: src === 'global' }" v-tooltip="$ts._timelines.global" v-if="isGlobalTimelineAvailable"><Fa :icon="faGlobe"/></button>
			</div>
			<div class="right">
				<button class="_button tab" @click="chooseChannel" :class="{ active: src === 'channel' }" v-tooltip="$ts.channel"><Fa :icon="faSatelliteDish"/><Fa :icon="faCircle" class="i" v-if="$i.hasUnreadChannel"/></button>
				<button class="_button tab" @click="chooseAntenna" :class="{ active: src === 'antenna' }" v-tooltip="$ts.antennas"><Fa :icon="faSatellite"/><Fa :icon="faCircle" class="i" v-if="$i.hasUnreadAntenna"/></button>
				<button class="_button tab" @click="chooseList" :class="{ active: src === 'list' }" v-tooltip="$ts.lists"><Fa :icon="faListUl"/></button>
				<button class="_button tab" @click="() => { src = 'directs'; saveSrc(); }" :class="{ active: src === 'directs' }" v-tooltip="$ts.directNotes"><Fa :icon="faEnvelope"/><Fa :icon="faCircle" class="i" v-if="$i.hasUnreadSpecifiedNotes"/></button>
				<button class="_button tab" @click="() => { src = 'mentions'; saveSrc(); }" :class="{ active: src === 'mentions' }" v-tooltip="$ts.mentions"><Fa :icon="faAt"/><Fa :icon="faCircle" class="i" v-if="$i.hasUnreadMentions"/></button>
				<button class="_button tab" @click="chooseTl"><Fa :icon="faEllipsisH"/></button>
			</div>
		</div>
		<XTimeline ref="tl"
			class="_content _vMargin"
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
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent, computed } from 'vue';
import { faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe, faListUl, faSatellite, faSatelliteDish, faCircle, faEllipsisH, faPencilAlt, faAt } from '@fortawesome/free-solid-svg-icons';
import { faComments, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import Progress from '@/scripts/loading';
import XTimeline from '@/components/timeline.vue';
import XPostForm from '@/components/post-form.vue';
import { scroll } from '@/scripts/scroll';
import * as os from '@/os';

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
			width: 0,
			INFO: computed(() => ({
				title: this.$ts.timeline,
				icon: this.src === 'local' ? faComments : this.src === 'social' ? faShareAlt : this.src === 'global' ? faGlobe : faHome,
				action: {
					icon: faPencilAlt,
					handler: () => os.post()
				}
			})),
			faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe, faComments, faListUl, faSatellite, faSatelliteDish, faCircle, faEllipsisH, faAt, faEnvelope,
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

	mounted() {
		this.width = this.$el.offsetWidth;
	},

	methods: {
		before() {
			Progress.start();
		},

		after() {
			Progress.done();
		},

		queueUpdated(q) {
			if (this.$el.offsetWidth !== 0) this.width = this.$el.offsetWidth;
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

		focus() {
			(this.$refs.tl as any).focus();
		}
	}
});
</script>

<style lang="scss" scoped>
.cmuxhskf {
	> .new {
		position: fixed;
		z-index: 1000;

		> button {
			display: block;
			margin: var(--margin) auto 0 auto;
			padding: 8px 16px;
			border-radius: 32px;
		}
	}

	> ._section {
		> .tabs {
			display: flex;
			box-sizing: border-box;
			padding: 0 8px;
			max-width: var(--baseContentWidth);
			margin-left: auto;
			margin-right: auto;
			white-space: nowrap;
			overflow: auto;

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
			}
		}
	}
}
</style>
