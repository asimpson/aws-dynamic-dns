build:
	docker build . -t dyndns
.PHONY: build

run:
	docker run --rm dyndns
.PHONY: run
