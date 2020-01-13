<template>
<div v-if="meta" class="mk-instance-page">
	<section class="_section info">
		<div class="title"><fa :icon="faInfoCircle"/> {{ $t('instanceInfo') }}</div>
		<div class="content table" v-if="stats">
			<div><b>{{ $t('users') }}</b><span>{{ stats.originalUsersCount | number }}</span></div>
			<div><b>{{ $t('notes') }}</b><span>{{ stats.originalNotesCount | number }}</span></div>
		</div>
		<div class="content table">
			<div><b>Misskey</b><span>v{{ version }}</span></div>
		</div>
		<div class="content table" v-if="serverInfo">
			<div><b>Node.js</b><span>{{ serverInfo.node }}</span></div>
			<div><b>PostgreSQL</b><span>v{{ serverInfo.psql }}</span></div>
			<div><b>Redis</b><span>v{{ serverInfo.redis }}</span></div>
		</div>
	</section>

	<section class="_section">
		<div class="title"><fa :icon="faCloud"/> {{ $t('files') }}</div>
		<div class="content">
			<x-switch v-model="cacheRemoteFiles">{{ $t('cacheRemoteFiles') }}<template #desc>{{ $t('cacheRemoteFilesDescription') }}</template></x-switch>
			<x-input v-model="remoteDriveCapacityMb" type="number" :disabled="!cacheRemoteFiles" style="margin-bottom: 0;">{{ $t('remoteFilesCacheCapacityPerAccount') }}<template #suffix>MB</template></x-input>
		</div>
		<div class="footer">
			<x-button primary @click="save()"><fa :icon="faSave"/> {{ $t('save') }}</x-button>
		</div>
	</section>

	<section class="_section">
		<div class="title"><fa :icon="faGhost"/> {{ $t('proxyAccount') }}</div>
		<div class="content">
			<x-input v-model="proxyAccount" style="margin: 0;"><template #prefix>@</template>{{ $t('proxyAccount') }}<template #desc>{{ $t('proxyAccountDescription') }}</template></x-input>
		</div>
		<div class="footer">
			<x-button primary @click="save()"><fa :icon="faSave"/> {{ $t('save') }}</x-button>
		</div>
	</section>

	<section class="_section">
		<div class="title"><fa :icon="faBan"/> {{ $t('blockedInstances') }}</div>
		<div class="content">
			<x-textarea v-model="blockedHosts" style="margin-top: 0;">
				<template #desc>{{ $t('blockedInstancesDescription') }}</template>
			</x-textarea>
		</div>
		<div class="footer">
			<x-button primary @click="save()"><fa :icon="faSave"/> {{ $t('save') }}</x-button>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faGhost, faCog, faPlus, faCloud, faInfoCircle, faBan, faSave } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import XButton from '../../components/ui/button.vue';
import XInput from '../../components/ui/input.vue';
import XTextarea from '../../components/ui/textarea.vue';
import XSwitch from '../../components/ui/switch.vue';
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
		XButton,
		XInput,
		XTextarea,
		XSwitch,
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
			faTrashAlt, faGhost, faCog, faPlus, faCloud, faInfoCircle, faBan, faSave
		}
	},

	created() {
		this.$root.getMeta().then(meta => {
			this.meta = meta;
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
