<template>
<MkModal ref="modal" @click="$refs.modal.close()" @closed="$emit('closed')" :position="'top'">
	<MkPostForm @esc="$refs.modal.close()"/>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkModal from '@/components/ui/modal.vue';
import MkPostForm from '@/components/post-form.vue';

export default defineComponent({
	components: {
		MkModal,
		MkPostForm,
	},
	props: {
	},
	emits: ['closed'],
});
</script>
