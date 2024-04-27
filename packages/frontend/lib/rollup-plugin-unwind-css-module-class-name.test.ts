/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parse } from 'acorn';
import { generate } from 'astring';
import { describe, expect, it } from 'vitest';
import { normalizeClass, unwindCssModuleClassName } from './rollup-plugin-unwind-css-module-class-name.js';
import type * as estree from 'estree';

function parseExpression(code: string): estree.Expression {
	const program = parse(code, { ecmaVersion: 'latest', sourceType: 'module' }) as unknown as estree.Program;
	const statement = program.body[0] as estree.ExpressionStatement;
	return statement.expression;
}

describe(normalizeClass.name, () => {
	it('should normalize string', () => {
		expect(normalizeClass(parseExpression('"a b c"'))).toBe('a b c');
	});
	it('should trim redundant spaces', () => {
		expect(normalizeClass(parseExpression('" a b  c "'))).toBe('a b c');
	});
	it('should ignore undefined', () => {
		expect(normalizeClass(parseExpression('undefined'))).toBe('');
	});
	it('should ignore non string literals', () => {
		expect(normalizeClass(parseExpression('0'))).toBe('');
		expect(normalizeClass(parseExpression('true'))).toBe('');
		expect(normalizeClass(parseExpression('null'))).toBe('');
		expect(normalizeClass(parseExpression('/I.D/'))).toBe('');
	});
	it('should not normalize identifiers', () => {
		expect(normalizeClass(parseExpression('EScape'))).toBeNull();
	});
	it('should normalize recursively array', () => {
		expect(normalizeClass(parseExpression('["from", ...["Utopia"]]'))).toBe('from Utopia');
		expect(normalizeClass(parseExpression('["from", ...[Utopia]]'))).toBeNull();
	});
	it('should normalize recursively template literal', () => {
		expect(normalizeClass(parseExpression('`name ${"shiho"} code ${33}`'))).toBe('name shiho code');
		expect(normalizeClass(parseExpression('`name ${shiho.name} code ${33}`'))).toBeNull();
	});
	it('should normalize recursively binary expression', () => {
		expect(normalizeClass(parseExpression('"mirage" + "mirror"'))).toBe('miragemirror');
		expect(normalizeClass(parseExpression('"mirage" + mirror'))).toBeNull();
	});
	it('should normalize recursively object expression', () => {
		expect(normalizeClass(parseExpression('({ a: true, b: "c" })'))).toBe('a b');
		expect(normalizeClass(parseExpression('({ a: false, b: "c" })'))).toBe('b');
		expect(normalizeClass(parseExpression('({ a: true, b: c })'))).toBeNull();
		expect(normalizeClass(parseExpression('({ a: true, b: "c", ...({ d: true }) })'))).toBe('a b d');
		expect(normalizeClass(parseExpression('({ a: true, [b]: "c" })'))).toBeNull();
		expect(normalizeClass(parseExpression('({ a: true, b: false, c: !false, d: !!0 })'))).toBe('a c');
	});
});

