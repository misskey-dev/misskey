AVT := aws-vault exec ro_misskey -- 
AWS := $(AVT) aws

ifeq ($(shell command -v aws-vault 2>/dev/null),)
AVT :=
AWS := aws
endif

REPOSITORY_NAME := rockcutter-misskey/misskey-with-like
ECR_REGION := ap-northeast-1
ECR_ENDPOINT := $(ACCOUNT_ID).dkr.ecr.$(ECR_REGION).amazonaws.com

.PHONY: build
build: 
	docker build -t $(REPOSITORY_NAME) . 

.PHONY: push
push: build
	$(AWS) ecr get-login-password --region $(ECR_REGION) | \
		docker login --username AWS --password-stdin $(ECR_ENDPOINT)
	docker tag $(REPOSITORY_NAME):latest $(ECR_ENDPOINT)/$(REPOSITORY_NAME):latest
	docker push $(ECR_ENDPOINT)/$(REPOSITORY_NAME):latest