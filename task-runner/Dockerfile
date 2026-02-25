FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for tsx)
RUN npm install

# Copy source code
COPY tsconfig.json .
COPY src ./src

# The Task Runner does not require a build step because we run it directly with tsx
# (Alternative: compile using tsc and run node dist/index.js)

CMD ["npx", "tsx", "src/index.ts"]
