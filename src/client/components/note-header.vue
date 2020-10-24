<template>
<header class="kkwtjztg">
	<MkA class="name" :to="userPage(note.user)" v-user-preview="note.user.id">
		<MkUserName :user="note.user"/>
	</MkA>
	<span class="is-bot" v-if="note.user.isBot">bot</span>
	<span class="username"><MkAcct :user="note.user"/></span>
	<span class="admin" v-if="note.user.isAdmin"><Fa :icon="faBookmark"/></span>
	<span class="moderator" v-if="!note.user.isAdmin && note.user.isModerator"><Fa :icon="farBookmark"/></span>
	<div class="info">
		<span class="mobile" v-if="note.viaMobile"><Fa :icon="faMobileAlt"/></span>
		<MkA class="created-at" :to="notePage(note)" :props="{ noteId: note.id }">
			<MkTime :time="note.createdAt"/>
		</MkA>
		<span class="visibility" v-if="note.visibility !== 'public'">
			<Fa v-if="note.visibility === 'home'" :icon="faHome"/>
			<Fa v-if="note.visibility === 'followers'" :icon="faUnlock"/>
			<Fa v-if="note.visibility === 'specified'" :icon="faEnvelope"/>
		</span>
		<span class="localOnly" v-if="note.localOnly"><Fa :icon="faBiohazard"/></span>
	</div>
</header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faHome, faUnlock, faEnvelope, faMobileAlt, faBookmark, faBiohazard } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as farBookmark } from '@fortawesome/free-regular-svg-icons';
import notePage from '../filters/note';
import { userPage } from '../filters/user';
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
			faHome, faUnlock, faEnvelope, faMobileAlt, faBookmark, farBookmark, faBiohazard
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
		border: solid 1px var(--divider);
		border-radius: 3px;
	}

	> .admin,
	> .moderator {
		margin-right: 0.5em;
		color: var(--badge);
	}

	> .username {
		margin: 0 .5em 0 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	> .info {
		margin-left: auto;
		font-size: 0.9em;

		> .mobile {
			margin-right: 8px;
		}

		> .visibility {
			margin-left: 8px;
		}

		> .localOnly {
			margin-left: 8px;
		}
	}
}
</style>
