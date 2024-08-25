---
title: "Coolify on Raspberry Pi 4 Setup"
description: "Setting up a pi with coolify"
pubDate: "8/25/2024"
heroImage: "/blog-placeholder-4.jpg"
---

## Login with ssh

```sh
ssh USER_NAME@IP_ADDRESS
```

## Update and reboot

```sh
sudo apt update && sudo apt upgrade
```

```sh
sudo reboot
```

## Setup ssh key

### HOST

```sh
mkdir ~/.ssh && chmod 700 ~/.ssh
```

### CLIENT

#### Create key

```sh
ssh-keygen -b 4096
```

#### Transfer pubkey to host

```sh
ssh-copy-id pi@192.168.0.100
```

### HOST

```sh
sudo nano /etc/ssh/sshd_config
```

#### Modfify /etc/ssh/sshd_config

```txt
PORT 721

AddressFamily inet

PermitRootLogin no

PasswordAuthentication no
```

#### Restart ssh

```sh
sudo systemctl restart sshd
```

### CLIENT

```sh
sudo nano ~/.ssh/config
```

#### Modify ~/.ssh/config

```txt
# Host
        HostName IP_ADDRESS
        Port 721
        IdentityFile ~/.ssh/id_rsa.pub
        IdentitiesOnly yes
        User USER_NAME
```

```txt
# Client
        HostName IP_ADDRESS
        Port 721
        IdentityFile ~/.ssh/id_rsa2.pub
        IdentitiesOnly yes
        User USER_NAME
```

## Mount external HDD

### Check where it is mounted

```sh
lsblk
```

### Get UUID

```sh
sudo blkid /dev/sda1
```

### Create mount location

```sh
sudo mkdir -p /mnt/flex
```

### Change ownership

```sh
sudo chown -R $USER:$USER /mnt/flex
```

```sh
sudo chmod -R 755 /mnt/flex
```

### Modify fstab

```sh
sudo nano /etc/fstab
```

### Replace current

```sh
UUID=22d23d78-272d-4d51-9168-3ac30bfb6353  /mnt/flex       ext4            auto,nofail,noatime,rw,users  0    0
```

### Unmount drive

```sh
sudo umount /dev/sda1
```

### Reboot

```sh
sudo reboot
```

## Setup Coolify

### Login as root

```sh
sudo -i
```

### Install Coolify

