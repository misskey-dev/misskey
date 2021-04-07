<template>
<div class="fdidabkb" :class="{ center }" :style="`--height:${height};`">
	<transition :name="$store.state.animation ? 'header' : ''" mode="out-in" appear>
		<button class="_button back" v-if="withBack && canBack" @click.stop="back()"><Fa :icon="faChevronLeft"/></button>
	</transition>
	<template v-if="info">
		<div class="titleContainer">
			<div class="title">
				<Fa v-if="info.icon" :icon="info.icon" :key="info.icon" class="icon"/>
				<MkAvatar v-else-if="info.avatar" class="avatar" :user="info.avatar" :disable-preview="true"/>
				<span v-if="info.title" class="text">{{ info.title }}</span>
				<MkUserName v-else-if="info.userName" :user="info.userName" :nowrap="false" class="text"/>
			</div>
		</div>
		<button class="_button menu" @click.stop="menu"><Fa :icon="faEllipsisH"/></button>
		<!--<button class="_button action" v-if="info.action" @click.stop="info.action.handler"><Fa :icon="info.action.icon" :key="info.action.icon"/></button>-->
	</template>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faChevronLeft, faCircle, faShareAlt, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import { modalMenu } from '@client/os';

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
		center: {
			type: Boolean,
			required: false,
			default: true,
		},
	},

	data() {
		return {
			canBack: false,
			height: 0,
			faChevronLeft, faCircle, faShareAlt, faEllipsisH,
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

		share() {
			navigator.share(this.info.share);
		},

		menu(ev) {
			modalMenu([this.info.share ? {
				text: this.$ts.share,
				icon: faShareAlt,
				action: this.share
			} : undefined], ev.currentTarget || ev.target);
		}
	}
});
</script>

<style lang="scss" scoped>
.fdidabkb {
	&.center {
		text-align: center;

		> .titleContainer {
			margin: 0 auto;
		}
	}

	> .back,
	> .menu {
		position: absolute;
		z-index: 1;
		top: 0;
		height: var(--height);
		width: var(--height);
	}

	> .back {
		left: 0;
	}

	> .menu {
		right: 0;
	}

	> .titleContainer {
		overflow: auto;
		white-space: nowrap;
		width: calc(100% - (var(--height) * 2));

		> .title {
			display: inline-block;
			vertical-align: bottom;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			padding: 0 16px;
			position: relative;
			height: var(--height);

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
				pointer-events: none;
			}
		}
	}
}
</style>
