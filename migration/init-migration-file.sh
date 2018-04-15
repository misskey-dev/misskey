#!/bin/bash

usage() {
		echo "$0 [-t type] [-n name]"
		echo "  type: [node | shell]"
		echo "  name: if no present, set untitled"
		exit 0
}

while getopts :t:n:h OPT
do
	case $OPT in
		t)	type=$OPTARG
				;;
		n)	name=$OPTARG
				;;
		h)	usage
				;;
		\?) usage
				;;
		:)	usage
				;;
	esac
done

if [ "$type" = "" ]
then
	echo "no type present!!!"
	usage
fi

if [ "$name" = "" ]
then
	name="untitled"
fi

touch "$(realpath $(dirname $BASH_SOURCE))/migration/$type.$(date +%s).$name.js"
