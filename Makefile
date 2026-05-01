.PHONY: test server client-install client-build client-dev build dev

# Run Go tests (static-file tests skip themselves if the client isn't built)
test:
	go test -v -cover -timeout 5m ./...

# Run the Go server only (expects public/ to be already built)
server:
	go run main.go

# Install client dependencies
client-install:
	cd client && npm install

# Build the React client into public/
client-build:
	cd client && npm run build

# Run the Vite dev server (proxies /api to localhost:4000)
client-dev:
	cd client && npm run dev

# Build everything for production (client first, then Go binary)
build: client-build
	go build -o whos-next .

# Hint for local dev: open two shells and run:
#   make server
#   make client-dev
dev:
	@echo "Run 'make server' in one shell and 'make client-dev' in another."
