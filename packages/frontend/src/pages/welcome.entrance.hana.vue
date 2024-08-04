<template>
<div :class="$style.root">
	<div :class="$style.heroRoot">
		<img :src="instance.backgroundImageUrl" :class="$style.backgroundImage" alt=""/>
		<div :class="$style.titleRoot">
			<h1 :class="$style.logo">
				<span :class="$style.visuallyHidden">はなみすきー</span>
				<img :class="$style.logoImage" src="https://static-assets.misskey.flowers/brand-assets/logotype/logotype_temp.png"/>
			</h1>
			<div :class="$style.cta">
				<div :class="$style.actions">
					<MkButton :class="[$style.mainAction, $style.action1]" full rounded gradate data-cy-signup @click="signup()">{{ i18n.ts.joinThisServer }}</MkButton>
					<MkButton :class="[$style.mainAction, $style.action2]" full rounded @click="upcomingFeatureDialog()">？？？</MkButton>
					<MkButton :class="[$style.mainAction, $style.action3]" full rounded data-cy-signin @click="signin()">{{ i18n.ts.login }}</MkButton>
				</div>
			</div>
		</div>
	</div>

	<div :class="$style.aboutRoot">
		<div :class="$style.aboutWrapper">
			<I18n :src="i18n.ts._hana._welcome.whatAboutX" tag="h2" :class="$style.aboutTitle" style="text-align: center;">
				<template #x>
					<span style="color: var(--hana-theme);">{{ i18n.ts._hana._welcome._aboutHana.title }}</span>
				</template>
			</I18n>
			<div class="_gaps">
				<div :class="$style.aboutDescription" style="text-align: center;">{{ i18n.ts._hana._welcome._aboutHana.description }}</div>
				<MkInfo v-if="instance.disableRegistration" style="width: fit-content; margin: 0 auto;" warn>{{ i18n.ts.invitationRequiredToRegister }}</MkInfo>
			</div>

			<div :class="$style.decentralizedRoot">
				<I18n :src="i18n.ts._hana._welcome.whatAboutX" tag="h2" :class="$style.aboutTitle">
					<template #x>
						<span style="color: var(--misskey-accent);">{{ i18n.ts._hana._welcome._aboutDecentralized.title }}</span>
					</template>
				</I18n>
				<div :class="$style.aboutDescription">{{ i18n.ts._hana._welcome._aboutDecentralized.description }}</div>
			</div>
		</div>
	</div>

	<div :class="$style.featuresRoot">
		<div :class="$style.feature" v-for="feature in features" :key="feature.title">
			<div :class="$style.featureRoot">
				<div :class="[$style.featureImage, { [$style.noImage]: (feature.image == null) }]">
					<img v-if="feature.image" :src="feature.image" alt=""/>
				</div>
				<div class="_gaps">
					<div v-if="feature.isInDevelopment">
						<span :class="$style.featureInDevelopment">{{ i18n.ts._hana._welcome._features.inDevelopment }}</span>
					</div>
					<h3 :class="$style.featureTitle">{{ feature.title }}</h3>
					<div :class="$style.featureDescription">{{ feature.description }}</div>
				</div>
			</div>
		</div>
	</div>

	<div :class="$style.footerCtaRoot" class="_gaps">
		<div :class="$style.footerCtaTitle">{{ i18n.ts._hana._welcome._cta.title }}</div>
		<MkButton :class="[$style.mainAction, $style.footerButton]" rounded transparent data-cy-signup @click="signup()">
			<span :class="$style.footerButtonText">{{ i18n.ts.joinThisServer }}</span>
		</MkButton>
		<div style="text-align: center;">
			<button :class="$style.footerCtaSubButton" class="_textButton" @click="signin">{{ i18n.ts.login }}</button>
		</div>
	</div>

	<div :class="$style.footerRoot" class="_gaps_s">
		<div style="text-align: center;">&copy; 2024 Misskey.flowers Project</div>
		<div :class="$style.links">
			<MkA to="/about">{{ i18n.ts.instanceInfo }}</MkA>
			<a v-if="instance.impressumUrl" :href="instance.impressumUrl">{{ i18n.ts.impressum }}</a>
			<a v-if="instance.tosUrl" :href="instance.tosUrl">{{ i18n.ts.termsOfService }}</a>
			<a v-if="instance.privacyPolicyUrl" :href="instance.privacyPolicyUrl">{{ i18n.ts.privacyPolicy }}</a>
			<a :href="instance.repositoryUrl">{{ i18n.ts.sourceCode }}</a>
		</div>
	</div>
