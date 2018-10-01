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

	<div class="form">
		<div>
			<label>
				<p>%i18n:@banner-url%</p>
				<input v-model="bannerUrl">
			</label>
			<button class="ui" @click="updateMeta">%i18n:@save%</button>
		</div>

		<div>
			<label>
				<input type="checkbox" v-model="disableRegistration" @change="updateMeta">
				<span>%i18n:@disableRegistration%</span>
			</label>
			<button class="ui" @click="invite">%i18n:@invite%</button>
			<p v-if="inviteCode">Code: <code>{{ inviteCode }}</code></p>
		</div>

		<div>
			<label>
				<input type="checkbox" v-model="disableLocalTimeline" @change="updateMeta">
				<span>%i18n:@disableLocalTimeline%</span>
			</label>
		</div>
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
			disableLocalTimeline: false,
			bannerUrl: null,
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
			this.disableLocalTimeline = meta.disableLocalTimeline;
			this.bannerUrl = meta.bannerUrl;
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
				disableRegistration: this.disableRegistration,
				disableLocalTimeline: this.disableLocalTimeline,
				bannerUrl: this.bannerUrl
			});
		}
	}
});
</script>

<style lang="stylus" scoped>


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
				color var(--primary)

			> *:last-child
				font-size 70%

	> .cpu-memory
		margin-bottom 16px
		padding 16px
		border solid 1px #eee
		border-radius: 8px

	> .form
		> div
			padding 16px
			border-bottom solid 1px #eee

</style>
