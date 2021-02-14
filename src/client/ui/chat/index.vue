<template>
<div class="mk-app" @contextmenu.self.prevent="onContextmenu">
	<XSidebar ref="menu" class="menu" :default-hidden="true"/>

	<div class="nav">
		<header class="header">
			<div class="left">
				<button class="_button account" @click="openAccountMenu">
					<MkAvatar :user="$i" class="avatar"/><MkAcct class="text" :user="$i"/>
				</button>
			</div>
			<div class="right">
				<MkA class="item" to="/my/notifications"><Fa :icon="faBell"/><i v-if="$i.hasUnreadNotification"><Fa :icon="faCircle"/></i></MkA>
			</div>
		</header>
		<div class="body">
			<div class="container">
				<div class="header">{{ $ts.timeline }}</div>
				<div class="body">
					<MkA to="/timeline/home" class="item" :class="{ active: tl === 'home' }"><Fa :icon="faHome" class="icon"/>{{ $ts._timelines.home }}</MkA>
					<MkA to="/timeline/local" class="item" :class="{ active: tl === 'local' }"><Fa :icon="faHome" class="icon"/>{{ $ts._timelines.local }}</MkA>
					<MkA to="/timeline/social" class="item" :class="{ active: tl === 'social' }"><Fa :icon="faHome" class="icon"/>{{ $ts._timelines.social }}</MkA>
					<MkA to="/timeline/global" class="item" :class="{ active: tl === 'global' }"><Fa :icon="faHome" class="icon"/>{{ $ts._timelines.global }}</MkA>
				</div>
			</div>
			<div class="container" v-if="lists">
				<div class="header">{{ $ts.lists }}</div>
				<div class="body">
					<MkA v-for="list in lists" :key="list.id" :to="`/my/list/${ list.id }`" class="item" :class="{ active: tl === `list:${ list.id }` }"><Fa :icon="faListUl" class="icon"/>{{ list.name }}</MkA>
				</div>
			</div>
			<div class="container" v-if="antennas">
				<div class="header">{{ $ts.antennas }}</div>
				<div class="body">
					<MkA v-for="antenna in antennas" :key="antenna.id" :to="`/my/antenna/${ antenna.id }`" class="item" :class="{ active: tl === `antenna:${ antenna.id }` }"><Fa :icon="faSatellite" class="icon"/>{{ antenna.name }}</MkA>
				</div>
			</div>
			<div class="container" v-if="followedChannels">
				<div class="header">{{ $ts.channel }}</div>
				<div class="body">
					<MkA v-for="channel in followedChannels" :key="channel.id" :to="`/channels/${ channel.id }`" class="item" :class="{ active: tl === `channel:${ channel.id }`, read: !channel.hasUnreadNote }"><Fa :icon="faSatelliteDish" class="icon"/>{{ channel.name }}</MkA>
				</div>
			</div>
			<div class="container" v-if="featuredChannels">
				<div class="header">{{ $ts.channel }}</div>
				<div class="body">
					<MkA v-for="channel in featuredChannels" :key="channel.id" :to="`/channels/${ channel.id }`" class="item" :class="{ active: tl === `channel:${ channel.id }` }"><Fa :icon="faSatelliteDish" class="icon"/>{{ channel.name }}</MkA>
				</div>
			</div>
		</div>
		<footer class="footer">
			<div class="left">
				<button class="_button menu" @click="showMenu">
					<Fa :icon="faBars"/>
				</button>
			</div>
			<div class="right">
				<MkA class="item" to="/settings"><Fa :icon="faCog"/></MkA>
			</div>
		</footer>
	</div>

	<main class="main" @contextmenu.stop="onContextmenu">
		<header class="header" ref="header" @click="onHeaderClick">
			<div v-if="tl === 'home'">
				<Fa :icon="faHome" class="icon"/>
				<div class="title">{{ $ts._timelines.home }}</div>
			</div>
			<div v-else-if="tl === 'local'">
				<Fa :icon="faShareAlt" class="icon"/>
				<div class="title">{{ $ts._timelines.local }}</div>
			</div>
			<div v-else-if="tl === 'social'">
				<Fa :icon="faShareAlt" class="icon"/>
				<div class="title">{{ $ts._timelines.social }}</div>
			</div>
			<div v-else-if="tl === 'global'">
				<Fa :icon="faShareAlt" class="icon"/>
				<div class="title">{{ $ts._timelines.global }}</div>
			</div>
		</header>
		<div class="body">
			<XTimeline v-if="tl.startsWith('channel:')" src="channel" :key="tl" :channel="tl.replace('channel:', '')"/>
			<XTimeline v-else :src="tl" :key="tl"/>
		</div>
		<footer class="footer">
			<XPostForm v-if="tl.startsWith('channel:')" :key="tl" :channel="tl.replace('channel:', '')"/>
			<XPostForm v-else/>
		</footer>
	</main>

	<XSide class="side" ref="side"/>

	<XCommon/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { faLayerGroup, faBars, faHome, faCircle, faWindowMaximize, faColumns, faPencilAlt, faShareAlt, faSatelliteDish, faListUl, faSatellite, faCog } from '@fortawesome/free-solid-svg-icons';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import { instanceName } from '@/config';
