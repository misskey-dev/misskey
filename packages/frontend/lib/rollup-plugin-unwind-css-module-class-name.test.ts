import { parse } from 'acorn';
import { generate } from 'astring';
import { expect, it } from 'vitest';
import { unwindCssModuleClassName } from './rollup-plugin-unwind-css-module-class-name';

it('Composition API', () => {
	const ast = parse(`
import { c as api, d as defaultStore, i as i18n, aD as notePage, bN as ImgWithBlurhash, bY as getStaticImageUrl, _ as _export_sfc } from './app-!~{001}~.js';
import { M as MkContainer } from './MkContainer-!~{03M}~.js';
import { b as defineComponent, a as ref, e as onMounted, z as resolveComponent, g as openBlock, h as createBlock, i as withCtx, K as createTextVNode, E as toDisplayString, u as unref, l as createBaseVNode, q as normalizeClass, B as createCommentVNode, k as createElementBlock, F as Fragment, C as renderList, A as createVNode } from './vue-!~{002}~.js';
import './photoswipe-!~{003}~.js';

const _hoisted_1 = /* @__PURE__ */ createBaseVNode("i", { class: "ti ti-photo" }, null, -1);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index.photos",
  props: {
    user: {}
  },
  setup(__props) {
    const props = __props;
    let fetching = ref(true);
    let images = ref([]);
    function thumbnail(image) {
      return defaultStore.state.disableShowingAnimatedImages ? getStaticImageUrl(image.url) : image.thumbnailUrl;
    }
    onMounted(() => {
      const image = [
        "image/jpeg",
        "image/webp",
        "image/avif",
        "image/png",
        "image/gif",
        "image/apng",
        "image/vnd.mozilla.apng"
      ];
      api("users/notes", {
        userId: props.user.id,
        fileType: image,
        excludeNsfw: defaultStore.state.nsfw !== "ignore",
        limit: 10
      }).then((notes) => {
        for (const note of notes) {
          for (const file of note.files) {
            images.value.push({
              note,
              file
            });
          }
        }
        fetching.value = false;
      });
    });
    return (_ctx, _cache) => {
      const _component_MkLoading = resolveComponent("MkLoading");
      const _component_MkA = resolveComponent("MkA");
      return openBlock(), createBlock(MkContainer, {
        "max-height": 300,
        foldable: true
      }, {
        icon: withCtx(() => [
          _hoisted_1
        ]),
        header: withCtx(() => [
          createTextVNode(toDisplayString(unref(i18n).ts.images), 1)
        ]),
        default: withCtx(() => [
          createBaseVNode("div", {
            class: normalizeClass(_ctx.$style.root)
          }, [
            unref(fetching) ? (openBlock(), createBlock(_component_MkLoading, { key: 0 })) : createCommentVNode("", true),
            !unref(fetching) && unref(images).length > 0 ? (openBlock(), createElementBlock("div", {
              key: 1,
              class: normalizeClass(_ctx.$style.stream)
            }, [
              (openBlock(true), createElementBlock(Fragment, null, renderList(unref(images), (image) => {
                return openBlock(), createBlock(_component_MkA, {
                  key: image.note.id + image.file.id,
                  class: normalizeClass(_ctx.$style.img),
                  to: unref(notePage)(image.note)
                }, {
                  default: withCtx(() => [
                    createVNode(ImgWithBlurhash, {
                      hash: image.file.blurhash,
                      src: thumbnail(image.file),
                      title: image.file.name
                    }, null, 8, ["hash", "src", "title"])
                  ]),
                  _: 2
                }, 1032, ["class", "to"]);
              }), 128))
            ], 2)) : createCommentVNode("", true),
            !unref(fetching) && unref(images).length == 0 ? (openBlock(), createElementBlock("p", {
              key: 2,
              class: normalizeClass(_ctx.$style.empty)
            }, toDisplayString(unref(i18n).ts.nothing), 3)) : createCommentVNode("", true)
          ], 2)
        ]),
        _: 1
      });
    };
  }
});

const root = "xenMW";
const stream = "xaZzf";
const img = "xtA8t";
const empty = "xhYKj";
const style0 = {
        root: root,
        stream: stream,
        img: img,
        empty: empty
};

const cssModules = {
  "$style": style0
};
const index_photos = /* @__PURE__ */ _export_sfc(_sfc_main, [["__cssModules", cssModules]]);

export { index_photos as default };
`.slice(1), { sourceType: 'module' });
	unwindCssModuleClassName(ast);
	expect(generate(ast)).toBe(`
import {c as api, d as defaultStore, i as i18n, aD as notePage, bN as ImgWithBlurhash, bY as getStaticImageUrl, _ as _export_sfc} from './app-!~{001}~.js';
import {M as MkContainer} from './MkContainer-!~{03M}~.js';
import {b as defineComponent, a as ref, e as onMounted, z as resolveComponent, g as openBlock, h as createBlock, i as withCtx, K as createTextVNode, E as toDisplayString, u as unref, l as createBaseVNode, q as normalizeClass, B as createCommentVNode, k as createElementBlock, F as Fragment, C as renderList, A as createVNode} from './vue-!~{002}~.js';
import './photoswipe-!~{003}~.js';
const _hoisted_1 = createBaseVNode("i", {
  class: "ti ti-photo"
}, null, -1);
const _sfc_main = defineComponent({
  __name: "index.photos",
  props: {
    user: {}
  },
  setup(__props) {
    const props = __props;
    let fetching = ref(true);
    let images = ref([]);
    function thumbnail(image) {
      return defaultStore.state.disableShowingAnimatedImages ? getStaticImageUrl(image.url) : image.thumbnailUrl;
    }
    onMounted(() => {
      const image = ["image/jpeg", "image/webp", "image/avif", "image/png", "image/gif", "image/apng", "image/vnd.mozilla.apng"];
      api("users/notes", {
        userId: props.user.id,
        fileType: image,
        excludeNsfw: defaultStore.state.nsfw !== "ignore",
        limit: 10
      }).then(notes => {
        for (const note of notes) {
          for (const file of note.files) {
            images.value.push({
              note,
              file
            });
          }
        }
        fetching.value = false;
      });
    });
    return (_ctx, _cache) => {
      const _component_MkLoading = resolveComponent("MkLoading");
      const _component_MkA = resolveComponent("MkA");
      return (openBlock(), createBlock(MkContainer, {
        "max-height": 300,
        foldable: true
      }, {
        icon: withCtx(() => [_hoisted_1]),
        header: withCtx(() => [createTextVNode(toDisplayString(unref(i18n).ts.images), 1)]),
        default: withCtx(() => [createBaseVNode("div", {
          class: normalizeClass("xenMW")
        }, [unref(fetching) ? (openBlock(), createBlock(_component_MkLoading, {
          key: 0
        })) : createCommentVNode("", true), !unref(fetching) && unref(images).length > 0 ? (openBlock(), createElementBlock("div", {
          key: 1,
          class: normalizeClass("xaZzf")
        }, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(images), image => {
          return (openBlock(), createBlock(_component_MkA, {
            key: image.note.id + image.file.id,
            class: normalizeClass("xtA8t"),
            to: unref(notePage)(image.note)
          }, {
            default: withCtx(() => [createVNode(ImgWithBlurhash, {
              hash: image.file.blurhash,
              src: thumbnail(image.file),
              title: image.file.name
            }, null, 8, ["hash", "src", "title"])]),
            _: 2
          }, 1032, ["class", "to"]));
        }), 128))], 2)) : createCommentVNode("", true), !unref(fetching) && unref(images).length == 0 ? (openBlock(), createElementBlock("p", {
          key: 2,
          class: normalizeClass("xhYKj")
        }, toDisplayString(unref(i18n).ts.nothing), 3)) : createCommentVNode("", true)], 2)]),
        _: 1
      }));
    };
  }
});
const root = "xenMW";
const stream = "xaZzf";
const img = "xtA8t";
const empty = "xhYKj";
const style0 = {
  root: root,
  stream: stream,
  img: img,
  empty: empty
};
const cssModules = {
  "$style": style0
};
const index_photos = _sfc_main;
export {index_photos as default};
`.slice(1));
});
