FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build:css

RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "src/app.js"]
