FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o api .

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /app/api ./api
EXPOSE 8080
ENV PORT=8080
CMD ["./api"]
