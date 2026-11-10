FROM node:20-alpine

WORKDIR /app

# Install compilation dependencies for native Node modules (e.g. bcrypt)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3006

CMD ["npm", "run", "dev:nodemon"]
