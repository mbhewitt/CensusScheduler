#!/usr/bin/bash
cd ~/CensusScheduler
V1_TAG=$(< new_current_version.txt)
git checkout main
git pull
V2_TAG=$(< new_current_version.txt)
DC_found=`sudo docker images|grep $V2_TAG|wc|awk '{print $1}'`
echo "tags $V1_TAG -> $V2_TAG DC_Tag Found $DC_found"

sudo docker system prune -fa
sudo docker compose --file docker-compose-playa.yaml build &&
sudo docker compose --file docker-compose-playa.yaml up -d &&
sudo docker tag burning-man/census-app:latest burning-man/census-app:$V2_TAG &&
echo "$V2_TAG update successful"
sudo docker compose --file docker-compose-playa.yaml up -d
