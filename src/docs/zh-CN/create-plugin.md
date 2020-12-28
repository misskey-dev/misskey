# 插件开发
Misskey Web客户端插件功能使您可以扩展客户端并添加各种功能。 我们在这里给出用于创建插件的元数据定义和AiScript API参考。

## 元数据
插件必须使用AiScript的元数据嵌入功能将插件的元数据定义为默认值。 元数据是一个包含以下属性的对象：

### name
插件名称

### author
插件作者

### version
插件版本。请使用数字。

### description
插件说明

### permissions
插件要求的权限。在发送Misskey API请求时需要使用。

### config
表示插件设置信息的对象。 在键名中包含设置名称，在键值中包含以下属性。

#### type
代表设置值的类型的字符串。从下列项中选择： string number boolean

#### label
显示给用户的设置名称

#### description
设置说明

#### default
设置的默认值

## API 参考
AiScript标准的内置API不会发布。

### Mk:dialog(title text type)
显示一个对话框。type可以设置为以下值： info success warn error question 默认值为info。

### Mk:confirm(title text type)
显示确认对话框。type可以设置为以下值： info success warn error question 默认值为question。 如果用户选择“OK”，则返回true；如果用户选择“取消”，则返回false。

### Mk:api(endpoint params)
Misskey API请求在第一个参数中传递终端名称，在第二个参数中传递参数对象。

### Mk:save(key value)
给任何名称赋任何值并使其持久化。所谓的持久化的值，指的是该值即使在AiScript上下文结束后仍然保留，并且可以通过Mk:load读取。

### Mk:load(key)
读取由Mk:save生成的持久化的值。

### Plugin:register_post_form_action(title fn)
将操作添加到发布表单。第一个参数是操作名，在第二个参数中选择操作时传入回调函数。 帖子表单对象作为第一个参数传给回调函数。

### Plugin:register_note_action(title fn)
将项目添加到帖子菜单。第一个参数是项目名，在第二个参数中选择项目时传入回调函数。 目标项目对象作为第一个参数传给回调函数。

### Plugin:register_user_action(title fn)
将项目添加到用户菜单。第一个参数是项目名，在第二个参数中选择项目时传入回调函数。 目标用户对象作为第一个参数传给回调函数。

### Plugin:register_note_view_interruptor(fn)
改写显示在UI上的帖子信息。 目标帖子对象作为第一个参数传给回调函数。 该帖子将会使用回调函数的返回值进行改写。

### Plugin:register_note_post_interruptor(fn)
发贴时改写帖子信息。 目标帖子对象作为第一个参数传给回调函数。 该帖子将会使用回调函数的返回值进行改写。

### Plugin:open_url(url)
第一引数に渡されたURLをブラウザの新しいタブで開きます。

### Plugin:config
プラグインの設定が格納されるオブジェクト。プラグイン定義のconfigで設定したキーで値が入ります。