</div>
</template>

<script setup lang="ts">
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import XSigninDialog from '@/components/MkSigninDialog.vue';
import XSignupDialog from '@/components/MkSignupDialog.vue';

type FeatureItem = {
	title: string;
	description: string;
	isInDevelopment?: boolean;
	image?: string;
};

const features: FeatureItem[] = [
	{
		title: i18n.ts._hana._welcome._features._hanaMode.title,
		description: i18n.ts._hana._welcome._features._hanaMode.description,
	},
	{
		title: i18n.ts._hana._welcome._features._easyMigration.title,
		description: i18n.ts._hana._welcome._features._easyMigration.description,
		isInDevelopment: true,
	},
	{
		title: i18n.ts._hana._welcome._features._preciseSearching.title,
		description: i18n.ts._hana._welcome._features._preciseSearching.description,
		isInDevelopment: true,
	},
	{
		title: i18n.ts._hana._welcome._features._lotsOfCustomEmojis.title,
		description: i18n.ts._hana._welcome._features._lotsOfCustomEmojis.description,
	},
];

function signin() {
	const { dispose } = os.popup(XSigninDialog, {
		autoSet: true,
	}, {
		closed: () => dispose(),
	});
}

function signup() {
	const { dispose } = os.popup(XSignupDialog, {
		autoSet: true,
	}, {
		closed: () => dispose(),
	});
}

function upcomingFeatureDialog() {
	os.alert({
		title: i18n.ts._hana._inDevelopment.title,
		text: i18n.ts._hana._inDevelopment.description,
	});
}
</script>

<style lang="scss" module>
.root,
.root * {
	box-sizing: border-box;
}

.root {
	--paddingSize: 19px;
	--innerBorderSize: 3px;
	--outerBorderSize: calc(var(--paddingSize) - var(--innerBorderSize));

	--fullViewHeight: calc(100dvh - var(--paddingSize) * 2);

	--hana-theme: #fd709a;
	--hana-themeAlt: #f77062;
	--hana-themeWeak: rgba(253, 112, 154, 0.2);

	--misskey-accent: #86b300;

	padding: var(--paddingSize);
	position: relative;

	min-height: 100dvh;

	&::before {
		position: fixed;
		display: block;
		content: '';
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: calc(100% - calc(var(--outerBorderSize) * 2));
		height: calc(100% - calc(var(--outerBorderSize) * 2));
		border: calc(var(--outerBorderSize) * 4) solid var(--panel);
		border-radius: calc(calc(var(--outerBorderSize) * 4) + 12px);
		z-index: 9999;
		pointer-events: none;
	}

	&::after {
		position: fixed;
		display: block;
		content: '';
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: calc(100% - calc(var(--paddingSize) * 2));
		height: calc(calc(100% - calc(var(--paddingSize) * 2)));
		border: var(--innerBorderSize) solid var(--hana-theme);
		border-radius: 12px;
		z-index: 9999;
		pointer-events: none;
	}
}

.visuallyHidden {
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;

	&:not(caption) {
		position: absolute;
	}
}

.heroRoot {
	position: relative;
	width: 100%;
	height: var(--fullViewHeight);
}

