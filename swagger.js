'use strict'

const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');
const yaml = require('js-yaml');

const apiRoot = './src/api/endpoints';
const files = [
  'meta.js',
  //app
  'app/show.js',
  'app/create.js',
  'app/name_id/available.js',
  //auth
  'auth/accept.js',
  //auth/session
  'auth/session/generate.js',
  'auth/session/show.js',
  'auth/session/userkey.js',
];

const defaultSwagger = {
  "swagger": "2.0",
  "info": {
    "title": "Misskey API",
    "version": "nighthike"
  },
  "host": "api.misskey.xyz",
  "schemes": [
    "https"
  ],
  "consumes": [
    "application/x-www-form-urlencoded"
  ],
  "produces": [
    "application/json"
  ],

  "parameters": {
    "AccessToken": {
      "name": "i",
      "description": "Access Token",
      "in": "formData",
      "required": true,
      "type": "string"
    },

    "NativeToken": {
      "name": "i",
      "description": "Native Access Token",
      "in": "formData",
      "required": true,
      "type": "string",
      "pattern": "^\!.+"
    }
  },

  "definitions": {
    "Error": {
      "type": "object",
      "properties": {
        "error": {
          "type": "string",
          "description": "Error message"
        }
      }
    },
    "User": {
      "type": "object",
      "required": [
        "created_at",
        "followers_count",
        "following_count",
        "id",
        "liked_count",
        "likes_count",
        "name",
        "posts_count",
        "username"
      ],
      "properties": {
        "avatar_id": {
          "type": "string",
          "description": "アバターに設定しているドライブのファイルのID"
        },
        "avatar_url": {
          "type": "string",
          "description": "アバターURL"
        },
        "banner_id": {
          "type": "string",
          "description": "バナーに設定しているドライブのファイルのID"
        },
        "banner_url": {
          "type": "string",
          "description": "バナーURL"
        },
        "bio": {
          "type": "string",
          "description": "プロフィール"
        },
        "birthday": {
          "type": "string",
          "format": "date",
          "description": "誕生日"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "description": "アカウント作成日時"
        },
        "drive_capacity": {
          "type": "integer",
          "description": "ドライブの最大容量"
        },
        "followers_count": {
          "type": "integer",
          "description": "フォロワー数"
        },
        "following_count": {
          "type": "integer",
          "description": "フォロー数"
        },
        "id": {
          "type": "string",
          "description": "ユーザーID"
        },
        "is_followed": {
          "type": "boolean",
          "description": "フォローされているか"
        },
        "is_following": {
          "type": "boolean",
          "description": "フォローしているか"
        },
        "liked_count": {
          "type": "integer",
          "description": "投稿にいいねされた数"
        },
        "likes_count": {
          "type": "integer",
          "description": "投稿にいいねした数"
        },
        "location": {
          "type": "string",
          "description": "場所"
        },
        "name": {
          "type": "string",
          "description": "ニックネーム"
        },
        "posts_count": {
          "type": "integer",
          "description": "投稿数"
        },
        "username": {
          "type": "string",
          "description": "ユーザー名"
        }
      }
    },
    "Application": {
      "type": "object",
      "properties": {
        "created_at": {
          "type": "string",
          "format": "date-time",
          "description": "アプリケーションの作成日時"
        },
        "user_id": {
          "type": "string",
          "description": "アプリケーションを作成したユーザーのID"
        },
        "name": {
          "type": "string",
          "description": "アプリケーションの名前"
        },
        "name_id": {
          "type": "string",
          "description": "アプリケーションのユニークな名前"
        },
        "description": {
          "type": "string",
          "description": "アプリケーションの説明"
        },
        "permission": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "アプリケーションの持つ権限一覧"
        },
        "callback_url": {
          "type": "string",
          "description": "コールバックURL"
        },
        "id": {
          "type": "string",
          "description": "アプリケーションID"
        },
        "icon_url": {
          "type": "string",
          "description": "アプリケーションのアイコンのURL"
        }
      }
    }
  },
  "securityDefinitions": {},
  "tags": []
};

var options = {
  swaggerDefinition: defaultSwagger,
  apis: []
};
options.apis = files.map(c => {return `${apiRoot}/${c}`;});

if(fs.existsSync('.config/config.yml')){
  var config = yaml.safeLoad(fs.readFileSync('./.config/config.yml', 'utf8'));
  options.swaggerDefinition.host = `api.${config.url.match(/\:\/\/(.+)$/)[1]}`;
  options.swaggerDefinition.schemes = config.https.enable ?
                                      ['https'] :
                                      ['http'];
}

var swaggerSpec = swaggerJSDoc(options);

fs.writeFileSync('api-docs.json', JSON.stringify(swaggerSpec));

