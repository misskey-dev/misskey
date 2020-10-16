<template>
<MkError v-if="error" @retry="init()"/>

<div v-else class="efvhhmdq">
	<div class="no-users" v-if="empty">
		<p>{{ $t('noUsers') }}</p>
	</div>
	<div class="users">
		<MkUserInfo class="user" v-for="user in users" :user="user" :key="user.id"/>
	</div>
	<button class="more" v-appear="$store.state.device.enableInfiniteScroll ? fetchMore : null" @click="fetchMore" :class="{ fetching: moreFetching }" v-show="more" :disabled="moreFetching">
		<template v-if="moreFetching"><Fa icon="spinner" pulse fixed-width/></template>{{ moreFetching ? $t('loading') : $t('loadMore') }}
	</button>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import paging from '@/scripts/paging';
import MkUserInfo from './user-info.vue';
import { userPage } from '../filters/user';

export default defineComponent({
	components: {
		MkUserInfo,
	},

	mixins: [
		paging({}),
	],

	props: {
		pagination: {
			required: true
		},
		extract: {
			required: false
		},
		expanded: {
			type: Boolean,
			default: true
		},
	},

	computed: {
		users() {
			return this.extract ? this.extract(this.items) : this.items;
		}
	},

	methods: {
		userPage
	}
});
</script>

<style lang="scss" scoped>
.efvhhmdq {
	> .no-users {
		text-align: center;
	}

	> .users {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		grid-gap: var(--margin);
	}

	> .more {
		display: block;
		width: 100%;
		padding: 16px;

		&:hover {
			background: rgba(#000, 0.025);
		}

		&:active {
			background: rgba(#000, 0.05);
		}

		&.fetching {
			cursor: wait;
		}

		> [data-icon] {
			margin-right: 4px;
		}
	}
}
</style>
