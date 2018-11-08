<template>
<mk-home customize/>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('.vue'),
	mounted() {
		document.title = `${(this as any).os.instanceName} - %i18n:@title%`;
	}
});
</script>
