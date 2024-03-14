cd CensusScheduler
git checkout main
git pull
sudo docker system prune -fa
sudo docker-compose build --no-cache
sudo docker-compose up -d
