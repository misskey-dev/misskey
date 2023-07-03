// d.tsが提供されているのに読み込まない 謎
declare module 'ms' {
    type TODO = any;
    export default function(...x: any): TODO;
}
