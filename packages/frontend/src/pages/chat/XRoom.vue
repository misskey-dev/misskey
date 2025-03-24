<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA :to="`/chat/room/${room.id}`" class="_panel _gaps_s" :class="$style.root">
	<div :class="$style.header">
		<div style="font-weight: bold;">{{ room.name }}</div>
		<MkAvatar :user="room.owner" :link="false" :class="$style.headerAvatar"/>
	</div>
	<hr>
	<div>{{ room.description }}</div>
</MkA>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';

const props = defineProps<{
	room: Misskey.entities.ChatRoom;
}>();

</script>

<style lang="scss" module>
.root {
	padding: 16px;
}

.header {
	display: flex;
	align-items: center;
}

.headerAvatar {
	width: 30px;
	height: 30px;
	margin-left: auto;
}
</style>
