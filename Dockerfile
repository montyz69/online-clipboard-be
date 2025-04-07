FROM node:18-alpine

RUN npm install -g typescript

WORKDIR /src

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3001

CMD [ "npm", "start" ]  
