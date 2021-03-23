<template>
<MkModal ref="modal" @click="$refs.modal.close()" @closed="$emit('closed')" :position="'top'">
	<MkPostForm @posted="$refs.modal.close()" @cancel="$refs.modal.close()" @esc="$refs.modal.close()" v-bind="$attrs"/>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkModal from '@client/components/ui/modal.vue';
import MkPostForm from '@client/components/post-form.vue';

export default defineComponent({
	components: {
		MkModal,
		MkPostForm,
	},
	emits: ['closed'],
});
</script>
