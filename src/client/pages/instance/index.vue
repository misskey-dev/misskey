<template>
<div v-if="meta" class="mk-instance-page">
	<portal to="icon"><fa :icon="faServer"/></portal>
	<portal to="title">{{ $t('instance') }}</portal>

	<section class="_section info">
		<div class="_title"><fa :icon="faInfoCircle"/> {{ $t('instanceInfo') }}</div>
		<div class="_content table" v-if="stats">
			<div><b>{{ $t('users') }}</b><span>{{ stats.originalUsersCount | number }}</span></div>
			<div><b>{{ $t('notes') }}</b><span>{{ stats.originalNotesCount | number }}</span></div>
		</div>
		<div class="_content table">
			<div><b>Misskey</b><span>v{{ version }}</span></div>
		</div>
		<div class="_content table" v-if="serverInfo">
			<div><b>Node.js</b><span>{{ serverInfo.node }}</span></div>
			<div><b>PostgreSQL</b><span>v{{ serverInfo.psql }}</span></div>
			<div><b>Redis</b><span>v{{ serverInfo.redis }}</span></div>
		</div>
	</section>

	<section class="_section">
		<div class="_content">
			<mk-input v-model="name">{{ $t('instanceName') }}</mk-input>
			<mk-textarea v-model="description">{{ $t('instanceDescription') }}</mk-textarea>
			<mk-input v-model="tosUrl"><template #icon><fa :icon="faLink"/></template>{{ $t('tosUrl') }}</mk-input>
			<mk-input v-model="maintainerName">{{ $t('maintainerName') }}</mk-input>
			<mk-input v-model="maintainerEmail" type="email"><template #icon><fa :icon="faEnvelope"/></template>{{ $t('maintainerEmail') }}</mk-input>
		</div>
		<div class="_footer">
			<mk-button primary @click="save()"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		</div>
	</section>

	<section class="_section">
		<div class="_title"><fa :icon="faCloud"/> {{ $t('files') }}</div>
		<div class="_content">
			<mk-switch v-model="cacheRemoteFiles">{{ $t('cacheRemoteFiles') }}<template #desc>{{ $t('cacheRemoteFilesDescription') }}</template></mk-switch>
			<mk-input v-model="remoteDriveCapacityMb" type="number" :disabled="!cacheRemoteFiles" style="margin-bottom: 0;">{{ $t('remoteFilesCacheCapacityPerAccount') }}<template #suffix>MB</template></mk-input>
		</div>
		<div class="_footer">
			<mk-button primary @click="save()"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		</div>
	</section>

	<section class="_section">
		<div class="_title"><fa :icon="faGhost"/> {{ $t('proxyAccount') }}</div>
		<div class="_content">
			<mk-input v-model="proxyAccount" style="margin: 0;"><template #prefix>@</template>{{ $t('proxyAccount') }}<template #desc>{{ $t('proxyAccountDescription') }}</template></mk-input>
		</div>
		<div class="_footer">
			<mk-button primary @click="save()"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		</div>
	</section>

	<section class="_section">
		<div class="_title"><fa :icon="faBan"/> {{ $t('blockedInstances') }}</div>
		<div class="_content">
			<mk-textarea v-model="blockedHosts" style="margin-top: 0;">
				<template #desc>{{ $t('blockedInstancesDescription') }}</template>
			</mk-textarea>
		</div>
		<div class="_footer">
			<mk-button primary @click="save()"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faGhost, faCog, faPlus, faCloud, faInfoCircle, faBan, faSave, faServer, faLink } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkInput from '../../components/ui/input.vue';
import MkTextarea from '../../components/ui/textarea.vue';
import MkSwitch from '../../components/ui/switch.vue';
import { version } from '../../config';
import i18n from '../../i18n';

export default Vue.extend({
	i18n,

	metaInfo() {
		return {
			title: this.$t('instance') as string
		};
	},

	components: {
		MkButton,
		MkInput,
		MkTextarea,
		MkSwitch,
	},

	data() {
		return {
			version,
			meta: null,
			stats: null,
			serverInfo: null,
			proxyAccount: null,
			cacheRemoteFiles: false,
			remoteDriveCapacityMb: 0,
			blockedHosts: '',
			maintainerName: null,
			maintainerEmail: null,
			name: null,
			description: null,
			tosUrl: null,
			faTrashAlt, faGhost, faCog, faPlus, faCloud, faInfoCircle, faBan, faSave, faServer, faLink, faEnvelope
		}
	},

	created() {
		this.$root.getMeta().then(meta => {
			this.meta = meta;
			this.name = this.meta.name;
			this.description = this.meta.description;
			this.tosUrl = this.meta.tosUrl;
			this.maintainerName = this.meta.maintainerName;
			this.maintainerEmail = this.meta.maintainerEmail;
			this.proxyAccount = this.meta.proxyAccount;
			this.cacheRemoteFiles = this.meta.cacheRemoteFiles;
			this.remoteDriveCapacityMb = this.meta.driveCapacityPerRemoteUserMb;
			this.blockedHosts = meta.blockedHosts.join('\n');
		});

		this.$root.api('admin/server-info').then(res => {
			this.serverInfo = res;
		});

		this.$root.api('stats').then(res => {
			this.stats = res;
		});
	},

	methods: {
		save() {
			this.$root.api('admin/update-meta', {
				name: this.name,
				description: this.description,
				tosUrl: this.tosUrl,
				maintainerName: this.maintainerName,
				maintainerEmail: this.maintainerEmail,
				proxyAccount: this.proxyAccount,
				cacheRemoteFiles: this.cacheRemoteFiles,
				remoteDriveCapacityMb: this.remoteDriveCapacityMb,
				blockedHosts: this.blockedHosts.split('\n') || []
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			}).catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e
				});
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-instance-page {
	> .info {
		> .table {
			> div {
				display: flex;

				> * {
					flex: 1;
				}
			}
		}
	}
}
</style>
