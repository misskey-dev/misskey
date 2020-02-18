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

	<x-tutorial class="tutorial" v-if="$store.state.settings.tutorial != -1"/>

	<div style="position: relative" v-if="$store.state.device.showFixedPostForm">
		<x-post-form class="post-form" fixed />
	</div>
	<x-timeline ref="tl" :key="src === 'list' ? `list:${list.id}` : src === 'antenna' ? `antenna:${antenna.id}` : src" :src="src" :list="list" :antenna="antenna" @before="before()" @after="after()"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe, faListUl, faSatellite, faCircle } from '@fortawesome/free-solid-svg-icons';
import { faComments } from '@fortawesome/free-regular-svg-icons';
import Progress from '../scripts/loading';
import XTimeline from '../components/timeline.vue';
import XTutorial from './index.home.tutorial.vue';
import XPostForm from '../components/post-form.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('timeline') as string
		};
	},

	components: {
		XTimeline,
		XTutorial,
		XPostForm,
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
			faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe, faComments, faListUl, faSatellite, faCircle
		};
	},

	computed: {
		keymap(): any {
			return {
				't': this.focus
			};
		},
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
		this.src = this.$store.state.deviceUser.tl.src;
		if (this.src === 'list') {
			this.list = this.$store.state.deviceUser.tl.arg;
		} else if (this.src === 'antenna') {
			this.antenna = this.$store.state.deviceUser.tl.arg;
		}
	},

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
			this.$store.commit('deviceUser/setTl', {
				src: this.src,
				arg: this.src == 'list' ? this.list : this.antenna
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
	> .tutorial {
		margin-bottom: var(--margin);
	}
}

.post-form {
	margin-bottom: 8px;
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
		color: var(--indicator);
		font-size: 12px;
		animation: blink 1s infinite;
	}
}
</style>
