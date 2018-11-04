<template>
<span class="mk-file-type-icon">
	<template v-if="kind == 'image'"><font-awesome-icon icon="file-image"/></template>
</span>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['type'],
	computed: {
		kind(): string {
			return this.type.split('/')[0];
		}
	}
});
</script>
