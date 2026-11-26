INSERT INTO op_roles (role_id, role, display) VALUES (1,'SuperAdmin',1),(2,'Admin',1),(500,'Lead',1) ON DUPLICATE KEY UPDATE role=VALUES(role);
INSERT INTO op_volunteers (shiftboard_id, playa_name, world_name, email) VALUES
 (10,'Admin','A',NULL),(11,'Vol','Eleven',NULL),(12,'Vol','Twelve',NULL),(13,'Vol','Thirteen',NULL),(14,'Vol','Fourteen',NULL);
INSERT INTO op_volunteer_roles (shiftboard_id, role_id, add_role, remove_role) VALUES (10,2,1,0);
INSERT INTO op_dates (date_id, date, datename) VALUES (1,'2027-08-27','Fri'),(2,'2027-08-28','Sat'),(3,'2027-08-29','Sun');
INSERT INTO op_shift_category (shift_category_id, department, shift_category) VALUES (1,'Census','Work'),(2,'Census','Training');
INSERT INTO op_shift_name (shift_name_id, shift_name, shift_category_id, delete_shift) VALUES (1,'Work',1,0),(2,'Training',2,0);
INSERT INTO op_position_type (position_type_id, position, role_id, prerequisite_id, max_per_volunteer, min_scheduled_csp, delete_position) VALUES
 (100,'General',NULL,NULL,NULL,NULL,0),(101,'Lead only',500,NULL,NULL,NULL,0),(102,'Needs training',NULL,2,NULL,NULL,0),
 (103,'Max one',NULL,NULL,1,NULL,0),(104,'Thank-you',NULL,NULL,NULL,2,0),(105,'Trainee',NULL,NULL,NULL,NULL,0);
INSERT INTO op_shift_times (shift_times_id, shift_name_id, start_date_id, start_time, end_time, canceled, remove_shift_time) VALUES
 (1,1,2,'2027-08-28 09:00','2027-08-28 12:00',0,0),
 (2,1,2,'2027-08-28 11:00','2027-08-28 13:00',0,0),
 (3,1,2,'2027-08-28 12:00','2027-08-28 14:00',0,0),
 (4,2,1,'2027-08-27 09:00','2027-08-27 10:00',0,0),
 (5,1,3,'2027-08-29 09:00','2027-08-29 10:00',0,0),
 (6,1,3,'2027-08-29 11:00','2027-08-29 12:00',1,0),
 (7,1,1,'2020-08-27 09:00','2020-08-27 10:00',0,0);
-- tp: 1 General T1 (1 slot), 2 General T2, 3 General T3, 4 Trainee T4, 5 Lead-only T5, 6 Needs-training T5,
--     7 Max-one T5, 8 Max-one T3, 9 Thank-you T5 (sap 0), 10 General T6 canceled, 11 General T7 past
INSERT INTO op_shift_time_position (time_position_id, shift_times_id, position_type_id, slots, sap_points, remove_time_position) VALUES
 (1,1,100,1,1,0),(2,2,100,5,1,0),(3,3,100,5,1,0),(4,4,105,5,0,0),(5,5,101,5,1,0),(6,5,102,5,1,0),
 (7,5,103,5,0,0),(8,3,103,5,0,0),(9,5,104,5,0,0),(10,6,100,5,1,0),(11,7,100,5,1,0);
