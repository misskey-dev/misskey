<template>
<div>
	<header>%i18n:@dashboard%</header>

	<p><b>%i18n:@all-users%</b><span>{{ stats.usersCount | number }}</span></p>
	<p><b>%i18n:@original-users%</b><span>{{ stats.originalUsersCount | number }}</span></p>
	<p><b>%i18n:@all-notes%</b><span>{{ stats.notesCount | number }}</span></p>
	<p><b>%i18n:@original-notes%</b><span>{{ stats.originalNotesCount | number }}</span></p>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
	data() {
		return {
			stats: null
		};
	},
	created() {
		(this as any).api('stats').then(stats => {
			this.stats = stats;
		});
	}
});
</script>
