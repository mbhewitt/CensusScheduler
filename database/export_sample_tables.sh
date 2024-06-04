SFILE="scheduler_sample_data.sql"

echo "SET time_zone = '-07:00';" > $SFILE
echo "SET FOREIGN_KEY_CHECKS=0;delete from op_volunteers;delete from op_volunteer_roles;delete from op_volunteer_shifts;SET FOREIGN_KEY_CHECKS=1;"|mysql -u root census

mysqldump -u root -y census op_doodles op_dates op_messages op_position_type op_roles op_shift_category op_shift_name op_shift_position op_shift_times op_volunteer_roles op_volunteer_shifts op_volunteers| sed 's$VALUES ($VALUES\n($g' | sed 's$),($),\n($g' |grep -v -- '-- Dump completed on '>> $SFILE

echo "insert ignore into op_volunteers (shiftboard_id,world_name,playa_name,passcode) values (1,'Admin','Admin','123456');" >>$SFILE
echo "insert ignore into op_roles (role_id,role,display,role_src) values (1,'SuperAdmin',1,'tablet'),(2,'Admin',1,'tablet');" >>$SFILE
echo "insert ignore into op_volunteer_roles (shiftboard_id,role_id) values (1,1),(1,2);" >>$SFILE

#echo "alter table op_volunteers add timestamp timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;" >>$SFILE
#echo "alter table op_volunteer_shifts add timestamp timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;" >>$SFILE
#echo "alter table op_shift_times add end_time timestamp,add start_time timestamp;">>$SFILE
echo "update op_shift_times set start_time=concat(start_time_lt,':00-07:00'),end_time=concat(end_time_lt,':00-07:00');" >>$SFILE
git add $SFILE
