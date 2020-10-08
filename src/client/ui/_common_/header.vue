<template>
<div class="fdidabkb">
	<transition :name="$store.state.device.animation ? 'header' : ''" mode="out-in" appear>
		<button class="_button back" v-if="canBack" @click="back()"><Fa :icon="faChevronLeft"/></button>
	</transition>
	<template v-if="info">
		<div class="titleContainer">
			<div class="title" v-for="header in info.header" :key="header.id" :class="{ _button: header.onClick, selected: header.selected }" @click="header.onClick" v-tooltip="header.tooltip">
				<Fa v-if="header.icon" :icon="header.icon" class="icon"/>
				<MkAvatar v-else-if="header.avatar" class="avatar" :user="header.avatar" :disable-preview="true"/>
				<span v-if="header.title" class="text">{{ header.title }}</span>
				<MkUserName v-else-if="header.userName" :user="header.userName" :nowrap="false" class="text"/>
			</div>
		</div>
		<button class="_button action" v-if="info.action" @click="info.action.handler"><Fa :icon="info.action.icon"/></button>
	</template>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import * as os from '@/os';

export default defineComponent({
	props: {
		info: {
			required: true
		}
	},

	data() {
		return {
			canBack: false,
			height: 0,
			faChevronLeft
		};
	},

	watch: {
		$route(to, from) {
			this.canBack = (window.history.length > 0 && !['index'].includes(to.name));
		},
	},

	mounted() {
		this.height = this.$el.offsetHeight + 'px';
	},

	methods: {
		back() {
			if (this.canBack) window.history.back();
		},
	}
});
</script>

<style lang="scss" scoped>
.fdidabkb {
	--height: 60px;

	> .back {
		position: absolute;
		z-index: 1;
		top: 0;
		left: 0;
		height: var(--height);
		width: var(--height);
	}

	> .action {
		position: absolute;
		z-index: 1;
		top: 0;
		right: 0;
		height: var(--height);
		width: var(--height);
	}

	> .titleContainer {
		width: calc(100% - (var(--height) * 2));
		margin: 0 auto;
		overflow: auto;
		white-space: nowrap;

		> .title {
			display: inline-block;
			vertical-align: bottom;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			height: var(--height);
			padding: 0 16px;

			> .icon + .text {
				margin-left: 8px;
			}

			> .avatar {
				$size: 32px;
				display: inline-block;
				width: $size;
				height: $size;
				vertical-align: bottom;
				margin: calc((var(--height) - #{$size}) / 2) 8px calc((var(--height) - #{$size}) / 2) 0;
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
