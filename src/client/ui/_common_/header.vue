<template>
<div class="fdidabkb" :class="{ slim: titleOnly || narrow }" :style="`--height:${height};`" :key="key">
	<transition :name="$store.state.animation ? 'header' : ''" mode="out-in" appear>
		<div class="buttons left" v-if="backButton">
			<button class="_button button back" @click.stop="$emit('back')" @touchstart="preventDrag" v-tooltip="$ts.goBack"><i class="fas fa-chevron-left"></i></button>
		</div>
	</transition>
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
			<button v-for="action in info.actions" class="_button button" :class="{ highlighted: action.highlighted }" @click.stop="action.handler" @touchstart="preventDrag" v-tooltip="action.text"><i :class="action.icon"></i></button>
		</template>
		<button v-if="shouldShowMenu" class="_button button" @click.stop="showMenu" @touchstart="preventDrag" v-tooltip="$ts.menu"><i class="fas fa-ellipsis-h"></i></button>
		<button v-if="closeButton" class="_button button" @click.stop="$emit('close')" @touchstart="preventDrag" v-tooltip="$ts.close"><i class="fas fa-times"></i></button>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { popupMenu } from '@client/os';
import { url } from '@client/config';

export default defineComponent({
	props: {
		info: {
			required: true
		},
		menu: {
			required: false
		},
		backButton: {
			type: Boolean,
			required: false,
			default: false,
		},
		closeButton: {
			type: Boolean,
			required: false,
			default: false,
		},
		titleOnly: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	data() {
		return {
			narrow: false,
			height: 0,
			key: 0,
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

	watch: {
		info() {
			this.key++;
		},
	},

	mounted() {
		this.height = this.$el.parentElement.offsetHeight + 'px';
		this.narrow = this.titleOnly || this.$el.parentElement.offsetWidth < 500;
		new ResizeObserver((entries, observer) => {
			this.height = this.$el.parentElement.offsetHeight + 'px';
			this.narrow = this.titleOnly || this.$el.parentElement.offsetWidth < 500;
		}).observe(this.$el);
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
		}
	}
});
</script>

<style lang="scss" scoped>
.fdidabkb {
	display: flex;

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
	}

	> .titleContainer {
		display: flex;
		align-items: center;
		overflow: auto;
		white-space: nowrap;
		text-align: left;
		font-weight: bold;

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
