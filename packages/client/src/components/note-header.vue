<template>
<header class="kkwtjztg">
	<MkA v-user-preview="note.user.id" class="name" :to="userPage(note.user)">
		<MkUserName :user="note.user"/>
	</MkA>
	<div v-if="note.user.isBot" class="is-bot">bot</div>
	<div class="username"><MkAcct :user="note.user"/></div>
	<div v-if="note.user.isAdmin" class="admin"><i class="fas fa-bookmark"></i></div>
	<div v-if="!note.user.isAdmin && note.user.isModerator" class="moderator"><i class="far fa-bookmark"></i></div>
	<div class="info">
		<MkA class="created-at" :to="notePage(note)">
			<MkTime :time="note.createdAt"/>
		</MkA>
		<span v-if="note.visibility !== 'public'" class="visibility">
			<i v-if="note.visibility === 'home'" class="fas fa-home"></i>
			<i v-else-if="note.visibility === 'followers'" class="fas fa-unlock"></i>
			<i v-else-if="note.visibility === 'specified'" class="fas fa-envelope"></i>
		</span>
		<span v-if="note.localOnly" class="localOnly"><i class="fas fa-biohazard"></i></span>
	</div>
</header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import notePage from '@/filters/note';
import { userPage } from '@/filters/user';
import * as os from '@/os';

export default defineComponent({
	props: {
		note: {
			type: Object,
			required: true
		},
	},

	data() {
		return {
		};
	},

	methods: {
		notePage,
		userPage
	}
});
</script>

<style lang="scss" scoped>
.kkwtjztg {
	display: flex;
	align-items: baseline;
	white-space: nowrap;

	> .name {
		flex-shrink: 1;
		display: block;
		margin: 0 .5em 0 0;
		padding: 0;
		overflow: hidden;
		font-size: 1em;
		font-weight: bold;
		text-decoration: none;
		text-overflow: ellipsis;

		&:hover {
			text-decoration: underline;
		}
	}

	> .is-bot {
		flex-shrink: 0;
		align-self: center;
		margin: 0 .5em 0 0;
		padding: 1px 6px;
		font-size: 80%;
		border: solid 0.5px var(--divider);
		border-radius: 3px;
	}

	> .admin,
	> .moderator {
		flex-shrink: 0;
		margin-right: 0.5em;
		color: var(--badge);
	}

	> .username {
		flex-shrink: 9999999;
		margin: 0 .5em 0 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	> .info {
		flex-shrink: 0;
		margin-left: auto;
		font-size: 0.9em;

		> .visibility {
			margin-left: 8px;
		}

		> .localOnly {
			margin-left: 8px;
		}
	}
}
</style>
