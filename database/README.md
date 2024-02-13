# Useful Tables in database

## op_dates -- ref table translating date to date_name

- **year** -- burn year
- **date** -- date
- **datename** -- what we call the name on playa allows for date references between years

## op_position_type -- details on the positions in shifts

- **position** -- name of the position
- **role_id** -- foreign key to op_roles, if the position has a role restriction 
- **lead** -- if the position is a lead position
- **critical** -- if the position is critical to the success of the shift
- **prerequisite_id** -- foreign key to op_shift_category, if the position has a shift that is a prereq to it
- **position_details** -- description of the position
- **position_type_id** -- the row id
- **start_time_offset** -- if the position actually starts this number of minutes before the shift start time
- **end_time_offset** -- if the position actually ends this number of minutes after the shift end time
- **create_position** -- 'bool', if the position is created on playa
- **delete_position** --  'bool', if the position is deleted on playa
- **update_position** --  'bool', if the position is updated on playa

## op_shift_category -- the category a shift falls into

- **category** -- name of the category
- **shift_category** -- name of the shift category
- **shift_category_id** -- row id
- **create_category**  -- 'bool', if the category is created on playa
- **delete_category** --  'bool', if the category is deleted on playa
- **update_category** --  'bool', if the category is updated on playa

## op_shift_name -- the name of a shift type, shift_times and shift_position are subtables of this one

- **core** -- bool if shift is part of the core mission
- **off_playa** -- bool if the shift takes place off playa
- **shift_category_id** -- foreign key to op_shfit_category
- **shift_name_id** -- rowid
- **shift_details** -- description of the shift type
- **shift_name** -- name of the shift type
- **create_shift** -- `Bool`, if this is an addition to the table onplaya this should be set to true
- **delete_shift** -- `Bool`, if true mark this shift for deletion
- **update_shift** -- `Bool`, if true we made a change to a shift

## op_shift_position -- links the position into the shift name table

- **position_type_id** -- foreign key to op_position_type
- **total_slots** -- number of slots needed for this position type
- **shift_name_id** -- foreign key to op_shift_name
- **wap_points** -- number of points associated with this position on this shift
- **shift_position_id** -- rowid
- **add_shift_position** -- `Bool`, if this is an addition to the table onplaya this should be set to true
- **remove_shift_position** --  `Bool`, if true mark this shift for deletion
- **update_shift_position** --  `Bool`, if true we made a change to a shift

## op_shift_times -- adds particular times to the shift name table

- **year** -- burn year
- **date** -- date the shift happens
- **shift** -- shift time text (dont use)
- **shift_name_id** -- foreign key to op_shift_name
- **shift_instance** -- a keyword to link the shiftboard shifts to the censusscheuduler
- **start_time_lt** -- local time text of the start time
- **end_time_lt** -- local time text of the end time
- **start_time** -- datetime
- **end_time** -- datetime
- **shift_times_id** -- rowid
- **notes** -- onplaya notes changes
- **add_shift_time** -- 
- **remove_shift_time** -- 
- **update_shift_time** -- 


## op_shifts -- info table about every shift/position. (deprecated)

- **year** -- burn year from the end of the last Burn until the start of the next burn so 2022-09-15 would have a burn year of 2023
- **datename** -- Each day of a given burn is named (examples PreFri, Mon, BurnSat) makes it easier to translate between years
- **date** -- date the shift is taking place
- **shift** -- time range for each shift in 24-hr PDT
- **position** -- the name of the particular job on the shift
- **total_slots** -- how many of this type of shift
- **free_slots** -- how many opening remain for this type of shift
- **role** -- If a shift has a restriction on who can sign up for this shift this won't be blank (examples: Construction, Census Gate Sampling Lead, Census Data Entry Lead)
- **category** -- Type of shift (examples: Training, ConDecon, Sampling, OutReach, DataEntry)
- **core** -- `Bool`, If the shift is core to the census mission
- **lead** -- `Bool`, if the position on the shift is a lead role
- **critical** -- `Bool`, If this position on the shift is critical to the success of the shift, for instances Leads and Driver
- **position_category** -- the category of the position this reduces a position title such as 'NAKED Gate Sampling Lead' to just SamplingLead
- **prerequisite** -- what training is required for the shift, this matches the names in `shift_category`. Once on playa these are optional prerequisites.
- **off_playa** -- `Bool`, if the shift is `on_playa` this will be false, otherwise true
- **shift_category** -- sub category of category above.
- **shift_id** -- an id to uniquly identify a shift, all of the positions on the same shift will have the same `shift_id`
- **shift_position_id** -- adds position name to `shift_id`, **PRIMARY KEY**
- **details** -- a description of the shift position
- **wap_points** -- each shift has a worth for purposes of allocating WAPS, not relevant once on playa
- **start_time** -- a datetime of the start of the shift (timezone less, but in PDT)
- **end_time** -- a datetime of the end of the shift (timezone less, but in PDT)
- **shiftname** -- a full text human readable name of the shift
- **shortname** -- the shiftname without the date information, use when dates are displayed elsewhere
- **add_shift** -- `Bool`, if this is an addition to the table onplaya this should be set to true
- **delete_shift** -- `Bool`, if true mark this shift for deletion
- **update_shift** -- `Bool`, if true we made a change to a shift
- **notes** -- onplaya notes changes

## op_volunteer_roles -- table containing all the roles assigned to each shiftboard member (Long not Wide)

- **shiftboard_id** -- the id identifying a particular individual
- **role_id** -- foreign key to op_roles
- **remove_role** -- the role is removed onplaya
- **add_role** -- the role is added onplaya

