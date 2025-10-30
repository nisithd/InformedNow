FROM node:24-slim as build

RUN mkdir -p /home/app/frontend
WORKDIR /home/app/frontend
COPY ./informednow/package*.json ./
RUN npm install
COPY ./informednow .
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]