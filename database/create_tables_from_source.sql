drop table if exists op_volunteer_shifts;
drop table if exists op_shift_times;
drop table if exists op_shift_position;
drop table if exists op_shift_name;
drop table if exists op_volunteer_roles;
drop table if exists op_volunteers;
drop table if exists op_position_type;
drop table if exists op_roles;
drop table if exists op_messages;
drop table if exists op_shift_category;
drop table if exists op_dates;

update bm_volunteers v inner join shiftboard_pinfo p using (shiftboard_id) inner join shiftboard_rinfo2 r using (shiftboard_id) 
       set v.playaname=p.playaname,v.first=p.first,v.last=p.last,v.account=r.account;

update bm_volunteers 
       set newplaya=(case when playaname='' then first else playaname end), 
       playa_not_first=(case when playaname!=first then true else false end) 
          where newplaya is NULL;
update bm_volunteers set newplaya=playaname, playa_not_first=true where playaname!='';

create table op_volunteers (
   select v.shiftboard_id,v.newplaya playa_name,concat(v.first,' ',v.last) world_name,p.email,GREATEST(p.mobilephone,p.homephone,p.workphone) phone,
         right(r.view,4) passcode, mid(r.view,locate('account=',r.view)+8,10) account_id, 
         case when r.roles like '%Core Crew%' or r.roles like '%Lead%' then true else false end core_crew, 
         0 new_shiftboard_id,n.score, z.rs_shifts,z.total_shifts 
      from bm_volunteers v join shiftboard_pinfo p using (shiftboard_id) 
         left join shiftboard_rinfo2 r using (shiftboard_id) left join (select shiftboard_id,avg(score) score from review_notes 
            where date> date_sub(now(),interval 2 year) group by 1) n using (shiftboard_id) 
         left join (select shiftboard_id,sum(case when room='RS' then (case when subject like '%Lead%' then 2 else 1 end) else 0 end) rs_shifts,
            sum(case when room!='T' then (case when subject like '%Lead%'  then 2 else 1 end) 
            else (case when subject like '%trainer%' then 1 else 0 end ) end) total_shifts 
            from shiftboard2 where noshow='' and date>date_sub(now(), interval 5 year) and date < now() group by 1) z using (shiftboard_id) 
      where exists (select * from shiftboard2 s2 where s2.shiftboard_id=v.shiftboard_id and date>date_sub(now(), interval 1 year)));
alter table op_volunteers add create_volunteer boolean default false,
        add update_volunteer boolean default false,
        add delete_volunteer boolean default false,
        add notes longtext, add location longtext, add emergency_contact longtext, add primary key(shiftboard_id), 
	add key (passcode,shiftboard_id), modify world_name text,modify email text, modify phone text;

insert ignore into op_volunteers (shiftboard_id,playa_name,world_name,email,phone,passcode,account_id,core_crew,
                                  new_shiftboard_id,score,rs_shifts,total_shifts) (
   select v.shiftboard_id,v.newplaya playa_name,concat(v.first,' ',v.last) world_name,p.email,GREATEST(p.mobilephone,p.homephone,p.workphone)
         phone,right(r.view,4) passcode, mid(r.view,locate('account=',r.view)+8,10) account_id, case when r.roles like '%Core Crew%' then true else false end
         core_crew, 0 new_shiftboard_id,n.score, z.rs_shifts,z.total_shifts 
      from bm_volunteers v join shiftboard_pinfo p using (shiftboard_id) left join shiftboard_rinfo2 r using (shiftboard_id) 
         left join (select shiftboard_id,avg(score) score from review_notes where date> date_sub(now(),interval 2 year) group by 1) n 
         using (shiftboard_id) left join (select shiftboard_id,sum(case when room='RS' then (case when subject like
            '%Lead%' then 2 else 1 end) else 0 end) rs_shifts,sum(case when room!='T' then (case when subject like '%Lead%' then 2 else 1 end) 
            else (case when subject like '%trainer%' then 1 else 0 end ) end) total_shifts from shiftboard2 where noshow='' and date>date_sub(now(), 
            interval 5 year) and date < now() group by 1) z using (shiftboard_id) 
      where r.roles like '%Core Crew%'
   );

alter table op_volunteers modify passcode varchar(6);
insert ignore into op_volunteers (shiftboard_id,playa_name,passcode) values (1,"Admin","123456");

