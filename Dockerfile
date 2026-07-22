FROM node:22-alpine

WORKDIR /app

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci && npm prune --production

COPY --chown=node:node . .

USER node

CMD ["node", "src/index.js"]
