<template>
<ui-modal
	ref="modal"
	:close-on-bg-click="false"
	:close-anime-duration="300"
	@before-close="onBeforeClose">
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
</ui-modal>
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

		onBeforeClose() {
			(this.$refs.main as any).style.pointerEvents = 'none';

			anime({
				targets: this.$refs.main,
				opacity: 0,
				translateY: 16,
				duration: 300,
				easing: 'easeOutQuad'
			});
		},

		close() {
			(this.$refs.modal as any).close();
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

.main
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
