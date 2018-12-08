<template>
<a :href="url" :class="service" target="_blank">
	<fa :icon="icon" size="lg" fixed-width />
	<div>{{ text }}</div>
</a>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['url', 'text', 'icon', 'service']
});
</script>
