FROM alpine:3.9.4 as installer

LABEL maintainer="adam@adamsimpson.net"

COPY package.json .

RUN apk update && \
    apk add nodejs npm bind-tools && \
    npm install

FROM installer

COPY --from=installer /node_modules .

COPY index.js .

COPY .env .

ENTRYPOINT ["node", "index.js"]
