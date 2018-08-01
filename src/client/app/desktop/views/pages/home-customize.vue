<template>
<mk-home customize/>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	mounted() {
		document.title = '%i18n:common.name% - %i18n:@title%';
	}
});
</script>
