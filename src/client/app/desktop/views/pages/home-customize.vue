<template>
<mk-home customize/>
</template>

<script lang="ts">
import Vue from 'vue';
import * as config from '../../../config';

export default Vue.extend({
	mounted() {
		document.title = `${config.name} - %i18n:@title%`;
	}
});
</script>
