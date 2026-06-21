# Step 1: Base image
FROM node:20-alpine

# Step 2: Working directory inside the container
WORKDIR /app

# Step 3: Copy package files
COPY package.json package-lock.json* ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy source code and Docker entrypoint
COPY . .

# Step 6: Ensure entrypoint script has executable permissions
RUN chmod +x docker-entrypoint.sh

# Step 7: Expose port and start
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
