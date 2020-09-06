<template>
<x-modal @closed="$emit('closed')" @click="onBgClick" :showing="showing">
	<x-post-form ref="form" class="ulveipgl"
		:reply="reply"
		:renote="renote"
		:mention="mention"
		:specified="specified"
		:initial-text="initialText"
		:initial-note="initialNote"
		:instant="instant"
		@posted="onPosted"
		@cancel="onCanceled"
	/>
</x-modal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XModal from './modal.vue';
import XPostForm from './post-form.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XModal,
		XPostForm,
	},

	props: {
		showing: {
			required: true
		},
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

	methods: {
		focus() {
			this.$refs.form.focus();
		},

		onPosted() {
			this.$emit('done', 'posted');
		},

		onCanceled() {
			this.$emit('done', 'canceled');
		},

		onKeydown(e) {
			if (e.which === 27) { // Esc
				e.preventDefault();
				e.stopPropagation();
				this.$emit('done', 'canceled');
			}
		},
	}
});
</script>

<style lang="scss" scoped>
.ulveipgl {
	width: 100%;
	max-width: 500px;
	border-radius: var(--radius);
}
</style>
