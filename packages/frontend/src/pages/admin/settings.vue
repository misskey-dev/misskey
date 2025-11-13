<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<SearchMarker path="/admin/settings" :label="i18n.ts.general" :keywords="['general', 'settings']" icon="ti ti-settings">
			<div class="_gaps_m">
				<SearchMarker v-slot="slotProps" :keywords="['information', 'meta']">
					<MkFolder :defaultOpen="true">
						<template #icon><SearchIcon><i class="ti ti-info-circle"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ i18n.ts.info }}</SearchLabel></template>
						<template v-if="infoForm.modified.value" #footer>
							<MkFormFooter :form="infoForm"/>
						</template>

						<div class="_gaps">
							<SearchMarker :keywords="['name']">
								<MkInput v-model="infoForm.state.name">
									<template #label><SearchLabel>{{ i18n.ts.instanceName }}</SearchLabel><span v-if="infoForm.modifiedStates.name" class="_modified">{{ i18n.ts.modified }}</span></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker :keywords="['shortName']">
								<MkInput v-model="infoForm.state.shortName">
									<template #label><SearchLabel>{{ i18n.ts._serverSettings.shortName }}</SearchLabel> ({{ i18n.ts.optional }})<span v-if="infoForm.modifiedStates.shortName" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #caption><SearchText>{{ i18n.ts._serverSettings.shortNameDescription }}</SearchText></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker :keywords="['description']">
								<MkTextarea v-model="infoForm.state.description">
									<template #label><SearchLabel>{{ i18n.ts.instanceDescription }}</SearchLabel><span v-if="infoForm.modifiedStates.description" class="_modified">{{ i18n.ts.modified }}</span></template>
								</MkTextarea>
							</SearchMarker>

							<FormSplit :minWidth="300">
								<SearchMarker :keywords="['maintainer', 'name']">
									<MkInput v-model="infoForm.state.maintainerName">
										<template #label><SearchLabel>{{ i18n.ts.maintainerName }}</SearchLabel><span v-if="infoForm.modifiedStates.maintainerName" class="_modified">{{ i18n.ts.modified }}</span></template>
									</MkInput>
								</SearchMarker>

								<SearchMarker :keywords="['maintainer', 'email', 'contact']">
									<MkInput v-model="infoForm.state.maintainerEmail" type="email">
										<template #label><SearchLabel>{{ i18n.ts.maintainerEmail }}</SearchLabel><span v-if="infoForm.modifiedStates.maintainerEmail" class="_modified">{{ i18n.ts.modified }}</span></template>
										<template #prefix><i class="ti ti-mail"></i></template>
									</MkInput>
								</SearchMarker>
							</FormSplit>

							<SearchMarker :keywords="['tos', 'termsOfService']">
								<MkInput v-model="infoForm.state.tosUrl" type="url">
									<template #label><SearchLabel>{{ i18n.ts.tosUrl }}</SearchLabel><span v-if="infoForm.modifiedStates.tosUrl" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #prefix><i class="ti ti-link"></i></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker :keywords="['privacyPolicy']">
								<MkInput v-model="infoForm.state.privacyPolicyUrl" type="url">
									<template #label><SearchLabel>{{ i18n.ts.privacyPolicyUrl }}</SearchLabel><span v-if="infoForm.modifiedStates.privacyPolicyUrl" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #prefix><i class="ti ti-link"></i></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker :keywords="['inquiry', 'contact']">
								<MkInput v-model="infoForm.state.inquiryUrl" type="url">
									<template #label><SearchLabel>{{ i18n.ts._serverSettings.inquiryUrl }}</SearchLabel><span v-if="infoForm.modifiedStates.inquiryUrl" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #caption><SearchText>{{ i18n.ts._serverSettings.inquiryUrlDescription }}</SearchText></template>
									<template #prefix><i class="ti ti-link"></i></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker :keywords="['repository', 'url']">
								<MkInput v-model="infoForm.state.repositoryUrl" type="url">
									<template #label><SearchLabel>{{ i18n.ts.repositoryUrl }}</SearchLabel><span v-if="infoForm.modifiedStates.repositoryUrl" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #caption><SearchText>{{ i18n.ts.repositoryUrlDescription }}</SearchText></template>
									<template #prefix><i class="ti ti-link"></i></template>
								</MkInput>
							</SearchMarker>

							<MkInfo v-if="!instance.providesTarball && !infoForm.state.repositoryUrl" warn>
								{{ i18n.ts.repositoryUrlOrTarballRequired }}
							</MkInfo>

							<SearchMarker :keywords="['impressum', 'legalNotice']">
								<MkInput v-model="infoForm.state.impressumUrl" type="url">
									<template #label><SearchLabel>{{ i18n.ts.impressumUrl }}</SearchLabel><span v-if="infoForm.modifiedStates.impressumUrl" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #caption><SearchText>{{ i18n.ts.impressumDescription }}</SearchText></template>
									<template #prefix><i class="ti ti-link"></i></template>
								</MkInput>
							</SearchMarker>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps" :keywords="['pinned', 'users']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #icon><SearchIcon><i class="ti ti-user-star"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ i18n.ts.pinnedUsers }}</SearchLabel></template>
						<template v-if="pinnedUsersForm.modified.value" #footer>
							<MkFormFooter :form="pinnedUsersForm"/>
						</template>

						<MkTextarea v-model="pinnedUsersForm.state.pinnedUsers">
							<template #label>{{ i18n.ts.pinnedUsers }}<span v-if="pinnedUsersForm.modifiedStates.pinnedUsers" class="_modified">{{ i18n.ts.modified }}</span></template>
							<template #caption><SearchText>{{ i18n.ts.pinnedUsersDescription }}</SearchText></template>
						</MkTextarea>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps" :keywords="['serviceWorker']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #icon><SearchIcon><i class="ti ti-world-cog"></i></SearchIcon></template>
						<template #label><SearchLabel>ServiceWorker</SearchLabel></template>
						<template v-if="serviceWorkerForm.modified.value" #footer>
							<MkFormFooter :form="serviceWorkerForm"/>
						</template>

						<div class="_gaps">
							<SearchMarker>
								<MkSwitch v-model="serviceWorkerForm.state.enableServiceWorker">
									<template #label><SearchLabel>{{ i18n.ts.enableServiceworker }}</SearchLabel><span v-if="serviceWorkerForm.modifiedStates.enableServiceWorker" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #caption><SearchText>{{ i18n.ts.serviceworkerInfo }}</SearchText></template>
								</MkSwitch>
							</SearchMarker>

							<template v-if="serviceWorkerForm.state.enableServiceWorker">
								<SearchMarker>
									<MkInput v-model="serviceWorkerForm.state.swPublicKey">
										<template #label><SearchLabel>Public key</SearchLabel><span v-if="serviceWorkerForm.modifiedStates.swPublicKey" class="_modified">{{ i18n.ts.modified }}</span></template>
										<template #prefix><i class="ti ti-key"></i></template>
									</MkInput>
								</SearchMarker>

								<SearchMarker>
									<MkInput v-model="serviceWorkerForm.state.swPrivateKey">
										<template #label><SearchLabel>Private key</SearchLabel><span v-if="serviceWorkerForm.modifiedStates.swPrivateKey" class="_modified">{{ i18n.ts.modified }}</span></template>
										<template #prefix><i class="ti ti-key"></i></template>
									</MkInput>
								</SearchMarker>
							</template>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps" :keywords="['ads']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #icon><SearchIcon><i class="ti ti-ad"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ i18n.ts._ad.adsSettings }}</SearchLabel></template>
						<template v-if="adForm.modified.value" #footer>
							<MkFormFooter :form="adForm"/>
						</template>

						<div class="_gaps">
							<div class="_gaps_s">
								<SearchMarker>
									<MkInput v-model="adForm.state.notesPerOneAd" :min="0" type="number">
										<template #label><SearchLabel>{{ i18n.ts._ad.notesPerOneAd }}</SearchLabel><span v-if="adForm.modifiedStates.notesPerOneAd" class="_modified">{{ i18n.ts.modified }}</span></template>
										<template #caption>{{ i18n.ts._ad.setZeroToDisable }}</template>
									</MkInput>
								</SearchMarker>

								<MkInfo v-if="adForm.state.notesPerOneAd > 0 && adForm.state.notesPerOneAd < 20" :warn="true">
									{{ i18n.ts._ad.adsTooClose }}
								</MkInfo>
							</div>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps" :keywords="['url', 'preview']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #icon><SearchIcon><i class="ti ti-world-search"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ i18n.ts._urlPreviewSetting.title }}</SearchLabel></template>
						<template v-if="urlPreviewForm.modified.value" #footer>
							<MkFormFooter :form="urlPreviewForm"/>
						</template>

						<div class="_gaps">
							<SearchMarker>
								<MkSwitch v-model="urlPreviewForm.state.urlPreviewEnabled">
									<template #label><SearchLabel>{{ i18n.ts._urlPreviewSetting.enable }}</SearchLabel><span v-if="urlPreviewForm.modifiedStates.urlPreviewEnabled" class="_modified">{{ i18n.ts.modified }}</span></template>
								</MkSwitch>
							</SearchMarker>

							<template v-if="urlPreviewForm.state.urlPreviewEnabled">
								<SearchMarker :keywords="['allow', 'redirect']">
									<MkSwitch v-model="urlPreviewForm.state.urlPreviewAllowRedirect">
										<template #label><SearchLabel>{{ i18n.ts._urlPreviewSetting.allowRedirect }}</SearchLabel><span v-if="urlPreviewForm.modifiedStates.urlPreviewAllowRedirect" class="_modified">{{ i18n.ts.modified }}</span></template>
										<template #caption>{{ i18n.ts._urlPreviewSetting.allowRedirectDescription }}</template>
									</MkSwitch>
								</SearchMarker>

								<SearchMarker :keywords="['contentLength']">
									<MkSwitch v-model="urlPreviewForm.state.urlPreviewRequireContentLength">
										<template #label><SearchLabel>{{ i18n.ts._urlPreviewSetting.requireContentLength }}</SearchLabel><span v-if="urlPreviewForm.modifiedStates.urlPreviewRequireContentLength" class="_modified">{{ i18n.ts.modified }}</span></template>
										<template #caption>{{ i18n.ts._urlPreviewSetting.requireContentLengthDescription }}</template>
									</MkSwitch>
								</SearchMarker>

								<SearchMarker :keywords="['contentLength']">
									<MkInput v-model="urlPreviewForm.state.urlPreviewMaximumContentLength" type="number">
										<template #label><SearchLabel>{{ i18n.ts._urlPreviewSetting.maximumContentLength }}</SearchLabel><span v-if="urlPreviewForm.modifiedStates.urlPreviewMaximumContentLength" class="_modified">{{ i18n.ts.modified }}</span></template>
										<template #caption>{{ i18n.ts._urlPreviewSetting.maximumContentLengthDescription }}</template>
									</MkInput>
								</SearchMarker>

								<SearchMarker :keywords="['timeout']">
									<MkInput v-model="urlPreviewForm.state.urlPreviewTimeout" type="number">
										<template #label><SearchLabel>{{ i18n.ts._urlPreviewSetting.timeout }}</SearchLabel><span v-if="urlPreviewForm.modifiedStates.urlPreviewTimeout" class="_modified">{{ i18n.ts.modified }}</span></template>
										<template #caption>{{ i18n.ts._urlPreviewSetting.timeoutDescription }}</template>
									</MkInput>
								</SearchMarker>

								<SearchMarker :keywords="['userAgent']">
									<MkInput v-model="urlPreviewForm.state.urlPreviewUserAgent" type="text">
										<template #label><SearchLabel>{{ i18n.ts._urlPreviewSetting.userAgent }}</SearchLabel><span v-if="urlPreviewForm.modifiedStates.urlPreviewUserAgent" class="_modified">{{ i18n.ts.modified }}</span></template>
										<template #caption>{{ i18n.ts._urlPreviewSetting.userAgentDescription }}</template>
									</MkInput>
								</SearchMarker>

								<div>
									<SearchMarker :keywords="['proxy']">
										<MkInput v-model="urlPreviewForm.state.urlPreviewSummaryProxyUrl" type="text">
											<template #label><SearchLabel>{{ i18n.ts._urlPreviewSetting.summaryProxy }}</SearchLabel><span v-if="urlPreviewForm.modifiedStates.urlPreviewSummaryProxyUrl" class="_modified">{{ i18n.ts.modified }}</span></template>
											<template #caption>[{{ i18n.ts.notUsePleaseLeaveBlank }}] {{ i18n.ts._urlPreviewSetting.summaryProxyDescription }}</template>
										</MkInput>
									</SearchMarker>

									<div :class="$style.subCaption">
										{{ i18n.ts._urlPreviewSetting.summaryProxyDescription2 }}
										<ul style="padding-left: 20px; margin: 4px 0">
											<li>{{ i18n.ts._urlPreviewSetting.timeout }} / key:timeout</li>
											<li>{{ i18n.ts._urlPreviewSetting.maximumContentLength }} / key:contentLengthLimit</li>
											<li>{{ i18n.ts._urlPreviewSetting.requireContentLength }} / key:contentLengthRequired</li>
											<li>{{ i18n.ts._urlPreviewSetting.userAgent }} / key:userAgent</li>
										</ul>
									</div>
								</div>
							</template>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps" :keywords="['federation']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #icon><SearchIcon><i class="ti ti-planet"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ i18n.ts.federation }}</SearchLabel></template>
						<template v-if="federationForm.savedState.federation === 'all'" #suffix>{{ i18n.ts.all }}</template>
						<template v-else-if="federationForm.savedState.federation === 'specified'" #suffix>{{ i18n.ts.specifyHost }}</template>
						<template v-else-if="federationForm.savedState.federation === 'none'" #suffix>{{ i18n.ts.none }}</template>
						<template v-if="federationForm.modified.value" #footer>
							<MkFormFooter :form="federationForm"/>
						</template>

						<div class="_gaps">
							<SearchMarker>
								<MkRadios
									v-model="federationForm.state.federation"
									:options="[
										{ value: 'all', label: i18n.ts.all },
										{ value: 'specified', label: i18n.ts.specifyHost },
										{ value: 'none', label: i18n.ts.none },
									]"
								>
									<template #label><SearchLabel>{{ i18n.ts.behavior }}</SearchLabel><span v-if="federationForm.modifiedStates.federation" class="_modified">{{ i18n.ts.modified }}</span></template>
								</MkRadios>
							</SearchMarker>

							<SearchMarker :keywords="['hosts']">
								<MkTextarea v-if="federationForm.state.federation === 'specified'" v-model="federationForm.state.federationHosts">
									<template #label><SearchLabel>{{ i18n.ts.federationAllowedHosts }}</SearchLabel><span v-if="federationForm.modifiedStates.federationHosts" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #caption>{{ i18n.ts.federationAllowedHostsDescription }}</template>
								</MkTextarea>
							</SearchMarker>

							<SearchMarker :keywords="['suspended', 'software']">
								<MkFolder>
									<template #icon><i class="ti ti-list"></i></template>
									<template #label><SearchLabel>{{ i18n.ts._serverSettings.deliverSuspendedSoftware }}</SearchLabel></template>
									<template #footer>
										<div class="_buttons">
											<MkButton @click="federationForm.state.deliverSuspendedSoftware.push({software: '', versionRange: ''})"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
										</div>
									</template>

									<div :class="$style.metadataRoot" class="_gaps_s">
										<MkInfo>{{ i18n.ts._serverSettings.deliverSuspendedSoftwareDescription }}</MkInfo>
										<div v-for="(element, index) in federationForm.state.deliverSuspendedSoftware" :key="index" v-panel :class="$style.fieldDragItem">
											<button class="_button" :class="$style.dragItemRemove" @click="federationForm.state.deliverSuspendedSoftware.splice(index, 1)"><i class="ti ti-x"></i></button>
											<div :class="$style.dragItemForm">
												<FormSplit :minWidth="200">
													<MkInput v-model="element.software" small :placeholder="i18n.ts.softwareName">
													</MkInput>
													<MkInput v-model="element.versionRange" small :placeholder="i18n.ts.version">
													</MkInput>
												</FormSplit>
											</div>
										</div>
									</div>
								</MkFolder>
							</SearchMarker>

							<SearchMarker :keywords="['sign', 'get']">
								<MkSwitch v-model="federationForm.state.signToActivityPubGet">
									<template #label><SearchLabel>{{ i18n.ts._serverSettings.signToActivityPubGet }}</SearchLabel><span v-if="federationForm.modifiedStates.signToActivityPubGet" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #caption><SearchText>{{ i18n.ts._serverSettings.signToActivityPubGet_description }}</SearchText></template>
								</MkSwitch>
							</SearchMarker>

							<SearchMarker :keywords="['proxy', 'remote', 'files']">
								<MkSwitch v-model="federationForm.state.proxyRemoteFiles">
									<template #label><SearchLabel>{{ i18n.ts._serverSettings.proxyRemoteFiles }}</SearchLabel><span v-if="federationForm.modifiedStates.proxyRemoteFiles" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #caption><SearchText>{{ i18n.ts._serverSettings.proxyRemoteFiles_description }}</SearchText></template>
								</MkSwitch>
							</SearchMarker>

							<SearchMarker :keywords="['allow', 'external', 'redirect']">
								<MkSwitch v-model="federationForm.state.allowExternalApRedirect">
									<template #label><SearchLabel>{{ i18n.ts._serverSettings.allowExternalApRedirect }}</SearchLabel><span v-if="federationForm.modifiedStates.allowExternalApRedirect" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #caption>
										<div><SearchText>{{ i18n.ts._serverSettings.allowExternalApRedirect_description }}</SearchText></div>
										<div>{{ i18n.ts.needToRestartServerToApply }}</div>
									</template>
								</MkSwitch>
							</SearchMarker>

							<SearchMarker :keywords="['cache', 'remote', 'files']">
								<MkSwitch v-model="federationForm.state.cacheRemoteFiles">
									<template #label><SearchLabel>{{ i18n.ts.cacheRemoteFiles }}</SearchLabel><span v-if="federationForm.modifiedStates.cacheRemoteFiles" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #caption><SearchText>{{ i18n.ts.cacheRemoteFilesDescription }}</SearchText>{{ i18n.ts.youCanCleanRemoteFilesCache }}</template>
								</MkSwitch>
							</SearchMarker>

							<template v-if="federationForm.state.cacheRemoteFiles">
								<SearchMarker :keywords="['cache', 'remote', 'sensitive', 'files']">
									<MkSwitch v-model="federationForm.state.cacheRemoteSensitiveFiles">
										<template #label><SearchLabel>{{ i18n.ts.cacheRemoteSensitiveFiles }}</SearchLabel><span v-if="federationForm.modifiedStates.cacheRemoteSensitiveFiles" class="_modified">{{ i18n.ts.modified }}</span></template>
										<template #caption><SearchText>{{ i18n.ts.cacheRemoteSensitiveFilesDescription }}</SearchText></template>
									</MkSwitch>
								</SearchMarker>
							</template>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps" :keywords="['proxy', 'account']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #icon><SearchIcon><i class="ti ti-ghost"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ i18n.ts.proxyAccount }}</SearchLabel></template>
						<template v-if="proxyAccountForm.modified.value" #footer>
							<MkFormFooter :form="proxyAccountForm"/>
						</template>

						<div class="_gaps">
							<MkInfo>{{ i18n.ts.proxyAccountDescription }}</MkInfo>

							<SearchMarker :keywords="['description']">
								<MkTextarea v-model="proxyAccountForm.state.description" :max="500" tall mfmAutocomplete :mfmPreview="true">
									<template #label><SearchLabel>{{ i18n.ts._profile.description }}</SearchLabel></template>
									<template #caption>{{ i18n.ts._profile.youCanIncludeHashtags }}</template>
								</MkTextarea>
							</SearchMarker>
						</div>
					</MkFolder>
				</SearchMarker>

				<MkButton primary @click="openSetupWizard">
					Open setup wizard
				</MkButton>
			</div>
		</SearchMarker>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkInfo from '@/components/MkInfo.vue';
