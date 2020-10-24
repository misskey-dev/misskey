<template>
<div class="">
	<div class="_section reports">
		<div class="_content">
			<div class="inputs" style="display: flex;">
				<MkSelect v-model:value="state" style="margin: 0; flex: 1;">
					<template #label>{{ $t('state') }}</template>
					<option value="all">{{ $t('all') }}</option>
					<option value="unresolved">{{ $t('unresolved') }}</option>
					<option value="resolved">{{ $t('resolved') }}</option>
				</MkSelect>
				<MkSelect v-model:value="targetUserOrigin" style="margin: 0; flex: 1;">
					<template #label>{{ $t('targetUserOrigin') }}</template>
					<option value="combined">{{ $t('all') }}</option>
					<option value="local">{{ $t('local') }}</option>
					<option value="remote">{{ $t('remote') }}</option>
				</MkSelect>
				<MkSelect v-model:value="reporterOrigin" style="margin: 0; flex: 1;">
					<template #label>{{ $t('reporterOrigin') }}</template>
					<option value="combined">{{ $t('all') }}</option>
					<option value="local">{{ $t('local') }}</option>
					<option value="remote">{{ $t('remote') }}</option>
				</MkSelect>
			</div>
			<!-- TODO
			<div class="inputs" style="display: flex; padding-top: 1.2em;">
				<MkInput v-model:value="searchUsername" style="margin: 0; flex: 1;" type="text" spellcheck="false" @update:value="$refs.reports.reload()">
					<span>{{ $t('username') }}</span>
				</MkInput>
				<MkInput v-model:value="searchHost" style="margin: 0; flex: 1;" type="text" spellcheck="false" @update:value="$refs.reports.reload()" :disabled="pagination.params().origin === 'local'">
					<span>{{ $t('host') }}</span>
				</MkInput>
			</div>
			-->

			<MkPagination :pagination="pagination" #default="{items}" ref="reports" :auto-margin="false" style="margin-top: var(--margin);">
				<div class="bcekxzvu _card _vMargin" v-for="report in items" :key="report.id">
					<div class="_content target">
						<MkAvatar class="avatar" :user="report.targetUser"/>
						<div class="info">
							<MkUserName class="name" :user="report.targetUser"/>
							<div class="acct">@{{ acct(report.targetUser) }}</div>
						</div>
					</div>
					<div class="_content">
						<div>
							<Mfm :text="report.comment"/>
						</div>
						<hr>
						<div>Reporter: <MkAcct :user="report.reporter"/></div>
						<div><MkTime :time="report.createdAt"/></div>
					</div>
					<div class="_footer">
						<div v-if="report.assignee">Assignee: <MkAcct :user="report.assignee"/></div>
						<MkButton @click="resolve(report)" primary v-if="!report.resolved">{{ $t('abuseMarkAsResolved') }}</MkButton>
					</div>
				</div>
			</MkPagination>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlus, faUsers, faSearch, faBookmark, faMicrophoneSlash, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { faSnowflake, faBookmark as farBookmark } from '@fortawesome/free-regular-svg-icons';
import parseAcct from '../../../misc/acct/parse';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import MkSelect from '@/components/ui/select.vue';
import MkPagination from '@/components/ui/pagination.vue';
import { acct } from '../../filters/user';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSelect,
		MkPagination,
	},

	data() {
		return {
			INFO: {
				header: [{
					title: this.$t('abuseReports'),
					icon: faExclamationCircle
				}],
			},
			searchUsername: '',
			searchHost: '',
			state: 'unresolved',
			reporterOrigin: 'combined',
			targetUserOrigin: 'combined',
			pagination: {
				endpoint: 'admin/abuse-user-reports',
				limit: 10,
				params: () => ({
					state: this.state,
					reporterOrigin: this.reporterOrigin,
					targetUserOrigin: this.targetUserOrigin,
				}),
			},
			faPlus, faUsers, faSearch, faBookmark, farBookmark, faMicrophoneSlash, faSnowflake
		}
	},

	watch: {
		state() {
			this.$refs.reports.reload();
		},

		reporterOrigin() {
			this.$refs.reports.reload();
		},

		targetUserOrigin() {
			this.$refs.reports.reload();
		},
	},

	methods: {
		acct,

		resolve(report) {
			os.apiWithDialog('admin/resolve-abuse-user-report', {
				reportId: report.id,
			}).then(() => {
				this.$refs.reports.removeItem(item => item.id === report.id);
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.bcekxzvu {
	> .target {
		display: flex;
		width: 100%;
		box-sizing: border-box;
		text-align: left;
		align-items: center;
					
		> .avatar {
			width: 42px;
			height: 42px;
		}

		> .info {
			margin-left: 0.3em;
			padding: 0 8px;
			flex: 1;

			> .name {
				font-weight: bold;
			}
		}
	}
}
</style>
