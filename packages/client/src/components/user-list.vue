<template>
<MkError v-if="error" @retry="init()"/>

<div v-else class="efvhhmdq _isolated">
	<div v-if="empty" class="no-users">
		<p>{{ $ts.noUsers }}</p>
	</div>
	<div class="users">
		<MkUserInfo v-for="user in users" :key="user.id" class="user" :user="user"/>
	</div>
	<button v-show="more" v-appear="$store.state.enableInfiniteScroll ? fetchMore : null" class="more" :class="{ fetching: moreFetching }" :disabled="moreFetching" @click="fetchMore">
		<template v-if="moreFetching"><i class="fas fa-spinner fa-pulse fa-fw"></i></template>{{ moreFetching ? $ts.loading : $ts.loadMore }}
	</button>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import paging from '@/scripts/paging';
import MkUserInfo from './user-info.vue';
import { userPage } from '@/filters/user';

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

		> i {
			margin-right: 4px;
		}
	}
}
</style>
