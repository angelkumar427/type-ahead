# Step 1: Base image
FROM node:20-alpine

# Step 2: Working directory inside the container
WORKDIR /app

# Step 3: Copy package files
COPY package.json package-lock.json* ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy source code
COPY . .

# Step 6: Expose port and start
EXPOSE 3000
CMD ["npm", "run", "dev"]
