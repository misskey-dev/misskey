<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<div style="overflow: clip;">
		<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-w: 600px;">
			<div class="_gaps_m znqjceqz">
				<div v-panel class="about">
					<div ref="containerEl" class="container">
						<img :src="imageSource" alt="" class="icon" draggable="false" :class="{ fadeOut: isFadingOut }" @click="handleIconClick"/>
						<div class="misskey">HanaMisskey</div>
					</div>
				</div>
				<div style="text-align: center;">
					{{ i18n.ts._hana._aboutHanaMisskey.about }}<br>
				</div>
				<div v-if="$i != null" style="text-align: center;">
					<MkButton primary rounded inline @click="iLoveHanaMisskey">I <Mfm text="$[jelly 💛]"/> #HanaMisskey</MkButton>
				</div>
				<FormSection>
					<div class="_gaps_s">
						<FormLink to="https://docs.misskey.flowers" external>
							<template #icon><i class="ti ti-notebook"></i></template>
							{{ i18n.ts._hana._aboutHanaMisskey.documentation }}
						</FormLink>
						<FormLink to="https://status.misskey.flowers" external>
							<template #icon><i class="ti ti-device-analytics"></i></template>
							{{ i18n.ts._hana._aboutHanaMisskey.serviceStatus }}
						</FormLink>
						<FormLink to="https://legacy.misskey.flowers" external>
							<template #icon><i class="ti ti-archive"></i></template>
							{{ i18n.ts._hana._aboutHanaMisskey.bskArchives }}
						</FormLink>
					</div>
				</FormSection>
				<FormSection>
					<template #label>{{ i18n.ts._hana._aboutHanaMisskey.teamMembers }}</template>
					<div :class="$style.contributors">
						<a href="https://github.com/kanarikanaru" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/93921745?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@kanarikanaru</span>
						</a>
						<a href="https://github.com/1STEP621" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/86859447?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@1Step621</span>
						</a>
						<a href="https://github.com/kakkokari-gtyih" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/67428053?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@kakkokari-gtyih</span>
						</a>
						<a href="https://github.com/mirashiya37" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/99032275?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@mirashiya37</span>
						</a>
						<a href="https://github.com/ULO-BACKDOOR" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/171937924?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@ULO-BACKDOOR</span>
						</a>
					</div>
				</FormSection>
				<FormSection>
					<template #label>Special Thanks</template>
					<div class="_gaps">
						<MkKeyValue>
							<template #key>Branding Supervisor</template>
							<template #value>
								<div :class="[$style.creditKvValue, $style.patronsWithIcon]">
									<div :class="$style.patronWithIcon">
										<img src="https://static-assets.misskey.flowers/misc/patrons/f1c3a3b1-18c0-4b31-8409-22938bd1173f.png" :class="$style.patronIcon">
										<span :class="$style.patronName">桜川七帆</span>
									</div>
								</div>
							</template>
						</MkKeyValue>
					</div>
				</FormSection>
				<FormSection>
					<template #label><Mfm text="$[jelly 💛]"/> {{ i18n.ts._hana._aboutHanaMisskey.bskPatrons }}</template>
					<div>
						<p>{{ i18n.ts._hana._aboutHanaMisskey.bskDescription }}</p>
					</div>
					<div :class="$style.patronsWithIcon">
						<div v-for="patron in patronsWithIcon" :class="$style.patronWithIcon">
							<img :src="patron.icon" :class="$style.patronIcon">
							<span :class="$style.patronName">{{ patron.name }}</span>
						</div>
					</div>
					<div style="margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); grid-gap: 12px;">
						<div v-for="patron in patrons" :key="patron">{{ patron }}</div>
					</div>
					<p>{{ i18n.ts._hana._aboutHanaMisskey.morePatrons }}</p>
				</FormSection>
			</div>
		</div>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { definePage } from '@/page.js';
import { $i } from '@/i.js';
import { claimAchievement, claimedAchievements } from '@/utility/achievements.js';

const patronsWithIcon = [{
	name: 'masnolia',
	icon: 'https://static-assets.misskey.flowers/misc/patrons/fdf161e8-520a-479e-b3ac-a3efbaf579c8.jpg',
}, {
	name: 'なりすまし多重人格野郎',
	icon: 'https://static-assets.misskey.flowers/misc/patrons/884ea994-28d7-4fee-8569-ea57ed1f57d7.png',
}, {
	name: '桜川七帆',
	icon: 'https://static-assets.misskey.flowers/misc/patrons/f1c3a3b1-18c0-4b31-8409-22938bd1173f.png',
}];

const patrons = [
	'星くず彼方に',
	'deNoN',
	'リラ',
	'kazu',
	'如月ユカ',
];

const clickCount = ref(0);
// イースターエッグでない方のアイコン
// TODO: APPICONに変更
const imageSource = ref('https://static-assets.misskey.flowers/brand-assets/icons/app_v1_192x192.png');
const isFadingOut = ref(false);
const imageChanged = ref(false);
const isAchivementClaimable = ref($i && !claimedAchievements.includes('foundLegacy'));

function handleIconClick() {
	clickCount.value++;
	if (clickCount.value === 10 && !imageChanged.value) {
		isFadingOut.value = true;
		window.setTimeout(() => {
			// イースターエッグの画像
			imageSource.value = '/client-assets/about-bsk-logo.png';
			isFadingOut.value = false;
			imageChanged.value = true;
		}, 250);
		if (isAchivementClaimable.value) {
			claimAchievement('foundLegacy');
		}
	}
}

function iLoveHanaMisskey() {
	os.post({
		initialText: 'I $[jelly ❤] #HanaMisskey',
		instant: true,
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts._hana.aboutHanaMisskey,
	icon: 'ti ti-hanamisskey-hanamode',
}));
</script>

<style lang="scss" scoped>
.znqjceqz {
	> .about {
		position: relative;
		border-radius: var(--MI-radius);

		> .container {
			position: relative;
			text-align: center;
			padding: 16px;

			> .icon {
				display: block;
				width: 80px;
				margin: 0 auto;
				border-radius: 16px;
				position: relative;
				z-index: 1;
				opacity: 1;
				transition: opacity 0.5s ease-in-out;
			}

			> .icon.fadeOut {
				opacity: 0;
				transition: opacity 0.5s ease-in-out;
			}

			> .misskey {
				margin: 0.75em auto 0 auto;
				width: max-content;
				position: relative;
				z-index: 1;
			}

			> .version {
				margin: 0 auto;
				width: max-content;
				opacity: 0.5;
				position: relative;
				z-index: 1;
			}
		}
	}
}
</style>

<style lang="scss" module>
.creditKvValue {
	margin-top: calc(var(--MI-marginHalf) / 2);
}

.contributors {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	grid-gap: 12px;
}

.contributor {
	display: flex;
	align-items: center;
	padding: 12px;
	background: var(--MI_THEME-buttonBg);
	border-radius: 6px;

	&:hover {
		text-decoration: none;
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.active {
		color: var(--MI_THEME-accent);
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.contributorAvatar {
	width: 30px;
	border-radius: 100%;
}

.contributorUsername {
	margin-left: 12px;
}

.patronsWithIcon {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	grid-gap: 12px;
}

.patronWithIcon {
	display: flex;
	align-items: center;
	padding: 12px;
	background: var(--MI_THEME-buttonBg);
	border-radius: 6px;
}

.patronIcon {
	width: 24px;
	border-radius: 100%;
}

.patronName {
	margin-left: 12px;
}
</style>
