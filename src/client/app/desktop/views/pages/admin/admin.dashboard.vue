<template>
<div>
	<h1>%i18n:@dashboard%</h1>
	<div v-if="stats">
		<p><b>%i18n:@all-users%</b>: <span>{{ stats.usersCount | number }}</span></p>
		<p><b>%i18n:@original-users%</b>: <span>{{ stats.originalUsersCount | number }}</span></p>
		<p><b>%i18n:@all-notes%</b>: <span>{{ stats.notesCount | number }}</span></p>
		<p><b>%i18n:@original-notes%</b>: <span>{{ stats.originalNotesCount | number }}</span></p>
	</div>
	<div>
		<button class="ui" @click="invite">%i18n:@invite%</button>
		<p v-if="inviteCode">Code: <code>{{ inviteCode }}</code></p>
	</div>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
	data() {
		return {
			stats: null,
			inviteCode: null
		};
	},
	created() {
		(this as any).api('stats').then(stats => {
			this.stats = stats;
		});
	},
	methods: {
		invite() {
			(this as any).api('admin/invite').then(x => {
				this.inviteCode = x.code;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
h1
	margin 0 0 1em 0
	padding 0 0 8px 0
	font-size 1em
	color #555
	border-bottom solid 1px #eee
</style>