## op_roles -- table containing all the valid roles to use 

- **role_id** -- rowid
- **role** -- the role name
- **display** -- if the role should be displayed
- **role_src** -- source of the role name
- **delete_role** -- the role is deleted onplaya
- **create_role** -- the role is added onplaya
- **update_role** -- if the role is updated on playa
- **display** -- if false this role is not to be shown to users

## op_volunteer_shifts -- table linking op_volunteers to op_shifts -- a 0 for shiftboard_id is how shiftboard identifies open slots.

- **shift_position_id** -- foreign key to op_shift_position
- **shift_times_id** -- foreign key to op_shift_times
- **shiftboard_id** -- the id of the individual
- **shiftboard_shift_id** -- a integer of the position of the shift in shiftboard leave `NULL` if unknown, used for making changes in shiftboard
- **noshow** -- If someone did not show up for a shift this is set to `Yes` otherwise '', set to `X` to denote that it is unknown yet
- **add_shift** -- `Bool`, if this is an addition to the table onplaya this should be set to true
- **remove_shift** -- `Bool`, if true mark this row for deletion
- **update_shift** -- `Bool`, if true we made a change to noshow

## op_volunteers -- table containing everything about each person

- **shiftboard_id** -- the id assigned by shiftboard for this person **PRIMARY KEY**
- **playa_name** -- the self selected playa name or their first name
- **world_name** -- the volunteer's default world name from shiftboard, `concat(first,' ',last)`
- **email** -- their email address
- **phone** -- their phone number
- **passcode** -- used as a password for updating their shifts
- **account_id** -- seperate `shiftboard_id` for making updates to shiftboard
- **core_crew** -- `Bool`, if true this is a admin
- **new_shiftboard_id** -- if it is a new acount what is their real `shiftboard_id` assigned after the event
- **score** -- score from previous years reviews for person
- **rs_shifts** -- number of random sampling shifts someone has done in prior years
- **total_shifts** -- total number of census shifts completed
- **notes** -- notes about volunteer from onplaya.
- **location** -- how to find them on playa
- **emergency_contact** -- Who to contact in case of emergency.
- **create_volunteer** -- `Bool`, if this account was created on playa
- **update_volunteer** -- `Bool`, if `playa_name`-`phone` is changed
- **delete_volunteer** -- 'bool', if volunteer is removed on playa
 

## op_messages -- any messages for census which can be questions, or reminders to fill out census, etc

- **name** -- playa name/default world name
- **email** -- person's email address
- **to** -- might be a department, or one of core crew
- **wants_reply** -- if true they want a reply
- **row_id** -- row id

# Basic operations on database (need to update)

## show who is on a shift and if they are checked in

`` select playa_name, position, noshow,`lead` from op_shifts s join op_volunteer_shifts vs on (s.shift_position_id=vs.shift_position_id and vs.delete_shift=false) join op_volunteers v on (v.shiftboard_id=vs.shiftboard_id) where shiftboard_id>0 and shift_id='$shift_id' order by `lead` desc,last,playa_name; ``

- Create duplicate roles from op_shifts where there are openings.

## list all shifts that on playa this year

`select datename,date,shiftname,position,total_slots,free_slots,shift_id from op_shifts where year='$year' and off_playa=false order by start_time;`

## search for a person

`select * from op_volunteers where playa_name like '%$searchstring%' OR last like '%$searchstring%' OR email  like '%$searchstring%' OR phone  like '%$searchstring%';`

## Check if the passcode matches

`select shiftboard_id from op_volunteers where passcode='$passcode' and shiftboard_id='$shiftboard_id';`

## Mark someone as checked in ; noshow='X' for future shifts

1. mark someone as present  
   `update op_volunteer_shifts set noshow='' where shiftboard_id='$shiftboard_id' and shift_position_id='$shift_position_id';`
1. After the shift now mark all 'X' with 'Yes'  
   `update op_volunteer_shifts join op_shifts using (shift_position_id) set noshow='Yes', update_shift=true where noshow='X' and date_add(end_time,interval 4 hour)<now();`  
   `update op_volunteer_shifts join op_shifts using (shift_position_id) set update_shift=false where noshow='' and date_add(end_time,interval 4 hour)<now();`

## Assign a person to a new account

`update op_volunteers set playa_name='$playa_name',first='$first',last='$last',email='$email,phone='$phone',needs_update=true where shiftboard_id='$shiftboard_id' and new_account=true;`

## Add a person to a shift

1. start transaction  
   `set autocommit=false;`  
   `begin;`
1. Check if there is still room on the shift --skip this step if the person being added is a last minute addition  
   `select sum(free_slots) from op_shifts s where (s.role='' OR s.role in (select r.roles from op_volunteer_roles r where shiftboard_id='$shiftboard_id'))  and shift_position_id='$shift_position_id';`
1. If free_slots>0  
   `insert into op_volunteer_shifts (shift_position_id,shiftboard_id,noshow,add_shift) values ('$shift_position_id','$shiftboard_id','',true);`  
   `update op_shifts set free_slots=free_slots-1 where shift_position_id='$shift_position_id';`
1. commit transaction  
   `commit;`  
   `set autocommit=true;`

## Delete a person from a shift

1. start transaction  
   `set autocommit=false;`  
   `begin;`
1. Update shift;
   `update op_shifts  set free_slots=free_slots+1 where shift_position_id='$shift_position_id';`  
   `update op_volunteer_shifts set delete_shift=true where shift_position_id='$shift_position_id' and shiftboard_id='$shiftboard_id';`
1. commit transaction  
   `commit;`  
   `set autocommit=true;`


## When a record has a "delete" feild should select where delete=false;
