.PHONY: start dev lint lint-fix test docker-build docker-run docker-stop clean

start:
	node src/index.js

dev:
	npx nodemon src/index.js

lint:
	npx eslint src/

lint-fix:
	npx eslint src/ --fix

test:
	npx jest

build:
	docker compose build

run:
	docker compose up -d

stop:
	docker compose down

clean:
	rm -rf node_modules data
