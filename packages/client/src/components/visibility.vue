<template>
<span v-if="note.visibility !== 'public'" class="visibility">
	<i v-if="note.visibility === 'home'" class="fas fa-home"></i>
	<i v-else-if="note.visibility === 'followers'" class="fas fa-unlock"></i>
	<i v-else-if="note.visibility === 'specified'" ref="specified" class="fas fa-envelope"></i>
</span>
<span v-if="note.localOnly" class="localOnly"><i class="fas fa-biohazard"></i></span>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps<{
	note: {
		visibility: string;
		localOnly?: boolean;
	},
}>();
</script>

<style lang="scss" scoped>
.visibility, .localOnly {
	margin-left: .3em;
}
</style>
