AWS := aws-vault exec ro_misskey -- aws

ifeq ($(shell which aws-vault),)
	AWS := aws
endif

ECR_REPOSITORY := rockcutter-misskey/misskey_with_like

help: 
	less Makefile

push: 
	make -f image.mk push