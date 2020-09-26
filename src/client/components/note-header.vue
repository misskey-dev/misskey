<template>
<header class="kkwtjztg">
	<router-link class="name" :to="note.user | userPage" v-user-preview="note.user.id">
		<mk-user-name :user="note.user"/>
	</router-link>
	<span class="is-bot" v-if="note.user.isBot">bot</span>
	<span class="username"><mk-acct :user="note.user"/></span>
	<span class="admin" v-if="note.user.isAdmin"><fa :icon="faBookmark"/></span>
	<span class="moderator" v-if="!note.user.isAdmin && note.user.isModerator"><fa :icon="farBookmark"/></span>
	<div class="info">
		<span class="mobile" v-if="note.viaMobile"><fa :icon="faMobileAlt"/></span>
		<router-link class="created-at" :to="note | notePage">
			<mk-time :time="note.createdAt"/>
		</router-link>
		<span class="visibility" v-if="note.visibility !== 'public'">
			<fa v-if="note.visibility === 'home'" :icon="faHome"/>
			<fa v-if="note.visibility === 'followers'" :icon="faUnlock"/>
			<fa v-if="note.visibility === 'specified'" :icon="faEnvelope"/>
		</span>
		<span class="localOnly" v-if="note.localOnly"><fa :icon="faBiohazard"/></span>
	</div>
</header>
</template>

<script lang="ts">
import Vue from 'vue';
import { faHome, faUnlock, faEnvelope, faMobileAlt, faBookmark, faBiohazard } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as farBookmark } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
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
