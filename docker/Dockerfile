FROM base/archlinux

MAINTAINER Aya Morisawa

RUN rm /etc/pacman.d/mirrorlist
RUN echo 'Server = http://ftp.jaist.ac.jp/pub/Linux/ArchLinux/$repo/os/$arch'    >> /etc/pacman.d/mirrorlist
RUN echo 'Server = http://ftp.tsukuba.wide.ad.jp/Linux/archlinux/$repo/os/$arch' >> /etc/pacman.d/mirrorlist

RUN rm /etc/localtime
RUN ln -s /usr/share/zoneinfo/Asia/Tokyo /etc/localtime

RUN pacman -Sy --noconfirm
RUN pacman -S --noconfirm pacman
RUN pacman-db-upgrade
RUN pacman -S --noconfirm archlinux-keyring
RUN pacman -Syyu --noconfirm
RUN pacman -S --noconfirm git nodejs npm mongodb redis imagemagick

COPY misskey.sh /root/misskey.sh
RUN chmod u+x /root/misskey.sh

EXPOSE 80
EXPOSE 443
EXPOSE 27017

CMD ["/root/misskey.sh"]
