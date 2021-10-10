<template>
<div class="mk-app" @contextmenu.self.prevent="onContextmenu">
	<XSidebar ref="menu" class="menu" :default-hidden="true"/>

	<div class="nav">
		<header class="header">
			<div class="left">
				<button class="_button account" @click="openAccountMenu">
					<MkAvatar :user="$i" class="avatar"/><!--<MkAcct class="text" :user="$i"/>-->
				</button>
			</div>
			<div class="right">
				<MkA class="item" to="/my/messaging" v-tooltip="$ts.messaging"><i class="fas fa-comments icon"></i><span v-if="$i.hasUnreadMessagingMessage" class="indicator"><i class="fas fa-circle"></i></span></MkA>
				<MkA class="item" to="/my/messages" v-tooltip="$ts.directNotes"><i class="fas fa-envelope icon"></i><span v-if="$i.hasUnreadSpecifiedNotes" class="indicator"><i class="fas fa-circle"></i></span></MkA>
				<MkA class="item" to="/my/mentions" v-tooltip="$ts.mentions"><i class="fas fa-at icon"></i><span v-if="$i.hasUnreadMentions" class="indicator"><i class="fas fa-circle"></i></span></MkA>
				<MkA class="item" to="/my/notifications" v-tooltip="$ts.notifications"><i class="fas fa-bell icon"></i><span v-if="$i.hasUnreadNotification" class="indicator"><i class="fas fa-circle"></i></span></MkA>
			</div>
		</header>
		<div class="body">
			<div class="container">
				<div class="header">{{ $ts.timeline }}</div>
				<div class="body">
					<MkA to="/timeline/home" class="item" :class="{ active: tl === 'home' }"><i class="fas fa-home icon"></i>{{ $ts._timelines.home }}</MkA>
					<MkA to="/timeline/local" class="item" :class="{ active: tl === 'local' }"><i class="fas fa-comments icon"></i>{{ $ts._timelines.local }}</MkA>
					<MkA to="/timeline/social" class="item" :class="{ active: tl === 'social' }"><i class="fas fa-share-alt icon"></i>{{ $ts._timelines.social }}</MkA>
					<MkA to="/timeline/global" class="item" :class="{ active: tl === 'global' }"><i class="fas fa-globe icon"></i>{{ $ts._timelines.global }}</MkA>
				</div>
			</div>
			<div class="container" v-if="followedChannels">
				<div class="header">{{ $ts.channel }} ({{ $ts.following }})<button class="_button add" @click="addChannel"><i class="fas fa-plus"></i></button></div>
				<div class="body">
					<MkA v-for="channel in followedChannels" :key="channel.id" :to="`/channels/${ channel.id }`" class="item" :class="{ active: tl === `channel:${ channel.id }`, read: !channel.hasUnreadNote }"><i class="fas fa-satellite-dish icon"></i>{{ channel.name }}</MkA>
				</div>
			</div>
			<div class="container" v-if="featuredChannels">
				<div class="header">{{ $ts.channel }}<button class="_button add" @click="addChannel"><i class="fas fa-plus"></i></button></div>
				<div class="body">
					<MkA v-for="channel in featuredChannels" :key="channel.id" :to="`/channels/${ channel.id }`" class="item" :class="{ active: tl === `channel:${ channel.id }` }"><i class="fas fa-satellite-dish icon"></i>{{ channel.name }}</MkA>
				</div>
			</div>
			<div class="container" v-if="lists">
				<div class="header">{{ $ts.lists }}<button class="_button add" @click="addList"><i class="fas fa-plus"></i></button></div>
				<div class="body">
					<MkA v-for="list in lists" :key="list.id" :to="`/my/list/${ list.id }`" class="item" :class="{ active: tl === `list:${ list.id }` }"><i class="fas fa-list-ul icon"></i>{{ list.name }}</MkA>
				</div>
			</div>
			<div class="container" v-if="antennas">
				<div class="header">{{ $ts.antennas }}<button class="_button add" @click="addAntenna"><i class="fas fa-plus"></i></button></div>
				<div class="body">
					<MkA v-for="antenna in antennas" :key="antenna.id" :to="`/my/antenna/${ antenna.id }`" class="item" :class="{ active: tl === `antenna:${ antenna.id }` }"><i class="fas fa-satellite icon"></i>{{ antenna.name }}</MkA>
				</div>
			</div>
			<div class="container">
				<div class="body">
					<MkA to="/my/favorites" class="item"><i class="fas fa-star icon"></i>{{ $ts.favorites }}</MkA>
				</div>
			</div>
			<MkAd class="a" :prefer="['square']"/>
		</div>
		<footer class="footer">
			<div class="left">
				<button class="_button menu" @click="showMenu">
					<i class="fas fa-bars icon"></i>
				</button>
			</div>
			<div class="right">
				<button class="_button item search" @click="search" v-tooltip="$ts.search">
					<i class="fas fa-search icon"></i>
				</button>
				<MkA class="item" to="/settings" v-tooltip="$ts.settings"><i class="fas fa-cog icon"></i></MkA>
			</div>
		</footer>
	</div>

	<main class="main" @contextmenu.stop="onContextmenu">
		<header class="header">
			<MkHeader class="header" :info="pageInfo" :menu="menu" :center="false" @click="onHeaderClick"/>
		</header>
		<router-view v-slot="{ Component }">
			<transition :name="$store.state.animation ? 'page' : ''" mode="out-in" @enter="onTransition">
				<keep-alive :include="['timeline']">
					<component :is="Component" :ref="changePage" class="body"/>
				</keep-alive>
			</transition>
		</router-view>
	</main>

	<XSide class="side" ref="side" @open="sideViewOpening = true" @close="sideViewOpening = false"/>
	<div class="side widgets" :class="{ sideViewOpening }">
		<XWidgets/>
	</div>

	<XCommon/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { instanceName, url } from '@client/config';
