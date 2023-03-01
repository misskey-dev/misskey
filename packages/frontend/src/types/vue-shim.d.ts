// ref: https://github.com/vuejs/vue-cli/issues/1198
declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent;
  // vueはデフォルトインポートで読み込むのでルールを無効化する
  // eslint-disable-next-line import/no-default-export
  export default component;
}
