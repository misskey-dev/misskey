build: 
	docker build -t rockcutter/misskey_with_like . 

push: build
	$(AWS) ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin $(ACCOUNT_ID).dkr.ecr.ap-northeast-1.amazonaws.com
	docker tag rockcutter/misskey_init_sidecar:latest $(ACCOUNT_ID).dkr.ecr.ap-northeast-1.amazonaws.com/rockcutter/misskey-init-sidecar:latest
	docker push $(ACCOUNT_ID).dkr.ecr.ap-northeast-1.amazonaws.com/rockcutter/misskey-init-sidecar:latest