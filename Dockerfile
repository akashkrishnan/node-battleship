FROM node:12.6.0-alpine as base

# Create working dir
RUN mkdir -p /home/app
WORKDIR /home/app

#RUN apk add --update --no-cache libc6-compat

# -----------------------------------------

FROM base as node_modules

ADD package.json package-lock.json /home/app/

# Install production npm deps
RUN npm install --production --unsafe-perm --quiet

# -----------------------------------------

FROM node_modules as dist

# Install development npm deps
RUN npm install --unsafe-perm --quiet

# Add build dependencies and sources
ADD .babelrc /home/app/
COPY src /home/app/src
COPY webpack /home/app/webpack

# Build
RUN npm --loglevel=silent run build

# -----------------------------------------

FROM base

COPY --from=dist /home/app/dist /home/app/dist
COPY --from=node_modules /home/app/node_modules /home/app/node_modules
COPY src/server /home/app/src/server
COPY package.json /home/app/

ENV NODE_ENV=production

CMD npm --loglevel=silent run server
