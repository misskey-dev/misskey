FROM nginx:1.25.1

RUN apt-get update && \
  apt-get install -y --no-install-recommends \
	apt-utils \
  locales \
	&& apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/* /root/.gnupg /tmp/library-scripts


RUN echo "ja_JP.UTF-8 UTF-8" > /etc/locale.gen && \
  locale-gen ja_JP.UTF-8

ENV LC_ALL ja_JP.UTF-8

# 初期状態の設定ファイル
ADD ./conf.d/default.conf.template /etc/nginx/conf.d/default.conf.template