```sh
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### Stop docker containers

```sh
docker stop $(docker ps -a -q)
```

### Create directories on external HDD

```sh
mkdir -p /mnt/flex/coolify/{source,ssh,applications,databases,backups,services,proxy,webhooks-during-maintenance,metrics,logs} && \
mkdir -p /mnt/flex/coolify/ssh/{keys,mux} && \
mkdir -p /mnt/flex/coolify/proxy/dynamic
```

### Update directory permissions

```sh
chown -R 9999:root /mnt/flex/coolify && chmod -R 700 /mnt/flex/coolify
```

### Move coolify to external HDD

```sh
rsync -a --remove-source-files /data/coolify/ /mnt/flex/coolify/
```

### Delete coolify on SD card

```sh
rm -R /data/coolify
```

### Modify /coolify/source/docker-compose.prod.yml

```sh
rm /mnt/flex/coolify/source/docker-compose.prod.yml && nano /mnt/flex/coolify/source/docker-compose.prod.yml
```

```txt
services:
  coolify:
    image: "ghcr.io/coollabsio/coolify:${LATEST_IMAGE:-latest}"
    volumes:
      - type: bind
        source: /mnt/flex/coolify/source/.env
        target: /var/www/html/.env
        read_only: true
      - /mnt/flex/coolify/ssh:/var/www/html/storage/app/ssh
      - /mnt/flex/coolify/applications:/var/www/html/storage/app/applications
      - /mnt/flex/coolify/databases:/var/www/html/storage/app/databases
      - /mnt/flex/coolify/services:/var/www/html/storage/app/services
      - /mnt/flex/coolify/backups:/var/www/html/storage/app/backups
      - /mnt/flex/coolify/webhooks-during-maintenance:/var/www/html/storage/app/webhooks-during-maintenance
    environment:
      - PHP_MEMORY_LIMIT
      - APP_ID
      - APP_ENV=production
      - APP_DEBUG
      - APP_NAME
      - APP_KEY
      - APP_URL
      - DB_CONNECTION
      - DB_HOST
      - DB_PORT
      - DB_DATABASE
      - DB_USERNAME
      - DB_PASSWORD
      - QUEUE_CONNECTION
      - REDIS_HOST
      - REDIS_PASSWORD
      - HORIZON_BALANCE
      - HORIZON_MAX_PROCESSES
      - HORIZON_BALANCE_MAX_SHIFT
      - HORIZON_BALANCE_COOLDOWN
      - SSL_MODE=off
      - PHP_PM_CONTROL=dynamic
      - PHP_PM_START_SERVERS=1
      - PHP_PM_MIN_SPARE_SERVERS=1
      - PHP_PM_MAX_SPARE_SERVERS=10
      - PUSHER_HOST
      - PUSHER_BACKEND_HOST
      - PUSHER_PORT
      - PUSHER_BACKEND_PORT
      - PUSHER_SCHEME
      - PUSHER_APP_ID
      - PUSHER_APP_KEY
      - PUSHER_APP_SECRET
      - AUTOUPDATE
      - SELF_HOSTED
      - SSH_MUX_PERSIST_TIME
      - FEEDBACK_DISCORD_WEBHOOK
      - WAITLIST
      - SUBSCRIPTION_PROVIDER
      - STRIPE_API_KEY
      - STRIPE_WEBHOOK_SECRET
      - STRIPE_PRICE_ID_BASIC_MONTHLY
      - STRIPE_PRICE_ID_BASIC_YEARLY
      - STRIPE_PRICE_ID_PRO_MONTHLY
      - STRIPE_PRICE_ID_PRO_YEARLY
      - STRIPE_PRICE_ID_ULTIMATE_MONTHLY
      - STRIPE_PRICE_ID_ULTIMATE_YEARLY
      - STRIPE_PRICE_ID_DYNAMIC_MONTHLY
      - STRIPE_PRICE_ID_DYNAMIC_YEARLY
      - STRIPE_PRICE_ID_BASIC_MONTHLY_OLD
      - STRIPE_PRICE_ID_BASIC_YEARLY_OLD
      - STRIPE_PRICE_ID_PRO_MONTHLY_OLD
      - STRIPE_PRICE_ID_PRO_YEARLY_OLD
      - STRIPE_PRICE_ID_ULTIMATE_MONTHLY_OLD
      - STRIPE_PRICE_ID_ULTIMATE_YEARLY_OLD
      - STRIPE_EXCLUDED_PLANS
    ports:
      - "${APP_PORT:-8000}:80"
    expose:
      - "${APP_PORT:-8000}"
    healthcheck:
      test: curl --fail http://127.0.0.1:80/api/health || exit 1
      interval: 5s
      retries: 10
      timeout: 2s
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
  postgres:
    volumes:
      - coolify-db:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: "${DB_USERNAME:-coolify}"
      POSTGRES_PASSWORD: "${DB_PASSWORD}"
      POSTGRES_DB: "${DB_DATABASE:-coolify}"
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -U ${DB_USERNAME:-coolify}",
          "-d",
          "${DB_DATABASE:-coolify}"
        ]
      interval: 5s
      retries: 10
      timeout: 2s
  redis:
    command: redis-server --save 20 1 --loglevel warning --requirepass ${REDIS_PASSWORD}
    environment:
      REDIS_PASSWORD: "${REDIS_PASSWORD}"
    volumes:
      - coolify-redis:/data
    healthcheck:
      test: redis-cli ping
      interval: 5s
      retries: 10
      timeout: 2s
  soketi:
    ports:
      - "${SOKETI_PORT:-6001}:6001"
    environment:
      SOKETI_DEBUG: "${SOKETI_DEBUG:-false}"
      SOKETI_DEFAULT_APP_ID: "${PUSHER_APP_ID}"
      SOKETI_DEFAULT_APP_KEY: "${PUSHER_APP_KEY}"
      SOKETI_DEFAULT_APP_SECRET: "${PUSHER_APP_SECRET}"
    healthcheck:
      test: wget -qO- http://127.0.0.1:6001/ready || exit 1
      interval: 5s
      retries: 10
      timeout: 2s
volumes:
  coolify-db:
    name: coolify-db
  coolify-redis:
    name: coolify-redis
```

### Start coolify with docker

```sh
docker compose --env-file /mnt/flex/coolify/source/.env \
    -f /mnt/flex/coolify/source/docker-compose.yml \
    -f /mnt/flex/coolify/source/docker-compose.prod.yml \
    up -d --pull always --remove-orphans --force-recreate
```

### Login to web UI

[IP_ADDRESS:8000](IP_ADDRESS:8000)

## Setup minio

1. Create access key
2. Download minio client

```sh
curl https://dl.min.io/client/mc/release/linux-arm64/mc \
  --create-dirs \
  -o ~/minio-binaries/mc
```

````sh
chmod +x $HOME/minio-binaries/mc
```sh
export PATH=$PATH:$HOME/minio-binaries/
````

### Create alias

```sh
mc alias set <ALIAS_NAME> <MINIO_SERVER_URL> <ACCESS_KEY> <SECRET_KEY>
```

### Add file to buckt

```sh
mc cp <LOCAL_FILE> <ALIAS_NAME>/<BUCKET_NAME>
```
