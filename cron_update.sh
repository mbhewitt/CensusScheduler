cd OnPlayaVolunteerInterface
git checkout main
git pull
sudo docker system prune -fa
sudo docker-compose build --no-cache
sudo docker-compose up -d
sleep 10
cat database/on_playa_server_data.sql| mysql -uroot -h 127.0.0.1 -padmin census
