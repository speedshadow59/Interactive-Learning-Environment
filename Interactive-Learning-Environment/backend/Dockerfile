FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN apk add --no-cache python3

COPY . .

EXPOSE 5000

CMD ["npm", "run", "start"]