CREATE TABLE `op_roles` (
  `role_id` bigint NOT NULL AUTO_INCREMENT,
  `role` varchar(64) DEFAULT NULL,
  `display` tinyint(1) DEFAULT '1',
  `role_src` varchar(16) DEFAULT NULL,
  create_role boolean default false, delete_role boolean default false,update_role boolean default false,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role` (`role`)
);
insert ignore into op_roles (role_id,role,display,role_src) values (0,"SuperAdmin",1,"tablet"),(1,"Admin",1,"tablet");
insert ignore into op_roles (role_id,role,display,role_src) select id,role,display,role_src from shiftboard_roles;


CREATE TABLE `op_volunteer_roles` (
  `shiftboard_id` bigint NOT NULL,
  `role_id` bigint,
  `add_role` tinyint(1) DEFAULT '0',
  `remove_role` tinyint(1) DEFAULT '0',
   foreign key (shiftboard_id) references op_volunteers(shiftboard_id),
   foreign key (role_id) references op_roles(role_id),
  PRIMARY KEY (`shiftboard_id`,`role_id`),
  KEY `role_id` (`role_id`)
);

drop table if exists numbers;
create temporary table numbers (n int);
insert into numbers values (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12);
drop table if exists tmp_volunteer_roles;
create temporary table tmp_volunteer_roles (
select shiftboard_id, SUBSTRING_INDEX(SUBSTRING_INDEX(roles, ',', numbers.n), ',', -1) roles
from numbers inner join shiftboard_rinfo2 on CHAR_LENGTH(roles) -CHAR_LENGTH(REPLACE(roles, ',', ''))>=numbers.n-1);

delete from tmp_volunteer_roles where roles='';
insert ignore into op_volunteer_roles ( shiftboard_id,role_id) (
   select shiftboard_id,role_id from tmp_volunteer_roles join op_roles on (op_roles.role=tmp_volunteer_roles.roles)
);

insert ignore into op_volunteer_roles ( shiftboard_id,role_id) (
   select shiftboard_id,role_id from volunteer_flags join op_roles on (op_roles.role=volunteer_flags.flag_name) where flag_value=1 and year=left(date_sub(now(),interval 5 month),4)
);

insert ignore into op_volunteer_roles (shiftboard_id,role_id) (
   select shiftboard_id,role_id from shiftboard_rinfo2 r join op_roles on (op_roles.role='Admin') where r.roles like '%Core Crew%' or r.roles like '%Lead%' or r.roles like '%Training%'
);

insert ignore into op_volunteer_roles (shiftboard_id,role_id) values (1,0),(1,1);

create table op_messages (timestamp timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,name text,
   email text,`to` text,message longtext, wants_reply boolean default false, sent boolean default false, 
   row_id bigint auto_increment not null, primary key(row_id));


create table op_shift_category (
   category varchar(128) not null,shift_category varchar(128) not null,shift_category_id bigint auto_increment not null,
   create_category boolean default false, delete_category boolean default false,update_category boolean default false,
   primary key (shift_category_id), key(category),unique(shift_category));

insert ignore into op_shift_category (category,shift_category) (
   select distinct category,subcategory from subject_category where subcategory is not null);

create table op_position_type (
   position varchar(128), role_id bigint, `lead` bool,critical bool, prerequisite_id bigint,
   position_details longtext, position_type_id bigint auto_increment not null,
   start_time_offset int default 0, end_time_offset int default 0,
   create_position boolean default false, delete_position boolean default false,update_position boolean default false,
   foreign key (role_id) references op_roles(role_id),
   foreign key (prerequisite_id) references op_shift_category(shift_category_id),
   unique ( position),
   primary key (position_type_id));

insert ignore into op_position_type (position,role_id,`lead`,critical,prerequisite_id,position_details) (
   select position, max(r.role_id) as role_id,max(`lead`),max(critical),
      max(s.shift_category_id) as prerequisite_id,max(details) 
   from subject_category c 
      join shiftboard2 z on z.subject=c.subject 
      left join op_roles r on (z.role=r.role) 
      left join op_shift_category s on (c.SubCategoryPreReq=s.shift_category) 
   where left(z.date,4)=left(date_sub(now(),interval 6 month),4) 
   group by position
);

create table op_shift_name ( 
   core bool, off_playa bool, shift_category_id bigint, 
   shift_name_id bigint auto_increment not null, 
   shift_details longtext, shift_name varchar(64), 
   create_shift boolean default false, delete_shift boolean default false,update_shift boolean default false,
   foreign key (shift_category_id) references op_shift_category(shift_category_id),
   unique(shift_name), 
   primary key (shift_name_id));

insert ignore into op_shift_name (core,off_playa,shift_category_id,shift_details,shift_name) (
   select distinct core, offplaya,shift_category_id,'',shortname as shift_name 
   from subject_category s 
      join shiftboard2 z on (z.subject=s.subject and left(z.date,4)=left(date_sub(now(),interval 6 month),4) )
      left join op_shift_category c on (c.shift_category=s.subcategory)
);


CREATE TABLE `op_dates` (
  `year` varchar(4),
  `date` date NOT NULL,
  `datename` varchar(64) NOT NULL DEFAULT '',
  PRIMARY KEY (`date`,`datename`),
  KEY `year` (`year`,`datename`),
  KEY `datename` (`datename`)
);

insert into op_dates (year,date,datename) (select year,date,datename from bm_dates);

create table op_shift_times (
   year varchar(4), date date,shift varchar(32),shift_name_id bigint, 
   shift_instance varchar(32),start_time_lt varchar(32),end_time_lt varchar(32), 
   shift_times_id bigint auto_increment not null, notes longtext,
   add_shift_time boolean default false, remove_shift_time boolean default false,update_shift_time boolean default false,
   foreign key (shift_name_id) references op_shift_name(shift_name_id),
   unique(date,shift_instance), 
   primary key(shift_times_id));

insert ignore into op_shift_times (year,date,shift,shift_instance,shift_name_id, start_time_lt,end_time_lt) (
   select distinct max(left(date_add(date,interval 3 month),4)) year, s.date,max(shift) shift,
      s.event_code shift_instance,max(shift_name_id), 
      min(concat(s.date,' ',left(s.shift,case when s.shift like '%M%' then 7 else 5 end))) start_time_lt,
      max(concat(s.date,' ',right(s.shift,case when s.shift like '%M%' then 7 else 5 end))) end_time_lt
   from shiftboard2 s 
      join subject_category c using (subject) 
      join op_shift_name sc on (c.shortname=sc.shift_name)
   where left(s.date,4)=left(date_sub(now(),interval 6 month),4) 
   group by 2,4
);

create table op_shift_position (
   position_type_id bigint, total_slots int, shift_name_id bigint, wap_points int, shift_position_id bigint auto_increment not null,
   add_shift_position boolean default false, remove_shift_position boolean default false,update_shift_position boolean default false,
   foreign key (shift_name_id) references op_shift_name(shift_name_id),
   foreign key (position_type_id) references op_position_type(position_type_id),
   unique(position_type_id,shift_name_id), 
   primary key(shift_position_id));

insert into op_shift_position (position_type_id,total_slots,shift_name_id,wap_points) (
   select position_type_id,round(sum(qty)/count(distinct concat(date,event_code)),0) as total_slots,
      shift_name_id,max(c.wappoints)
   from shiftboard2 s 
      join subject_category c using (subject) 
      join op_shift_name sc on (c.shortname=sc.shift_name) 
      join op_position_type pt on (c.position=pt.position)
   where left(s.date,4)=left(date_sub(now(),interval 6 month),4) 
   group by 1,3
);


CREATE TABLE `op_volunteer_shifts` (
  shift_position_id bigint,
  shift_times_id bigint,
  `shiftboard_id` bigint NOT NULL,
  `shiftboard_shift_id` bigint NOT NULL DEFAULT '0',
  `noshow` varchar(10) CHARACTER SET latin1 DEFAULT NULL,
  `add_shift` tinyint(1) DEFAULT '0',
  `remove_shift` tinyint(1) DEFAULT '0',
  `update_shift` tinyint(1) DEFAULT '0',
  foreign key (shiftboard_id) references op_volunteers(shiftboard_id),
  foreign key (shift_position_id) references op_shift_position(shift_position_id),
  foreign key (shift_times_id) references op_shift_times(shift_times_id),
  PRIMARY KEY (`shiftboard_id`,`shift_position_id`,`shiftboard_shift_id`),
  KEY `shift_position_id` (`shift_position_id`)
);

insert ignore into op_volunteer_shifts (shift_position_id,shift_times_id, shiftboard_id,shiftboard_shift_id,noshow) (
   select shift_position_id, shift_times_id, shiftboard_id,id shiftboard_shift_id,
      case when noshow='' and s.date>=now() then 'X' else noshow end noshow
   from shiftboard2 s join subject_category sc using (subject)
      join op_position_type pt on (pt.position=sc.position)
      join op_shift_position sp on (pt.position_type_id=sp.position_type_id)
      join op_shift_times st on (s.event_code=st.shift_instance and s.date=st.date and st.shift_name_id=sp.shift_name_id)
   where left(s.date,4)=left(date_sub(now(),interval 5 month),4) and shiftboard_id!=0
);
