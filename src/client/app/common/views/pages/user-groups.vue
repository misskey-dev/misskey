<template>
<ui-container>
	<template #header><fa :icon="faUsers"/> {{ $t('user-groups') }}</template>
	<ui-margin>
		<ui-button @click="add"><fa :icon="faPlus"/> {{ $t('create-group') }}</ui-button>
	</ui-margin>
	<div class="hwgkdrbl" v-for="group in groups" :key="group.id">
		<ui-hr/>
		<ui-margin>
			<router-link :to="`/i/groups/${group.id}`">{{ group.name }}</router-link>
		</ui-margin>
	</div>
</ui-container>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { faUsers, faPlus } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/components/user-groups.vue'),
	data() {
		return {
			fetching: true,
			groups: [],
			faUsers, faPlus
		};
	},
	mounted() {
		this.$root.api('users/groups/owned').then(groups => {
			this.fetching = false;
			this.groups = groups;
		});

		this.$emit('init', {
			title: this.$t('user-groups'),
			icon: faUsers
		});
	},
	methods: {
		add() {
			this.$root.dialog({
				title: this.$t('group-name'),
				input: true
			}).then(async ({ canceled, result: name }) => {
				if (canceled) return;
				const list = await this.$root.api('users/groups/create', {
					name
				});

				this.groups.push(list)
			});
		},
	}
});
</script>

<style lang="stylus" scoped>
.hwgkdrbl
	display block

</style>
