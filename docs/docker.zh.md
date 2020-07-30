Docker 部署指南
================================================================

这份指南描述了如何使用Docker安装并设置 Misskey 。

- [日本語版もあります - Japanese version also available](./docker.ja.md)
- [英語版もあります - English version also available](./docker.en.md)]

----------------------------------------------------------------

*1.* 下载 Misskey
----------------------------------------------------------------
1. 克隆 Misskey 项目的 master 分支。

	`git clone -b master git://github.com/syuilo/misskey.git`

2. 进入 misskey 文件夹。

	`cd misskey`

3. 检查 [最新发布版](https://github.com/syuilo/misskey/releases/latest) 标签。

	`git checkout master`

*2.* 配置 Misskey
----------------------------------------------------------------

可以按照如下方式创建配置文件：

``` bash
cd .config
cp example.yml default.yml
cp docker_example.env docker.env
```

### `default.yml`

这个文件的编辑工作基本与非 Docker 环境的版本相同。
但请注意， Postgresql、 Redis 和 Elasticsearch 的 **主机名(hostname)** 配置不应该是 `localhost` ，它们被设置在 `docker-compose.yml` 文件中。
以下是默认的主机名：

| 服务          | 主机名   |
|---------------|----------|
| Postgresql    | `db`     |
| Redis         | `redis`  |
| Elasticsearch | `es`     |

### `docker.env`

在这个文件中配置 Postgresql 。
至少需要如下这些配置：

| 名称                |  描述         |
|---------------------|---------------|
| `POSTGRES_PASSWORD` |  数据库密码   |
| `POSTGRES_USER`     |  数据库用户名 |
| `POSTGRES_DB`       |  数据库名     |

*3.* 配置 Docker
----------------------------------------------------------------
编辑 `docker-compose.yml` 文件。

*4.* 构建 Misskey
----------------------------------------------------------------
使用如下的方式构建Misskey：

`docker-compose build`

*5.* 初始化数据库
----------------------------------------------------------------
``` bash
docker-compose run --rm web yarn run init
```

*6.* 完成了！
----------------------------------------------------------------
干得不错！现在您拥有了一个可以运行Misskey的环境啦。

### 正常启动
只需要 `docker-compose up -d` 即可。玩得愉快!

### 如何将您的 Misskey 服务器升级至最新版本
1. `git stash`
2. `git checkout master`
3. `git pull`
4. `git stash pop`
5. `docker-compose build`
6. 检查 [更新日志](../CHANGELOG.md) 以获取升级迁移信息。
7. `docker-compose stop && docker-compose up -d`

### 如何执行 [控制台指令](manage.zh.md):
`docker-compose run --rm web node built/tools/mark-admin @example`

----------------------------------------------------------------

如果您有任何疑问或是困惑，欢迎与我们联系！