import FormSplit from '@/components/form/split.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { fetchInstance, instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import { useForm } from '@/composables/use-form.js';
import MkFormFooter from '@/components/MkFormFooter.vue';
import MkRadios from '@/components/MkRadios.vue';

const meta = await misskeyApi('admin/meta');

const proxyAccount = await misskeyApi('users/show', { userId: meta.proxyAccountId });

const infoForm = useForm({
	name: meta.name ?? '',
	shortName: meta.shortName ?? '',
	description: meta.description ?? '',
	maintainerName: meta.maintainerName ?? '',
	maintainerEmail: meta.maintainerEmail ?? '',
	tosUrl: meta.tosUrl ?? '',
	privacyPolicyUrl: meta.privacyPolicyUrl ?? '',
	inquiryUrl: meta.inquiryUrl ?? '',
	repositoryUrl: meta.repositoryUrl ?? '',
	impressumUrl: meta.impressumUrl ?? '',
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		name: state.name,
		shortName: state.shortName === '' ? null : state.shortName,
		description: state.description,
		maintainerName: state.maintainerName,
		maintainerEmail: state.maintainerEmail,
		tosUrl: state.tosUrl,
		privacyPolicyUrl: state.privacyPolicyUrl,
		inquiryUrl: state.inquiryUrl,
		repositoryUrl: state.repositoryUrl,
		impressumUrl: state.impressumUrl,
	});
	fetchInstance(true);
});

