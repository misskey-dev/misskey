<template>
<div>
	<ui-card>
		<div slot="title"><fa :icon="faTerminal"/> {{ $t('federation') }}</div>
		<section class="fit-top">
			<ui-input class="target" v-model="target" type="text" @enter="showInstance">
				<span>{{ $t('host') }}</span>
			</ui-input>
			<ui-button @click="showInstance"><fa :icon="faSearch"/> {{ $t('lookup') }}</ui-button>

			<div class="instance" v-if="instance">
				<ui-input :value="instance.host" type="text" readonly>
					<span>{{ $t('host') }}</span>
				</ui-input>
				<ui-horizon-group inputs>
					<ui-input :value="instance.notesCount | number" type="text" readonly>
						<span>{{ $t('notes') }}</span>
					</ui-input>
					<ui-input :value="instance.usersCount | number" type="text" readonly>
						<span>{{ $t('users') }}</span>
					</ui-input>
				</ui-horizon-group>
				<ui-horizon-group inputs>
					<ui-input :value="instance.followingCount | number" type="text" readonly>
						<span>{{ $t('following') }}</span>
					</ui-input>
					<ui-input :value="instance.followersCount | number" type="text" readonly>
						<span>{{ $t('followers') }}</span>
					</ui-input>
				</ui-horizon-group>
				<ui-horizon-group inputs>
					<ui-input :value="instance.latestRequestSentAt" type="text" readonly>
						<span>{{ $t('latest-request-sent-at') }}</span>
					</ui-input>
					<ui-input :value="instance.latestStatus" type="text" readonly>
						<span>{{ $t('status') }}</span>
					</ui-input>
				</ui-horizon-group>
				<ui-input :value="instance.latestRequestReceivedAt" type="text" readonly>
					<span>{{ $t('latest-request-received-at') }}</span>
				</ui-input>
			</div>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title"><fa :icon="faUsers"/> {{ $t('instances') }}</div>
		<section class="fit-top">
			<ui-horizon-group inputs>
				<ui-select v-model="sort">
					<span slot="label">{{ $t('sort') }}</span>
					<option value="-caughtAt">{{ $t('sorts.caughtAtAsc') }}</option>
					<option value="+caughtAt">{{ $t('sorts.caughtAtDesc') }}</option>
					<option value="-notes">{{ $t('sorts.notesAsc') }}</option>
					<option value="+notes">{{ $t('sorts.notesDesc') }}</option>
					<option value="-users">{{ $t('sorts.usersAsc') }}</option>
					<option value="+users">{{ $t('sorts.usersDesc') }}</option>
					<option value="-following">{{ $t('sorts.followingAsc') }}</option>
					<option value="+following">{{ $t('sorts.followingDesc') }}</option>
					<option value="-followers">{{ $t('sorts.followersAsc') }}</option>
					<option value="+followers">{{ $t('sorts.followersDesc') }}</option>
				</ui-select>
			</ui-horizon-group>

			<div class="instances">
				<header>
					<span>{{ $t('host') }}</span>
					<span>{{ $t('notes') }}</span>
					<span>{{ $t('users') }}</span>
					<span>{{ $t('following') }}</span>
					<span>{{ $t('followers') }}</span>
					<span>{{ $t('status') }}</span>
				</header>
				<div v-for="instance in instances">
					<span>{{ instance.host }}</span>
					<span>{{ instance.notesCount | number }}</span>
					<span>{{ instance.usersCount | number }}</span>
					<span>{{ instance.followingCount | number }}</span>
					<span>{{ instance.followersCount | number }}</span>
					<span>{{ instance.latestStatus }}</span>
				</div>
			</div>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import { faGlobe, faTerminal, faSearch } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('admin/views/federation.vue'),

	data() {
		return {
			instance: null,
			target: null,
			sort: '+caughtAt',
			limit: 50,
			instances: [],
			faGlobe, faTerminal, faSearch
		};
	},

	watch: {
		sort() {
			this.instances = [];
			this.fetchInstances();
		},
	},

	mounted() {
		this.fetchInstances();
	},

	methods: {
		showInstance() {
			this.$root.api('federation/show-instance', {
				host: this.target
			}).then(instance => {
				if (instance == null) {
					this.$root.dialog({
						type: 'error',
						text: this.$t('instance-not-registered')
					});
				} else {
					this.instance = instance;
					this.target = '';
				}
			});
		},

		fetchInstances() {
			this.$root.api('federation/instances', {
				sort: this.sort
			}).then(instances => {
				this.instances = instances;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.target
	margin-bottom 16px !important

.instances
	width 100%

	> header
		display flex

		> *
			color var(--text)
			font-weight bold

	> div
		display flex

	> * > *
		flex 1
		overflow auto

		&:first-child
			min-width 200px

</style>
