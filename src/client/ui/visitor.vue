<template>
<div class="mk-app">
	<header>
		<router-link to="">foo</router-link>
		<router-link to="">foo</router-link>
		<router-link to="">foo</router-link>
	</header>

	<div class="banner" :style="{ backgroundImage: `url(${ $store.state.instance.meta.bannerUrl })` }"></div>

	<div class="contents" ref="contents" :class="{ wallpaper }">
		<header class="header" ref="header">
			<transition :name="$store.state.device.animation ? 'header' : ''" mode="out-in" appear>
				<button class="_button back" v-if="canBack" @click="back()"><Fa :icon="faChevronLeft"/></button>
			</transition>
			<template v-if="pageInfo">
				<div class="titleContainer">
					<div class="title" v-for="header in pageInfo.header" :key="header.id" :class="{ _button: header.onClick, selected: header.selected }" @click="header.onClick" v-tooltip="header.tooltip">
						<Fa v-if="header.icon" :icon="header.icon" class="icon"/>
						<MkAvatar v-else-if="header.avatar" class="avatar" :user="header.avatar" :disable-preview="true"/>
						<span v-if="header.title" class="text">{{ header.title }}</span>
						<MkUserName v-else-if="header.userName" :user="header.userName" :nowrap="false" class="text"/>
					</div>
				</div>
				<button class="_button action" v-if="pageInfo.action" @click="pageInfo.action.handler"><Fa :icon="pageInfo.action.icon"/></button>
			</template>
		</header>
		<main ref="main">
			<div class="content">
				<router-view v-slot="{ Component }">
					<transition :name="$store.state.device.animation ? 'page' : ''" mode="out-in" @enter="onTransition">
						<keep-alive :include="['index']">
							<component :is="Component" :ref="changePage"/>
						</keep-alive>
					</transition>
				</router-view>
			</div>
			<div class="powerd-by" :class="{ visible: !$store.getters.isSignedIn }">
				<b><router-link to="/">{{ host }}</router-link></b>
				<small>Powered by <a href="https://github.com/syuilo/misskey" target="_blank">Misskey</a></small>
			</div>
		</main>
	</div>

	<StreamIndicator v-if="$store.getters.isSignedIn"/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { faGripVertical, faChevronLeft, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faListUl, faPlus, faUserClock, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer, faInfoCircle, faQuestionCircle, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
import { faBell, faEnvelope, faLaugh, faComments } from '@fortawesome/free-regular-svg-icons';
import { host } from '@/config';
import { search } from '@/scripts/search';
import * as os from '@/os';

const DESKTOP_THRESHOLD = 1100;

export default defineComponent({
	components: {
		MkButton: defineAsyncComponent(() => import('@/components/ui/button.vue')),
	},

	data() {
		return {
			host: host,
			pageKey: 0,
			pageInfo: null,
			searching: false,
			connection: null,
			searchQuery: '',
			searchWait: false,
			isDesktop: window.innerWidth >= DESKTOP_THRESHOLD,
			canBack: false,
			faGripVertical, faChevronLeft, faComments, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faBell, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faEnvelope, faListUl, faPlus, faUserClock, faLaugh, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer, faProjectDiagram
		};
	},

	computed: {
		keymap(): any {
			return {
				'd': () => {
					if (this.$store.state.device.syncDeviceDarkMode) return;
					this.$store.commit('device/set', { key: 'darkMode', value: !this.$store.state.device.darkMode });
				},
				'p': this.post,
				'n': this.post,
				's': this.search,
				'h|/': this.help
			};
		},
	},

	watch: {
		$route(to, from) {
			this.pageKey++;
			this.canBack = (window.history.length > 0 && !['index'].includes(to.name));
		},
	},

	created() {
		document.documentElement.style.overflowY = 'scroll';
	},

	mounted() {
		if (!this.isDesktop) {
			window.addEventListener('resize', () => {
				if (window.innerWidth >= DESKTOP_THRESHOLD) this.isDesktop = true;
			}, { passive: true });
		}
	},

	methods: {
		async changePage(page) {
			if (page == null) return;
			if (page.info) {
				this.pageInfo = page.info;
			}
		},

		top() {
			window.scroll({ top: 0, behavior: 'smooth' });
		},

		help() {
			this.$router.push('/docs/keyboard-shortcut');
		},

		back() {
			if (this.canBack) window.history.back();
		},

		onTransition() {
			if (window._scroll) window._scroll();
		},

		search() {
			if (this.searching) return;

			os.dialog({
				title: this.$t('search'),
				input: true
			}).then(async ({ canceled, result: query }) => {
				if (canceled || query == null || query === '') return;

				this.searching = true;
				search(this, query).finally(() => {
					this.searching = false;
				});
			});
		},

		searchKeypress(e) {
			if (e.keyCode === 13) {
				this.searchWait = true;
				search(this, this.searchQuery).finally(() => {
					this.searchWait = false;
					this.searchQuery = '';
				});
			}
		},
	}
});
</script>

<style lang="scss" scoped>
.mk-app {
	> header {
		background: var(--panel);
	}

	> .banner {
		width: 100%;
		height: 200px;
		background-size: cover;
		background-position: center;
	}

	> .contents {
		max-width: 1300px;
		margin: 0 auto;
	}
}
</style>

<style lang="scss">
</style>