.backgroundImage {
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.titleRoot {
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 100%;
}

.logo {
	background: linear-gradient(transparent, var(--bg));
	width: 100%;
	min-height: 25%;
	padding: 16px 16px 0 16px;
	margin: 0;
}

.logoImage {
	display: block;
	margin: 0 auto;
	width: 100%;
	max-width: 500px;
}

.cta {
	background: var(--bg);
	width: 100%;
	min-height: 75%;
	padding: 16px;
}

.actions {
	width: 100%;
	display: grid;
	gap: 8px;
	margin: 0 auto;
}

.action2 {
	order: 3;
}

.mainAction {
	line-height: 28px;
	padding-left: 24px;
	padding-right: 24px;
}

.aboutRoot {
	max-width: 840px;
	margin: 32px auto;
}

.aboutWrapper {
	margin: 0 16px;
	padding: 16px;
	border-radius: var(--radius);
	background: var(--panel);
}

.decentralizedRoot {
	margin-top: 32px;
	padding: 16px;
	border-radius: var(--radius);
	background: var(--panel);

	border: 2px dashed var(--misskey-accent);

	font-size: 90%;
}

.aboutTitle {
	margin: 0 0 .5em 0;
	padding: 0;
	font-size: 1.5em;
	text-decoration: 1px dashed underline;
	text-underline-offset: .4em;
}

.aboutDescription {
	margin: 0;
	padding: 0;
	line-height: 2;
	white-space: pre-wrap;
}

.feature {
	padding: 32px 0;
}

.featureRoot {
	max-width: 1280px;
	padding: 0 16px;
	margin: 0 auto;

	display: grid;
	gap: 16px;
}

.featureTitle {
	margin: 0;
	padding: 0;
	font-size: 1.3em;
}

.featureDescription {
	margin: 0;
	padding: 0;
	line-height: 1.75;
	white-space: pre-wrap;
}

.featureInDevelopment {
	display: inline-block;
	padding: 4px 12px;
	font-size: .9em;
	border-radius: 99rem;
	background: var(--hana-themeWeak);
}

.featureImage {
	width: 100%;
	height: auto;
	aspect-ratio: 3 / 2;

	&.noImage {
		background-color: #aaa;
		border-radius: var(--radius);
	}
}

.featuresRoot .feature:nth-child(odd) {
	background: var(--panel);
}

.footerCtaRoot {
	padding: 32px 16px;
	background: linear-gradient(45deg, var(--hana-theme), var(--hana-themeAlt));
}

.footerCtaTitle {
	margin: 0;
	padding: 0;
	font-size: 1.5em;
	font-weight: 700;
	text-align: center;
	color: #fff;
}

.footerButton {
	margin: 0 auto;
	background: #fff!important;
	font-weight: 700;

	.footerButtonText {
		color: var(--hana-theme);
		background: linear-gradient(45deg, var(--hana-theme), var(--hana-themeAlt));
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	&:hover {
		background: #f0f0f0!important;
	}
}

.footerCtaSubButton {
	color: #fff;
	font-size: .9em;
}

.footerRoot {
	padding: 24px;
}

.links {
	font-size: .9em;
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 16px;

	a {
		color: var(--fg);
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}
}

@media (min-width: 680px) {
	.cta {
		padding: 24px;
	}

	.actions {
		width: fit-content;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}

	.action1 {
		order: 2;
	}

	.action2 {
		order: 1;
	}

	.action3 {
		order: 3;
	}

	.aboutWrapper {
		padding: 32px;
	}

	.featureInDevelopment {
		font-size: 1em;
	}

	.featureRoot {
		padding: 16px 32px;
	}

	.featureTitle {
		font-size: 1.4em;
	}

	.featureDescription {
		font-size: 1.1em;
	}

	.featuresRoot .feature:nth-child(odd) {
		.featureImage {
			order: 2;
		}

		.featureRoot {
			grid-template-columns: 2fr 1fr;
		}
	}

	.featuresRoot .feature:nth-child(even) {
		.featureRoot {
			grid-template-columns: 1fr 2fr;
		}
	}
}

</style>
