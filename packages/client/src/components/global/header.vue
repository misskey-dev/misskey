<template>
<div ref="el" class="fdidabkb" :class="{ slim: narrow, thin: thin_ }" :style="{ background: bg }" @click="onClick">
	<template v-if="info">
		<div v-if="!hideTitle" class="titleContainer" @click="showTabsPopup">
			<MkAvatar v-if="info.avatar" class="avatar" :user="info.avatar" :disable-preview="true" :show-indicator="true"/>
			<i v-else-if="info.icon" class="icon" :class="info.icon"></i>

			<div class="title">
				<MkUserName v-if="info.userName" :user="info.userName" :nowrap="false" class="title"/>
				<div v-else-if="info.title" class="title">{{ info.title }}</div>
				<div v-if="!narrow && info.subtitle" class="subtitle">
					{{ info.subtitle }}
				</div>
				<div v-if="narrow && hasTabs" class="subtitle activeTab">
					{{ info.tabs.find(tab => tab.active)?.title }}
					<i class="chevron fas fa-chevron-down"></i>
				</div>
			</div>
		</div>
		<div v-if="!narrow || hideTitle" class="tabs">
			<button v-for="tab in info.tabs" v-tooltip="tab.title" class="tab _button" :class="{ active: tab.active }" @click="tab.onClick">
				<i v-if="tab.icon" class="icon" :class="tab.icon"></i>
				<span v-if="!tab.iconOnly" class="title">{{ tab.title }}</span>
			</button>
		</div>
	</template>
	<div class="buttons right">
		<template v-if="info && info.actions && !narrow">
			<template v-for="action in info.actions">
				<MkButton v-if="action.asFullButton" class="fullButton" primary @click.stop="action.handler"><i :class="action.icon" style="margin-right: 6px;"></i>{{ action.text }}</MkButton>
				<button v-else v-tooltip="action.text" class="_button button" :class="{ highlighted: action.highlighted }" @click.stop="action.handler" @touchstart="preventDrag"><i :class="action.icon"></i></button>
			</template>
		</template>
		<button v-if="shouldShowMenu" v-tooltip="$ts.menu" class="_button button" @click.stop="showMenu" @touchstart="preventDrag"><i class="fas fa-ellipsis-h"></i></button>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref, inject } from 'vue';
import * as tinycolor from 'tinycolor2';
import { popupMenu } from '@/os';
import { url } from '@/config';
import { scrollToTop } from '@/scripts/scroll';
import MkButton from '@/components/ui/button.vue';
import { i18n } from '@/i18n';
import { globalEvents } from '@/events';

export default defineComponent({
	components: {
		MkButton
	},

	props: {
		info: {
			type: Object as PropType<{
				actions?: {}[];
				tabs?: {}[];
			}>,
			required: true
		},
		menu: {
			required: false
		},
		thin: {
			required: false,
			default: false
		},
	},

	setup(props) {
		const el = ref<HTMLElement>(null);
		const bg = ref(null);
		const narrow = ref(false);
		const height = ref(0);
		const hasTabs = computed(() => {
			return props.info.tabs && props.info.tabs.length > 0;
		});
		const shouldShowMenu = computed(() => {
			if (props.info == null) return false;
			if (props.info.actions != null && narrow.value) return true;
			if (props.info.menu != null) return true;
			if (props.info.share != null) return true;
			if (props.menu != null) return true;
			return false;
		});

		const share = () => {
			navigator.share({
				url: url + props.info.path,
				...props.info.share,
			});
		};

		const showMenu = (ev: MouseEvent) => {
			let menu = props.info.menu ? props.info.menu() : [];
			if (narrow.value && props.info.actions) {
				menu = [...props.info.actions.map(x => ({
					text: x.text,
					icon: x.icon,
					action: x.handler
				})), menu.length > 0 ? null : undefined, ...menu];
			}
			if (props.info.share) {
				if (menu.length > 0) menu.push(null);
				menu.push({
					text: i18n.locale.share,
					icon: 'fas fa-share-alt',
					action: share
				});
			}
			if (props.menu) {
				if (menu.length > 0) menu.push(null);
				menu = menu.concat(props.menu);
			}
			popupMenu(menu, ev.currentTarget || ev.target);
		};

		const showTabsPopup = (ev: MouseEvent) => {
			if (!hasTabs.value) return;
			if (!narrow.value) return;
			ev.preventDefault();
			ev.stopPropagation();
			const menu = props.info.tabs.map(tab => ({
				text: tab.title,
				icon: tab.icon,
				action: tab.onClick,
			}));
			popupMenu(menu, ev.currentTarget || ev.target);
		};

		const preventDrag = (ev: TouchEvent) => {
			ev.stopPropagation();
		};

		const onClick = () => {
			scrollToTop(el.value, { behavior: 'smooth' });
		};

		const calcBg = () => {
			const rawBg = props.info?.bg || 'var(--bg)';
			const tinyBg = tinycolor(rawBg.startsWith('var(') ? getComputedStyle(document.documentElement).getPropertyValue(rawBg.slice(4, -1)) : rawBg);
			tinyBg.setAlpha(0.85);
			bg.value = tinyBg.toRgbString();
		};

		onMounted(() => {
			calcBg();
			globalEvents.on('themeChanged', calcBg);
			onUnmounted(() => {
				globalEvents.off('themeChanged', calcBg);
			});
		
			if (el.value.parentElement) {
				narrow.value = el.value.parentElement.offsetWidth < 500;
				const ro = new ResizeObserver((entries, observer) => {
					if (el.value) {
						narrow.value = el.value.parentElement.offsetWidth < 500;
					}
				});
				ro.observe(el.value.parentElement);
				onUnmounted(() => {
					ro.disconnect();
				});
			}
		});

		return {
			el,
			bg,
			narrow,
			height,
			hasTabs,
			shouldShowMenu,
			share,
			showMenu,
			showTabsPopup,
			preventDrag,
			onClick,
			hideTitle: inject('shouldOmitHeaderTitle', false),
			thin_: props.thin || inject('shouldHeaderThin', false)
		};
	},
});
</script>

