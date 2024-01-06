<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<a :class="$style.root" @click="UserInfoUpdate"><i class="ti ti-alert-triangle" style="margin-right: 8px;"></i>{{ i18n.ts.remoteUserInfoUpdate }}</a>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
const props = withDefaults(defineProps<{
  UserId: string;
}>(), {
	UserId: null,
});

function UserInfoUpdate() {
	misskeyApi('federation/update-remote-user', { userId: props.UserId });
}

</script>

<style lang="scss" module>
.root {
	font-size: 0.8em;
	padding: 16px;
	background: var(--infoWarnBg);
	color: var(--infoWarnFg);
	border-radius: var(--radius);
	overflow: clip;
}

.link {
	margin-left: 4px;
	color: var(--accent);
}
</style>