const pinnedUsersForm = useForm({
	pinnedUsers: meta.pinnedUsers.join('\n'),
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		pinnedUsers: state.pinnedUsers.split('\n'),
	});
	fetchInstance(true);
});

const serviceWorkerForm = useForm({
	enableServiceWorker: meta.enableServiceWorker,
	swPublicKey: meta.swPublickey ?? '',
	swPrivateKey: meta.swPrivateKey ?? '',
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		enableServiceWorker: state.enableServiceWorker,
		swPublicKey: state.swPublicKey,
		swPrivateKey: state.swPrivateKey,
	});
	fetchInstance(true);
});

const adForm = useForm({
	notesPerOneAd: meta.notesPerOneAd,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		notesPerOneAd: state.notesPerOneAd,
	});
	fetchInstance(true);
});

const urlPreviewForm = useForm({
	urlPreviewEnabled: meta.urlPreviewEnabled,
	urlPreviewAllowRedirect: meta.urlPreviewAllowRedirect,
	urlPreviewTimeout: meta.urlPreviewTimeout,
	urlPreviewMaximumContentLength: meta.urlPreviewMaximumContentLength,
	urlPreviewRequireContentLength: meta.urlPreviewRequireContentLength,
	urlPreviewUserAgent: meta.urlPreviewUserAgent ?? '',
	urlPreviewSummaryProxyUrl: meta.urlPreviewSummaryProxyUrl ?? '',
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		urlPreviewEnabled: state.urlPreviewEnabled,
		urlPreviewAllowRedirect: state.urlPreviewAllowRedirect,
		urlPreviewTimeout: state.urlPreviewTimeout,
		urlPreviewMaximumContentLength: state.urlPreviewMaximumContentLength,
		urlPreviewRequireContentLength: state.urlPreviewRequireContentLength,
		urlPreviewUserAgent: state.urlPreviewUserAgent,
		urlPreviewSummaryProxyUrl: state.urlPreviewSummaryProxyUrl,
	});
	fetchInstance(true);
});

