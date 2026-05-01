# syntax=docker/dockerfile:1.7

# ---------- Stage 1: build the React client ----------
FROM node:20-alpine AS client-build
WORKDIR /client
COPY client/package.json client/package-lock.json* ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---------- Stage 2: build the Go binary ----------
FROM golang:1.25-alpine AS server-build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/whos-next .

# ---------- Stage 3: minimal runtime ----------
FROM alpine:3.20
RUN apk add --no-cache ca-certificates && adduser -D -u 10001 app
WORKDIR /app
COPY --from=server-build /out/whos-next ./whos-next
COPY --from=client-build /public ./public
USER app
EXPOSE 4000
CMD ["./whos-next"]
