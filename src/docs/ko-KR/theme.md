# 테마

테마를 설정하여 Misskey 클라이언트의 외형을 변경할 수 있습니다.

## 테마 설정
설정 > 테마

## 테마 만들기
테마 코드는 JSON5에 기술된 테마 객체입니다. 예시는 아래와 같습니다.
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

* `id` ... 테마에 지정된 고유 ID. UUID 방식을 추천합니다.
* `name` ... 테마 이름
* `author` ... 테마 제작자
* `desc` ... 테마 설명(옵션)
* `base` ... 밝은 테마인지, 어두운 테마인지
    * `light`로 하면 밝은 테마가 되고, `dark`로 하면 어두운 테마가 됩니다.
    * 테마는 여기서 상속된 베이스 테마를 기준으로 합니다.
* `props` ... 테마 스타일 정의. 이제부터 설명하겠습니다.

### 테마 스타일 정의
`props`에서는 테마의 스타일을 정의합니다. 키가 CSS 변수명이 되고, 값으로 내용을 지정합니다. 덧붙여, 이 `props` 객체는 베이스 테마로부터 상속됩니다. 베이스 테마는, 이 테마의 `base`가 `light`인 경우, [_light.json5](https://github.com/misskey-dev/misskey/blob/develop/src/client/themes/_light.json5) 이고, `dark`라면 [_dark.json5](https://github.com/misskey-dev/misskey/blob/develop/src/client/themes/_dark.json5) 입니다. 즉, 만들려는 테마의 `props`에 `panel`라는 키가 없어도 베이스 테마로부터 상속되므로, `panel`이 존재한다고 볼 수 있습니다.

#### 값으로 사용할 수 있는 구문
* 16진수로 표현된 색
    * 예: `#00ff00`
* `rgb(r, g, b)` 형식으로 나타낸 색
    * 예: `rgb(0, 255, 0)`
* `rgb(r, g, b, a)` 형식으로 표시된 투명도를 포함한 색상
    * 예: `rgba(0, 255, 0, 0.5)`
* 다른 키 값 참조
    * `@{키 이름}`으로 쓰면 다른 키의 값을 참조할 수 있습니다. `{키 이름}`은 참조하려는 키의 이름으로 대체합니다.
    * 예: `@panel`
* 정수(후술)의 참조
    * `${정수명}`이라고 쓰면 정수를 참조합니다. `{정수명}`은 참조하려는 정수의 이름으로 대체합니다.
    * 예: `$main`
* 함수(후술)
    * `:{함수명}<{인수}<{색상}`

#### 상수
「CSS 변수로 출력하고 싶지 않지만, 다른 CSS 변수의 값을 사용」하고 싶은 값이 있을 때는, 정수를 사용하면 편리합니다. 키의 이름 앞에 `$`를 붙이면, 키가 CSS 변수로 출력되지 않습니다.

#### 함수
wip
