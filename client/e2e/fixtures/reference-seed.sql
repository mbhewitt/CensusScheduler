-- CI reference seed: base data the e2e helpers assume pre-exist.
-- Tests only clean up IDs >= 9,000,000, so these persist across specs.
-- Regenerate from prod: op_roles, op_dates; built-in Admin per the prod dump pipeline.

-- Roles (assignRole FK target)
INSERT IGNORE INTO op_roles (role_id, role) VALUES
(1,'SuperAdmin'),(2,'Admin'),(13184,'Core Crew'),(19962,'IT Tech'),(21215,'Setup/Strike'),(25312,'Data Entry'),(25313,'Data Entry - Veteran'),(25314,'Data Visualization'),(25315,'Data Analysis - Release Signed'),(25407,'Census Lab Host'),(25408,'Census Lab Host - Veteran'),(27504,'Blog Writer'),(29611,'BxB Sampler'),(34863,'Census Airport Sampling Lead'),(35155,'Special Project'),(36983,'Census Driver'),(36984,'Census Gate Sampling Lead'),(36985,'Census Data Entry Lead'),(43173,'Census Random Sampler - Veteran'),(43174,'Census Random Sampler'),(46488,'Training'),(65890,'Not This Year'),(92220,'Shift Lead'),(95152,'Census Sampling Lead'),(95153,'Census Construction Lead'),(95154,'Census OutReach Lead'),(95155,'Census Training Lead'),(174766,'TrainingWelcomeComplete'),(890543,'DataBeast Technician'),(1000010,'Camping With Census'),(1000011,'Passed online RS-test-out'),(1000012,'Signed Behavioral Standards'),(1001318,'campingLocation'),(1001319,'emergencyContact'),(1001320,'NewWAPstartdate'),(1001321,'WAP_V_override'),(2000001,'TrainingCensusBasicsComplete'),(2000002,'TrainingRandomSamplingComplete'),(2000003,'TrainingOutReachComplete'),(2000004,'TrainingDataEntryWizComplete'),(2000005,'TrainingDataBeastDriverComplete'),(2000006,'Staff'),(2000007,'OtherSAP'),(2000008,'CounterCultureCamp'),(2000009,'CensusLabCamp'),(2000010,'BurnerProfileUpdated'),(2000011,'CensusTicket'),(2000020,'EmailUnsubscribed'),(2000021,'TestAccount'),(2000022,'OrgAccount')
;

-- Built-in Admin account (signInAsBuiltinAdmin: name "Admin", passcode 123456) + roles
-- Admin(2) + SuperAdmin(1) + Signed Behavioral Standards(1000012). The BS role
-- is required because Header.tsx force-redirects any signed-in volunteer who
-- hasn't signed the agreement to /roles/behavioral-standards when PIN_ENABLED
-- (on-playa mode, which CI runs with). Without it, every admin spec races the
-- redirect against the sign-in helper's waitForURL(/info) and flakes.
INSERT IGNORE INTO op_volunteers (shiftboard_id, playa_name, world_name, passcode) VALUES (1,'Admin','Admin','123456');
INSERT IGNORE INTO op_volunteer_roles (shiftboard_id, role_id) VALUES (1,1),(1,2),(1,1000012);

-- Event calendar (VIP/SAP/shift specs reference date_id, e.g. PreWed=8)
INSERT IGNORE INTO op_dates (date_id, datename, date) VALUES
(1,'Training','2026-08-15'),(2,'EarlyThur','2026-08-20'),(3,'EarlyFri','2026-08-21'),(4,'EarlyMan','2026-08-22'),(5,'PreSun','2026-08-23'),(6,'PreMon','2026-08-24'),(7,'PreTue','2026-08-25'),(8,'PreWed','2026-08-26'),(9,'PreThur','2026-08-27'),(10,'PreFri','2026-08-28'),(11,'PreSat','2026-08-29'),(12,'OpenSun','2026-08-30'),(13,'Mon','2026-08-31'),(14,'Tue','2026-09-01'),(15,'Wed','2026-09-02'),(16,'Thur','2026-09-03'),(17,'Fri','2026-09-04'),(18,'BurnSat','2026-09-05'),(19,'TempleSun','2026-09-06'),(20,'PostMon','2026-09-07'),(21,'PostTue','2026-09-08'),(22,'PostWed','2026-09-09')
;

-- Doodle canvas row
INSERT IGNORE INTO op_doodles (id, image_url) VALUES (1, '');

-- Minimal shift type id=3 ("Gate Sampling") for the shift-type editor specs
-- (11-shift-type-add-position, 11b-shift-type-validation reference TYPE_ID=3).
-- Without a seeded type the editor page loads empty and the Add/Update buttons
-- never render. Mirrors e2e/helpers/db.ts insertFullShift.
INSERT IGNORE INTO op_shift_category (shift_category_id, shift_category, department, create_category) VALUES (3,'Gate Sampling','Census',1);
INSERT IGNORE INTO op_position_type (position_type_id, position, create_position) VALUES (3,'Sampler',1);
INSERT IGNORE INTO op_shift_name (shift_name_id, shift_name, shift_category_id, off_playa, delete_shift, create_shift) VALUES (3,'Gate Sampling',3,0,0,1);
INSERT IGNORE INTO op_shift_times (shift_times_id, shift_name_id, start_time, end_time, remove_shift_time, add_shift_time) VALUES (3,3,'2026-08-31 10:00:00','2026-08-31 14:00:00',0,1);
INSERT IGNORE INTO op_shift_time_position (time_position_id, shift_times_id, position_type_id, slots, remove_time_position, add_time_position) VALUES (3,3,3,3,0,1);

-- Shift type id=15 ("Setup") with a BLANK category, for 11b-shift-type-validation
-- (TYPE_EMPTY_CATEGORY=15): clicking Update must surface "Category is required".
INSERT IGNORE INTO op_shift_name (shift_name_id, shift_name, shift_category_id, off_playa, delete_shift, create_shift) VALUES (15,'Setup',NULL,0,0,1);
INSERT IGNORE INTO op_shift_times (shift_times_id, shift_name_id, start_time, end_time, remove_shift_time, add_shift_time) VALUES (15,15,'2026-08-29 08:00:00','2026-08-29 12:00:00',0,1);