const federationForm = useForm({
	federation: meta.federation,
	federationHosts: meta.federationHosts.join('\n'),
	deliverSuspendedSoftware: meta.deliverSuspendedSoftware,
	signToActivityPubGet: meta.signToActivityPubGet,
	proxyRemoteFiles: meta.proxyRemoteFiles,
	allowExternalApRedirect: meta.allowExternalApRedirect,
	cacheRemoteFiles: meta.cacheRemoteFiles,
	cacheRemoteSensitiveFiles: meta.cacheRemoteSensitiveFiles,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		federation: state.federation,
		federationHosts: state.federationHosts.split('\n'),
		deliverSuspendedSoftware: state.deliverSuspendedSoftware,
		signToActivityPubGet: state.signToActivityPubGet,
		proxyRemoteFiles: state.proxyRemoteFiles,
		allowExternalApRedirect: state.allowExternalApRedirect,
		cacheRemoteFiles: state.cacheRemoteFiles,
		cacheRemoteSensitiveFiles: state.cacheRemoteSensitiveFiles,
	});
	fetchInstance(true);
});

const proxyAccountForm = useForm({
	description: proxyAccount.description,
}, async (state) => {
	await os.apiWithDialog('admin/update-proxy-account', {
		description: state.description,
	});
	fetchInstance(true);
});

