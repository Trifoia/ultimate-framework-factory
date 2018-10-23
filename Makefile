.PHONY: install lint clean clean-quick build test test-quick

# Installs all dependencies
install:
	npm i

# Lints all files, and attempts to fix any that it can
lint:
	node ./node_modules/.bin/eslint . --fix

# Deletes the contents of the "build" folder
clean:
	rm -rf ./build/*

# Deletes the contents of the "build" folder except for node modules. Note that
# if the "build" directory is empty
clean-quick:
	find build -type f | grep -v "gitkeep" | xargs rm -f

# Run a build and put it in the build directory (used for development purposes)
build:
	node bin/uff.js run trifoia-static-web NAME=testing DESCRIPTION="Testing description" --dest=build

# Runs a test build
test: install lint clean build

# Runs a test build without destroying node modules (for faster testing)
test-quick: install lint clean-quick build
