<template>
<div class="obdskegsannmntldydackcpzezagxqfy mk-admin-card">
	<header>%i18n:@dashboard%</header>
	<div v-if="stats" class="stats">
		<div><b>%fa:user% {{ stats.originalUsersCount | number }}</b><span>%i18n:@original-users%</span></div>
		<div><span>%fa:user% {{ stats.usersCount | number }}</span><span>%i18n:@all-users%</span></div>
		<div><b>%fa:pencil-alt% {{ stats.originalNotesCount | number }}</b><span>%i18n:@original-notes%</span></div>
		<div><span>%fa:pencil-alt% {{ stats.notesCount | number }}</span><span>%i18n:@all-notes%</span></div>
	</div>
	<div class="cpu-memory">
		<x-cpu-memory :connection="connection"/>
	</div>
	<div>
		<label>
			<input type="checkbox" v-model="disableRegistration" @change="updateMeta">
			<span>disableRegistration</span>
		</label>
		<button class="ui" @click="invite">%i18n:@invite%</button>
		<p v-if="inviteCode">Code: <code>{{ inviteCode }}</code></p>
	</div>
</div>
</template>

<script lang="ts">
import Vue from "vue";
import XCpuMemory from "./admin.cpu-memory.vue";

export default Vue.extend({
	components: {
		XCpuMemory
	},
	data() {
		return {
			stats: null,
			disableRegistration: false,
			inviteCode: null,
			connection: null,
			connectionId: null
		};
	},
	created() {
		this.connection = (this as any).os.streams.serverStatsStream.getConnection();
		this.connectionId = (this as any).os.streams.serverStatsStream.use();

		(this as any).os.getMeta().then(meta => {
			this.disableRegistration = meta.disableRegistration;
		});

		(this as any).api('stats').then(stats => {
			this.stats = stats;
		});
	},
	beforeDestroy() {
		(this as any).os.streams.serverStatsStream.dispose(this.connectionId);
	},
	methods: {
		invite() {
			(this as any).api('admin/invite').then(x => {
				this.inviteCode = x.code;
			});
		},
		updateMeta() {
			(this as any).api('admin/update-meta', {
				disableRegistration: this.disableRegistration
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
		padding 16px
		border solid 1px #eee
		border-radius 8px

		> div
			flex 1
			text-align center

			> *:first-child
				display block
				color $theme-color

			> *:last-child
				font-size 70%

	> .cpu-memory
		margin-bottom 16px
		padding 16px
		border solid 1px #eee
		border-radius: 8px

</style>
