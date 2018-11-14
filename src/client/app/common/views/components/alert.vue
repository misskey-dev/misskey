<template>
<div class="felqjxyj" :class="{ pointer }">
	<div class="bg" ref="bg" @click="onBgClick"></div>
	<div class="main" ref="main">
		<div class="icon" :class="type"><fa :icon="icon"/></div>
		<header v-if="title" v-html="title"></header>
		<div class="body" v-if="text" v-html="text"></div>
		<ui-horizon-group no-grow class="buttons">
			<ui-button @click="ok" primary>OK</ui-button>
			<ui-button @click="cancel" v-if="showCancelButton">Cancel</ui-button>
		</ui-horizon-group>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as anime from 'animejs';
import { faTimesCircle, faQuestionCircle } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	props: {
		type: {
			type: String,
			required: false,
			default: 'info'
		},
		title: {
			type: String,
			required: false
		},
		text: {
			type: String,
			required: true
		},
		showCancelButton: {
			type: Boolean,
			default: false
		},
		pointer: {
			type: Boolean,
			default: true
		}
	},

	computed: {
		icon(): any {
			switch (this.type) {
				case 'success': return 'check';
				case 'error': return faTimesCircle;
				case 'warning': return 'exclamation-triangle';
				case 'info': return 'info-circle';
				case 'question': return faQuestionCircle;
			}
		}
	},

	mounted() {
		this.$nextTick(() => {
			(this.$refs.bg as any).style.pointerEvents = 'auto';
			anime({
				targets: this.$refs.bg,
				opacity: 1,
				duration: 100,
				easing: 'linear'
			});

			anime({
				targets: this.$refs.main,
				opacity: 1,
				scale: [1.2, 1],
				duration: 300,
				easing: [0, 0.5, 0.5, 1]
			});
		});
	},

	methods: {
		ok() {
			this.$emit('ok');
			this.close();
		},

		cancel() {
			this.$emit('cancel');
			this.close();
		},

		close() {
			(this.$refs.bg as any).style.pointerEvents = 'none';
			anime({
				targets: this.$refs.bg,
				opacity: 0,
				duration: 300,
				easing: 'linear'
			});

			(this.$refs.main as any).style.pointerEvents = 'none';
			anime({
				targets: this.$refs.main,
				opacity: 0,
				scale: 0.8,
				duration: 300,
				easing: [ 0.5, -0.5, 1, 0.5 ],
				complete: () => this.destroyDom()
			});
		},

		onBgClick() {
			this.cancel();
		}
	}
});
</script>

<style lang="stylus" scoped>
.felqjxyj
	display flex
	align-items center
	justify-content center
	position fixed
	z-index 30000
	top 0
	left 0
	width 100%
	height 100%

	&:not(.pointer)
		pointer-events none

	> .bg
		display block
		position fixed
		top 0
		left 0
		width 100%
		height 100%
		background rgba(#000, 0.7)
		opacity 0
		pointer-events none

	> .main
		display block
		position fixed
		margin auto
		padding 32px 42px
		min-width 320px
		max-width 480px
		width calc(100% - 32px)
		text-align center
		background var(--face)
		border-radius 8px
		color var(--faceText)
		opacity 0

		> .icon
			font-size 32px

			&.success
				color #37ec92

			&.error
				color #ec4137

			&.warning
				color #ecb637

			> *
				display block
				margin 0 auto

		> .header
			margin 16px 0
			font-weight bold

		> .body
			margin 16px 0

</style>
