<template>
<div class="obdskegsannmntldydackcpzezagxqfy">
	<header>%i18n:@dashboard%</header>
	<div v-if="stats" class="stats">
		<div><b>%fa:user% {{ stats.originalUsersCount | number }}</b><span>%i18n:@original-users%</span></div>
		<div><b>%fa:user% {{ stats.usersCount | number }}</b><span>%i18n:@all-users%</span></div>
		<div><b>%fa:pen% {{ stats.originalNotesCount | number }}</b><span>%i18n:@original-notes%</span></div>
		<div><b>%fa:pen% {{ stats.notesCount | number }}</b><span>%i18n:@all-notes%</span></div>
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
@import '~const.styl'

.obdskegsannmntldydackcpzezagxqfy
	> .stats
		display flex
		justify-content center
		margin-bottom 16px

		> div
			flex 1
			text-align center

			> b
				display block
				color $theme-color

			> span
				font-size 70%

</style>
