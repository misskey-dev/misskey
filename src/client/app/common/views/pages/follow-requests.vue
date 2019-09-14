<template>
<div>
	<ui-container :body-togglable="true">
		<template #header>{{ $t('received-follow-requests') }}</template>
		<div v-if="!fetching">
			<sequential-entrance animation="entranceFromTop" delay="25" tag="div">
				<div v-for="req in requests" class="mcbzkkaw">
					<router-link :key="req.id" :to="req.follower | userPage">
						<mk-user-name :user="req.follower"/>
					</router-link>
					<span>
						<a @click="accept(req.follower)">{{ $t('accept') }}</a> | <a @click="reject(req.follower)">{{ $t('reject') }}</a>
					</span>
				</div>
			</sequential-entrance>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../scripts/loading';
import { faUserClock } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/pages/follow-requests.vue'),
	data() {
		return {
			fetching: true,
			requests: []
		};
	},
	created() {
		this.$emit('init', {
			title: this.$t('received-follow-requests'),
			icon: faUserClock
		});
	},
	mounted() {
		Progress.start();
		this.$root.api('following/requests/list').then(requests => {
			this.fetching = false;
			this.requests = requests;
			Progress.done();
		});
	},
	methods: {
		accept(user) {
			this.$root.api('following/requests/accept', { userId: user.id }).then(() => {
				this.requests = this.requests.filter(r => r.follower.id != user.id);
			});
		},
		reject(user) {
			this.$root.api('following/requests/reject', { userId: user.id }).then(() => {
				this.requests = this.requests.filter(r => r.follower.id != user.id);
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mcbzkkaw
	display flex
	padding 16px
	border solid 1px var(--faceDivider)
	border-radius 4px

	> span
		margin 0 0 0 auto
		color var(--text)

</style>
