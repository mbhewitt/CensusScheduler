FROM node:22-alpine

WORKDIR /client

COPY package.json /client
COPY yarn.lock /client

RUN yarn install --frozen-lockfile

COPY . /client

RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]
