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


## On-playa outbound email (intermittent uplink)

The app's mail worker (`client/lib/mail`) queues every email in
`op_email_queue` and retries transient failures forever (backoff caps at
24h), so an internet outage never drops mail — it sends whenever the
uplink is up. What the playa box needs is a real SMTP submission target,
because unlike the cloud box there is no local Exim/SES relay. We use the
same Gmail account the legacy VCcensus mailer sent through.

Add to `client/.env.production` on the playa server (password is
`$MYVARS["users"]["mu"]["imappassword"]` in `CensusSecret/bm_org_local.php`;
it is a Gmail app password):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=1
SMTP_USER=mu@burningman.org
SMTP_PASS=<gmail app password from CensusSecret/bm_org_local.php>
MAIL_FROM=Mu Census VC <censusvolunteercoordinators@burningman.org>
```

Notes:
* `MAIL_FROM` matches the legacy mailer's From. Gmail only honors it
  because it is a configured send-as alias on the mu account; otherwise it
  rewrites From to mu@burningman.org (harmless).
* Make sure `MAIL_DRY_RUN` and `MAIL_WORKER_DISABLED` are NOT set.
* Rebuild/recreate the container after editing the env file.
* Watch it: `docker logs census-app | grep mail:` — the worker logs
  `smtp=smtp.gmail.com:465 auth=mu@burningman.org secure=true` on boot,
  and queue state lives in `op_email_queue` (`status`, `attempts`,
  `next_attempt_at`, `last_error`).
