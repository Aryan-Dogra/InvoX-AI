FROM node:24-bookworm

RUN apt-get update \
    && apt-get install -y python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package*.json ./backend/
RUN npm install --prefix backend

COPY requirements.txt .
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

COPY backend ./backend
COPY agents ./agents

RUN mkdir -p /app/backend/uploads

EXPOSE 10000

CMD ["npm", "start", "--prefix", "backend"]