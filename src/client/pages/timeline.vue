<template>
<div class="mk-home" v-hotkey.global="keymap">
	<div class="new" v-if="queue > 0" :style="{ width: width + 'px' }"><button class="_buttonPrimary" @click="top()">{{ $t('newNoteRecived') }}</button></div>

	<XTutorial class="tutorial" v-if="$store.state.settings.tutorial != -1"/>

	<div class="_section" v-if="$store.state.device.showFixedPostForm">
		<XPostForm class="post-form _content _panel" fixed/>
	</div>

	<div class="_section">
		<XTimeline class="_content" ref="tl" :key="src === 'list' ? `list:${list.id}` : src === 'antenna' ? `antenna:${antenna.id}` : src === 'channel' ? `channel:${channel.id}` : src" :src="src" :list="list ? list.id : null" :antenna="antenna ? antenna.id : null" :channel="channel ? channel.id : null" :sound="true" @before="before()" @after="after()" @queue="queueUpdated"/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent, computed } from 'vue';
import { faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe, faListUl, faSatellite, faSatelliteDish, faCircle, faEllipsisH, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faComments } from '@fortawesome/free-regular-svg-icons';
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
			INFO: {
				header: [{
					id: 'home',
					title: null,
					tooltip: this.$t('_timelines.home'),
					icon: faHome,
					onClick: () => { this.src = 'home'; this.saveSrc(); },
					selected: computed(() => this.src === 'home')
				}, {
					id: 'local',
					title: null,
					tooltip: this.$t('_timelines.local'),
					icon: faComments,
					onClick: () => { this.src = 'local'; this.saveSrc(); },
					selected: computed(() => this.src === 'local')
				}, {
					id: 'social',
					title: null,
					tooltip: this.$t('_timelines.social'),
					icon: faShareAlt,
					onClick: () => { this.src = 'social'; this.saveSrc(); },
					selected: computed(() => this.src === 'social')
				}, {
					id: 'global',
					title: null,
					tooltip: this.$t('_timelines.global'),
					icon: faGlobe,
					onClick: () => { this.src = 'global'; this.saveSrc(); },
					selected: computed(() => this.src === 'global')
				}, {
					id: 'other',
					title: null,
					icon: faEllipsisH,
					onClick: this.choose,
					indicate: computed(() => this.$store.state.i.hasUnreadAntenna || this.$store.state.i.hasUnreadChannel)
				}],
				action: {
					icon: faPencilAlt,
					handler: () => os.post()
				}
			},
			faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe, faComments, faListUl, faSatellite, faSatelliteDish, faCircle
		};
	},

	computed: {
		keymap(): any {
			return {
				't': this.focus
			};
		},

		meta() {
			return this.$store.state.instance.meta;
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
		this.src = this.$store.state.deviceUser.tl.src;
		if (this.src === 'list') {
			this.list = this.$store.state.deviceUser.tl.arg;
		} else if (this.src === 'antenna') {
			this.antenna = this.$store.state.deviceUser.tl.arg;
		} else if (this.src === 'channel') {
			this.channel = this.$store.state.deviceUser.tl.arg;
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

		async choose(ev) {
			if (this.meta == null) return;
			const [antennas, lists, channels] = await Promise.all([
				os.api('antennas/list'),
				os.api('users/lists/list'),
				os.api('channels/followed'),
			]);
			const antennaItems = antennas.map(antenna => ({
				text: antenna.name,
				icon: faSatellite,
				indicate: antenna.hasUnreadNote,
				action: () => {
					this.antenna = antenna;
					this.src = 'antenna';
					this.saveSrc();
				}
			}));
			const listItems = lists.map(list => ({
				text: list.name,
				icon: faListUl,
				action: () => {
					this.list = list;
					this.src = 'list';
					this.saveSrc();
				}
			}));
			const channelItems = channels.map(channel => ({
				text: channel.name,
				icon: faSatelliteDish,
				indicate: channel.hasUnreadNote,
				action: () => {
					// NOTE: チャンネルタイムラインをこのコンポーネントで表示するようにすると投稿フォームはどうするかなどの問題が生じるのでとりあえずページ遷移で
					//this.channel = channel;
					//this.src = 'channel';
					//this.saveSrc();
					this.$router.push(`/channels/${channel.id}`);
				}
			}));
			os.menu({
				items: [...antennaItems, listItems.length > 0 ? null : undefined, ...listItems, channelItems.length > 0 ? null : undefined, ...channelItems],
				fixed: true,
				noCenter: true,
			}, {
				source: ev.currentTarget || ev.target,
			});
		},

		saveSrc() {
			this.$store.commit('deviceUser/setTl', {
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
.mk-home {
	> .new {
		position: fixed;
		z-index: 1000;

		> button {
			display: block;
			margin: 0 auto;
			padding: 8px 16px;
			border-radius: 32px;
		}
	}

	> .tutorial {
		margin-bottom: var(--margin);
	}

	> .post-form {
		position: relative;
		margin-bottom: var(--margin);
	}
}

._kjvfvyph_ {
	position: relative;
	height: 100%;
	padding: 0 16px;
	font-weight: bold;

	> i {
		position: absolute;
		top: initial;
		right: 8px;
		color: var(--indicator);
		font-size: 12px;
		animation: blink 1s infinite;
	}
}
</style>
