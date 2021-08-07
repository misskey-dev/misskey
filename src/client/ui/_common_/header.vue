<template>
<div class="fdidabkb" :class="{ center }" :style="`--height:${height};`" :key="key">
	<transition :name="$store.state.animation ? 'header' : ''" mode="out-in" appear>
		<div class="buttons left" v-if="backButton">
			<button class="_button button back" @click.stop="$emit('back')" v-tooltip="$ts.goBack"><i class="fas fa-chevron-left"></i></button>
		</div>
	</transition>
	<template v-if="info">
		<div class="titleContainer">
			<i v-if="info.icon" class="icon" :class="info.icon"></i>
			<MkAvatar v-else-if="info.avatar" class="avatar" :user="info.avatar" :disable-preview="true" :show-indicator="true"/>

			<div class="title">
				<MkUserName v-if="info.userName" :user="info.userName" :nowrap="false" class="title"/>
				<div v-else-if="info.title" class="title">{{ info.title }}</div>
				<div class="subtitle" v-if="info.subtitle">
					{{ info.subtitle }}
				</div>
			</div>
		</div>
		<div class="buttons right">
			<template v-if="info.actions && showActions">
				<button v-for="action in info.actions" class="_button button" :class="{ highlighted: action.highlighted }" @click.stop="action.handler" v-tooltip="action.text"><i :class="action.icon"></i></button>
			</template>
			<button v-if="shouldShowMenu" class="_button button" @click.stop="showMenu" v-tooltip="$ts.menu"><i class="fas fa-ellipsis-h"></i></button>
			<button v-if="closeButton" class="_button button" @click.stop="$emit('close')" v-tooltip="$ts.close"><i class="fas fa-times"></i></button>
		</div>
	</template>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { modalMenu } from '@client/os';
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
		center: {
			type: Boolean,
			required: false,
			default: true,
		},
	},

	data() {
		return {
			showActions: false,
			height: 0,
			key: 0,
		};
	},

	computed: {
		shouldShowMenu() {
			if (this.info.actions != null && !this.showActions) return true;
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
		this.showActions = this.$el.parentElement.offsetWidth >= 500;
		new ResizeObserver((entries, observer) => {
			this.height = this.$el.parentElement.offsetHeight + 'px';
			this.showActions = this.$el.parentElement.offsetWidth >= 500;
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
			if (!this.showActions && this.info.actions) {
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
			modalMenu(menu, ev.currentTarget || ev.target);
		}
	}
});
</script>

<style lang="scss" scoped>
.fdidabkb {
	display: flex;

	&.center {
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
			}
		}
	}
}
</style>
