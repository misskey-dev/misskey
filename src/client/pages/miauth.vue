<template>
<div v-if="$store.getters.isSignedIn">
	<div class="waiting _card" v-if="state == 'waiting'">
		<div class="_content">
			<mk-loading/>
		</div>
	</div>
	<div class="denied _card" v-if="state == 'denied'">
		<div class="_content">
			<p>{{ $t('_auth.denied') }}</p>
		</div>
	</div>
	<div class="accepted _card" v-else-if="state == 'accepted'">
		<div class="_content">
			<p v-if="callback">{{ $t('_auth.callback') }}<mk-ellipsis/></p>
			<p v-else>{{ $t('_auth.pleaseGoBack') }}</p>
		</div>
	</div>
	<div class="_card" v-else>
		<div class="_title" v-if="name">{{ $t('_auth.shareAccess', { name: name }) }}</div>
		<div class="_title" v-else>{{ $t('_auth.shareAccessAsk') }}</div>
		<div class="_content">
			<p>{{ $t('_auth.permissionAsk') }}</p>
			<ul>
				<template v-for="p in permission">
					<li :key="p">{{ $t(`_permissions.${p}`) }}</li>
				</template>
			</ul>
		</div>
		<div class="_footer">
			<mk-button @click="deny" inline>{{ $t('cancel') }}</mk-button>
			<mk-button @click="accept" inline primary>{{ $t('accept') }}</mk-button>
		</div>
	</div>
</div>
<div class="signin" v-else>
	<mk-signin @login="onLogin"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkSignin from '../components/signin.vue';
import MkButton from '../components/ui/button.vue';

export default Vue.extend({
	components: {
		MkSignin,
		MkButton,
	},
	data() {
		return {
			state: null
		};
	},
	computed: {
		session(): string {
			return this.$route.params.session;
		},
		callback(): string {
			return this.$route.query.callback;
		},
		name(): string {
			return this.$route.query.name;
		},
		icon(): string {
			return this.$route.query.icon;
		},
		permission(): string[] {
			return this.$route.query.permission ? this.$route.query.permission.split(',') : [];
		},
	},
	methods: {
		async accept() {
			this.state = 'waiting';
			await this.$root.api('miauth/gen-token', {
				session: this.session,
				name: this.name,
				iconUrl: this.icon,
				permission: this.permission,
			});

			this.state = 'accepted';
			if (this.callback) {
				location.href = `${this.callback}?session=${this.session}`;
			}
		},
		deny() {
			this.state = 'denied';
		},
		onLogin(res) {
			localStorage.setItem('i', res.i);
			location.reload();
		}
	}
});
</script>

<style lang="scss" scoped>

</style>
