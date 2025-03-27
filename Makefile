AWS := aws-vault exec ro_misskey -- aws

ifeq ($(shell which aws-vault),)
	AWS := aws
endif

ECR_REPOSITORY := rockcutter-misskey/misskey_with_like

help: 
	less Makefile

.PHONY: build
build: 
	docker build -t $(ECR_REPOSITORY) . 

.PHONY: push
push: build
	$(AWS) ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin $(ACCOUNT_ID).dkr.ecr.ap-northeast-1.amazonaws.com
	docker tag $(ECR_REPOSITORY):latest $(ACCOUNT_ID).dkr.ecr.ap-northeast-1.amazonaws.com/$(ECR_REPOSITORY):latest
	docker push $(ACCOUNT_ID).dkr.ecr.ap-northeast-1.amazonaws.com/$(ECR_REPOSITORY):latest
