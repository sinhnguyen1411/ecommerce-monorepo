FROM golang:1.22-alpine AS base
WORKDIR /app
COPY go.mod ./
RUN go mod download

FROM base AS dev
COPY . .
CMD ["go", "run", "."]

FROM base AS builder
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o api .

FROM alpine:3.20 AS prod
WORKDIR /app
COPY --from=builder /app/api ./api
ENV PORT=8080
EXPOSE 8080
CMD ["./api"]
