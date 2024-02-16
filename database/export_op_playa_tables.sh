SFILE="scheduler_schema.sql"
cat create_tables_from_source.sql | mysql -u root census
echo "SET time_zone = '-07:00';" > $SFILE
mysqldump -u root -y census --no-data op_dates op_messages op_position_type op_roles op_shift_category op_shift_name op_shift_position op_shift_times op_volunteer_roles op_volunteer_shifts op_volunteers| sed 's$VALUES ($VALUES\n($g' | sed 's$),($),\n($g' |grep -v -- '-- Dump completed on '>> $SFILE

#echo "-- Test shfits now and in future" >>$SFILE
#echo "INSERT INTO \`op_shifts\` (year,datename,date,shift,position,total_slots,free_slots,role,category,core,\`lead\`,critical,position_category,prerequisite,off_playa,shift_category,shift_id,shift_position_id,details,wap_points,start_time_lt,end_time_lt,shiftname,shortname) VALUES " >>$SFILE
#echo "(left(date_sub(now(), interval 2 day),4),'OffPlaya',left(date_sub(now(), interval 2 day),10),'01:00 - 23:00','Test Subject1',2,2,'',NULL,0,0,0,NULL,NULL,0,NULL,concat(left(date_sub(now(), interval 2 day),10),'Test'),concat(left(date_sub(now(), interval 2 day),10),'Test','Test Subject1'),'No Description only test',0,concat(left(date_sub(now(), interval 2 day),10),' 01:00'),concat(left(date_sub(now(), interval 2 day),10),' 23:00'),'2023 Test Shift Prev2','Test SHift'),">>$SFILE
#echo "(left(date_sub(now(), interval 1 day),4),'OffPlaya',left(date_sub(now(), interval 1 day),10),'01:00 - 23:00','Test Subject5',2,2,'',NULL,0,0,0,NULL,NULL,0,NULL,concat(left(date_sub(now(), interval 1 day),10),'Test'),concat(left(date_sub(now(), interval 1 day),10),'Test','Test Subject5'),'No Description only test',0,concat(left(date_sub(now(), interval 1 day),10),' 01:00'),concat(left(date_sub(now(), interval 1 day),10),' 23:00'),'2023 Test Shift Prev','Test SHift'),">>$SFILE
#echo "(left(now(),4),'OffPlaya',left(now(),10),'01:00 - 23:00','Test Subject4',2,2,'',NULL,0,0,0,NULL,NULL,0,NULL,concat(left(now(),10),'Test'),concat(left(now(),10),'Test','Test Subject4'),'No Description only test',0,concat(left(now(),10),' 01:00'),concat(left(now(),10),' 23:00'),'2023 Test Shift','Test SHift'),">>$SFILE
#echo "(left(date_add(now(), interval 1 day),4),'OffPlaya',left(date_add(now(), interval 1 day),10),'01:00 - 23:00','Test Subject3',2,2,'',NULL,0,0,0,NULL,NULL,0,NULL,concat(left(date_add(now(), interval 1 day),10),'Test'),concat(left(date_add(now(), interval 1 day),10),'Test','Test Subject3'),'No Description only test',0,concat(left(date_add(now(), interval 1 day),10),' 01:00'),concat(left(date_add(now(), interval 1 day),10),' 23:00'),'2023 Test Shift after','Test SHift');">>$SFILE

echo "insert ignore into op_volunteers (shiftboard_id,playa_name,passcode) values (1,'Admin','123456');" >>$SFILE
echo "insert ignore into op_roles (role_id,role,display,role_src) values (0,'SuperAdmin',1,'tablet'),(1,'Admin',1,'tablet');" >>$SFILE
echo "insert ignore into op_volunteer_roles (shiftboard_id,role_id) values (1,0),(1,1);" >>$SFILE

echo "alter table op_volunteers add timestamp timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;" >>$SFILE
echo "alter table op_volunteer_shifts add timestamp timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;" >>$SFILE
echo "alter table op_shift_times add end_time timestamp,add start_time timestamp;">>$SFILE
echo "update op_shift_times set start_time=concat(start_time_lt,':00-07:00'),end_time=concat(end_time_lt,':00-07:00');" >>$SFILE
git add $SFILE
