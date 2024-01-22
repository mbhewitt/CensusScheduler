# Useful Tables in database

## op_shifts -- info table about every shift/position.

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
- **roles** -- the role assigned to the `shiftboard_id` matches role in `op_shifts` and in `op_roles`
- **delete_role** -- the role is deleted onplaya
- **add_role** -- the role is added onplaya

## op_roles -- table containing all the valid roles to use 

- **roles** -- the role name
- **delete_role** -- the role is deleted onplaya
- **add_role** -- the role is added onplaya
- **display** -- if false this role is not to be shown to users

## op_volunteer_shifts -- table linking op_volunteers to op_shifts -- a 0 for shiftboard_id is how shiftboard identifies open slots.

- **shift_position_id** -- uniquly identifies a shift and position on the shift
- **shiftboard_id** -- the id of the individual
- **shiftboard_shift_id** -- a integer of the position of the shift in shiftboard leave `NULL` if unknown, used for making changes in shiftboard
- **noshow** -- If someone did not show up for a shift this is set to `Yes` otherwise '', set to `X` to denote that it is unknown yet
- **add_shift** -- `Bool`, if this is an addition to the table onplaya this should be set to true
- **delete_shift** -- `Bool`, if true mark this row for deletion
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
- **new_account** -- `Bool`, if this account was created on playa
- **needs_update** -- `Bool`, if `playa_name`-`phone` is changed
- **new_shiftboard_id** -- if it is a new acount what is their real `shiftboard_id` assigned after the event
- **score** -- score from previous years reviews for person
- **rs_shifts** -- number of random sampling shifts someone has done in prior years
- **total_shifts** -- total number of census shifts completed
- **notes** -- notes about volunteer from onplaya.
- **location** -- how to find them on playa
- **emergency_contact** -- Who to contact in case of emergency.

## op_messages -- any messages for census which can be questions, or reminders to fill out census, etc

- **name** -- playa name/default world name
- **email** -- person's email address
- **to** -- might be a department, or one of core crew
- **wants_reply** -- if true they want a reply
- **row_id** -- row id

# Basic operations on database

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
