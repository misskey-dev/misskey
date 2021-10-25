<template>
<XModalWindow ref="dialog"
	:width="520"
	:height="500"
	@close="$refs.dialog.close()"
	@closed="$emit('closed')"
>
	<template #header>{{ instance.host }}</template>
	<div class="mk-instance-info">
		<div class="_table section">
			<div class="_row">
				<div class="_cell">
					<div class="_label">{{ $ts.software }}</div>
					<div class="_data">{{ instance.softwareName || '?' }}</div>
				</div>
				<div class="_cell">
					<div class="_label">{{ $ts.version }}</div>
					<div class="_data">{{ instance.softwareVersion || '?' }}</div>
				</div>
			</div>
		</div>
		<div class="_table data section">
			<div class="_row">
				<div class="_cell">
					<div class="_label">{{ $ts.registeredAt }}</div>
					<div class="_data">{{ new Date(instance.caughtAt).toLocaleString() }} (<MkTime :time="instance.caughtAt"/>)</div>
				</div>
			</div>
			<div class="_row">
				<div class="_cell">
					<div class="_label">{{ $ts.following }}</div>
					<button class="_data _textButton" @click="showFollowing()">{{ number(instance.followingCount) }}</button>
				</div>
				<div class="_cell">
					<div class="_label">{{ $ts.followers }}</div>
					<button class="_data _textButton" @click="showFollowers()">{{ number(instance.followersCount) }}</button>
				</div>
			</div>
			<div class="_row">
				<div class="_cell">
					<div class="_label">{{ $ts.users }}</div>
					<button class="_data _textButton" @click="showUsers()">{{ number(instance.usersCount) }}</button>
				</div>
				<div class="_cell">
					<div class="_label">{{ $ts.notes }}</div>
					<div class="_data">{{ number(instance.notesCount) }}</div>
				</div>
			</div>
			<div class="_row">
				<div class="_cell">
					<div class="_label">{{ $ts.files }}</div>
					<div class="_data">{{ number(instance.driveFiles) }}</div>
				</div>
				<div class="_cell">
					<div class="_label">{{ $ts.storageUsage }}</div>
					<div class="_data">{{ bytes(instance.driveUsage) }}</div>
				</div>
			</div>
			<div class="_row">
				<div class="_cell">
					<div class="_label">{{ $ts.latestRequestSentAt }}</div>
					<div class="_data"><MkTime v-if="instance.latestRequestSentAt" :time="instance.latestRequestSentAt"/><span v-else>N/A</span></div>
				</div>
				<div class="_cell">
					<div class="_label">{{ $ts.latestStatus }}</div>
					<div class="_data">{{ instance.latestStatus ? instance.latestStatus : 'N/A' }}</div>
				</div>
			</div>
			<div class="_row">
				<div class="_cell">
					<div class="_label">{{ $ts.latestRequestReceivedAt }}</div>
					<div class="_data"><MkTime v-if="instance.latestRequestReceivedAt" :time="instance.latestRequestReceivedAt"/><span v-else>N/A</span></div>
				</div>
			</div>
		</div>
		<div class="chart">
			<div class="header">
				<span class="label">{{ $ts.charts }}</span>
				<div class="selects">
					<MkSelect v-model="chartSrc" style="margin: 0; flex: 1;">
						<option value="instance-requests">{{ $ts._instanceCharts.requests }}</option>
						<option value="instance-users">{{ $ts._instanceCharts.users }}</option>
						<option value="instance-users-total">{{ $ts._instanceCharts.usersTotal }}</option>
						<option value="instance-notes">{{ $ts._instanceCharts.notes }}</option>
						<option value="instance-notes-total">{{ $ts._instanceCharts.notesTotal }}</option>
						<option value="instance-ff">{{ $ts._instanceCharts.ff }}</option>
						<option value="instance-ff-total">{{ $ts._instanceCharts.ffTotal }}</option>
						<option value="instance-drive-usage">{{ $ts._instanceCharts.cacheSize }}</option>
						<option value="instance-drive-usage-total">{{ $ts._instanceCharts.cacheSizeTotal }}</option>
						<option value="instance-drive-files">{{ $ts._instanceCharts.files }}</option>
						<option value="instance-drive-files-total">{{ $ts._instanceCharts.filesTotal }}</option>
					</MkSelect>
					<MkSelect v-model="chartSpan" style="margin: 0;">
						<option value="hour">{{ $ts.perHour }}</option>
						<option value="day">{{ $ts.perDay }}</option>
					</MkSelect>
				</div>
			</div>
			<div class="chart">
				<MkChart :src="chartSrc" :span="chartSpan" :limit="90" :detailed="true"></MkChart>
			</div>
		</div>
		<div class="operations section">
			<span class="label">{{ $ts.operations }}</span>
			<MkSwitch v-model="isSuspended" class="switch">{{ $ts.stopActivityDelivery }}</MkSwitch>
			<MkSwitch :model-value="isBlocked" class="switch" @update:modelValue="changeBlock">{{ $ts.blockThisInstance }}</MkSwitch>
			<details>
				<summary>{{ $ts.deleteAllFiles }}</summary>
				<MkButton @click="deleteAllFiles()" style="margin: 0.5em 0 0.5em 0;"><i class="fas fa-trash-alt"></i> {{ $ts.deleteAllFiles }}</MkButton>
			</details>
			<details>
				<summary>{{ $ts.removeAllFollowing }}</summary>
				<MkButton @click="removeAllFollowing()" style="margin: 0.5em 0 0.5em 0;"><i class="fas fa-minus-circle"></i> {{ $ts.removeAllFollowing }}</MkButton>
				<MkInfo warn>{{ $t('removeAllFollowingDescription', { host: instance.host }) }}</MkInfo>
			</details>
		</div>
		<details class="metadata section">
			<summary class="label">{{ $ts.metadata }}</summary>
			<pre><code>{{ JSON.stringify(instance, null, 2) }}</code></pre>
		</details>
	</div>
