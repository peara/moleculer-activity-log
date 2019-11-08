FROM node:10.16.3-alpine

ENV NODE_ENV=staging

RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i --production

COPY . .

RUN chmod +x docker/entrypoint.sh
CMD docker/entrypoint.sh
