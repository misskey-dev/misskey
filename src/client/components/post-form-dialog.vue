<template>
<div class="ulveipglmagnxfgvitaxyszerjwiqmwl">
	<transition :name="$store.state.device.animation ? 'form-fade' : ''" appear @after-leave="$emit('closed');">
		<div class="bg" ref="bg" v-if="show" @click="close()"></div>
	</transition>
	<div class="main" ref="main" @click.self="close()" @keydown="onKeydown">
		<transition :name="$store.state.device.animation ? 'form' : ''" appear
			@after-leave="destroyDom"
		>
			<x-post-form ref="form"
				v-if="show"
				:reply="reply"
				:renote="renote"
				:mention="mention"
				:specified="specified"
				:initial-text="initialText"
				:initial-note="initialNote"
				:instant="instant"
				@posted="onPosted"
				@cancel="onCanceled"
				style="border-radius: var(--radius);"/>
		</transition>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
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
		specified: {
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

	data() {
		return {
			show: true
		};
	},

	methods: {
		focus() {
			this.$refs.form.focus();
		},

		close() {
			this.show = false;
			(this.$refs.bg as any).style.pointerEvents = 'none';
			(this.$refs.main as any).style.pointerEvents = 'none';
		},

		onPosted() {
			this.$emit('posted');
			this.close();
		},

		onCanceled() {
			this.$emit('cancel');
			this.close();
		},

		onKeydown(e) {
			if (e.which === 27) { // Esc
				e.preventDefault();
				e.stopPropagation();
				this.close();
			}
		},
	}
});
</script>

<style lang="scss" scoped>
.form-enter-active, .form-leave-active {
	transition: opacity 0.3s, transform 0.3s !important;
}
.form-enter, .form-leave-to {
	opacity: 0;
	transform: scale(0.9);
}

.form-fade-enter-active, .form-fade-leave-active {
	transition: opacity 0.3s !important;
}
.form-fade-enter, .form-fade-leave-to {
	opacity: 0;
}

.ulveipglmagnxfgvitaxyszerjwiqmwl {
	> .bg {
		display: block;
		position: fixed;
		z-index: 10000;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(#000, 0.7);
	}

	> .main {
		display: block;
		position: fixed;
		z-index: 10000;
		top: 32px;
		left: 0;
		right: 0;
		height: calc(100% - 64px);
		width: 500px;
		max-width: calc(100% - 16px);
		overflow: auto;
		margin: 0 auto 0 auto;

		@media (max-width: 550px) {
			top: 16px;
			height: calc(100% - 32px);
		}

		@media (max-width: 520px) {
			top: 8px;
			height: calc(100% - 16px);
		}
	}
}
</style>
