<template>
<ui-card>
	<div slot="title">%fa:ban% %i18n:@mute-and-block%</div>

	<section>
		<header>%i18n:@mute%</header>
		<ui-info v-if="!muteFetching && mute.length == 0">
			<p>%i18n:@no-muted-users%</p>
		</ui-info>
		<div class="users" v-if="mute.length != 0">
			<div v-for="user in mute" :key="user.id">
				<p><b>{{ user | userName }}</b> @{{ user | acct }}</p>
			</div>
		</div>
	</section>

	<section>
		<header>%i18n:@block%</header>
		<ui-info v-if="!blockFetching && block.length == 0">
			<p>%i18n:@no-blocked-users%</p>
		</ui-info>
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

export default Vue.extend({
	data() {
		return {
			muteFetching: true,
			blockFetching: true,
			mute: [],
			block: []
		};
	},

	mounted() {
		(this as any).api('mute/list').then(mute => {
			this.mute = mute.map(x => x.mutee);
			this.muteFetching = false;
		});

		(this as any).api('blocking/list').then(blocking => {
			this.block = blocking.map(x => x.blockee);
			this.blockFetching = false;
		});
	}
});
</script>