</XModalWindow>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import XModalWindow from '@client/components/ui/modal-window.vue';
import MkUsersDialog from '@client/components/users-dialog.vue';
import MkSelect from '@client/components/form/select.vue';
import MkButton from '@client/components/ui/button.vue';
import MkSwitch from '@client/components/form/switch.vue';
import MkInfo from '@client/components/ui/info.vue';
import MkChart from '@client/components/chart.vue';
import bytes from '@client/filters/bytes';
import number from '@client/filters/number';
import * as os from '@client/os';

export default defineComponent({
	components: {
		XModalWindow,
		MkSelect,
		MkButton,
		MkSwitch,
		MkInfo,
		MkChart,
	},

	props: {
		instance: {
			type: Object,
			required: true
		}
	},

	emits: ['closed'],

	data() {
		return {
			isSuspended: this.instance.isSuspended,
			chartSrc: 'requests',
			chartSpan: 'hour',
		};
	},

	computed: {
		meta() {
			return this.$instance;
		},

		isBlocked() {
			return this.meta && this.meta.blockedHosts && this.meta.blockedHosts.includes(this.instance.host);
		}
	},

	watch: {
		isSuspended() {
			os.api('admin/federation/update-instance', {
				host: this.instance.host,
				isSuspended: this.isSuspended
			});
		},
	},

	methods: {
		changeBlock(e) {
			os.api('admin/update-meta', {
				blockedHosts: this.isBlocked ? this.meta.blockedHosts.concat([this.instance.host]) : this.meta.blockedHosts.filter(x => x !== this.instance.host)
			});
		},

		removeAllFollowing() {
			os.apiWithDialog('admin/federation/remove-all-following', {
				host: this.instance.host
			});
		},

		deleteAllFiles() {
			os.apiWithDialog('admin/federation/delete-all-files', {
				host: this.instance.host
			});
		},

		showFollowing() {
			os.modal(MkUsersDialog, {
				title: this.$ts.instanceFollowing,
				pagination: {
					endpoint: 'federation/following',
					limit: 10,
					params: {
						host: this.instance.host
					}
				},
				extract: item => item.follower
			});
		},

		showFollowers() {
			os.modal(MkUsersDialog, {
				title: this.$ts.instanceFollowers,
				pagination: {
					endpoint: 'federation/followers',
					limit: 10,
					params: {
						host: this.instance.host
					}
				},
				extract: item => item.followee
			});
		},

		showUsers() {
			os.modal(MkUsersDialog, {
				title: this.$ts.instanceUsers,
				pagination: {
					endpoint: 'federation/users',
					limit: 10,
					params: {
						host: this.instance.host
					}
				}
			});
		},

		bytes,

		number
	}
});
</script>

<style lang="scss" scoped>
.mk-instance-info {
	overflow: auto;

	> .section {
		padding: 16px 32px;

		@media (max-width: 500px) {
			padding: 8px 16px;
		}

		&:not(:first-child) {
			border-top: solid 0.5px var(--divider);
		}
	}

	> .chart {
		border-top: solid 0.5px var(--divider);
		padding: 16px 0 12px 0;

		> .header {
			padding: 0 32px;

			@media (max-width: 500px) {
				padding: 0 16px;
			}

			> .label {
				font-size: 80%;
				opacity: 0.7;
			}

			> .selects {
				display: flex;
			}
		}

		> .chart {
			padding: 0 16px;

			@media (max-width: 500px) {
				padding: 0;
			}
		}
	}

	> .operations {
		> .label {
			font-size: 80%;
			opacity: 0.7;
		}

		> .switch {
			margin: 16px 0;
		}
	}

	> .metadata {
		> .label {
			font-size: 80%;
			opacity: 0.7;
		}

		> pre > code {
			display: block;
			max-height: 200px;
			overflow: auto;
		}
	}
}
</style>
