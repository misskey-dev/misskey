<template>
<div class="xcukqgmh _panel">
	<portal to="avatar" v-if="page"><mk-avatar class="avatar" :user="page.user" :disable-preview="true"/></portal>
	<portal to="title" v-if="page">{{ page.title || page.name }}</portal>

	<div class="_section" v-if="page" :key="page.id">
		<div class="_title">{{ page.title }}</div>
		<div class="_content">
			<x-page :page="page"/>
		</div>
		<div class="_footer">
			<small>@{{ page.user.username }}</small>
			<template v-if="$store.getters.isSignedIn && $store.state.i.id === page.userId">
				<router-link :to="`/my/pages/edit/${page.id}`">{{ $t('edit-this-page') }}</router-link>
				<a v-if="$store.state.i.pinnedPageId === page.id" @click="pin(false)">{{ $t('unpin-this-page') }}</a>
				<a v-else @click="pin(true)">{{ $t('pin-this-page') }}</a>
			</template>
			<router-link :to="`./${page.name}/view-source`">{{ $t('view-source') }}</router-link>
			<div class="like">
				<button @click="unlike()" v-if="page.isLiked" :title="$t('unlike')"><fa :icon="faHeartS"/></button>
				<button @click="like()" v-else :title="$t('like')"><fa :icon="faHeart"/></button>
				<span class="count" v-if="page.likedCount > 0">{{ page.likedCount }}</span>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XPage from '../components/page/page.vue';

export default Vue.extend({
	components: {
		XPage
	},

	props: {
		pageName: {
			type: String,
			required: true
		},
		username: {
			type: String,
			required: true
		},
	},

	data() {
		return {
			page: null,
		};
	},

	computed: {
		path(): string {
			return this.username + '/' + this.pageName;
		}
	},

	watch: {
		path() {
			this.fetch();
		}
	},

	created() {
		this.fetch();
	},

	methods: {
		fetch() {
			this.$root.api('pages/show', {
				name: this.pageName,
				username: this.username,
			}).then(page => {
				this.page = page;
			});
		},

		like() {
			this.$root.api('pages/like', {
				pageId: this.page.id,
			}).then(() => {
				this.page.isLiked = true;
				this.page.likedCount++;
			});
		},

		unlike() {
			this.$root.api('pages/unlike', {
				pageId: this.page.id,
			}).then(() => {
				this.page.isLiked = false;
				this.page.likedCount--;
			});
		},

		pin(pin) {
			this.$root.api('i/update', {
				pinnedPageId: pin ? this.page.id : null,
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					splash: true
				});
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.xcukqgmh {

}
</style>
