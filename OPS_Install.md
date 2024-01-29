The basic system will consist of a wifi access point running DHCP. We have it setup where the tablets get 192.168.13.X addresses and everyone else gets 192.168.11.X addresses. With the server on 192.168.11.11 . The tablets are prevented from accessing the internet. They get DNS from 192.168.11.11 which redirects every request to itself.
 
 Install based upon Ubuntu server 22.04.01
 * install 
 * sudo apt update -y && sudo apt upgrade -y
 * sudo apt install docker docker.io docker-compose net-tools mysql-client -y
 * sudo timedatectl set-timezone America/Los_Angeles
 * cd
 * sudo systemctl enable docker
 * sudo systemctl start docker
 * git clone git@github.com:mbhewitt/CensusScheduler.git
 * cd OnPlayaVolunteerInterface
 * sudo docker-compose build
 * sudo docker-compose up

