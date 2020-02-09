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

	<section class="_card tutorial" v-if="tutorial != -1">
		<div class="_title">{{ $t('_tutorial.title') }}</div>
		<div class="_content" v-if="tutorial === 0">
			<div>{{ $t('_tutorial.step1_1') }}</div>
			<div>{{ $t('_tutorial.step1_2') }}</div>
			<div>{{ $t('_tutorial.step1_3') }}</div>
		</div>
		<div class="_content" v-else-if="tutorial === 1">
			<div>{{ $t('_tutorial.step2_1') }}</div>
			<div>{{ $t('_tutorial.step2_2') }}</div>
			<router-link class="_link" to="/my/settings">{{ $t('editProfile') }}</router-link>
		</div>
		<div class="_content" v-else-if="tutorial === 2">
			<div>{{ $t('_tutorial.step3_1') }}</div>
			<div>{{ $t('_tutorial.step3_2') }}</div>
			<div>{{ $t('_tutorial.step3_3') }}</div>
			<small>{{ $t('_tutorial.step3_4') }}</small>
		</div>
		<div class="_content" v-else-if="tutorial === 3">
			<div>{{ $t('_tutorial.step4_1') }}</div>
			<div>{{ $t('_tutorial.step4_2') }}</div>
		</div>
		<div class="_content" v-else-if="tutorial === 4">
			<div>{{ $t('_tutorial.step5_1') }}</div>
			<i18n path="_tutorial.step5_2" tag="div">
				<router-link class="_link" place="featured" to="/featured">{{ $t('featured') }}</router-link>
				<router-link class="_link" place="explore" to="/explore">{{ $t('explore') }}</router-link>
			</i18n>
			<div>{{ $t('_tutorial.step5_3') }}</div>
			<small>{{ $t('_tutorial.step5_4') }}</small>
		</div>
		<div class="_content" v-else-if="tutorial === 5">
			<div>{{ $t('_tutorial.step6_1') }}</div>
			<div>{{ $t('_tutorial.step6_2') }}</div>
			<div>{{ $t('_tutorial.step6_3') }}</div>
		</div>
		<div class="_content" v-else-if="tutorial === 6">
			<div>{{ $t('_tutorial.step7_1') }}</div>
			<i18n path="_tutorial.step7_2" tag="div">
				<router-link class="_link" place="help" to="/docs">{{ $t('help') }}</router-link>
			</i18n>
			<div>{{ $t('_tutorial.step7_3') }}</div>
		</div>
		<div class="_footer navigation">
			<button class="arrow" @click="tutorial--" :disabled="tutorial === 0">
				<fa :icon="faChevronLeft"/>
			</button>
			<span>{{ tutorial + 1 }} / 7</span>
			<button class="arrow" @click="tutorial++" :disabled="tutorial === 6">
				<fa :icon="faChevronRight"/>
			</button>
			<mk-button class="ok" @click="tutorial = -1" primary v-if="tutorial === 6"><fa :icon="faCheck"/> {{ $t('gotIt') }}</mk-button>
			<mk-button class="ok" @click="tutorial++" primary v-else><fa :icon="faCheck"/> {{ $t('next') }}</mk-button>
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
			faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe, faComments, faListUl, faSatellite, faCircle, faChevronLeft, faChevronRight, faCheck
		};
	},

	computed: {
		keymap(): any {
			return {
				't': this.focus
			};
		},
		tutorial: {
			get() { return this.$store.state.settings.tutorial || 0; },
			set(value) { this.$store.dispatch('settings/set', { key: 'tutorial', value }); }
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
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-home {
	.tutorial {
		margin-bottom: var(--margin);

		> ._content {
			> small {
				opacity: 0.7;
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
