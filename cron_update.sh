cd CensusScheduler
git checkout main
git pull
sudo docker system prune -fa
sudo docker-compose --file docker-compose-playa.yaml build --no-cache
sudo docker-compose --file docker-compose-playa.yaml up -d
