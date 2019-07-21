<template>
<div class="ulveipglmagnxfgvitaxyszerjwiqmwl">
	<div class="bg" ref="bg"></div>
	<div class="main" ref="main">
		<x-post-form ref="form"
			:reply="reply"
			:renote="renote"
			:mention="mention"
			:initial-text="initialText"
			:initial-note="initialNote"
			:instant="instant"
			@posted="onPosted"
			@cancel="onCanceled"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import anime from 'animejs';
import XPostForm from './post-form.vue';

export default Vue.extend({
	components: {
		XPostForm
	},

	props: {
		reply: {
			type: Object,
			required: false
		},
		renote: {
			type: Object,
			required: false
		},
		mention: {
			type: Object,
			required: false
		},
		initialText: {
			type: String,
			required: false
		},
		initialNote: {
			type: Object,
			required: false
		},
		instant: {
			type: Boolean,
			required: false,
			default: false
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
				translateY: [-16, 0],
				duration: 300,
				easing: 'easeOutQuad'
			});
		});
	},

	methods: {
		focus() {
			this.$refs.form.focus();
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
				translateY: 16,
				duration: 300,
				easing: 'easeOutQuad',
				complete: () => this.destroyDom()
			});
		},

		onPosted() {
			this.$emit('posted');
			this.close();
		},

		onCanceled() {
			this.$emit('cancel');
			this.close();
		}
	}
});
</script>

<style lang="stylus" scoped>
.ulveipglmagnxfgvitaxyszerjwiqmwl
	> .bg
		display block
		position fixed
		z-index 10000
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
		z-index 10000
		top 0
		left 0
		right 0
		height 100%
		overflow auto
		margin 0 auto 0 auto
		opacity 0
		transform translateY(-16px)

</style>
