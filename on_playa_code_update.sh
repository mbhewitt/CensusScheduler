#!/usr/bin/bash
cd ~/CensusScheduler
V1_TAG=$(< new_current_version.txt)
git checkout main
git pull
# The training course bundle (client/public/training) is stored in Git LFS.
# If git-lfs isn't installed, or the smudge filter didn't run, the working tree
# holds ~130-byte pointer files and the app ships blank images / broken PDFs.
# Fetch the real objects explicitly — this must happen while still on a
# network, since there is nothing to fetch from once we're offline on playa.
git lfs pull || echo "WARNING: git lfs pull failed - training images/PDFs may be pointer files"
V2_TAG=$(< new_current_version.txt)
DC_found=`sudo docker images|grep $V2_TAG|wc|awk '{print $1}'`
echo "tags $V1_TAG -> $V2_TAG DC_Tag Found $DC_found"

sudo docker system prune -fa
sudo docker compose --file docker-compose-playa.yaml build &&
sudo docker compose --file docker-compose-playa.yaml up -d &&
sudo docker tag burning-man/census-app:latest burning-man/census-app:$V2_TAG &&
echo "$V2_TAG update successful"
sudo docker compose --file docker-compose-playa.yaml up -d
