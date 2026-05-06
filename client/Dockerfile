FROM node:22-bookworm

WORKDIR /client

# Recent node images don't ship yarn by default; activate via corepack.
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

COPY package.json /client
COPY yarn.lock /client

# `yarn cache clean` after install drops ~2.2 GB of downloaded tarballs
# that would otherwise live forever in this layer.
RUN yarn install --frozen-lockfile && yarn cache clean

COPY . /client

RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]
