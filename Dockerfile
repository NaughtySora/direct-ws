FROM node:24-alpine
RUN apk add --no-cache tini
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run docker-build
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
