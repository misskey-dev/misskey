import * as mfm from 'mfm-js';
import { toUnicode } from 'punycode';
import { host as localHost } from '@/config';
import sanitizeHtml from 'sanitize-html';
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css';

const QUOTE_STYLE = `
display: block;
margin: 8px;
padding: 6px 0 6px 12px;
color: var(--fg);
border-left: solid 3px var(--fg);
opacity: 0.7;
`.split('\n').join(' ');

interface MfmFn extends mfm.MfmFn {
    props: {
        name: string;
        args: Record<string, any>;
    }
};

export function parseMfm(text: string, useAnim: boolean = false): HTMLDivElement {
    const ast = mfm.parse(text);

    const el = document.createElement("div");

    const validTime = (t: string | null | undefined) => {
        if (t == null) return null;
        return t.match(/^[0-9.]+s$/) ? t : null;
    };

    function genEl(ast: (MfmFn | mfm.MfmNode)[]) {
        return ast.map((token: (MfmFn | mfm.MfmNode)) => {
            switch (token.type) {
                case 'text': {
                    const text = token.props.text.replace(/(\r\n|\n|\r)/g, '\n');

                    const res: HTMLElement[] = [];
                    for (const t of text.split('\n')) {
                        res.push(document.createElement('br'));
                        const el = document.createElement('span');
                        el.innerText = t;
                        res.push(el);
                    }
                    res.shift();
                    return res;
                }

                case 'bold': {
                    const el = document.createElement("b");
                    genEl(token.children).forEach((child) => {
                        el.appendChild(child as HTMLElement);
                    });
                    return [el];
                }

                case 'strike': {
                    const el = document.createElement("del");
                    genEl(token.children).forEach((child) => {
                        el.appendChild(child as HTMLElement);
                    });
                    return [el];
                }

                case 'italic': {
                    const el = document.createElement("i");
                    el.style.fontStyle = 'oblique';
                    genEl(token.children).forEach((child) => {
                        el.appendChild(child as HTMLElement);
                    });
                    return [el];
                }

                case 'fn': {
                    // TODO: CSSを文字列で組み立てていくと token.props.args.~~~ 経由でCSSインジェクションできるのでよしなにやる
                    let style;
                    switch (token.props.name) {
                        case 'tada': {
							const speed = validTime(token.props.args.speed) ?? '1s';
							style = 'font-size: 150%;' + (useAnim ? `animation: tada ${speed} linear infinite both;` : '');
							break;
						}
						case 'jelly': {
							const speed = validTime(token.props.args.speed) ?? '1s';
							style = (useAnim ? `animation: mfm-rubberBand ${speed} linear infinite both;` : '');
							break;
						}
						case 'twitch': {
							const speed = validTime(token.props.args.speed) ?? '0.5s';
							style = useAnim ? `animation: mfm-twitch ${speed} ease infinite;` : '';
							break;
						}
						case 'shake': {
							const speed = validTime(token.props.args.speed) ?? '0.5s';
							style = useAnim ? `animation: mfm-shake ${speed} ease infinite;` : '';
							break;
						}
						case 'spin': {
							const direction =
								token.props.args.left ? 'reverse' :
								token.props.args.alternate ? 'alternate' :
								'normal';
							const anime =
								token.props.args.x ? 'mfm-spinX' :
								token.props.args.y ? 'mfm-spinY' :
								'mfm-spin';
							const speed = validTime(token.props.args.speed) ?? '1.5s';
							style = useAnim ? `animation: ${anime} ${speed} linear infinite; animation-direction: ${direction};` : '';
							break;
						}
						case 'jump': {
							const speed = validTime(token.props.args.speed) ?? '0.75s';
							style = useAnim ? `animation: mfm-jump ${speed} linear infinite;` : '';
							break;
						}
						case 'bounce': {
							const speed = validTime(token.props.args.speed) ?? '0.75s';
							style = useAnim ? `animation: mfm-bounce ${speed} linear infinite; transform-origin: center bottom;` : '';
							break;
						}
                        case 'flip': {
                            const transform =
                                (token.props.args.h && token.props.args.v) ? 'scale(-1, -1)' :
                                    token.props.args.v ? 'scaleY(-1)' :
                                        'scaleX(-1)';
                            style = `transform: ${transform};`;
                            break;
                        }
                        case 'x2': {
                            const el = document.createElement("span");
                            el.classList.add('mfm-x2');
                            genEl(token.children).forEach((child) => {
                                el.appendChild(child as HTMLElement);
                            });
                            return [el];
                        }
                        case 'x3': {
                            const el = document.createElement("span");
                            el.classList.add('mfm-x3');
                            genEl(token.children).forEach((child) => {
                                el.appendChild(child as HTMLElement);
                            });
                            return [el];
                        }
                        case 'x4': {
                            const el = document.createElement("span");
                            el.classList.add('mfm-x4');
                            genEl(token.children).forEach((child) => {
                                el.appendChild(child as HTMLElement);
                            });
                            return [el];
                        }
                        case 'font': {
                            const family =
                                token.props.args.serif ? 'serif' :
                                token.props.args.monospace ? 'monospace' :
                                token.props.args.cursive ? 'cursive' :
                                token.props.args.fantasy ? 'fantasy' :
                                token.props.args.emoji ? 'emoji' :
                                token.props.args.math ? 'math' :
                                                        null;
                            
                            if (family) style = `font-family: ${family};`;
                            break;
                        }
                        case 'blur': {
                            const el = document.createElement("span");
                            el.classList.add('_mfm_blur_');
                            genEl(token.children).forEach((child) => {
                                el.appendChild(child as HTMLElement);
                            });
                            return [el];
                        }
                        case 'rainbow': {
							const speed = validTime(token.props.args.speed) ?? '1s';
							style = useAnim ? `animation: mfm-rainbow ${speed} linear infinite;` : '';
							break;
                        }
                        // TODO: Sparkle の プレーンHTML実装
                        case 'rotate': {
                            const degrees = parseFloat(token.props.args.deg ?? '90');
                            style = `transform: rotate(${degrees}deg); transform-origin: center center;`;
                            break;
                        }
                        case 'position': {
                            const x = parseFloat(token.props.args.x ?? '0');
                            const y = parseFloat(token.props.args.y ?? '0');
                            style = `transform: translateX(${x}em) translateY(${y}em);`;
                            break;
                        }
                        case 'scale': {
                            const x = Math.min(parseFloat(token.props.args.x ?? '1'), 5);
                            const y = Math.min(parseFloat(token.props.args.y ?? '1'), 5);
                            style = `transform: scale(${x}, ${y});`;
                            break;
                        }
                        case 'fg': {
                            let color = token.props.args.color;
                            if (!/^[0-9a-f]{3,6}$/i.test(color)) color = 'f00';
                            style = `color: #${color};`;
                            break;
                        }
                        case 'bg': {
                            let color = token.props.args.color;
                            if (!/^[0-9a-f]{3,6}$/i.test(color)) color = 'f00';
                            style = `background-color: #${color};`;
                            break;
                        }
                        default:
                            style = '';
                            break;
                    }
                    if (style == null) {
                        const el = document.createElement("span");
                        genEl(token.children).forEach((child) => {
                            el.appendChild(child as HTMLElement);
                        });
                        el.innerHTML = `$[${token.props.name} ${el.innerHTML}]`;
                        return [el];
                    } else {
                        const el = document.createElement("span");
                        genEl(token.children).forEach((child) => {
                            el.appendChild(child as HTMLElement);
                        });
                        el.setAttribute('style', `display: inline-block; ${style}`);
                        return [el];
                    }
                }

                case 'small': {
                    const el = document.createElement("small");
                    el.style.opacity = '.7';
                    genEl(token.children).forEach((child) => {
                        el.appendChild(child as HTMLElement);
                    });
                    return [el];
                }

                case 'center': {
                    const el = document.createElement("div");
                    el.style.textAlign = "center";
                    genEl(token.children).forEach((child) => {
                        el.appendChild(child as HTMLElement);
                    });
                    return [el];
                }

                case 'url': {
                    const el = document.createElement("a");
                    el.href = token.props.url;
                    el.target = '_blank';
                    el.rel = 'nofollow noopener';

                    el.innerText = token.props.url;
                    return [el];
                }

                case 'link': {
                    const el = document.createElement("a");
                    el.href = token.props.url;
                    el.target = '_blank';
                    el.rel = 'nofollow noopener';
                    genEl(token.children).forEach((child) => {
                        el.appendChild(child as HTMLElement);
                    });
                    return [el];
                }

                case 'mention': {
                    const el = document.createElement("a");
                    const canonical = token.props.host === localHost ? `@${token.props.username}` : `@${token.props.username}@${toUnicode(token.props.host ?? '')}`;
                    el.href = `/${canonical}`;
                    el.target = '_blank';
                    el.rel = 'nofollow noopener';
                    el.style.display = 'inline-block';
                    el.style.padding = '4px 8px 4px 4px';
                    el.style.borderRadius = '999px';
                    el.style.color = 'var(--mention)';
                    el.style.fontWeight = '700';

                    el.innerText = `@${canonical}`;
                    return [el];
                }

                case 'hashtag': {
                    const el = document.createElement("a");
                    el.href = `/tags/${encodeURIComponent(token.props.hashtag)}`;
                    el.target = '_blank';
                    el.rel = 'nofollow noopener';
                    el.style.color = 'var(--hashtag)';

                    el.innerText = `#${token.props.hashtag}`;
                    return [el];
                }

                case 'blockCode': {
                    const el = document.createElement('pre');
                    el.style.overflowX = 'scroll';
                    el.style.width = '100%';
                    const elc = document.createElement('code');
                    const prismLang = Prism.languages[token.props.lang] ? token.props.lang : 'js';
                    elc.innerHTML = Prism.highlight(token.props.code, Prism.languages[prismLang], prismLang);
                    el.classList.add(`language-${prismLang}`);
                    elc.classList.add(`language-${prismLang}`);
                    el.appendChild(elc);
                    return [el];
                }

                case 'inlineCode': {
                    const el = document.createElement('code');
                    const prismLang = 'js';
                    el.innerHTML = Prism.highlight(token.props.code, Prism.languages[prismLang], prismLang);
                    el.classList.add(`language-${prismLang}`);
                    return [el];
                }

                case 'quote': {
                    const el = document.createElement('div');
                    el.setAttribute('style', QUOTE_STYLE);
                    genEl(token.children).forEach((child) => {
                        el.appendChild(child as HTMLElement);
                    });
                    return [el];
                }

                case 'emojiCode': {
                    const el = document.createElement('span');
                    el.classList.add('emoji', 'custom-emoji');
                    el.innerText = `:${token.props.name}:`;
                    return [el];
                }

                case 'unicodeEmoji': {
                    const el = document.createElement('span');
                    el.classList.add('emoji', 'unicode-emoji');
                    el.innerText = token.props.emoji;
                    return [el];
                }

                case 'mathInline': {
                    const el = document.createElement('code');
                    el.innerText = token.props.formula;
                    return [el];
                }

                case 'mathBlock': {
                    const el = document.createElement('code');
                    el.innerText = token.props.formula;
                    return [el];
                }
                case 'search': {
                    const el = document.createElement('form');
                    el.action = 'https://www.google.com/search';
                    el.method = 'GET';

                    const text = document.createElement('input');
                    text.type = 'search';
                    text.value = token.props.query;
                    el.appendChild(text);

                    const submit = document.createElement('button');
                    submit.type = 'submit';
                    submit.innerHTML = '<i class="ti ti-search"></i><span data-mi-i18n-';
                    el.appendChild(submit);

                    return [el];
                }

                case 'plain': {
                    const el = document.createElement('span');
                    genEl(token.children).forEach((child) => {
                        el.appendChild(child as HTMLElement);
                    });
                    return [el];
                }

                default: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    console.error('unrecognized ast type:', (token as any).type);

                    return [];
                }
            }
        }).flat(Infinity);
    }

    genEl(ast).forEach((element) => {
        el.appendChild(element as HTMLElement);
    });

    el.innerHTML = sanitizeHtml(el.innerHTML, {
        allowedAttributes: {
            '*': ['style', 'class']
        }
    });

    return el;
}
