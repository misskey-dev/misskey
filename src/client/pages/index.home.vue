<template>
<div class="mk-home">
	<portal to="header">
		<button @click="choose" class="_button _kjvfvyph_">
			<fa v-if="src === 'home'" :icon="faHome"/>
			<fa v-if="src === 'local'" :icon="faComments"/>
			<fa v-if="src === 'social'" :icon="faShareAlt"/>
			<fa v-if="src === 'global'" :icon="faGlobe"/>
			<span style="margin-left: 8px;">{{ $t('_timelines.' + src) }}</span>
			<fa :icon="menuOpened ? faAngleUp : faAngleDown" style="margin-left: 8px;"/>
		</button>
	</portal>
	<x-home-timeline :key="src" :src="src" @before="before()" @after="after()"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe, faListUl } from '@fortawesome/free-solid-svg-icons';
import { faComments } from '@fortawesome/free-regular-svg-icons';
import Progress from '../scripts/loading';
import XHomeTimeline from './index.home.timeline.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('timeline') as string
		};
	},

	components: {
		XHomeTimeline
	},

	data() {
		return {
			src: 'home',
			list: null,
			menuOpened: false,
			faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe, faComments
		};
	},

	watch: {
		src() {
			this.showNav = false;
			this.saveSrc();
		},
		list(x) {
			this.showNav = false;
			this.saveSrc();
			if (x != null) this.tagTl = null;
		},
		tagTl(x) {
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
			) && ['local', 'hybrid'].includes(this.src)) this.src = 'home';
		});
		if (this.$store.state.device.tl) {
			this.src = this.$store.state.device.tl.src;
			if (this.src == 'list') {
				this.list = this.$store.state.device.tl.arg;
			} else if (this.src == 'tag') {
				this.tagTl = this.$store.state.device.tl.arg;
			}
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
			const lists = await this.$root.api('users/lists/list');
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
				}, listItems.length > 0 ? null : undefined, ...listItems],
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
				arg: this.src == 'list' ? this.list : this.tagTl
			});
		},
	}
});
</script>

<style lang="scss">
@import '../theme';

._kjvfvyph_ {
	height: 100%;
	padding: 0 16px;
	font-weight: bold;
}
</style>
