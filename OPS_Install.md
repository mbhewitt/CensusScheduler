 Install based upon Ubuntu server 22.04.01
 * install https://github.com/mbhewitt/my_basic_config
 * sudo apt update -y && sudo apt upgrade -y
 * sudo apt install docker docker.io docker-compose net-tools mysql-client -y
 *  sudo timedatectl set-timezone America/Los_Angeles
 * cd my_basic_config
 * ./setup.sh
 * cd
 * sudo systemctl enable docker
 * sudo systemctl start docker
 * git clone git@github.com:mbhewitt/OnPlayaVolunteerInterface.git
 * cd OnPlayaVolunteerInterface
 * sudo docker-compose build
 * sudo docker-compose up

