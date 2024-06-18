SFILE="scheduler_schema.sql"
DFILE="scheduler_schema.sql"
cat create_tables_from_source.sql | mysql -u root census
echo "SET time_zone = '-07:00';" > $SFILE
TABLE_LIST=`echo "show tables"|mysql |grep op_`
mysqldump -u root -y census --no-data $TABLE_LIST| sed 's$VALUES ($VALUES\n($g' | sed 's$),($),\n($g' |grep -v -- '-- Dump completed on '>> $SFILE

echo "insert ignore into op_volunteers (shiftboard_id,world_name,playa_name,passcode) values (1,'Admin','Admin','123456');" >>$SFILE
echo "insert ignore into op_roles (role_id,role,display,role_src) values (1,'SuperAdmin',1,'tablet'),(2,'Admin',1,'tablet');" >>$SFILE
echo "insert ignore into op_volunteer_roles (shiftboard_id,role_id) values (1,1),(1,2);" >>$SFILE
echo "insert into op_doodles (image_url) values ('');" >>$SFILE

echo "update op_shift_times set start_time=concat(start_time_lt,':00-07:00'),end_time=concat(end_time_lt,':00-07:00');" >>$SFILE
git add $SFILE
