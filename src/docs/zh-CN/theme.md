# 主题

您可以设置主题来改变您的Misskey客户端的外观和质感。

## 设置主题
设置 > 主题

## 创建主题
主题代码是一个由 JSON5 编写和构成的对象。下面是一个主题对象，它看起来像是这样：
``` js
{
    id: '17587283-dd92-4a2c-a22c-be0637c9e22a',

    name: 'Danboard',
    author: 'syuilo',

    base: 'light',

    props: {
        accent: 'rgb(218, 141, 49)',
        bg: 'rgb(218, 212, 190)',
        fg: 'rgb(115, 108, 92)',
        panel: 'rgb(236, 232, 220)',
        renote: 'rgb(100, 152, 106)',
        link: 'rgb(100, 152, 106)',
        mention: '@accent',
        hashtag: 'rgb(100, 152, 106)',
        header: 'rgba(239, 227, 213, 0.75)',
        navBg: 'rgb(216, 206, 182)',
        inputBorder: 'rgba(0, 0, 0, 0.1)',
    },
}



```

* `id` ... 该主题的唯一 ID，推荐采用 UUID。
* `name` ... 主题名称
* `author` ... 主题作者
* `desc` ... 主题的描述说明（可选）
* `base` ... 浅色主题还是深色主题
    * `light` 为浅色主题，`dark` 为深色主题。
    * 该主题将继承使用的基础主题集。
* `props` ... 关于主题样式的定义，下面是详细介绍。

### 主题样式定义
在 `props` 下，你可以定义主题的样式。 键是 CSS 变量名，值是指定的内容。 请注意，`props` 对象是从基础主题集继承的。 如果这个主题的 `base` 是 `light`，则基础主题为 [_light.json5](https://github.com/syuilo/misskey/blob/develop/src/client/themes/_light.json5)；如果 `dark`，则基础主题为 [_dark.json5](https://github.com/syuilo/misskey/blob/develop/src/client/themes/_dark.json5)。 换句话说，即使这个主题中的 `props` 中没有定义关键的 `panel`，也会继承在基础主题中所拥有 `panel`。

#### 可以在值中使用的语法
* 以十六进制表示的颜色
    * 例: `#00ff00`
* 以 `rgb(r, g, b)` 形式表示的颜色
    * 例: `rgb(0, 255, 0)`
* 以 `rgb(r, g, b, a)` 形式表示的包含透明度的颜色
    * 例: `rgba(0, 255, 0, 0.5)`
* 引用其他键的值
    * 以 `@{键名}` 对另一个键值的引用。请将 `{键名}` 替换为您要引用键名。
    * 例: `@panel`
* 参照常量（见下文）
    * 以 `${常量名}` 对一个常量进行引用。请将 `{常量名}` 替换为您要引用常量名。
    * 例: `$main`
* 函数（见下文）
    * `:{函数名}<{参数}<{颜色}`

#### 常量
「CSS変数として出力はしたくないが、他のCSS変数の値として使いまわしたい」値があるときは、定数を使うと便利です。 キー名を`$`で始めると、そのキーはCSS変数として出力されません。

#### 函数
wip