it('Composition API (standard)', () => {
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
`.slice(1), { ecmaVersion: 'latest', sourceType: 'module' });
	unwindCssModuleClassName(ast);
	expect(generate(ast)).toBe(`
import {c as api, d as defaultStore, i as i18n, aD as notePage, bN as ImgWithBlurhash, bY as getStaticImageUrl, _ as _export_sfc} from './app-!~{001}~.js';
import {M as MkContainer} from './MkContainer-!~{03M}~.js';
import {b as defineComponent, a as ref, e as onMounted, z as resolveComponent, g as openBlock, h as createBlock, i as withCtx, K as createTextVNode, E as toDisplayString, u as unref, l as createBaseVNode, q as normalizeClass, B as createCommentVNode, k as createElementBlock, F as Fragment, C as renderList, A as createVNode} from './vue-!~{002}~.js';
import './photoswipe-!~{003}~.js';
const _hoisted_1 = createBaseVNode("i", {
  class: "ti ti-photo"
}, null, -1);
const index_photos = defineComponent({
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
          class: "xenMW"
        }, [unref(fetching) ? (openBlock(), createBlock(_component_MkLoading, {
          key: 0
        })) : createCommentVNode("", true), !unref(fetching) && unref(images).length > 0 ? (openBlock(), createElementBlock("div", {
          key: 1,
          class: "xaZzf"
        }, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(images), image => {
          return (openBlock(), createBlock(_component_MkA, {
            key: image.note.id + image.file.id,
            class: "xtA8t",
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
          class: "xhYKj"
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
export {index_photos as default};
`.slice(1));
});

it('Composition API (with `useCssModule()`)', () => {
	const ast = parse(`
import { a7 as getCurrentInstance, b as defineComponent, G as useCssModule, a1 as h, H as TransitionGroup } from './!~{002}~.js';
import { d as defaultStore, aK as toast, b5 as MkAd, i as i18n, _ as _export_sfc } from './app-!~{001}~.js';

function isDebuggerEnabled(id) {
  try {
    return localStorage.getItem(\`DEBUG_\${id}\`) !== null;
  } catch {
    return false;
  }
}
function stackTraceInstances() {
  let instance = getCurrentInstance();
  const stack = [];
  while (instance) {
    stack.push(instance);
    instance = instance.parent;
  }
  return stack;
}

const _sfc_main = defineComponent({
  props: {
    items: {
      type: Array,
      required: true
    },
    direction: {
      type: String,
      required: false,
      default: "down"
    },
    reversed: {
      type: Boolean,
      required: false,
      default: false
    },
    noGap: {
      type: Boolean,
      required: false,
      default: false
    },
    ad: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup(props, { slots, expose }) {
    const $style = useCssModule();
    function getDateText(time) {
      const date = new Date(time).getDate();
      const month = new Date(time).getMonth() + 1;
      return i18n.t("monthAndDay", {
        month: month.toString(),
        day: date.toString()
      });
    }
    if (props.items.length === 0)
      return;
    const renderChildrenImpl = () => props.items.map((item, i) => {
      if (!slots || !slots.default)
        return;
      const el = slots.default({
        item
      })[0];
      if (el.key == null && item.id)
        el.key = item.id;
      if (i !== props.items.length - 1 && new Date(item.createdAt).getDate() !== new Date(props.items[i + 1].createdAt).getDate()) {
        const separator = h("div", {
          class: $style["separator"],
          key: item.id + ":separator"
        }, h("p", {
          class: $style["date"]
        }, [
          h("span", {
            class: $style["date-1"]
          }, [
            h("i", {
              class: \`ti ti-chevron-up \${$style["date-1-icon"]}\`
            }),
            getDateText(item.createdAt)
          ]),
          h("span", {
            class: $style["date-2"]
          }, [
            getDateText(props.items[i + 1].createdAt),
            h("i", {
              class: \`ti ti-chevron-down \${$style["date-2-icon"]}\`
            })
          ])
        ]));
        return [el, separator];
      } else {
        if (props.ad && item._shouldInsertAd_) {
          return [h(MkAd, {
            key: item.id + ":ad",
            prefer: ["horizontal", "horizontal-big"]
          }), el];
        } else {
          return el;
        }
      }
    });
    const renderChildren = () => {
      const children = renderChildrenImpl();
      if (isDebuggerEnabled(6864)) {
        const nodes = children.flatMap((node) => node ?? []);
        const keys = new Set(nodes.map((node) => node.key));
        if (keys.size !== nodes.length) {
          const id = crypto.randomUUID();
          const instances = stackTraceInstances();
          toast(instances.reduce((a, c) => \`\${a} at \${c.type.name}\`, \`[DEBUG_6864 (\${id})]: \${nodes.length - keys.size} duplicated keys found\`));
          console.warn({ id, debugId: 6864, stack: instances });
        }
      }
      return children;
    };
    function onBeforeLeave(el) {
      el.style.top = \`\${el.offsetTop}px\`;
      el.style.left = \`\${el.offsetLeft}px\`;
    }
    function onLeaveCanceled(el) {
      el.style.top = "";
      el.style.left = "";
    }
    return () => h(
      defaultStore.state.animation ? TransitionGroup : "div",
      {
        class: {
          [$style["date-separated-list"]]: true,
          [$style["date-separated-list-nogap"]]: props.noGap,
          [$style["reversed"]]: props.reversed,
          [$style["direction-down"]]: props.direction === "down",
          [$style["direction-up"]]: props.direction === "up"
        },
        ...defaultStore.state.animation ? {
          name: "list",
          tag: "div",
          onBeforeLeave,
          onLeaveCanceled
        } : {}
      },
      { default: renderChildren }
    );
  }
});

const reversed = "xxiZh";
const separator = "xxeDx";
const date = "xxawD";
const style0 = {
        "date-separated-list": "xfKPa",
        "date-separated-list-nogap": "xf9zr",
        "direction-up": "x7AeO",
        "direction-down": "xBIqc",
        reversed: reversed,
        separator: separator,
        date: date,
        "date-1": "xwtmh",
        "date-1-icon": "xsNPa",
        "date-2": "x1xvw",
        "date-2-icon": "x9ZiG"
};

const cssModules = {
  "$style": style0
};
const MkDateSeparatedList = /* @__PURE__ */ _export_sfc(_sfc_main, [["__cssModules", cssModules]]);

export { MkDateSeparatedList as M };
`.slice(1), { ecmaVersion: 'latest', sourceType: 'module' });
	unwindCssModuleClassName(ast);
	expect(generate(ast)).toBe(`
import {a7 as getCurrentInstance, b as defineComponent, G as useCssModule, a1 as h, H as TransitionGroup} from './!~{002}~.js';
import {d as defaultStore, aK as toast, b5 as MkAd, i as i18n, _ as _export_sfc} from './app-!~{001}~.js';
function isDebuggerEnabled(id) {
  try {
    return localStorage.getItem(\`DEBUG_\${id}\`) !== null;
  } catch {
    return false;
  }
}
function stackTraceInstances() {
  let instance = getCurrentInstance();
  const stack = [];
  while (instance) {
    stack.push(instance);
    instance = instance.parent;
  }
  return stack;
}
const _sfc_main = defineComponent({
  props: {
    items: {
      type: Array,
      required: true
    },
    direction: {
      type: String,
      required: false,
      default: "down"
    },
    reversed: {
      type: Boolean,
      required: false,
      default: false
    },
    noGap: {
      type: Boolean,
      required: false,
      default: false
    },
    ad: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup(props, {slots, expose}) {
    const $style = useCssModule();
    function getDateText(time) {
      const date = new Date(time).getDate();
      const month = new Date(time).getMonth() + 1;
      return i18n.t("monthAndDay", {
        month: month.toString(),
        day: date.toString()
      });
    }
    if (props.items.length === 0) return;
    const renderChildrenImpl = () => props.items.map((item, i) => {
      if (!slots || !slots.default) return;
      const el = slots.default({
        item
      })[0];
      if (el.key == null && item.id) el.key = item.id;
      if (i !== props.items.length - 1 && new Date(item.createdAt).getDate() !== new Date(props.items[i + 1].createdAt).getDate()) {
        const separator = h("div", {
          class: $style["separator"],
          key: item.id + ":separator"
        }, h("p", {
          class: $style["date"]
        }, [h("span", {
          class: $style["date-1"]
        }, [h("i", {
          class: \`ti ti-chevron-up \${$style["date-1-icon"]}\`
        }), getDateText(item.createdAt)]), h("span", {
          class: $style["date-2"]
        }, [getDateText(props.items[i + 1].createdAt), h("i", {
          class: \`ti ti-chevron-down \${$style["date-2-icon"]}\`
        })])]));
        return [el, separator];
      } else {
        if (props.ad && item._shouldInsertAd_) {
          return [h(MkAd, {
            key: item.id + ":ad",
            prefer: ["horizontal", "horizontal-big"]
          }), el];
        } else {
          return el;
        }
      }
    });
    const renderChildren = () => {
      const children = renderChildrenImpl();
      if (isDebuggerEnabled(6864)) {
        const nodes = children.flatMap(node => node ?? []);
        const keys = new Set(nodes.map(node => node.key));
        if (keys.size !== nodes.length) {
          const id = crypto.randomUUID();
          const instances = stackTraceInstances();
          toast(instances.reduce((a, c) => \`\${a} at \${c.type.name}\`, \`[DEBUG_6864 (\${id})]: \${nodes.length - keys.size} duplicated keys found\`));
          console.warn({
            id,
            debugId: 6864,
            stack: instances
          });
        }
      }
      return children;
    };
    function onBeforeLeave(el) {
      el.style.top = \`\${el.offsetTop}px\`;
      el.style.left = \`\${el.offsetLeft}px\`;
    }
    function onLeaveCanceled(el) {
      el.style.top = "";
      el.style.left = "";
    }
    return () => h(defaultStore.state.animation ? TransitionGroup : "div", {
      class: {
        [$style["date-separated-list"]]: true,
        [$style["date-separated-list-nogap"]]: props.noGap,
        [$style["reversed"]]: props.reversed,
        [$style["direction-down"]]: props.direction === "down",
        [$style["direction-up"]]: props.direction === "up"
      },
      ...defaultStore.state.animation ? {
        name: "list",
        tag: "div",
        onBeforeLeave,
        onLeaveCanceled
      } : {}
    }, {
      default: renderChildren
    });
  }
});
const reversed = "xxiZh";
const separator = "xxeDx";
const date = "xxawD";
const style0 = {
  "date-separated-list": "xfKPa",
  "date-separated-list-nogap": "xf9zr",
  "direction-up": "x7AeO",
  "direction-down": "xBIqc",
  reversed: reversed,
  separator: separator,
  date: date,
  "date-1": "xwtmh",
  "date-1-icon": "xsNPa",
  "date-2": "x1xvw",
  "date-2-icon": "x9ZiG"
};
const cssModules = {
  "$style": style0
};
const MkDateSeparatedList = _export_sfc(_sfc_main, [["__cssModules", cssModules]]);
export {MkDateSeparatedList as M};
`.slice(1));
});