import XSidebar from '@/components/sidebar.vue';
import XCommon from '../_common_/common.vue';
import XSide from './side.vue';
import XTimeline from './timeline.vue';
import XPostForm from './post-form.vue';
import * as os from '@/os';
import { sidebarDef } from '@/sidebar';

export default defineComponent({
	components: {
		XCommon,
		XSidebar,
		XSide, // NOTE: dynamic importするとAsyncComponentWrapperが間に入るせいでref取得できなくて面倒になる
		XTimeline,
		XPostForm,
	},

	provide() {
		return {
			navHook: (path) => {
				switch (path) {
					case '/timeline/home': this.tl = 'home'; return;
					case '/timeline/local': this.tl = 'local'; return;
					case '/timeline/social': this.tl = 'social'; return;
					case '/timeline/global': this.tl = 'global'; return;

					default:
						if (path.startsWith('/channels/')) {
							this.tl = `channel:${ path.replace('/channels/', '') }`;
							return;
						}
						//os.pageWindow(path);
						this.$refs.side.navigate(path);
						break;
				}
			},
			sideViewHook: (path) => {
				this.$refs.side.navigate(path);
			}
		};
	},

	data() {
		return {
			tl: 'home',
			lists: null,
			antennas: null,
			followedChannels: null,
			featuredChannels: null,
			menuDef: sidebarDef,
			faLayerGroup, faBars, faBell, faHome, faCircle, faPencilAlt, faShareAlt, faSatelliteDish, faListUl, faSatellite, faCog,
		};
	},

	created() {
		os.api('users/lists/list').then(lists => {
			this.lists = lists;
		});

		os.api('antennas/list').then(antennas => {
			this.antennas = antennas;
		});

		os.api('channels/followed').then(channels => {
			this.followedChannels = channels;
		});

		os.api('channels/featured').then(channels => {
			this.featuredChannels = channels;
		});
	},

	methods: {
		showMenu() {
			this.$refs.menu.show();
		},

		post() {
			os.post();
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
			if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.attributes['contenteditable']) return;
			if (window.getSelection().toString() !== '') return;
			const path = this.$route.path;
			os.contextMenu([{
				type: 'label',
				text: path,
			}, {
				icon: faColumns,
				text: this.$ts.openInSideView,
				action: () => {
					this.$refs.side.navigate(path);
				}
			}, {
				icon: faWindowMaximize,
				text: this.$ts.openInWindow,
				action: () => {
					os.pageWindow(path);
				}
			}], e);
		},
	}
});
</script>

<style lang="scss" scoped>
.mk-app {
	$header-height: 54px; // TODO: どこかに集約したい
	$ui-font-size: 1em; // TODO: どこかに集約したい

	// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
	min-height: calc(var(--vh, 1vh) * 100);
	box-sizing: border-box;
	display: flex;

	> .nav {
		display: flex;
		flex-direction: column;
		width: 250px;
		height: 100vh;
		border-right: solid 1px var(--divider);

		> .header, > .footer {
			$padding: 8px;
			display: flex;
			z-index: 1000;
			height: $header-height;
			padding: $padding;
			box-sizing: border-box;
			line-height: ($header-height - ($padding * 2));
			user-select: none;

			&.header {
				border-bottom: solid 1px var(--divider);
			}

			&.footer {
				border-top: solid 1px var(--divider);
			}

			> .left {
				> .account {
					display: flex;
					align-items: center;
					padding: 0 8px;

					> .avatar {
						width: 26px;
						height: 26px;
						margin-right: 8px;
					}
				}
			}

			> .right {
				margin-left: auto;

				> .item {
					height: ($header-height - ($padding * 2));
					width: ($header-height - ($padding * 2));
					padding: 10px;
					box-sizing: border-box;
					margin-right: 4px;
					//opacity: 0.6;
					position: relative;

					> i {
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
		}

		> .body {
			flex: 1;
			min-width: 0;
			overflow: auto;

			> .container {
				& + .container {
					margin-top: 16px;
				}

				> .header {
					font-size: 0.9em;
					padding: 8px 16px;
					opacity: 0.7;
				}

				> .body {
					padding: 0 8px;

					> .item {
						display: block;
						padding: 6px 8px;
						border-radius: 4px;

						&:hover {
							text-decoration: none;
							background: rgba(0, 0, 0, 0.05);
						}

						&.active, &.active:hover {
							background: var(--accent);
							color: #fff;
						}

						&.read {
							opacity: 0.5;
						}

						> .icon {
							margin-right: 6px;
							opacity: 0.6;
						}
					}
				}
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
			$padding: 8px;
			z-index: 1000;
			height: $header-height;
			padding: $padding;
			box-sizing: border-box;
			line-height: ($header-height - ($padding * 2));
			font-weight: bold;
			background-color: var(--panel);
			border-bottom: solid 1px var(--divider);
			user-select: none;

			> div {
				display: flex;

				> .icon {
					height: ($header-height - ($padding * 2));
					width: ($header-height - ($padding * 2));
					padding: 10px;
					box-sizing: border-box;
					margin-right: 4px;
					opacity: 0.6;
				}
			}
		}

		> .footer {
			padding: 16px;
		}

		> .body {
			flex: 1;
			min-width: 0;
			overflow: auto;
		}
	}

	> .side {
		border-left: solid 1px var(--divider);
	}
}
</style>
