<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
    <template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
    <MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
        <FormSuspense :p="init">
            <MkFolder>
                <template #label>DeepL Translation</template>

                <div class="_gaps_m">
                    <MkInput v-model="deeplAuthKey">
                        <template #prefix><i class="ti ti-key"></i></template>
                        <template #label>DeepL Auth Key</template>
                    </MkInput>
                    <MkSwitch v-model="deeplIsPro">
                        <template #label>Pro account</template>
                    </MkSwitch>
                    <MkButton primary @click="save_deepl">Save</MkButton>
                </div>
            </MkFolder>
            <br />
            <MkFolder>
                <template #label>Text-To-Speech</template>
                <div class="_gaps_m">
                    <MkInput v-model="hfAuthKey">
                        <template #prefix><i class="ti ti-key"></i></template>
                        <template #label>HuggingFace Auth Key</template>
                    </MkInput>
                    <MkSwitch v-model="hfSpace">
                        <template #label>HuggingFace Space</template>
                    </MkSwitch>
                    <div v-if="hfSpace">
                        <MkInput v-model="hfSpaceName">
                            <template #label>Space Name</template>
                        </MkInput>
                        <MkInput v-model="hfexampleAudioURL">
                            <template #label>Example Audio URL</template>
                        </MkInput>
                        <MkSwitch v-model="hfnrm">
                            <template #label>Enable no reference mode</template>
                        </MkSwitch>
                        <div v-if="!hfnrm">
                            <MkInput v-model="hfexampleText">
                                <template #label>Example Text</template>
                            </MkInput>
                        </div>
                        <label for="exampleLanguage">Example Language</label>
                        <select v-model="hfexampleLang" id="exampleLanguage">
                            <option value="" disabled> </option>
                            <option value="Chinese">中文</option>
                            <option value="English">English</option>
                            <option value="Japanese">日本語</option>
                            <option value="Yue">中文 (粤语)</option>
							<option value="Korean">한국어</option>
							<option value="Chinese-English Mixed">中文 - English</option>
							<option value="Japanese-English Mixed">日本語 - English</option>
							<option value="Yue-English Mixed">中文 (粤语) - English</option>
							<option value="Korean-English Mixed">한국어 - English</option>
							<option value="Multilingual Mixed">Multilingual Mixed</option>
							<option value="Multilingual Mixed(Yue)">Multilingual Mixed (Yue)</option>
                        </select>
                        <MkSwitch v-model="hfdas">
                            <template #label>Whether to directly adjust the speech rate and timebre of the last synthesis result to prevent randomness</template>
                        </MkSwitch>
						<label for="ttsslice">Slice</label>
						<select v-model="hfslice" id="ttsslice">
                            <option value="" disabled> </option>
                            <option value="No slice">No slice</option>
                            <option value="Slice once every 4 sentences">Slice once every 4 sentences</option>
                            <option value="Slice per 50 characters">Slice per 50 characters</option>
                            <option value="Slice by Chinese punct">Slice by Chinese punct</option>
							<option value="Slice by English punct">Slice by English punct</option>
							<option value="Slice by every punct">Slice by every punct</option>
                        </select>
                        <label>Set top_k Value: {{ value }}</label>
                        <input
                            type="range"
                            v-model="hftopK"
                            :value="value = 15"
                            :min="0"
                            :max="100"
                            :step="1"
                            @input="value"
                        />
                        <label>Set top_p Value: {{ value.toFixed(2) }}</label>
                        <input
                            type="range"
                            v-model="hftopP"
                            :value="value = 1"
                            :min="0"
                            :max="1"
                            :step="0.05"
                            @input="value = (Math.round(event.target.value / step) * step).toFixed(2)"
                        />
                        <label>Set Temperature Value: {{ value.toFixed(2) }}</label>
                        <input
                            type="range"
                            v-model="hfTemperature"
                            :value="value = 1"
                            :min="0"
                            :max="1"
                            :step="0.05"
                            @input="value = (Math.round(event.target.value / step) * step).toFixed(2)"
                        />
                        <label>Set Speed Rate Value: {{ value.toFixed(2) }}</label>
                        <input
                            type="range"
                            v-model="hfSpeedRate"
                            :value="value = 1.2"
                            :min="0.6"
                            :max="1.65"
                            :step="0.05"
                            @input="value = (Math.round(event.target.value / step) * step).toFixed(2)"
                        />
                    </div>
                    <MkButton primary @click="save_tts">Save</MkButton>
                </div>
            </MkFolder>
        </FormSuspense>
    </MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import XHeader from './_header_.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { fetchInstance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkFolder from '@/components/MkFolder.vue';

const deeplAuthKey = ref<string>('');
const deeplIsPro = ref<boolean>(false);
const hfAuthKey = ref<string>('');
const hfSpace = ref<boolean>(false);
const hfSpaceName = ref<string | null>(null);
const hfexampleAudioURL = ref<string | null>(null);
const hfexampleText = ref<string | null>(null);
const hfexampleLang = ref<string | null>(null);
const hfslice = ref<string | null>('Slice once every 4 sentences');
const hftopK = ref<number>(15);
const hftopP = ref<number>(1.00);
const hfTemperature = ref<number>(1.00);
const hfnrm = ref<boolean>(false);
const hfSpeedRate = ref<number>(1.25);
const hfdas = ref<boolean>(false);


async function init() {
    const meta = await misskeyApi('admin/meta');
    deeplAuthKey.value = meta.deeplAuthKey;
    deeplIsPro.value = meta.deeplIsPro;
    hfAuthKey.value = meta.hfAuthkey;
    hfSpace.value = meta.hfSpace,
    hfSpaceName.value = meta.hfSpaceName,
    hfexampleAudioURL.value = meta.hfexampleAudioURL,
    hfexampleText.value = meta.hfexampleText,
    hfexampleLang.value = meta.hfexampleLang,
    hfslice.value = meta.hfslice,
    hftopK.value = meta.hftopK,
    hftopP.value = meta.hftopP,
    hfTemperature.value = meta.hfTemperature,
    hfnrm.value = meta.hfnrm,
    hfSpeedRate.value = meta.hfSpeedRate,
    hfdas.value = meta.hfdas,
}

function save_deepl() {
    os.apiWithDialog('admin/update-meta', {
        deeplAuthKey: deeplAuthKey.value,
        deeplIsPro: deeplIsPro.value,
    }).then(() => {
        fetchInstance(true);
    });
}

function save_tts() {
    os.apiWithDialog('admin/update-meta', {
        hfAuthKey: hfAuthKey.value,
        hfSpace: hfSpace.value,
        hfSpaceName: hfSpaceName.value,
        hfexampleAudioURL: hfexampleAudioURL.value,
        hfexampleText: hfexampleText.value,
        hfexampleLang: hfexampleLang.value,
        hfslice: hfslice.value,
        hftopK: hftopK.value,
        hftopP: hftopP.value,
        hfTemperature: hfTemperature.value,
        hfnrm: hfnrm.value,
        hfSpeedRate: hfSpeedRate.value,
        hfdas: hfdas.value,
    }).then(() => {
        fetchInstance(true);
    });
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
    title: i18n.ts.externalServices,
    icon: 'ti ti-link',
}));
</script>
