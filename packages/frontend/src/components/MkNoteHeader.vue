<template>
<header class="kkwtjztg">
	<MkA v-user-preview="note.user.id" class="name" :to="userPage(note.user)">
		<MkUserName :user="note.user"/>
	</MkA>
	<div v-if="note.user.isBot" class="is-bot">bot</div>
	<div class="username"><MkAcct :user="note.user"/></div>
	<div class="info">
		<MkA class="created-at" :to="notePage(note)">
			<MkTime :time="note.createdAt"/>
		</MkA>
		<MkVisibility :note="note"/>
	</div>
</header>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as misskey from 'misskey-js';
import MkVisibility from '@/components/MkVisibility.vue';
import { notePage } from '@/filters/note';
import { userPage } from '@/filters/user';

defineProps<{
	note: misskey.entities.Note;
	pinned?: boolean;
}>();
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
	}
}
</style>