import XSidebar from '@client/ui/_common_/sidebar.vue';
import XWidgets from './widgets.vue';
import XCommon from '../_common_/common.vue';
import XSide from './side.vue';
import XHeaderClock from './header-clock.vue';
import * as os from '@client/os';
import { router } from '@client/router';
import { menuDef } from '@client/menu';
import { search } from '@client/scripts/search';
import copyToClipboard from '@client/scripts/copy-to-clipboard';
import { store } from './store';
import * as symbols from '@client/symbols';
import { openAccountMenu } from '@client/account';

export default defineComponent({
	components: {
		XCommon,
		XSidebar,
		XWidgets,
		XSide, // NOTE: dynamic importするとAsyncComponentWrapperが間に入るせいでref取得できなくて面倒になる
		XHeaderClock,
	},

	provide() {
		return {
			sideViewHook: (path) => {
				this.$refs.side.navigate(path);
			}
		};
	},

	data() {
		return {
			pageInfo: null,
			lists: null,
			antennas: null,
			followedChannels: null,
			featuredChannels: null,
			currentChannel: null,
			menuDef: menuDef,
			sideViewOpening: false,
			instanceName,
		};
	},

	computed: {
		menu() {
			return [{
				icon: 'fas fa-columns',
				text: this.$ts.openInSideView,
				action: () => {
					this.$refs.side.navigate(this.$route.path);
				}
			}, {
				icon: 'fas fa-window-maximize',
				text: this.$ts.openInWindow,
				action: () => {
					os.pageWindow(this.$route.path);
				}
			}];
		}
	},

	created() {
		if (window.innerWidth < 1024) {
			localStorage.setItem('ui', 'default');
			location.reload();
		}

		os.api('users/lists/list').then(lists => {
			this.lists = lists;
		});

		os.api('antennas/list').then(antennas => {
			this.antennas = antennas;
		});

		os.api('channels/followed', { limit: 20 }).then(channels => {
			this.followedChannels = channels;
		});

		// TODO: pagination
		os.api('channels/featured', { limit: 20 }).then(channels => {
			this.featuredChannels = channels;
		});
	},

	methods: {
		changePage(page) {
			console.log(page);
			if (page == null) return;
			if (page[symbols.PAGE_INFO]) {
				this.pageInfo = page[symbols.PAGE_INFO];
				document.title = `${this.pageInfo.title} | ${instanceName}`;
			}
		},

		onTransition() {
			if (window._scroll) window._scroll();
		},

		showMenu() {
			this.$refs.menu.show();
		},

		post() {
			os.post();
		},

		search() {
			search();
		},

		back() {
			history.back();
		},

		top() {
			window.scroll({ top: 0, behavior: 'smooth' });
		},

		onTransition() {
			if (window._scroll) window._scroll();
		},

		onHeaderClick() {
			window.scroll({ top: 0, behavior: 'smooth' });
		},

		onContextmenu(e) {
			const isLink = (el: HTMLElement) => {
				if (el.tagName === 'A') return true;
				if (el.parentElement) {
					return isLink(el.parentElement);
				}
			};
			if (isLink(e.target)) return;
			if (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes(e.target.tagName) || e.target.attributes['contenteditable']) return;
			if (window.getSelection().toString() !== '') return;
			const path = this.$route.path;
			os.contextMenu([{
				type: 'label',
				text: path,
			}, {
				icon: 'fas fa-columns',
				text: this.$ts.openInSideView,
				action: () => {
					this.$refs.side.navigate(path);
				}
			}, {
				icon: 'fas fa-window-maximize',
				text: this.$ts.openInWindow,
				action: () => {
					os.pageWindow(path);
				}
			}], e);
		},

		openAccountMenu,
	}
});
</script>