<style lang="scss" scoped>
.fdidabkb {
	--height: 60px;
	display: flex;
	position: sticky;
	top: var(--stickyTop, 0);
	z-index: 1000;
	width: 100%;
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	border-bottom: solid 0.5px var(--divider);

	&.thin {
		--height: 50px;

		> .buttons {
			> .button {
				font-size: 0.9em;
			}
		}
	}

	&.slim {
		text-align: center;

		> .titleContainer {
			flex: 1;
			margin: 0 auto;
			margin-left: var(--height);

			> *:first-child {
				margin-left: auto;
			}

			> *:last-child {
				margin-right: auto;
			}
		}
	}

	> .buttons {
		--margin: 8px;
		display: flex;
    align-items: center;
		height: var(--height);
		margin: 0 var(--margin);

		&.right {
			margin-left: auto;
		}

		&:empty {
			width: var(--height);
		}

		> .button {
			display: flex;
			align-items: center;
			justify-content: center;
			height: calc(var(--height) - (var(--margin) * 2));
			width: calc(var(--height) - (var(--margin) * 2));
			box-sizing: border-box;
			position: relative;
			border-radius: 5px;

			&:hover {
				background: rgba(0, 0, 0, 0.05);
			}

			&.highlighted {
				color: var(--accent);
			}
		}

		> .fullButton {
			& + .fullButton {
				margin-left: 12px;
			}
		}
	}

	> .titleContainer {
		display: flex;
		align-items: center;
		overflow: auto;
		white-space: nowrap;
		text-align: left;
		font-weight: bold;
		flex-shrink: 0;
		margin-left: 24px;

		> .avatar {
			$size: 32px;
			display: inline-block;
			width: $size;
			height: $size;
			vertical-align: bottom;
			margin: 0 8px;
			pointer-events: none;
		}

		> .icon {
			margin-right: 8px;
		}

		> .title {
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			line-height: 1.1;

			> .subtitle {
				opacity: 0.6;
				font-size: 0.8em;
				font-weight: normal;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;

				&.activeTab {
					text-align: center;

					> .chevron {
						display: inline-block;
						margin-left: 6px;
					}
				}
			}
		}
	}

	> .tabs {
		margin-left: 16px;
		font-size: 0.8em;
		overflow: auto;
		white-space: nowrap;

		> .tab {
			display: inline-block;
			position: relative;
			padding: 0 10px;
			height: 100%;
			font-weight: normal;
			opacity: 0.7;

			&:hover {
				opacity: 1;
			}

			&.active {
				opacity: 1;

				&:after {
					content: "";
					display: block;
					position: absolute;
					bottom: 0;
					left: 0;
					right: 0;
					margin: 0 auto;
					width: 100%;
					height: 3px;
					background: var(--accent);
				}
			}

			> .icon + .title {
				margin-left: 8px;
			}
		}
	}
}
</style>
