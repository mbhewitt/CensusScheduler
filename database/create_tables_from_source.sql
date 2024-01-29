
drop table if exists op_shifts;
create table op_shifts (
   select left(s.date,4) year, (case when d.datename is null then 'OffPlaya' else d.datename end) datename, s.date, s.shift, 
        s.subject position, sum(s.qty) as total_slots, sum(case when s.shiftboard_id=0 then s.qty else 0 end) free_slots,
        max(s.role) role,c.category,c.core,c.lead,c.critical,c.RoleCategory position_category,c.SubCategoryPreReq prerequisite,
        c.offPlaya off_playa,c.SubCategory shift_category, concat(s.date,s.event_code) shift_id,concat(s.date,s.event_code,s.subject) shift_position_id,
        max(details) details, c.WAPpoints wap_points,
        concat(s.date,' ',left(s.shift,case when s.shift like '%M%' then 7 else 5 end)) start_time_lt,
        concat(s.date,' ',right(s.shift,case when s.shift like '%M%' then 7 else 5 end)) end_time_lt, 
        concat((case when d.datename is null then 'OffPlaya' else d.datename end)," ",c.shortname," ",s.shift) as shiftname,
        c.shortname
     from shiftboard2 s left join bm_dates d using (date) left join subject_category c using (subject) 
     where left(s.date,4)=left(date_sub(now(),interval 5 month),4)  
     group by 1,2,3,4,5,9,10,11,12,13,14,15,16,17,18,20,21,22,23,24
  );
alter table op_shifts add create_shift boolean default false, add delete_shift boolean default false, add update_shift boolean default false, add primary key(shift_position_id), add key(shift_id), add key (year,off_playa), add notes longtext;

update bm_volunteers v inner join shiftboard_pinfo p using (shiftboard_id) inner join shiftboard_rinfo2 r using (shiftboard_id) 
       set v.playaname=p.playaname,v.first=p.first,v.last=p.last,v.account=r.account;

update bm_volunteers 
       set newplaya=(case when playaname='' then first else playaname end), 
       playa_not_first=(case when playaname!=first then true else false end) 
          where newplaya is NULL;
update bm_volunteers set newplaya=playaname, playa_not_first=true where playaname!='';

drop table if exists op_volunteers;
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

drop table if exists op_volunteer_roles;
create temporary table numbers (n int);
insert into numbers values (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12);
create table op_volunteer_roles (
select shiftboard_id, SUBSTRING_INDEX(SUBSTRING_INDEX(roles, ',', numbers.n), ',', -1) roles 
   from numbers inner join shiftboard_rinfo2 on CHAR_LENGTH(roles) -CHAR_LENGTH(REPLACE(roles, ',', ''))>=numbers.n-1);
delete from op_volunteer_roles where roles='';
delete from op_volunteer_roles where roles in (select role from shiftboard_roles where display=0);
alter table op_volunteer_roles add primary key(shiftboard_id,roles), add key(roles), add add_role boolean default false, add remove_role boolean default false;

-- drop table if exists op_volunteer_roles;
-- create table op_volunteer_roles (
-- select t.shiftboard_id, j.roles
-- from shiftboard_rinfo2 t
-- join json_table(
--   replace(json_array(t.roles), ',', '","'),
--   '$[*]' columns (roles varchar(50) path '$')
-- ) j where j.roles!='');

insert into op_volunteer_roles (shiftboard_id,roles) (
   select shiftboard_id,flag_name from volunteer_flags where flag_value=1 and year=left(date_sub(now(),interval 5 month),4));

insert into op_volunteer_roles (shiftboard_id,roles) (
   select shiftboard_id,'Admin' from shiftboard_rinfo2 r where r.roles like '%Core Crew%' or r.roles like '%Lead%' or r.roles like '%Training%');

drop table if exists op_roles;
create table op_roles (roles varchar(50) not null, create_role boolean default false, delete_role boolean default false, display boolean default true, primary key(roles));

insert into op_roles (roles,display) select role,display from shiftboard_roles;
insert ignore into op_roles (roles) select distinct roles from op_volunteer_roles;

drop table if exists op_volunteer_shifts;
create table op_volunteer_shifts (
   select distinct concat(date,event_code,subject) shift_position_id, shiftboard_id,id shiftboard_shift_id, 
         case when noshow='' and date>=now() then 'X' else noshow end noshow
         from shiftboard2 where left(date,4)=left(date_sub(now(),interval 5 month),4)
   );
alter table op_volunteer_shifts 
   modify shiftboard_shift_id bigint default 0, 
   add add_shift boolean default false,
   add remove_shift boolean default false,
   add update_shift boolean default false,
   add primary key (shiftboard_id,shift_position_id,shiftboard_shift_id), 
   add key (shift_position_id);

drop table if exists op_messages;
create table op_messages (timestamp timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,name text,
   email text,`to` text,message longtext, wants_reply boolean default false, sent boolean default false, 
   row_id bigint auto_increment not null, primary key(row_id));


