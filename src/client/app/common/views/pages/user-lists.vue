<template>
<ui-container>
	<template #header><fa :icon="faListUl"/> {{ $t('user-lists') }}</template>
	<ui-margin>
		<ui-button @click="add"><fa :icon="faPlus"/> {{ $t('create-list') }}</ui-button>
	</ui-margin>
	<div class="cpqqyrst" v-for="list in lists" :key="list.id">
		<ui-hr/>
		<ui-margin>
			<router-link :to="`/i/lists/${list.id}`">{{ list.name }}</router-link>
			<x-avatars :user-ids="list.userIds" style="margin-top:8px;"/>
		</ui-margin>
	</div>
</ui-container>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { faListUl, faPlus } from '@fortawesome/free-solid-svg-icons';
import XAvatars from '../../views/components/avatars.vue';

export default Vue.extend({
	i18n: i18n('common/views/components/user-lists.vue'),
	components: {
		XAvatars
	},
	data() {
		return {
			fetching: true,
			lists: [],
			faListUl, faPlus
		};
	},
	mounted() {
		document.title = this.$root.instanceName;
		
		this.$root.api('users/lists/list').then(lists => {
			this.fetching = false;
			this.lists = lists;
		});

		this.$emit('init', {
			title: this.$t('user-lists'),
			icon: faListUl
		});
	},
	methods: {
		add() {
			this.$root.dialog({
				title: this.$t('list-name'),
				input: true
			}).then(async ({ canceled, result: name }) => {
				if (canceled) return;
				const list = await this.$root.api('users/lists/create', {
					name
				});

				this.lists.push(list)
			});
		},
	}
});
</script>

<style lang="stylus" scoped>
.cpqqyrst
	display block

</style>