async function openSetupWizard() {
	const { canceled } = await os.confirm({
		type: 'warning',
		title: i18n.ts._serverSettings.restartServerSetupWizardConfirm_title,
		text: i18n.ts._serverSettings.restartServerSetupWizardConfirm_text,
	});
	if (canceled) return;

	const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkServerSetupWizardDialog.vue').then(x => x.default), {
	}, {
		closed: () => dispose(),
	});
}

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.general,
	icon: 'ti ti-settings',
}));
</script>

<style lang="scss" module>
.subCaption {
	font-size: 0.85em;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
}

.metadataRoot {
	container-type: inline-size;
}

.fieldDragItem {
	display: flex;
	padding: 10px;
	align-items: flex-end;
	border-radius: 6px;

	/* (drag button) 32px + (drag button margin) 8px + (input width) 200px * 2 + (input gap) 12px = 452px */
	@container (max-width: 452px) {
		align-items: center;
	}
}

.dragItemHandle {
	cursor: grab;
	width: 32px;
	height: 32px;
	margin: 0 8px 0 0;
	opacity: 0.5;
	flex-shrink: 0;

	&:active {
		cursor: grabbing;
	}
}

.dragItemRemove {
	@extend .dragItemHandle;

	color: #ff2a2a;
	opacity: 1;
	cursor: pointer;

	&:hover, &:focus {
		opacity: .7;
	}

	&:active {
		cursor: pointer;
	}
}

.dragItemForm {
	flex-grow: 1;
}
</style>
