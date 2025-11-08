FROM node:24-slim 

RUN mkdir -p /home/app
WORKDIR /home/app

COPY ./package*.json ./
COPY ./tsconfig.json ./
COPY ./src ./src
RUN npm install
RUN npm run build

EXPOSE 3000
CMD ["npm","run","prod"]