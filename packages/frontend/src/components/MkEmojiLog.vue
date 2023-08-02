<template>
<MkFolder>
	<template #label><MkTime :time="emojiLog.createDate" mode="absolute"/></template>
	<template #suffix>
		<span v-if="emojiLog.type === 'Add'">{{ i18n.ts.add }}</span>
		<span v-else-if="emojiLog.type === 'Update'">{{ i18n.ts.update }}</span>
		<span v-else>{{ i18n.ts.unknown }}</span>
	</template>

	<div class="_gaps_s" :class="$style.root">
		<div :class="$style.items">
			<div>
				<div :class="$style.label">{{ i18n.ts.user }}</div>
				<div v-if="emojiLog.user" :class="$style.user">
					<MkAvatar :user="emojiLog.user" :class="$style.avatar" link preview/>
					<MkUserName :user="emojiLog.user" :nowrap="false"/>
					<div>({{ emojiLog.userId }})</div>
				</div>
				<div v-else>{{ emojiLog.userId ?? i18n.ts.unknown }}</div>
			</div>
			<div>
				<div :class="$style.label">{{ i18n.ts.loggingDate }}</div>
				<div><MkTime :time="emojiLog.createDate" mode="absolute"/></div>
			</div>
		</div>
		<div>
			<div :class="$style.label">{{ i18n.ts.changes }}</div>
			<div v-for="property in emojiLog.changesProperties" :key="property.type">
				<div :class="$style.label">{{ typeToi18n[property.type] }}</div>
				<div v-if="property.type === 'aliases'">
					<div v-if="property.changeInfo.before.length !== 0">
						<div :class="$style.label">{{ i18n.ts.removedAliases }}</div>
						<div>
							<span v-for="(value, index) in property.changeInfo.before" :key="value">{{ value }}{{ property.changeInfo.before.length - 1 !== index ? ', ' : ''}}</span>
						</div>
					</div>
					<div v-if="property.changeInfo.after.length !== 0">
						<div :class="$style.label">{{ i18n.ts.addedAliases }}</div>
						<div>
							<span v-for="(value, index) in property.changeInfo.after" :key="value">{{ value }}{{ property.changeInfo.after.length - 1 !== index ? ', ' : ''}}</span>
						</div>
					</div>
				</div>
				<div v-else>
					<div>{{ property.changeInfo.before ?? i18n.ts.none }} {{ i18n.ts.changeTo }} {{ property.changeInfo.after ?? i18n.ts.none }}</div>
				</div>
			</div>
		</div>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as misskey from 'misskey-js';
import MkFolder from '@/components/MkFolder.vue';
import { i18n } from '@/i18n';

const typeToi18n = {
	name: i18n.ts.name,
	category: i18n.ts.category,
	originalUrl: i18n.ts.emojiUrl,
	aliases: i18n.ts.tags,
	license: i18n.ts.license,
	localOnly: i18n.ts.localOnly,
	isSensitive: i18n.ts.markAsSensitive,
};

const props = defineProps<{
	emojiLog: misskey.entities.EmojiLog;
}>();

const isExpired = computed(() => {
	return props.emojiLog.expiresAt && new Date(props.emojiLog.expiresAt) < new Date();
});
</script>

<style lang="scss" module>
.root {
	text-align: left;
}

.items {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	grid-gap: 12px;
}

.label {
	font-size: 0.85em;
	padding: 0 0 8px 0;
	user-select: none;
	opacity: 0.7;
}

.user {
	display: flex;
	align-items: center;
	gap: 8px;
}

.avatar {
	--height: 24px;
	width: var(--height);
	height: var(--height);
}
</style>
