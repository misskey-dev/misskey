<template>
<div class="mvcprjjd" :class="{ iconOnly }">
	<div>
		<button v-click-anime class="item _button account" @click="openAccountMenu">
			<MkAvatar :user="$i" class="avatar"/><MkAcct class="text" :user="$i"/>
		</button>
		<MkA v-click-anime class="item index" active-class="active" to="/" exact>
			<i class="fas fa-home fa-fw"></i><span class="text">{{ $ts.timeline }}</span>
		</MkA>
		<template v-for="item in menu">
			<div v-if="item === '-'" class="divider"></div>
			<component :is="menuDef[item].to ? 'MkA' : 'button'" v-else-if="menuDef[item] && (menuDef[item].show !== false)" v-click-anime class="item _button" :class="[item, { active: menuDef[item].active }]" active-class="active" :to="menuDef[item].to" v-on="menuDef[item].action ? { click: menuDef[item].action } : {}">
				<i class="fa-fw" :class="menuDef[item].icon"></i><span class="text">{{ $ts[menuDef[item].title] }}</span>
				<span v-if="menuDef[item].indicated" class="indicator"><i class="fas fa-circle"></i></span>
			</component>
		</template>
		<div class="divider"></div>
		<MkA v-if="$i.isAdmin || $i.isModerator" v-click-anime class="item" active-class="active" to="/admin">
			<i class="fas fa-door-open fa-fw"></i><span class="text">{{ $ts.controlPanel }}</span>
		</MkA>
		<button v-click-anime class="item _button" @click="more">
			<i class="fa fa-ellipsis-h fa-fw"></i><span class="text">{{ $ts.more }}</span>
			<span v-if="otherMenuItemIndicated" class="indicator"><i class="fas fa-circle"></i></span>
		</button>
		<MkA v-click-anime class="item" active-class="active" to="/settings">
			<i class="fas fa-cog fa-fw"></i><span class="text">{{ $ts.settings }}</span>
		</MkA>
		<button class="item _button post" data-cy-open-post-form @click="os.post">
			<i class="fas fa-pencil-alt fa-fw"></i><span class="text">{{ $ts.note }}</span>
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import * as os from '@/os';
import { menuDef } from '@/menu';
import { $i, openAccountMenu as openAccountMenu_ } from '@/account';
import { defaultStore } from '@/store';

const iconOnly = ref(false);

const menu = computed(() => defaultStore.state.menu);
const otherMenuItemIndicated = computed(() => {
	for (const def in menuDef) {
		if (menu.value.includes(def)) continue;
		if (menuDef[def].indicated) return true;
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

function more(ev: MouseEvent) {
	os.popup(defineAsyncComponent(() => import('@/components/launch-pad.vue')), {
		src: ev.currentTarget ?? ev.target,
	}, {
	}, 'closed');
}
</script>

<style lang="scss" scoped>
.mvcprjjd {
	$ui-font-size: 1em; // TODO: どこかに集約したい
	$nav-width: 250px;
	$nav-icon-only-width: 86px;
	$avatar-size: 32px;
	$avatar-margin: 8px;

	flex: 0 0 $nav-width;
	width: $nav-width;
	box-sizing: border-box;

	> div {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 1001;
		width: $nav-width;
		// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
		height: calc(var(--vh, 1vh) * 100);
		box-sizing: border-box;
		overflow: auto;
		overflow-x: clip;
		background: var(--navBg);

		> .divider {
			margin: 16px 16px;
			border-top: solid 0.5px var(--divider);
		}

		> .item {
			position: relative;
			display: block;
			padding-left: 24px;
			font-size: $ui-font-size;
			line-height: 2.85rem;
			text-overflow: ellipsis;
			overflow: hidden;
			white-space: nowrap;
			width: 100%;
			text-align: left;
			box-sizing: border-box;
			color: var(--navFg);

			> i {
				position: relative;
				width: 32px;
			}

			> i,
			> .avatar {
				margin-right: $avatar-margin;
			}

			> .avatar {
				width: $avatar-size;
				height: $avatar-size;
				vertical-align: middle;
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
					width: calc(100% - 24px);
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

			&:first-child, &:last-child {
				position: sticky;
				z-index: 1;
				padding-top: 8px;
				padding-bottom: 8px;
				background: var(--X14);
				-webkit-backdrop-filter: var(--blur, blur(8px));
				backdrop-filter: var(--blur, blur(8px));
			}

			&:first-child {
				top: 0;

				&:hover, &.active {
					&:before {
						content: none;
					}
				}
			}

			&:last-child {
				bottom: 0;
				color: var(--fgOnAccent);

				&:before {
					content: "";
					display: block;
					width: calc(100% - 20px);
					height: calc(100% - 20px);
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
			}
		}
	}

	&.iconOnly {
		flex: 0 0 $nav-icon-only-width;
		width: $nav-icon-only-width;

		> div {
			width: $nav-icon-only-width;

			> .divider {
				margin: 8px auto;
				width: calc(100% - 32px);
			}

			> .item {
				padding-left: 0;
				padding: 18px 0;
				width: 100%;
				text-align: center;
				font-size: $ui-font-size * 1.1;
				line-height: initial;

				> i,
				> .avatar {
					display: block;
					margin: 0 auto;
				}

				> i {
					opacity: 0.7;
				}

				> .text {
					display: none;
				}

				&:hover, &.active {
					> i, > .text {
						opacity: 1;
					}
				}

				&:first-child {
					margin-bottom: 8px;
				}

				&:last-child {
					margin-top: 8px;
				}

				&:before {
					width: min-content;
					height: 100%;
					aspect-ratio: 1/1;
					border-radius: 8px;
				}

				&.post {
					height: $nav-icon-only-width;

					> i {
						opacity: 1;
					}
				}

				&.post:before {
					width: calc(100% - 28px);
					height: auto;
					aspect-ratio: 1/1;
					border-radius: 100%;
				}
			}
		}
	}
}
</style>
