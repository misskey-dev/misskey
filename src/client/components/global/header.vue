<template>
<div class="fdidabkb" :class="{ slim: narrow, thin }" :style="{ background: bg }" @click="onClick">
	<template v-if="info">
		<div class="titleContainer" @click="showTabsPopup">
			<i v-if="info.icon" class="icon" :class="info.icon"></i>
			<MkAvatar v-else-if="info.avatar" class="avatar" :user="info.avatar" :disable-preview="true" :show-indicator="true"/>

			<div class="title">
				<MkUserName v-if="info.userName" :user="info.userName" :nowrap="false" class="title"/>
				<div v-else-if="info.title" class="title">{{ info.title }}</div>
				<div class="subtitle" v-if="!narrow && info.subtitle">
					{{ info.subtitle }}
				</div>
				<div class="subtitle activeTab" v-if="narrow && hasTabs">
					{{ info.tabs.find(tab => tab.active)?.title }}
					<i class="chevron fas fa-chevron-down"></i>
				</div>
			</div>
		</div>
		<div class="tabs" v-if="!narrow">
			<button class="tab _button" v-for="tab in info.tabs" :class="{ active: tab.active }" @click="tab.onClick" v-tooltip="tab.title">
				<i v-if="tab.icon" class="icon" :class="tab.icon"></i>
				<span v-if="!tab.iconOnly" class="title">{{ tab.title }}</span>
			</button>
		</div>
	</template>
	<div class="buttons right">
		<template v-if="info && info.actions && !narrow">
			<template v-for="action in info.actions">
				<MkButton class="fullButton" v-if="action.asFullButton" @click.stop="action.handler" primary><i :class="action.icon" style="margin-right: 6px;"></i>{{ action.text }}</MkButton>
				<button v-else class="_button button" :class="{ highlighted: action.highlighted }" @click.stop="action.handler" @touchstart="preventDrag" v-tooltip="action.text"><i :class="action.icon"></i></button>
			</template>
		</template>
		<button v-if="shouldShowMenu" class="_button button" @click.stop="showMenu" @touchstart="preventDrag" v-tooltip="$ts.menu"><i class="fas fa-ellipsis-h"></i></button>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as tinycolor from 'tinycolor2';
import { popupMenu } from '@client/os';
import { url } from '@client/config';
import { scrollToTop } from '@client/scripts/scroll';
import MkButton from '@client/components/ui/button.vue';

export default defineComponent({
	components: {
		MkButton
	},

	props: {
		info: {
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

	data() {
		return {
			bg: null,
			narrow: false,
			height: 0,
		};
	},

	computed: {
		hasTabs(): boolean {
			return this.info.tabs && this.info.tabs.length > 0;
		},

		shouldShowMenu() {
			if (this.info == null) return false;
			if (this.info.actions != null && this.narrow) return true;
			if (this.info.menu != null) return true;
			if (this.info.share != null) return true;
			if (this.menu != null) return true;
			return false;
		}
	},

	mounted() {
		const rawBg = this.info?.bg || 'var(--bg)';
		const bg = tinycolor(rawBg.startsWith('var(') ? getComputedStyle(document.documentElement).getPropertyValue(rawBg.slice(4, -1)) : rawBg);
		bg.setAlpha(0.85);
		this.bg = bg.toRgbString();
	
		if (this.$el.parentElement) {
			this.narrow = this.$el.parentElement.offsetWidth < 500;
			new ResizeObserver((entries, observer) => {
				this.narrow = this.$el.parentElement.offsetWidth < 500;
			}).observe(this.$el.parentElement);
			const currentStickyTop = getComputedStyle(this.$el).getPropertyValue('--stickyTop') || '0px';
			this.$el.style.setProperty('--stickyTop', currentStickyTop);
			this.$el.parentElement.style.setProperty('--stickyTop', `calc(${currentStickyTop} + ${this.$el.offsetHeight}px)`);
		}
	},

	methods: {
		share() {
			navigator.share({
				url: url + this.info.path,
				...this.info.share,
			});
		},

		showMenu(ev) {
			let menu = this.info.menu ? this.info.menu() : [];
			if (this.narrow && this.info.actions) {
				menu = [...this.info.actions.map(x => ({
					text: x.text,
					icon: x.icon,
					action: x.handler
				})), menu.length > 0 ? null : undefined, ...menu];
			}
			if (this.info.share) {
				if (menu.length > 0) menu.push(null);
				menu.push({
					text: this.$ts.share,
					icon: 'fas fa-share-alt',
					action: this.share
				});
			}
			if (this.menu) {
				if (menu.length > 0) menu.push(null);
				menu = menu.concat(this.menu);
			}
			popupMenu(menu, ev.currentTarget || ev.target);
		},

		showTabsPopup(ev) {
			if (!this.hasTabs) return;
			if (!this.narrow) return;
			ev.preventDefault();
			ev.stopPropagation();
			const menu = this.info.tabs.map(tab => ({
				text: tab.title,
				icon: tab.icon,
				action: tab.onClick,
			}));
			popupMenu(menu, ev.currentTarget || ev.target);
		},

		preventDrag(ev) {
			ev.stopPropagation();
		},

		onClick(ev) {
			scrollToTop(this.$el, { behavior: 'smooth' });
		}
	}
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

	&.thin {
		--height: 50px;
	}

	&.slim {
		text-align: center;

		> .titleContainer {
			margin: 0 auto;
		}

		> .buttons {
			&.right {
				margin-left: 0;
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
