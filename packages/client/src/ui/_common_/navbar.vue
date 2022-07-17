<template>
<div class="mvcprjjd" :class="{ iconOnly }">
	<div class="body">
		<div class="top">
			<div class="banner" :style="{ backgroundImage: `url(${ $instance.bannerUrl })` }"></div>
			<button v-click-anime v-tooltip.noDelay.right="$instance.name ?? i18n.ts.instance" class="item _button instance" @click="openInstanceMenu">
				<img :src="$instance.iconUrl || $instance.faviconUrl || '/favicon.ico'" alt="" class="icon"/>
			</button>
		</div>
		<div class="middle">
			<MkA v-click-anime v-tooltip.noDelay.right="i18n.ts.timeline" class="item index" active-class="active" to="/" exact>
				<i class="icon fas fa-home fa-fw"></i><span class="text">{{ i18n.ts.timeline }}</span>
			</MkA>
			<template v-for="item in menu">
				<div v-if="item === '-'" class="divider"></div>
				<component
					:is="navbarItemDef[item].to ? 'MkA' : 'button'"
					v-else-if="navbarItemDef[item] && (navbarItemDef[item].show !== false)"
					v-click-anime
					v-tooltip.noDelay.right="i18n.ts[navbarItemDef[item].title]"
					class="item _button"
					:class="[item, { active: navbarItemDef[item].active }]"
					active-class="active"
					:to="navbarItemDef[item].to"
					v-on="navbarItemDef[item].action ? { click: navbarItemDef[item].action } : {}"
				>
					<i class="icon fa-fw" :class="navbarItemDef[item].icon"></i><span class="text">{{ i18n.ts[navbarItemDef[item].title] }}</span>
					<span v-if="navbarItemDef[item].indicated" class="indicator"><i class="icon fas fa-circle"></i></span>
				</component>
			</template>
			<div class="divider"></div>
			<MkA v-if="$i.isAdmin || $i.isModerator" v-click-anime v-tooltip.noDelay.right="i18n.ts.controlPanel" class="item" active-class="active" to="/admin">
				<i class="icon fas fa-door-open fa-fw"></i><span class="text">{{ i18n.ts.controlPanel }}</span>
			</MkA>
			<button v-click-anime class="item _button" @click="more">
				<i class="icon fa fa-ellipsis-h fa-fw"></i><span class="text">{{ i18n.ts.more }}</span>
				<span v-if="otherMenuItemIndicated" class="indicator"><i class="icon fas fa-circle"></i></span>
			</button>
			<MkA v-click-anime v-tooltip.noDelay.right="i18n.ts.settings" class="item" active-class="active" to="/settings">
				<i class="icon fas fa-cog fa-fw"></i><span class="text">{{ i18n.ts.settings }}</span>
			</MkA>
		</div>
		<div class="bottom">
			<button v-tooltip.noDelay.right="i18n.ts.note" class="item _button post" data-cy-open-post-form @click="os.post">
				<i class="icon fas fa-pencil-alt fa-fw"></i><span class="text">{{ i18n.ts.note }}</span>
			</button>
			<button v-click-anime v-tooltip.noDelay.right="`${i18n.ts.account}: @${$i.username}`" class="item _button account" @click="openAccountMenu">
				<MkAvatar :user="$i" class="avatar"/><MkAcct class="text" :user="$i"/>
			</button>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import * as os from '@/os';
import { navbarItemDef } from '@/navbar';
import { $i, openAccountMenu as openAccountMenu_ } from '@/account';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import { instance } from '@/instance';
import { host } from '@/config';

const iconOnly = ref(false);

const menu = computed(() => defaultStore.state.menu);
const otherMenuItemIndicated = computed(() => {
	for (const def in navbarItemDef) {
		if (menu.value.includes(def)) continue;
		if (navbarItemDef[def].indicated) return true;
	}
	return false;
});

const calcViewState = () => {
	iconOnly.value = (window.innerWidth <= 1279) || (defaultStore.state.menuDisplay === 'sideIcon');
};

