.PHONY: install

install:
	npm i

lint:
	node node_modules/.bin/eslint . --fix
