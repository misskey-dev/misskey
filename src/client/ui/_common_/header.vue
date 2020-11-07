<template>
<div class="fdidabkb">
	<transition :name="$store.state.device.animation ? 'header' : ''" mode="out-in" appear>
		<button class="_button back" v-if="withBack && canBack" @click.stop="back()"><Fa :icon="faChevronLeft"/></button>
	</transition>
	<template v-if="info">
		<div class="titleContainer">
			<template v-if="info.tabs">
				<div class="title" v-for="tab in info.tabs" :key="tab.id" :class="{ _button: tab.onClick, selected: tab.selected }" @click.stop="tab.onClick" v-tooltip="tab.tooltip">
					<Fa v-if="tab.icon" :icon="tab.icon" :key="tab.icon" class="icon"/>
					<span v-if="tab.title" class="text">{{ tab.title }}</span>
					<Fa class="indicator" v-if="tab.indicate" :icon="faCircle"/>
				</div>
			</template>
			<template v-else>
				<div class="title">
					<Fa v-if="info.icon" :icon="info.icon" :key="info.icon" class="icon"/>
					<MkAvatar v-else-if="info.avatar" class="avatar" :user="info.avatar" :disable-preview="true"/>
					<span v-if="info.title" class="text">{{ info.title }}</span>
					<MkUserName v-else-if="info.userName" :user="info.userName" :nowrap="false" class="text"/>
				</div>
			</template>
		</div>
		<button class="_button action" v-if="info.action" @click.stop="info.action.handler"><Fa :icon="info.action.icon" :key="info.action.icon"/></button>
	</template>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faChevronLeft, faCircle } from '@fortawesome/free-solid-svg-icons';

export default defineComponent({
	props: {
		info: {
			required: true
		},
		withBack: {
			type: Boolean,
			required: false,
			default: true,
		},
	},

	data() {
		return {
			canBack: false,
			height: 0,
			faChevronLeft, faCircle
		};
	},

	watch: {
		$route: {
			handler(to, from) {
				this.canBack = (window.history.length > 0 && !['index'].includes(to.name));
			},
			immediate: true
		},
	},

	mounted() {
		this.height = this.$el.parentElement.offsetHeight + 'px';
		new ResizeObserver((entries, observer) => {
			this.height = this.$el.parentElement.offsetHeight + 'px';
		}).observe(this.$el);
	},

	methods: {
		back() {
			if (this.canBack) this.$router.back();
		},
	}
});
</script>

<style lang="scss" scoped vars="{ height }">
.fdidabkb {
	text-align: center;

	> .back {
		height: var(--height);
		width: var(--height);
	}

	> .action {
		height: var(--height);
		width: var(--height);
	}

	> .titleContainer {
		width: calc(100% - (var(--height) * 2));

		> .title {
			height: var(--height);

			> .avatar {
				$size: 32px;
				margin: calc((var(--height) - #{$size}) / 2) 8px calc((var(--height) - #{$size}) / 2) 0;
				pointer-events: none;
			}
		}
	}
}
</style>

<style lang="scss" scoped>
.fdidabkb {
	> .back {
		position: absolute;
		z-index: 1;
		top: 0;
		left: 0;
	}

	> .action {
		position: absolute;
		z-index: 1;
		top: 0;
		right: 0;
	}

	> .titleContainer {
		margin: 0 auto;
		overflow: auto;
		white-space: nowrap;

		> .title {
			display: inline-block;
			vertical-align: bottom;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			padding: 0 16px;
			position: relative;

			> .indicator {
				position: absolute;
				top: initial;
				right: 8px;
				top: 8px;
				color: var(--indicator);
				font-size: 12px;
				animation: blink 1s infinite;
			}

			> .icon + .text {
				margin-left: 8px;
			}

			> .avatar {
				$size: 32px;
				display: inline-block;
				width: $size;
				height: $size;
				vertical-align: bottom;
			}

			&._button {
				&:hover {
					color: var(--fgHighlighted);
				}
			}

			&.selected {
				box-shadow: 0 -2px 0 0 var(--accent) inset;
				color: var(--fgHighlighted);
			}
		}
	}
}
</style>