<style lang="scss" scoped>
.mk-app {
	$header-height: 54px; // TODO: どこかに集約したい
	$ui-font-size: 1em; // TODO: どこかに集約したい

	// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
	height: calc(var(--vh, 1vh) * 100);
	display: flex;

	> .nav {
		display: flex;
		flex-direction: column;
		width: 250px;
		height: 100vh;
		border-right: solid 4px var(--divider);

		> .header, > .footer {
			$padding: 8px;
			display: flex;
			align-items: center;
			z-index: 1000;
			height: $header-height;
			padding: $padding;
			box-sizing: border-box;
			user-select: none;

			&.header {
				border-bottom: solid 0.5px var(--divider);
			}

			&.footer {
				border-top: solid 0.5px var(--divider);
			}

			> .left, > .right {
				> .item, > .menu {
					display: inline-flex;
					vertical-align: middle;
					height: ($header-height - ($padding * 2));
					width: ($header-height - ($padding * 2));
					box-sizing: border-box;
					//opacity: 0.6;
					position: relative;
					border-radius: 5px;

					&:hover {
						background: rgba(0, 0, 0, 0.05);
					}

					> .icon {
						margin: auto;
					}

					> .indicator {
						position: absolute;
						top: 8px;
						right: 8px;
						color: var(--indicator);
						font-size: 8px;
						line-height: 8px;
						animation: blink 1s infinite;
					}
				}
			}

			> .left {
				flex: 1;
				min-width: 0;

				> .account {
					display: flex;
					align-items: center;
					padding: 0 8px;

					> .avatar {
						width: 26px;
						height: 26px;
						margin-right: 8px;
					}

					> .text {
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						font-size: 0.9em;
					}
				}
			}

			> .right {
				margin-left: auto;
			}
		}

		> .body {
			flex: 1;
			min-width: 0;
			overflow: auto;

			> .container {
				margin-top: 8px;
				margin-bottom: 8px;

				& + .container {
					margin-top: 16px;
				}

				> .header {
					display: flex;
					font-size: 0.9em;
					padding: 8px 16px;
					position: sticky;
					top: 0;
					background: var(--X17);
					-webkit-backdrop-filter: var(--blur, blur(8px));
					backdrop-filter: var(--blur, blur(8px));
					z-index: 1;
					color: var(--fgTransparentWeak);

					> .add {
						margin-left: auto;
						color: var(--fgTransparentWeak);

						&:hover {
							color: var(--fg);
						}
					}
				}

				> .body {
					padding: 0 8px;

					> .item {
						display: block;
						padding: 6px 8px;
						border-radius: 4px;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;

						&:hover {
							text-decoration: none;
							background: rgba(0, 0, 0, 0.05);
						}

						&.active, &.active:hover {
							background: var(--accent);
							color: #fff !important;
						}

						&.read {
							color: var(--fgTransparent);
						}

						> .icon {
							margin-right: 8px;
							opacity: 0.6;
						}
					}
				}
			}

			> .a {
				margin: 12px;
			}
		}
	}

	> .main {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
		height: 100vh;
		position: relative;
		background: var(--panel);

		> .header {
			z-index: 1000;
			height: $header-height;
			background-color: var(--panel);
			border-bottom: solid 0.5px var(--divider);
			user-select: none;
		}

		> .body {
			width: 100%;
			box-sizing: border-box;
			overflow: auto;
		}
	}

	> .side {
		width: 350px;
		border-left: solid 4px var(--divider);
		background: var(--panel);

		&.widgets.sideViewOpening {
			@media (max-width: 1400px) {
				display: none;
			}
		}
	}
}
</style>
