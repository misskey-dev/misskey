<template>
<div class="mk-home" v-hotkey.global="keymap">
	<portal to="header" v-if="showTitle">
		<button @click="choose" class="_button _kjvfvyph_">
			<i><fa v-if="$store.state.i.hasUnreadAntenna" :icon="faCircle"/></i>
			<fa v-if="src === 'home'" :icon="faHome"/>
			<fa v-if="src === 'local'" :icon="faComments"/>
			<fa v-if="src === 'social'" :icon="faShareAlt"/>
			<fa v-if="src === 'global'" :icon="faGlobe"/>
			<fa v-if="src === 'list'" :icon="faListUl"/>
			<fa v-if="src === 'antenna'" :icon="faSatellite"/>
			<span style="margin-left: 8px;">{{ src === 'list' ? list.name : src === 'antenna' ? antenna.name : $t('_timelines.' + src) }}</span>
			<fa :icon="menuOpened ? faAngleUp : faAngleDown" style="margin-left: 8px;"/>
		</button>
	</portal>
	<section class="_card announcements" v-if="$store.getters.isSignedIn && announcements.length > 0">
		<div class="_title">{{ currentAnnouncement.title }}</div>
		<div class="_content">
			<mfm :text="currentAnnouncement.text"/>
			<img v-if="currentAnnouncement.imageUrl" :src="currentAnnouncement.imageUrl" alt=""/>
		</div>
		<div class="_footer navigation">
			<button class="arrow" @click="currentAnnouncementIndex--" :disabled="currentAnnouncementIndex == 0">
				<fa :icon="faChevronLeft"/>
			</button>
			<span>{{ currentAnnouncementIndex + 1 }} / {{ announcements.length }}</span>
			<button class="arrow" @click="currentAnnouncementIndex++" :disabled="currentAnnouncementIndex == announcements.length - 1">
				<fa :icon="faChevronRight"/>
			</button>
			<mk-button class="ok" @click="read(currentAnnouncement)" primary><fa :icon="faCheck"/> {{ $t('gotIt') }}</mk-button>
		</div>
	</section>
	<x-timeline ref="tl" :key="src === 'list' ? `list:${list.id}` : src === 'antenna' ? `antenna:${antenna.id}` : src" :src="src" :list="list" :antenna="antenna" @before="before()" @after="after()"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe, faListUl, faSatellite, faCircle, faChevronLeft, faChevronRight, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faComments } from '@fortawesome/free-regular-svg-icons';
import Progress from '../scripts/loading';
import XTimeline from '../components/timeline.vue';
import MkButton from '../components/ui/button.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('timeline') as string
		};
	},

	components: {
		XTimeline,
		MkButton,
	},

	props: {
		showTitle: {
			type: Boolean,
			required: true
		}
	},

	data() {
		return {
			src: 'home',
			list: null,
			antenna: null,
			menuOpened: false,
			announcements: [] as any[],
			currentAnnouncementIndex: 0,
			faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe, faComments, faListUl, faSatellite, faCircle, faChevronLeft, faChevronRight, faCheck
		};
	},

	computed: {
		keymap(): any {
			return {
				't': this.focus
			};
		},
		currentAnnouncement() {
			if (this.announcements.length > 0) {
				if (this.currentAnnouncementIndex < 0)
					this.currentAnnouncementIndex = 0;
				if (this.currentAnnouncementIndex >= this.announcements.length)
					this.currentAnnouncementIndex = this.announcements.length - 1;
				
				return this.announcements[this.currentAnnouncementIndex];
			}
			return null;
		}
	},

	watch: {
		src() {
			this.showNav = false;
			this.saveSrc();
		},
		list(x) {
			this.showNav = false;
			this.saveSrc();
			if (x != null) this.antenna = null;
		},
		antenna(x) {
			this.showNav = false;
			this.saveSrc();
			if (x != null) this.list = null;
		},
	},

	created() {
		this.$root.getMeta().then((meta: Record<string, any>) => {
			if (!(
				this.enableGlobalTimeline = !meta.disableGlobalTimeline || this.$store.state.i.isModerator || this.$store.state.i.isAdmin
			) && this.src === 'global') this.src = 'local';
			if (!(
				this.enableLocalTimeline = !meta.disableLocalTimeline || this.$store.state.i.isModerator || this.$store.state.i.isAdmin
			) && ['local', 'social'].includes(this.src)) this.src = 'home';
		});
		if (this.$store.state.device.tl) {
			this.src = this.$store.state.device.tl.src;
			if (this.src === 'list') {
				this.list = this.$store.state.device.tl.arg;
			} else if (this.src === 'antenna') {
				this.antenna = this.$store.state.device.tl.arg;
			}
		}
	},

	activated() {
		this.$root.api('announcements', { limit: 100, withUnreads: true }).then((a: any) => {
			this.announcements = a
		});
	}

	methods: {
		before() {
			Progress.start();
		},

		after() {
			Progress.done();
		},

		async choose(ev) {
			this.menuOpened = true;
			const [antennas, lists] = await Promise.all([
				this.$root.api('antennas/list'),
				this.$root.api('users/lists/list')
			]);
			const antennaItems = antennas.map(antenna => ({
				text: antenna.name,
				icon: faSatellite,
				indicate: antenna.hasUnreadNote,
				action: () => {
					this.antenna = antenna;
					this.setSrc('antenna');
				}
			}));
			const listItems = lists.map(list => ({
				text: list.name,
				icon: faListUl,
				action: () => {
					this.list = list;
					this.setSrc('list');
				}
			}));
			this.$root.menu({
				items: [{
					text: this.$t('_timelines.home'),
					icon: faHome,
					action: () => { this.setSrc('home') }
				}, {
					text: this.$t('_timelines.local'),
					icon: faComments,
					action: () => { this.setSrc('local') }
				}, {
					text: this.$t('_timelines.social'),
					icon: faShareAlt,
					action: () => { this.setSrc('social') }
				}, {
					text: this.$t('_timelines.global'),
					icon: faGlobe,
					action: () => { this.setSrc('global') }
				}, antennaItems.length > 0 ? null : undefined, ...antennaItems, listItems.length > 0 ? null : undefined, ...listItems],
				fixed: true,
				noCenter: true,
				source: ev.currentTarget || ev.target
			}).then(() => {
				this.menuOpened = false;
			});
		},

		setSrc(src) {
			this.src = src;
		},

		saveSrc() {
			this.$store.commit('device/setTl', {
				src: this.src,
				arg: this.src == 'list' ? this.list : this.antenna
			});
		},

		focus() {
			(this.$refs.tl as any).focus();
		},

		read(announcement: any) {
			this.announcements = this.announcements.filter(a => a != announcement)
			this.$root.api('i/read-announcement', { announcementId: announcement.id });
		},
	}
});
</script>

<style lang="scss" scoped>

.announcements {
	margin-bottom: 8px;

	> ._content {
		> img {
			display: block;
			max-height: 300px;
			max-width: 100%;
		}
	}

	> .navigation {
		display: flex;
		flex-direction: row;
		align-items: baseline;
		font-size: 18px;

		> .arrow {
			color: var(--fg);
			background: none;
			border: none;
			font-size: inherit;

			&:disabled {
				opacity: 0.6;
			}
		}

		> .ok {
			margin-left: auto;
		}
	}
}

._kjvfvyph_ {
	position: relative;
	height: 100%;
	padding: 0 16px;
	font-weight: bold;

	> i {
		position: absolute;
		top: 16px;
		right: 8px;
		color: var(--accent);
		font-size: 12px;
		animation: blink 1s infinite;
	}
}
</style>
