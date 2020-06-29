<template>
<div class="mk-deck" v-hotkey.global="keymap">
	<div class="column">
		<keep-alive :include="['index']">
			<router-view></router-view>
		</keep-alive>
	</div>

	<button v-if="$store.getters.isSignedIn" class="post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>

	<stream-indicator v-if="$store.getters.isSignedIn"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faGripVertical, faChevronLeft, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faListUl, faPlus, faUserClock, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer, faInfoCircle, faQuestionCircle, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
import { faBell, faEnvelope, faLaugh, faComments } from '@fortawesome/free-regular-svg-icons';
import { ResizeObserver } from '@juggle/resize-observer';
import { v4 as uuid } from 'uuid';
import { host, instanceName } from './config';
import { search } from './scripts/search';

const DESKTOP_THRESHOLD = 1100;

export default Vue.extend({
	components: {
		XClock: () => import('./components/header-clock.vue').then(m => m.default),
		MkButton: () => import('./components/ui/button.vue').then(m => m.default),
		XDraggable: () => import('vuedraggable'),
	},

	data() {
		return {
			host: host,
			pageKey: 0,
			showNav: false,
			searching: false,
			accounts: [],
			lists: [],
			connection: null,
			searchQuery: '',
			searchWait: false,
			widgetsEditMode: false,
			menuDef: this.$store.getters.nav({
				search: this.search
			}),
			isDesktop: window.innerWidth >= DESKTOP_THRESHOLD,
			canBack: false,
			wallpaper: localStorage.getItem('wallpaper') != null,
			faGripVertical, faChevronLeft, faComments, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faBell, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faEnvelope, faListUl, faPlus, faUserClock, faLaugh, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer, faProjectDiagram
		};
	},

	computed: {
		keymap(): any {
			return {
				'p': this.post,
				'n': this.post,
				's': this.search,
				'h|/': this.help
			};
		},

		widgets(): any[] {
			return this.$store.state.deviceUser.widgets;
		},

		menu(): string[] {
			return this.$store.state.deviceUser.menu;
		},

		otherNavItemIndicated(): boolean {
			if (!this.$store.getters.isSignedIn) return false;
			for (const def in this.menuDef) {
				if (this.menu.includes(def)) continue;
				if (this.menuDef[def].indicated) return true;
			}
			return false;
		},

		navIndicated(): boolean {
			if (!this.$store.getters.isSignedIn) return false;
			for (const def in this.menuDef) {
				if (def === 'timeline') continue;
				if (def === 'notifications') continue;
				if (this.menuDef[def].indicated) return true;
			}
			return false;
		}
	},

	watch:{
		$route(to, from) {
			this.pageKey++;
			this.showNav = false;
			this.canBack = (window.history.length > 0 && !['index'].includes(to.name));
		},
	},

	created() {
		if (this.$store.getters.isSignedIn) {
			this.connection = this.$root.stream.useSharedConnection('main');
			this.connection.on('notification', this.onNotification);

			if (this.widgets.length === 0) {
				this.$store.commit('deviceUser/setWidgets', [{
					name: 'calendar',
					id: 'a', data: {}
				}, {
					name: 'notifications',
					id: 'b', data: {}
				}, {
					name: 'trends',
					id: 'c', data: {}
				}]);
			}
		}
	},

	mounted() {
		const adjustTitlePosition = () => {
			const left = this.$refs.main.getBoundingClientRect().left - this.$refs.nav.offsetWidth;
			if (left >= 0) {
				this.$refs.title.style.left = left + 'px';
			}
		};

		adjustTitlePosition();

		const ro = new ResizeObserver((entries, observer) => {
			adjustTitlePosition();
		});

		ro.observe(this.$refs.contents);

		window.addEventListener('resize', adjustTitlePosition, { passive: true });

		if (!this.isDesktop) {
			window.addEventListener('resize', () => {
				if (window.innerWidth >= DESKTOP_THRESHOLD) this.isDesktop = true;
			}, { passive: true });
		}
	},

	methods: {
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

		post() {
			this.$root.post();
		},

		search() {
			if (this.searching) return;

			this.$root.dialog({
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

		async openAccountMenu(ev) {
			const accounts = (await this.$root.api('users/show', { userIds: this.$store.state.device.accounts.map(x => x.id) })).filter(x => x.id !== this.$store.state.i.id);

			const accountItems = accounts.map(account => ({
				type: 'user',
				user: account,
				action: () => { this.switchAccount(account); }
			}));

			this.$root.menu({
				items: [...[{
					type: 'link',
					text: this.$t('profile'),
					to: `/@${ this.$store.state.i.username }`,
					avatar: this.$store.state.i,
				}, {
					type: 'link',
					text: this.$t('accountSettings'),
					to: '/my/settings',
					icon: faCog,
				}, null, ...accountItems, {
					icon: faPlus,
					text: this.$t('addAcount'),
					action: () => {
						this.$root.menu({
							items: [{
								text: this.$t('existingAcount'),
								action: () => { this.addAcount(); },
							}, {
								text: this.$t('createAccount'),
								action: () => { this.createAccount(); },
							}],
							align: 'left',
							fixed: true,
							width: 240,
							source: ev.currentTarget || ev.target,
						});
					},
				}]],
				align: 'left',
				fixed: true,
				width: 240,
				source: ev.currentTarget || ev.target,
			});
		},

		oepnInstanceMenu(ev) {
			this.$root.menu({
				items: [{
					type: 'link',
					text: this.$t('dashboard'),
					to: '/instance',
					icon: faTachometerAlt,
				}, null, {
					type: 'link',
					text: this.$t('settings'),
					to: '/instance/settings',
					icon: faCog,
				}, {
					type: 'link',
					text: this.$t('customEmojis'),
					to: '/instance/emojis',
					icon: faLaugh,
				}, {
					type: 'link',
					text: this.$t('users'),
					to: '/instance/users',
					icon: faUsers,
				}, {
					type: 'link',
					text: this.$t('files'),
					to: '/instance/files',
					icon: faCloud,
				}, {
					type: 'link',
					text: this.$t('jobQueue'),
					to: '/instance/queue',
					icon: faExchangeAlt,
				}, {
					type: 'link',
					text: this.$t('federation'),
					to: '/instance/federation',
					icon: faGlobe,
				}, {
					type: 'link',
					text: this.$t('relays'),
					to: '/instance/relays',
					icon: faProjectDiagram,
				}, {
					type: 'link',
					text: this.$t('announcements'),
					to: '/instance/announcements',
					icon: faBroadcastTower,
				}],
				align: 'left',
				fixed: true,
				width: 200,
				source: ev.currentTarget || ev.target,
			});
		},

		more(ev) {
			const items = Object.keys(this.menuDef).filter(k => !this.menu.includes(k)).map(k => this.menuDef[k]).filter(def => def.show == null ? true : def.show).map(def => ({
				type: def.to ? 'link' : 'button',
				text: this.$t(def.title),
				icon: def.icon,
				to: def.to,
				action: def.action,
				indicate: def.indicated,
			}));
			this.$root.menu({
				items: [...items, null, {
					type: 'link',
					text: this.$t('help'),
					to: '/docs',
					icon: faQuestionCircle,
				}, {
					type: 'link',
					text: this.$t('aboutX', { x: instanceName || host }),
					to: '/about',
					icon: faInfoCircle,
				}, {
					type: 'link',
					text: this.$t('aboutMisskey'),
					to: '/about-misskey',
					icon: faInfoCircle,
				}],
				align: 'left',
				fixed: true,
				width: 200,
				source: ev.currentTarget || ev.target,
			});
		},

		async addAcount() {
			this.$root.new(await import('./components/signin-dialog.vue').then(m => m.default)).$once('login', res => {
				this.$store.dispatch('addAcount', res);
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			});
		},

		async createAccount() {
			this.$root.new(await import('./components/signup-dialog.vue').then(m => m.default)).$once('signup', res => {
				this.$store.dispatch('addAcount', res);
				this.switchAccountWithToken(res.i);
			});
		},

		async switchAccount(account: any) {
			const token = this.$store.state.device.accounts.find((x: any) => x.id === account.id).token;
			this.switchAccountWithToken(token);
		},

		switchAccountWithToken(token: string) {
			this.$root.dialog({
				type: 'waiting',
				iconOnly: true
			});

			this.$root.api('i', {}, token).then((i: any) => {
				this.$store.dispatch('switchAccount', {
					...i,
					token: token
				}).then(() => {
					this.$nextTick(() => {
						location.reload();
					});
				});
			});
		},

		async onNotification(notification) {
			if (document.visibilityState === 'visible') {
				this.$root.stream.send('readNotification', {
					id: notification.id
				});

				this.$root.new(await import('./components/toast.vue').then(m => m.default), {
					notification
				});
			}

			this.$root.sound('notification');
		},

		widgetFunc(id) {
			const w = this.$refs[id][0];
			if (w.func) w.func();
		},

		onWidgetSort() {
			this.saveHome();
		},

		addWidget(ev) {
			const widgets = [
				'memo',
				'notifications',
				'timeline',
				'calendar',
				'rss',
				'trends',
				'clock',
				'activity',
				'photos',
			];

			this.$root.menu({
				items: widgets.map(widget => ({
					text: this.$t('_widgets.' + widget),
					action: () => {
						this.$store.commit('deviceUser/addWidget', {
							name: widget,
							id: uuid(),
							data: {}
						});
					}
				})),
				source: ev.currentTarget || ev.target,
			});
		},

		removeWidget(widget) {
			this.$store.commit('deviceUser/removeWidget', widget);
		},

		saveHome() {
			this.$store.commit('deviceUser/setWidgets', this.widgets);
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-deck {
	padding: 16px;

	> .column {
		width: 300px;
		height: 100vh;
		overflow: auto;
	}
}
</style>
