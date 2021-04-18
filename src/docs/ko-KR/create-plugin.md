# 플러그인 제작
Misskey 웹 클라이언트의 플러그인 기능을 사용하면, 클라이언트를 확장하고 다양한 기능을 추가할 수 있습니다. 여기에서는 플러그인의 제작에 있어서 메타데이터 정의, AiScript API 레퍼런스를 소개합니다.

## 메타데이터
플러그인은 AiScript의 메타데이터 내장 기능을 사용하며, 기본적으로 플러그인의 메타데이터를 정의해야 합니다.

### name
플러그인 이름

### author
플러그인 제작자

### version
플러그인 버전. 값을 지정해 주세요.

### description
플러그인에 대한 설명

### permissions
플러그인이 요구하는 권한. Misskey API에 요청할 때 사용됩니다.

### config
플러그인의 설정 정보를 나타내는 객체. 키 값에 설정명을, 값에는 다음 속성을 포함할 수 있습니다.

#### type
설정값의 종류를 나타내는 문자열. 아래 항목들을 사용할 수 있습니다. string number boolean

#### label
사용자에게 표시할 설정 이름

#### description
설정의 설명

#### default
설정의 기본값

## API 레퍼런스
AiScript 표준으로 내장되어 있는 API는 소개하지 않습니다.

### Mk:dialog(title text type)
대화 상자를 표시합니다. type에는 아래 항목들을 사용할 수 있습니다. info success warn error question 생략하면 info로 설정됩니다.

### Mk:confirm(title text type)
확인 대화 상자를 표시합니다. type에는 아래 항목들을 사용할 수 있습니다. info success warn error question 생략하면 question으로 설정됩니다. 사용자가 "OK"를 선택한 경우 true를, "취소"를 선택한 경우 false가 반환됩니다.

### Mk:api(endpoint params)
Misskey API에 요청합니다. 첫 번째 인수에 엔드포인트 이름, 두 번째 인수에 매개변수 객체를 전달합니다.

### Mk:save(key value)
임의의 값에 임의의 이름을 붙여 영속화합니다. 영속화한 값은 AiScript 컨텍스트가 종료되어도 남아서 Mk:load 작업을 수행합니다.

### Mk:load(key)
Mk:save에서 영속화된 지정값을 읽습니다.

### Plugin:register_post_form_action(title fn)
게시 양식에 작업을 추가합니다. 첫 번째 인수로 작업 이름, 두 번째 인수로 작업이 선택되었을 때의 콜백 함수를 전달합니다. 콜백 함수에는 첫 번째 인수로 게시 양식 객체가 전달됩니다.

### Plugin:register_note_action(title fn)
노트 메뉴에 항목을 추가합니다. 첫 번째 인수로 항목명, 두 번째 인수로 항목이 선택되었을 때의 콜백 함수를 전달합니다. 콜백 함수에는 첫 번째 인수로 대상 노트 객체가 전달됩니다.

### Plugin:register_user_action(title fn)
유저 메뉴에 항목을 추가합니다. 첫 번째 인수로 항목명, 두 번째 인수로 항목이 선택되었을 때의 콜백 함수를 전달합니다. 콜백 함수에는 첫 번째 인수로 대상 유저 객체가 전달됩니다.

### Plugin:register_note_view_interruptor(fn)
UI에 표시되는 노트 정보를 변경합니다. 콜백 함수는 첫 번째 인수로 해당되는 노트 객체를 전달합니다. 콜백 함수의 반환값으로 노트가 변경됩니다.

### Plugin:register_note_post_interruptor(fn)
노트를 게시할 때의 노트 정보를 변경합니다. 콜백 함수는 첫 번째 인수로 해당되는 노트 객체를 전달합니다. 콜백 함수의 반환값으로 노트가 변경됩니다.

### Plugin:open_url(url)
첫 번째 인수로 전달된 URL을 브라우저의 새 탭에서 엽니다.

### Plugin:config
플러그인의 설정이 저장되는 객체. 플러그인 정의 config에서 설정한 키로 값이 저장됩니다.
