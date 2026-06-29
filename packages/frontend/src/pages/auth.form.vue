<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only

📝 O'zbekcha izoh:
Bu sahifa - OAuth/Authentifikatsiya formas
Tretinchi tomon ilovalar uchun ruxsatni tasdiqlaydigan forma
-->

<template>
<section>
	<!-- Ruxsatlar (agar bor bo'lsa) -->
	<div v-if="permissions.length > 0">
		<p>{{ i18n.tsx._auth.permission({ name }) }}</p>
		<ul>
			<!-- Har bir ruxsat turini ro'yxat qilish -->
			<li v-for="p in permissions" :key="p">{{ i18n.ts._permissions[p] ?? p }}</li>
		</ul>
	</div>
	<!-- Kirish ruxsati xabari -->
	<div>{{ i18n.tsx._auth.shareAccess({ name: `${name} (${app.id})` }) }}</div>
	<!-- Tugmalar: Bekor qilish / Qabul qilish -->
	<div :class="$style.buttons">
		<MkButton inline @click="cancel">{{ i18n.ts.cancel }}</MkButton>
		<MkButton inline primary @click="accept">{{ i18n.ts.accept }}</MkButton>
	</div>
</section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';

// Prop-lar: Authentifikatsiya sessiyasi ma'lumotlari
const props = defineProps<{
	session: Misskey.entities.AuthSessionShowResponse;
}>();

// Event-lar: Qabul qilindi / Rad etildi
const emit = defineEmits<{
	(event: 'accepted'): void;
	(event: 'denied'): void;
}>();

// Ilova ma'lumotlari
const app = computed(() => props.session.app);

// Ruxsatlar ro'yxati
const permissions = computed(() => {
	return props.session.app.permission.filter((p): p is typeof Misskey.permissions[number] => typeof p === 'string');
});

// Ilova nomini HTML-dan himoya qilish
const name = computed(() => {
	const el = window.document.createElement('div');
	el.textContent = app.value.name;
	return el.innerHTML;
});

// Bekor qilish funksiyasi
function cancel() {
	//misskeyApi('auth/deny', {
	//	token: props.session.token,
	//}).then(() => {
	//	emit('denied');
	//});

	emit('denied');
}

// Qabul qilish funksiyasi - API-ga so'rov yuborish
function accept() {
	misskeyApi('auth/accept', {
		token: props.session.token,
	}).then(() => {
		emit('accepted');
	});
}
</script>

<style lang="scss" module>
// Tugmalar: joylashtirilishi va bo'shligi
.buttons {
	margin-top: 16px;
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}
</style>
