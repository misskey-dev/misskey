build: 
	docker build -t rockcutter/misskey_with_like . 

push: build
	aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin $(ACCOUNT_ID).dkr.ecr.ap-northeast-1.amazonaws.com
	docker tag rockcutter/misskey_with_like:latest $(ACCOUNT_ID).dkr.ecr.ap-northeast-1.amazonaws.com/rockcutter/misskey_with_like:latest
	docker push $(ACCOUNT_ID).dkr.ecr.ap-northeast-1.amazonaws.com/rockcutter/misskey_with_like:latest