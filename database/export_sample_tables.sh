SFILE="scheduler_sample_data.sql"

echo "SET time_zone = '-07:00';" > $SFILE
echo "SET FOREIGN_KEY_CHECKS=0;delete from op_volunteers;delete from op_volunteer_roles;delete from op_volunteer_shifts;SET FOREIGN_KEY_CHECKS=1;"|mysql -u root census
TABLE_LIST=`echo "show tables"|mysql |grep op_`

mysqldump -u root -y census $TABLE_LIST| sed 's$VALUES ($VALUES\n($g' | sed 's$),($),\n($g' |grep -v -- '-- Dump completed on '>> $SFILE

echo "insert ignore into op_volunteers (shiftboard_id,world_name,playa_name,passcode) values (1,'Admin','Admin','123456');" >>$SFILE
echo "insert ignore into op_roles (role_id,role,display,role_src) values (1,'SuperAdmin',1,'tablet'),(2,'Admin',1,'tablet');" >>$SFILE
echo "insert ignore into op_volunteer_roles (shiftboard_id,role_id) values (1,1),(1,2);" >>$SFILE

echo "update op_shift_times set start_time=date_add(concat(start_time_lt,':00'),interval 7 hour) , end_time=date_add(concat(end_time_lt,':00'), interval 7 hour);" >>$SFILE
echo "update op_position_type set role_id=NULL where role_id in ('43174','21215');" >>$SFILE
git add $SFILE
