<template>
<mk-home customize/>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	mounted() {
		document.title = `${(this as any).os.instanceName} - %i18n:@title%`;
	}
});
</script>
