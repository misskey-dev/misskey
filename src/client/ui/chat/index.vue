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
				<MkA class="item" to="/my/messaging" v-tooltip="$ts.messaging"><Fa class="icon" :icon="faComments"/><i v-if="$i.hasUnreadMessagingMessage"><Fa :icon="faCircle"/></i></MkA>
				<MkA class="item" to="/my/messages" v-tooltip="$ts.directNotes"><Fa class="icon" :icon="faEnvelope"/><i v-if="$i.hasUnreadSpecifiedNotes"><Fa :icon="faCircle"/></i></MkA>
				<MkA class="item" to="/my/mentions" v-tooltip="$ts.mentions"><Fa class="icon" :icon="faAt"/><i v-if="$i.hasUnreadMentions"><Fa :icon="faCircle"/></i></MkA>
				<MkA class="item" to="/my/notifications" v-tooltip="$ts.notifications"><Fa class="icon" :icon="faBell"/><i v-if="$i.hasUnreadNotification"><Fa :icon="faCircle"/></i></MkA>
			</div>
		</header>
		<div class="body">
			<div class="container">
				<div class="header">{{ $ts.timeline }}</div>
				<div class="body">
					<MkA to="/timeline/home" class="item" :class="{ active: tl === 'home' }"><Fa :icon="faHome" class="icon"/>{{ $ts._timelines.home }}</MkA>
					<MkA to="/timeline/local" class="item" :class="{ active: tl === 'local' }"><Fa :icon="faComments" class="icon"/>{{ $ts._timelines.local }}</MkA>
					<MkA to="/timeline/social" class="item" :class="{ active: tl === 'social' }"><Fa :icon="faShareAlt" class="icon"/>{{ $ts._timelines.social }}</MkA>
					<MkA to="/timeline/global" class="item" :class="{ active: tl === 'global' }"><Fa :icon="faGlobe" class="icon"/>{{ $ts._timelines.global }}</MkA>
				</div>
			</div>
			<div class="container" v-if="followedChannels">
				<div class="header">{{ $ts.channel }} ({{ $ts.following }})<button class="_button add" @click="addChannel"><Fa :icon="faPlus"/></button></div>
				<div class="body">
					<MkA v-for="channel in followedChannels" :key="channel.id" :to="`/channels/${ channel.id }`" class="item" :class="{ active: tl === `channel:${ channel.id }`, read: !channel.hasUnreadNote }"><Fa :icon="faSatelliteDish" class="icon"/>{{ channel.name }}</MkA>
				</div>
			</div>
			<div class="container" v-if="featuredChannels">
				<div class="header">{{ $ts.channel }}<button class="_button add" @click="addChannel"><Fa :icon="faPlus"/></button></div>
				<div class="body">
					<MkA v-for="channel in featuredChannels" :key="channel.id" :to="`/channels/${ channel.id }`" class="item" :class="{ active: tl === `channel:${ channel.id }` }"><Fa :icon="faSatelliteDish" class="icon"/>{{ channel.name }}</MkA>
				</div>
			</div>
			<div class="container" v-if="lists">
				<div class="header">{{ $ts.lists }}<button class="_button add" @click="addList"><Fa :icon="faPlus"/></button></div>
				<div class="body">
					<MkA v-for="list in lists" :key="list.id" :to="`/my/list/${ list.id }`" class="item" :class="{ active: tl === `list:${ list.id }` }"><Fa :icon="faListUl" class="icon"/>{{ list.name }}</MkA>
				</div>
			</div>
			<div class="container" v-if="antennas">
				<div class="header">{{ $ts.antennas }}<button class="_button add" @click="addAntenna"><Fa :icon="faPlus"/></button></div>
				<div class="body">
					<MkA v-for="antenna in antennas" :key="antenna.id" :to="`/my/antenna/${ antenna.id }`" class="item" :class="{ active: tl === `antenna:${ antenna.id }` }"><Fa :icon="faSatellite" class="icon"/>{{ antenna.name }}</MkA>
				</div>
			</div>
			<div class="container">
				<div class="body">
					<MkA to="/my/favorites" class="item"><Fa :icon="faStar" class="icon"/>{{ $ts.favorites }}</MkA>
				</div>
			</div>
		</div>
		<footer class="footer">
			<div class="left">
				<button class="_button menu" @click="showMenu">
					<Fa class="icon" :icon="faBars"/>
				</button>
			</div>
			<div class="right">
				<button class="_button item search" @click="search" v-tooltip="$ts.search">
					<Fa :icon="faSearch"/>
				</button>
				<MkA class="item" to="/settings" v-tooltip="$ts.settings"><Fa class="icon" :icon="faCog"/></MkA>
			</div>
		</footer>
	</div>

	<main class="main" @contextmenu.stop="onContextmenu">
		<header class="header" ref="header" @click="onHeaderClick">
			<div class="left">
				<template v-if="tl === 'home'">
					<Fa :icon="faHome" class="icon"/>
					<div class="title">{{ $ts._timelines.home }}</div>
				</template>
				<template v-else-if="tl === 'local'">
					<Fa :icon="faComments" class="icon"/>
					<div class="title">{{ $ts._timelines.local }}</div>
				</template>
				<template v-else-if="tl === 'social'">
					<Fa :icon="faShareAlt" class="icon"/>
					<div class="title">{{ $ts._timelines.social }}</div>
				</template>
				<template v-else-if="tl === 'global'">
					<Fa :icon="faGlobe" class="icon"/>
					<div class="title">{{ $ts._timelines.global }}</div>
				</template>
				<template v-else-if="tl.startsWith('channel:')">
					<Fa :icon="faSatelliteDish" class="icon"/>
					<div class="title" v-if="currentChannel">{{ currentChannel.name }}<div class="description">{{ currentChannel.description }}</div></div>
				</template>
			</div>

			<div class="right">
				<div class="instance">{{ instanceName }}</div>
				<XHeaderClock class="clock"/>
				<button class="_button button search" v-if="tl.startsWith('channel:') && currentChannel" @click="inChannelSearch" v-tooltip="$ts.inChannelSearch">
					<Fa :icon="faSearch"/>
				</button>
				<button class="_button button search" v-else @click="search" v-tooltip="$ts.search">
					<Fa :icon="faSearch"/>
				</button>
				<button class="_button button follow" v-if="tl.startsWith('channel:') && currentChannel" :class="{ followed: currentChannel.isFollowing }" @click="toggleChannelFollow" v-tooltip="currentChannel.isFollowing ? $ts.unfollow : $ts.follow">
					<Fa v-if="currentChannel.isFollowing" :icon="faStar"/>
					<Fa v-else :icon="farStar"/>
				</button>
				<button class="_button button menu" v-if="tl.startsWith('channel:') && currentChannel" @click="openChannelMenu">
					<Fa :icon="faEllipsisH"/>
				</button>
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

	<XSide class="side" ref="side" @open="sideViewOpening = true" @close="sideViewOpening = false"/>
	<div class="side widgets" :class="{ sideViewOpening }">
		<XWidgets/>
	</div>

	<XCommon/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { faLayerGroup, faBars, faHome, faCircle, faWindowMaximize, faColumns, faPencilAlt, faShareAlt, faSatelliteDish, faListUl, faSatellite, faCog, faSearch, faPlus, faStar, faAt, faLink, faEllipsisH, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { faBell, faStar as farStar, faEnvelope, faComments } from '@fortawesome/free-regular-svg-icons';
import { instanceName, url } from '@/config';
import XSidebar from '@/components/sidebar.vue';
import XWidgets from './widgets.vue';
import XCommon from '../_common_/common.vue';
import XSide from './side.vue';
import XTimeline from './timeline.vue';
import XPostForm from './post-form.vue';
import XHeaderClock from './header-clock.vue';
import * as os from '@/os';
import { router } from '@/router';
import { sidebarDef } from '@/sidebar';
import { search } from '@/scripts/search';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { store } from './store';

export default defineComponent({
	components: {
		XCommon,
		XSidebar,
		XWidgets,
		XSide, // NOTE: dynamic importするとAsyncComponentWrapperが間に入るせいでref取得できなくて面倒になる
		XTimeline,
		XPostForm,
		XHeaderClock,
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
			tl: store.state.tl,
			lists: null,
			antennas: null,
			followedChannels: null,
			featuredChannels: null,
			currentChannel: null,
			menuDef: sidebarDef,
			sideViewOpening: false,
			instanceName,
			faLayerGroup, faBars, faBell, faHome, faCircle, faPencilAlt, faShareAlt, faSatelliteDish, faListUl, faSatellite, faCog, faSearch, faPlus, faStar, farStar, faAt, faLink, faEllipsisH, faGlobe, faComments, faEnvelope,
		};
	},

	created() {
		if (window.innerWidth < 1024) {
			localStorage.setItem('ui', 'default');
			location.reload();
		}

		router.beforeEach((to, from) => {
			this.$refs.side.navigate(to.fullPath);
			// search?q=foo のようなクエリを受け取れるようにするため、return falseはできない
			//return false;
		});

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

		this.$watch('tl', () => {
			if (this.tl.startsWith('channel:')) {
				os.api('channels/show', { channelId: this.tl.replace('channel:', '') }).then(channel => {
					this.currentChannel = channel;
				});
			}
			store.set('tl', this.tl);
		}, { immediate: true });
	},

	methods: {
		showMenu() {
			this.$refs.menu.show();
		},

		post() {
			os.post();
		},

		search() {
			search();
		},

		async inChannelSearch() {
			const { canceled, result: query } = await os.dialog({
				title: this.$ts.inChannelSearch,
				input: true
			});
			if (canceled || query == null || query === '') return;
			router.push(`/search?q=${encodeURIComponent(query)}&channel=${this.currentChannel.id}`);
		},

		top() {
			window.scroll({ top: 0, behavior: 'smooth' });
		},

		async toggleChannelFollow() {
			if (this.currentChannel.isFollowing) {
				await os.apiWithDialog('channels/unfollow', {
					channelId: this.currentChannel.id
				});
				this.currentChannel.isFollowing = false;
			} else {
				await os.apiWithDialog('channels/follow', {
					channelId: this.currentChannel.id
				});
				this.currentChannel.isFollowing = true;
			}
		},

		openChannelMenu(ev) {
			os.modalMenu([{
				text: this.$ts.copyUrl,
				icon: faLink,
				action: () => {
					copyToClipboard(`${url}/channels/${this.currentChannel.id}`);
				}
			}], ev.currentTarget || ev.target);
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
	height: calc(var(--vh, 1vh) * 100);
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
			align-items: center;
			z-index: 1000;
			height: $header-height;
			padding: $padding;
			box-sizing: border-box;
			user-select: none;

			&.header {
				border-bottom: solid 1px var(--divider);
			}

			&.footer {
				border-top: solid 1px var(--divider);
			}

			> .left, > .right {
				> .item, > .menu {
					display: inline-block;
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
						position: absolute;
						top: 0;
						left: 0;
						right: 0;
						bottom: 0;
						margin: auto;
					}

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
					-webkit-backdrop-filter: blur(8px);
					backdrop-filter: blur(8px);
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
			display: flex;
			z-index: 1000;
			height: $header-height;
			padding: $padding;
			box-sizing: border-box;
			background-color: var(--panel);
			border-bottom: solid 1px var(--divider);
			user-select: none;

			> .left {
				display: flex;
				align-items: center;
				flex: 1;
				min-width: 0;

				> .icon {
					height: ($header-height - ($padding * 2));
					width: ($header-height - ($padding * 2));
					padding: 10px;
					box-sizing: border-box;
					margin-right: 4px;
					opacity: 0.6;
				}

				> .title {
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					min-width: 0;
					font-weight: bold;

					> .description {
						opacity: 0.6;
						font-size: 0.8em;
						font-weight: normal;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
					}
				}
			}

			> .right {
				display: flex;
				align-items: center;
				min-width: 0;
				margin-left: auto;
				padding-left: 8px;

				> .instance {
					margin-right: 16px;
					font-size: 0.9em;
				}

				> .clock {
					margin-right: 16px;
				}

				> .button {
					height: ($header-height - ($padding * 2));
					width: ($header-height - ($padding * 2));
					box-sizing: border-box;
					position: relative;
					border-radius: 5px;

					&:hover {
						background: rgba(0, 0, 0, 0.05);
					}

					&.follow.followed {
						color: var(--accent);
					}
				}
			}
		}

		> .footer {
			padding: 0 16px 16px 16px;
		}

		> .body {
			flex: 1;
			min-width: 0;
			overflow: auto;
		}
	}

	> .side {
		width: 350px;
		border-left: solid 1px var(--divider);

		&.widgets.sideViewOpening {
			@media (max-width: 1400px) {
				display: none;
			}
		}
	}
}
</style>