calcViewState();

window.addEventListener('resize', calcViewState);

watch(defaultStore.reactiveState.menuDisplay, () => {
	calcViewState();
});

function openAccountMenu(ev: MouseEvent) {
	openAccountMenu_({
		withExtraOperation: true,
	}, ev);
}

function openInstanceMenu(ev: MouseEvent) {
	os.popupMenu([{
		text: instance.name ?? host,
		type: 'label',
	}, {
		type: 'link',
		text: i18n.ts.instanceInfo,
		icon: 'fas fa-info-circle',
		to: '/about',
	}, {
		type: 'link',
		text: i18n.ts.customEmojis,
		icon: 'fas fa-laugh',
		to: '/about#emojis',
	}, {
		type: 'link',
		text: i18n.ts.federation,
		icon: 'fas fa-globe',
		to: '/about#federation',
	}], ev.currentTarget ?? ev.target, {
		align: 'left',
	});
}

function more(ev: MouseEvent) {
	os.popup(defineAsyncComponent(() => import('@/components/launch-pad.vue')), {
		src: ev.currentTarget ?? ev.target,
	}, {
	}, 'closed');
}
</script>

<style lang="scss" scoped>
.mvcprjjd {
	$nav-width: 250px;
	$nav-icon-only-width: 86px;

	flex: 0 0 $nav-width;
	width: $nav-width;
	box-sizing: border-box;

	> .body {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 1001;
		width: $nav-icon-only-width;
		// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
		height: calc(var(--vh, 1vh) * 100);
		box-sizing: border-box;
		overflow: auto;
		overflow-x: clip;
		background: var(--navBg);
		contain: strict;
		display: flex;
		flex-direction: column;
	}

	&:not(.iconOnly) {
		> .body {
			width: $nav-width;

			> .top {
				position: sticky;
				top: 0;
				z-index: 1;
				padding: 20px 0;
				background: var(--X14);
				-webkit-backdrop-filter: var(--blur, blur(8px));
				backdrop-filter: var(--blur, blur(8px));

				> .banner {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background-size: cover;
					background-position: center center;
					-webkit-mask-image: linear-gradient(0deg, rgba(0,0,0,0) 15%, rgba(0,0,0,0.75) 100%);
					mask-image: linear-gradient(0deg, rgba(0,0,0,0) 15%, rgba(0,0,0,0.75) 100%);
				}

				> .instance {
					position: relative;
					display: block;
					text-align: center;
					width: 100%;

					> .icon {
						display: inline-block;
						width: 38px;
						aspect-ratio: 1;
					}
				}
			}

			> .bottom {
				position: sticky;
				bottom: 0;
				padding: 20px 0;
				background: var(--X14);
				-webkit-backdrop-filter: var(--blur, blur(8px));
				backdrop-filter: var(--blur, blur(8px));

				> .post {
					position: relative;
					display: block;
					width: 100%;
					height: 40px;
					color: var(--fgOnAccent);
					font-weight: bold;
					text-align: left;

					&:before {
						content: "";
						display: block;
						width: calc(100% - 38px);
						height: 100%;
						margin: auto;
						position: absolute;
						top: 0;
						left: 0;
						right: 0;
						bottom: 0;
						border-radius: 999px;
						background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));
					}

					&:hover, &.active {
						&:before {
							background: var(--accentLighten);
						}
					}

					> .icon {
						position: relative;
						margin-left: 30px;
						margin-right: 8px;
						width: 32px;
					}

					> .text {
						position: relative;
					}
				}

				> .account {
					position: relative;
					display: flex;
					align-items: center;
					padding-left: 30px;
					text-overflow: ellipsis;
					overflow: hidden;
					white-space: nowrap;
					width: 100%;
					text-align: left;
					box-sizing: border-box;
					margin-top: 16px;

					> .avatar {
						position: relative;
						width: 32px;
						aspect-ratio: 1;
						margin-right: 8px;
					}
				}
			}

			> .middle {
				flex: 1;

				> .divider {
					margin: 16px 16px;
					border-top: solid 0.5px var(--divider);
				}

				> .item {
					position: relative;
					display: block;
					padding-left: 30px;
					line-height: 2.85rem;
					text-overflow: ellipsis;
					overflow: hidden;
					white-space: nowrap;
					width: 100%;
					text-align: left;
					box-sizing: border-box;
					color: var(--navFg);

					> .icon {
						position: relative;
						width: 32px;
						margin-right: 8px;
					}

					> .indicator {
						position: absolute;
						top: 0;
						left: 20px;
						color: var(--navIndicator);
						font-size: 8px;
						animation: blink 1s infinite;
					}

					> .text {
						position: relative;
						font-size: 0.9em;
					}

					&:hover {
						text-decoration: none;
						color: var(--navHoverFg);
					}

					&.active {
						color: var(--navActive);
					}

					&:hover, &.active {
						color: var(--accent);

						&:before {
							content: "";
							display: block;
							width: calc(100% - 34px);
							height: 100%;
							margin: auto;
							position: absolute;
							top: 0;
							left: 0;
							right: 0;
							bottom: 0;
							border-radius: 999px;
							background: var(--accentedBg);
						}
					}
				}
			}
		}
	}

	&.iconOnly {
		flex: 0 0 $nav-icon-only-width;
		width: $nav-icon-only-width;

		> .body {
			width: $nav-icon-only-width;

			> .top {
				position: sticky;
				top: 0;
				z-index: 1;
				padding: 20px 0;
				background: var(--X14);
				-webkit-backdrop-filter: var(--blur, blur(8px));
				backdrop-filter: var(--blur, blur(8px));

				> .instance {
					display: block;
					text-align: center;
					width: 100%;

					> .icon {
						display: inline-block;
						width: 30px;
						aspect-ratio: 1;
					}
				}
			}

			> .bottom {
				position: sticky;
				bottom: 0;
				padding: 20px 0;
				background: var(--X14);
				-webkit-backdrop-filter: var(--blur, blur(8px));
				backdrop-filter: var(--blur, blur(8px));

				> .post {
					display: block;
					position: relative;
					width: 100%;
					height: 52px;
					margin-bottom: 16px;
					text-align: center;

					&:before {
						content: "";
						display: block;
						position: absolute;
						top: 0;
						left: 0;
						right: 0;
						bottom: 0;
						margin: auto;
						width: 52px;
						aspect-ratio: 1/1;
						border-radius: 100%;
						background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));
					}

					&:hover, &.active {
						&:before {
							background: var(--accentLighten);
						}
					}

					> .icon {
						position: relative;
						color: var(--fgOnAccent);
					}

					> .text {
						display: none;
					}
				}

				> .account {
					display: block;
					text-align: center;
					width: 100%;

					> .avatar {
						display: inline-block;
						width: 38px;
						aspect-ratio: 1;
					}

					> .text {
						display: none;
					}
				}
			}

			> .middle {
				flex: 1;

				> .divider {
					margin: 8px auto;
					width: calc(100% - 32px);
					border-top: solid 0.5px var(--divider);
				}

				> .item {
					display: block;
					position: relative;
					padding: 18px 0;
					width: 100%;
					text-align: center;

					> .icon {
						display: block;
						margin: 0 auto;
						opacity: 0.7;
					}

					> .text {
						display: none;
					}

					> .indicator {
						position: absolute;
						top: 6px;
						left: 24px;
						color: var(--navIndicator);
						font-size: 8px;
						animation: blink 1s infinite;
					}

					&:hover, &.active {
						text-decoration: none;
						color: var(--accent);

						&:before {
							content: "";
							display: block;
							height: 100%;
							aspect-ratio: 1;
							margin: auto;
							position: absolute;
							top: 0;
							left: 0;
							right: 0;
							bottom: 0;
							border-radius: 999px;
							background: var(--accentedBg);
						}

						> .icon, > .text {
							opacity: 1;
						}
					}
				}
			}
		}
	}
}
</style>
