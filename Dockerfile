FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci && npm prune --production

COPY . .

CMD ["node", "src/index.js"]
