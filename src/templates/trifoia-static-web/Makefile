.PHONY: install clean scss ejs build
START_TIME = $(shell date +%s)

# Installs node modules
install: 
	npm install

# Destroys all build artifacts
clean:
	rm -rf ./build/*
	rm -rf ./.pre_build/*

# Renders SCSS into CSS
scss:
	node render_scss.js ./src/scss/ ./.pre_build/ ./config/scss_options.js

# TODO: WebPack + Babble JavaScript

# Renders EJS into HTML
ejs:
	node render_ejs.js ./src/ejs/ ./build/ ./config/ejs_options.js

# Performs all build tasks
build: clean scss ejs
	# Copy image files
	cp images/ build/ -r
	@echo Build Complete! Took $(shell expr $(shell date +%s) - $(START_TIME)) seconds
