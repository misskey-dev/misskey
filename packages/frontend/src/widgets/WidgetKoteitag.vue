<template>
<MkContainer :scrollable="false">
  <template #icon><i class="ti ti-hash"></i></template>
  <template #header>{{ i18n.ts._widgets.koteitag }}</template>
  <div :class="$style.container">
    <div>
      <MkSelect :class="$style.select" v-model="program_selected">
        <option v-for="option in options" :value="option['key']">{{option['label']}}</option>
      </MkSelect>
    </div>
    <div>
      <MkButton :class="$style.button" class="get" @click="getPrograms">
        <i :class="$style.iconInner" class="ti ti-reload"></i>
      </MkButton>
    </div>
  </div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, reactive, watch } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentExpose } from './widget';
import { GetFormResultType } from '@/scripts/form';
import * as os from '@/os';
import MkContainer from '@/components/MkContainer.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n';

const name = 'koteitag';
const dic = i18n.ts._koteitag;
const program_selected = ref('');
let programs:object[] = [];
let options = reactive({});

const widgetPropsDef = {};
type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

// 現時点ではvueの制限によりimportしたtypeをジェネリックに渡せない
//const props = defineProps<WidgetComponentProps<WidgetProps>>();
//const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const props = defineProps<{ widget?: Widget<WidgetProps>; }>();
const emit = defineEmits<{ (ev: 'updateProps', props: WidgetProps); }>();
const { configure } = useWidgetPropsManager(name, widgetPropsDef, props, emit);

defineExpose<WidgetComponentExpose>({
  name,
  configure,
  id: props.widget ? props.widget.id : null,
});

const getPrograms = async () => {
  options = {clear_tags: {key:'clear_tags', label: dic.clearTags}};
  fetch('/mulukhiya/api/program/update', {method: 'POST'})
    .then(e => fetch('/mulukhiya/api/program'))
    .then(e => e.json())
    .then(e => {
      programs = e;
      Object.keys(programs).filter(k => programs[k]?.enable).map(k => {
        const v = programs[k];
        const label = [v.series];
        if (v.episode) {
          label.push(`${dic.episodePrefix}${v.episode}${v.episode_suffix || dic.episodeSuffix}`);
        }
        if (v.subtitle) label.push(`「${v.subtitle}」`);
        if (v.livecure) {
          if (v.air) label.push(dic.air);
          label.push(dic.livecure);
        }
        if (v.minutes) label.push(`${v.minutes}分`);
        (v.extra_tags || []).map((tag: string) => label.push(tag));
        options[k] = {key: k, label: label.join(' ')};
      });
      options['episode_browser'] = {key:'episode_browser', label: dic.episodeBrowser};
    }).catch(e => os.alert({type: 'error', title: dic.fetch, text: e.message}));
}

const setPrograms = async () => {
  const commandToot = {command: 'user_config', tagging: {}}
  switch (program_selected.value) {
    case 'episode_browser':
      program_selected.value = '';
      window.open('/mulukhiya/app/episode');
      return;

    case 'clear_tags':
      commandToot.tagging['user_tags'] = null;
      break;

    default:
      const v = programs[program_selected.value];
      commandToot.tagging['user_tags'] = [v.series];
      if (v.episode) {
        commandToot.tagging['user_tags'].push(`${v.episode}${v.episode_suffix || dic.episodeSuffix}`);
      }
      if (v.subtitle) commandToot.tagging['user_tags'].push(v.subtitle);
      if (v.air) commandToot.tagging['user_tags'].push(dic.air);
      if (v.livecure) commandToot.tagging['user_tags'].push(dic.livecure);
      (v.extra_tags || []).map((tag: string) => commandToot.tagging['user_tags'].push(tag));
      if (v.minutes) commandToot.tagging['minutes'] = v.minutes;
      break;
  }

  os.confirm({
    type: 'info',
    title: dic.confirmMessage,
    text: options[program_selected.value].label,
  }).then(({ canceled }) => {
    if (canceled) return;
    program_selected.value = '';
    const payload = {
      localOnly: true, // コマンドトゥートは連合に流す必要なし
      poll: null,
      text: JSON.stringify(commandToot),
      visibility: 'specified',
      visibleUserIds: [],
    } as object;
    os.api('notes/create', payload).then(() => os.toast(dic.successMessage));
  });
}

watch(program_selected, (next, prev) => setPrograms());
getPrograms();
</script>

<style lang="scss" module>
.select {
  padding: 5px;
}
.container {
  display: grid;
  grid-template-columns: 85% 15%;
  grid-column-gap: 5px;
  align-items: end;
}
.button {
  margin-bottom: 5px;
  min-width: 60%;
  min-height: 35px;
  padding: 0;
}
.iconInner {
  display: block;
  margin: 0 auto;
  font-size: 12px;
}
</style>
