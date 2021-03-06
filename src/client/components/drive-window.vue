<template>
<XWindow ref="window"
	:initial-width="800"
	:initial-height="500"
	:can-resize="true"
	@closed="$emit('closed')"
>
	<template #header>
		{{ $ts.drive }}
	</template>
	<XDrive :initial-folder="initialFolder"/>
</XWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XDrive from './drive.vue';
import XWindow from '@/components/ui/window.vue';

export default defineComponent({
	components: {
		XDrive,
		XWindow,
	},

	props: {
		initialFolder: {
			type: Object,
			required: false
		},
	},

	emits: ['closed'],

	data() {
		return {
		};
	},

	methods: {

	}
});
</script>
