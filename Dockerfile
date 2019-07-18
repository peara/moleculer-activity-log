FROM node:10.16

ENV NODE_ENV=development

RUN mkdir /app
WORKDIR /app
COPY . .

RUN npm i

RUN chmod +x docker/entrypoint.sh
