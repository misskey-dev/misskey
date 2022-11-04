<template>
<MkModal ref="modal" :prefer-type="'dialog:top'" @click="$refs.modal.close()" @closed="$emit('closed')">
	<MkPostForm v-bind="$attrs" @posted="$refs.modal.close()" @cancel="$refs.modal.close()" @esc="$refs.modal.close()"/>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkModal from '@/components/MkModal.vue';
import MkPostForm from '@/components/MkPostForm.vue';

export default defineComponent({
	components: {
		MkModal,
		MkPostForm,
	},
	emits: ['closed'],
});
</script>
