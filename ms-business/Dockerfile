FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Opciones para modo desarrollo vs producción (acá lo dejamos listo para prod/dev según CMD)
EXPOSE 3000

CMD ["npm", "run", "start:dev"]
