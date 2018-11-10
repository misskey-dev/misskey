<template>
<ui-card>
	<div slot="title"><fa icon="ban"/> {{ $t('mute-and-block') }}</div>

	<section>
		<header>{{ $t('mute') }}</header>
		<ui-info v-if="!muteFetching && mute.length == 0">{{ $t('no-muted-users') }}</ui-info>
		<div class="users" v-if="mute.length != 0">
			<div v-for="user in mute" :key="user.id">
				<p><b>{{ user | userName }}</b> @{{ user | acct }}</p>
			</div>
		</div>
	</section>

	<section>
		<header>{{ $t('block') }}</header>
		<ui-info v-if="!blockFetching && block.length == 0">{{ $t('no-blocked-users') }}</ui-info>
		<div class="users" v-if="block.length != 0">
			<div v-for="user in block" :key="user.id">
				<p><b>{{ user | userName }}</b> @{{ user | acct }}</p>
			</div>
		</div>
	</section>
</ui-card>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('common/views/components/mute-and-block.vue'),
	data() {
		return {
			muteFetching: true,
			blockFetching: true,
			mute: [],
			block: []
		};
	},

	mounted() {
		this.$root.api('mute/list').then(mute => {
			this.mute = mute.map(x => x.mutee);
			this.muteFetching = false;
		});

		this.$root.api('blocking/list').then(blocking => {
			this.block = blocking.map(x => x.blockee);
			this.blockFetching = false;
		});
	}
});
</script>
