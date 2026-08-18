-- CensusScheduler schema (op_* tables), regenerated from prod (MariaDB 11.8).
-- CI loads this into a MariaDB service matching prod. Regenerate: mysqldump --no-data census op_*
/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;
DROP TABLE IF EXISTS `op_dates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_dates` (
  `date` date NOT NULL,
  `datename` varchar(64) NOT NULL DEFAULT '',
  `date_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `create_date` tinyint(4) DEFAULT 0,
  `update_date` tinyint(4) DEFAULT 0,
  `delete_date` tinyint(4) DEFAULT 0,
  PRIMARY KEY (`date_id`),
  UNIQUE KEY `datename_2` (`datename`),
  KEY `datename` (`datename`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_doodles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_doodles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image_url` longtext DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_email_queue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_email_queue` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `to` text NOT NULL,
  `cc` text DEFAULT NULL,
  `reply_to` text NOT NULL,
  `from` varchar(255) NOT NULL,
  `subject` varchar(998) NOT NULL,
  `body_text` mediumtext NOT NULL,
  `body_html` mediumtext DEFAULT NULL,
  `ics_attachment` mediumblob DEFAULT NULL,
  `ics_filename` varchar(255) DEFAULT NULL,
  `category` varchar(64) NOT NULL,
  `enqueued_at` datetime NOT NULL DEFAULT current_timestamp(),
  `next_attempt_at` datetime NOT NULL DEFAULT current_timestamp(),
  `sent_at` datetime DEFAULT NULL,
  `attempts` int(11) NOT NULL DEFAULT 0,
  `state` enum('queued','sending','sent','failed','dead') NOT NULL DEFAULT 'queued',
  `last_error` text DEFAULT NULL,
  `attachment` mediumblob DEFAULT NULL,
  `attachment_filename` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_state_next` (`state`,`next_attempt_at`),
  KEY `idx_sent_at` (`sent_at`)
) ENGINE=InnoDB AUTO_INCREMENT=1239 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_messages` (
  `timestamp` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `name` mediumtext DEFAULT NULL,
  `email` mediumtext DEFAULT NULL,
  `to` mediumtext DEFAULT NULL,
  `message` longtext DEFAULT NULL,
  `wants_reply` tinyint(1) DEFAULT 0,
  `sent` tinyint(1) DEFAULT 0,
  `row_id` bigint(20) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`row_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_position_trainings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_position_trainings` (
  `position_training_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `position_type_id` bigint(20) DEFAULT NULL,
  `training_id` bigint(20) DEFAULT NULL,
  `create_position_training` tinyint(1) DEFAULT 0,
  `update_position_training` tinyint(1) DEFAULT 0,
  `delete_position_training` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`position_training_id`),
  UNIQUE KEY `uk_position_training` (`position_type_id`,`training_id`),
  KEY `fk_pt_training` (`training_id`),
  CONSTRAINT `fk_pt_position` FOREIGN KEY (`position_type_id`) REFERENCES `op_position_type` (`position_type_id`),
  CONSTRAINT `fk_pt_training` FOREIGN KEY (`training_id`) REFERENCES `op_trainings` (`training_id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_position_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_position_type` (
  `position` varchar(128) DEFAULT NULL,
  `role_id` bigint(20) DEFAULT NULL,
  `max_per_volunteer` int(11) DEFAULT NULL,
  `min_scheduled_csp` int(11) DEFAULT NULL,
  `lead` tinyint(1) DEFAULT NULL,
  `critical` tinyint(1) DEFAULT NULL,
  `prerequisite_id` bigint(20) DEFAULT NULL,
  `position_details` longtext DEFAULT NULL,
  `position_type_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `start_time_offset` int(11) DEFAULT 0,
  `end_time_offset` int(11) DEFAULT 0,
  `create_position` tinyint(1) DEFAULT 0,
  `delete_position` tinyint(1) DEFAULT 0,
  `update_position` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`position_type_id`),
  UNIQUE KEY `position` (`position`),
  KEY `role_id` (`role_id`),
  KEY `prerequisite_id` (`prerequisite_id`),
  CONSTRAINT `op_position_type_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `op_roles` (`role_id`),
  CONSTRAINT `op_position_type_ibfk_2` FOREIGN KEY (`prerequisite_id`) REFERENCES `op_shift_category` (`shift_category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=955996 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_qr_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_qr_codes` (
  `qr_id` int(11) NOT NULL AUTO_INCREMENT,
  `qr_type` enum('calendar','link','wifi') NOT NULL,
  `filename` varchar(200) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `payload` mediumtext NOT NULL,
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`settings`)),
  `purpose` enum('home','download') DEFAULT NULL,
  `burn_year` int(11) DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `event_time` time DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`qr_id`),
  UNIQUE KEY `uq_qr_filename` (`filename`),
  KEY `idx_qr_purpose` (`purpose`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_role_grant_roster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_role_grant_roster` (
  `email` varchar(255) NOT NULL,
  `role_id` bigint(20) NOT NULL,
  PRIMARY KEY (`email`,`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_roles` (
  `role_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `role` varchar(64) DEFAULT NULL,
  `display` tinyint(1) DEFAULT 1,
  `role_src` varchar(16) DEFAULT NULL,
  `create_role` tinyint(1) DEFAULT 0,
  `delete_role` tinyint(1) DEFAULT 0,
  `update_role` tinyint(1) DEFAULT 0,
  `census_shift_points` int(11) DEFAULT NULL COMMENT 'Min Census Shift Points for this role. NULL = no threshold.',
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=2000023 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_sap_offbook`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_sap_offbook` (
  `email` varchar(256) NOT NULL,
  `name` varchar(256) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `linked_shiftboard_id` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `sap_date_override` date DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_saps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_saps` (
  `sap_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `filename` varchar(256) NOT NULL,
  `shiftboard_id` bigint(20) DEFAULT NULL,
  `date_id` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ticket_id` varchar(32) DEFAULT NULL,
  `sap_date` date DEFAULT NULL,
  `burn_year` smallint(6) DEFAULT NULL,
  `status` enum('available','assigned','received','burned') NOT NULL DEFAULT 'available',
  `assigned_email` varchar(256) DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT NULL,
  `received_at` timestamp NULL DEFAULT NULL,
  `received_via` enum('download','email') DEFAULT NULL,
  `superseded_by_sap_id` bigint(20) DEFAULT NULL,
  `uploaded_by` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`sap_id`),
  UNIQUE KEY `uq_sap_ticket` (`ticket_id`),
  KEY `idx_sap_volunteer` (`shiftboard_id`),
  KEY `idx_sap_date` (`date_id`),
  KEY `idx_sap_status_date` (`status`,`sap_date`),
  KEY `idx_sap_burn_year` (`burn_year`),
  CONSTRAINT `fk_sap_date` FOREIGN KEY (`date_id`) REFERENCES `op_dates` (`date_id`),
  CONSTRAINT `fk_sap_volunteer` FOREIGN KEY (`shiftboard_id`) REFERENCES `op_volunteers` (`shiftboard_id`)
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_shift_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_shift_category` (
  `department` varchar(128) NOT NULL,
  `shift_category` varchar(128) NOT NULL,
  `shift_category_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `create_category` tinyint(1) DEFAULT 0,
  `delete_category` tinyint(1) DEFAULT 0,
  `update_category` tinyint(1) DEFAULT 0,
  `description` longtext DEFAULT NULL,
  PRIMARY KEY (`shift_category_id`),
  UNIQUE KEY `shift_category` (`shift_category`),
  KEY `department` (`department`)
) ENGINE=InnoDB AUTO_INCREMENT=73712 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_shift_name`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_shift_name` (
  `core` tinyint(1) DEFAULT NULL,
  `off_playa` tinyint(1) DEFAULT NULL,
  `shift_category_id` bigint(20) DEFAULT NULL,
  `shift_name_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `shift_details` longtext DEFAULT NULL,
  `shift_name` varchar(64) DEFAULT NULL,
  `create_shift` tinyint(1) DEFAULT 0,
  `delete_shift` tinyint(1) DEFAULT 0,
  `update_shift` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`shift_name_id`),
  UNIQUE KEY `shift_name` (`shift_name`),
  KEY `shift_category_id` (`shift_category_id`),
  CONSTRAINT `op_shift_name_ibfk_1` FOREIGN KEY (`shift_category_id`) REFERENCES `op_shift_category` (`shift_category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=798118 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_shift_position`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_shift_position` (
  `position_type_id` bigint(20) DEFAULT NULL,
  `total_slots` int(11) DEFAULT NULL,
  `shift_name_id` bigint(20) DEFAULT NULL,
  `wap_points` int(11) DEFAULT NULL,
  `shift_position_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `add_shift_position` tinyint(1) DEFAULT 0,
  `remove_shift_position` tinyint(1) DEFAULT 0,
  `update_shift_position` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`shift_position_id`),
  UNIQUE KEY `position_type_id` (`position_type_id`,`shift_name_id`),
  KEY `shift_name_id` (`shift_name_id`),
  CONSTRAINT `op_shift_position_ibfk_1` FOREIGN KEY (`shift_name_id`) REFERENCES `op_shift_name` (`shift_name_id`),
  CONSTRAINT `op_shift_position_ibfk_2` FOREIGN KEY (`position_type_id`) REFERENCES `op_position_type` (`position_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_shift_time_position`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_shift_time_position` (
  `time_position_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `shift_times_id` bigint(20) NOT NULL,
  `position_alias` varchar(64) DEFAULT NULL,
  `slots` int(11) DEFAULT 0,
  `sap_points` int(11) DEFAULT 0,
  `add_time_position` tinyint(4) DEFAULT 0,
  `remove_time_position` tinyint(4) DEFAULT 0,
  `update_time_position` tinyint(4) DEFAULT 0,
  `position_type_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`time_position_id`),
  UNIQUE KEY `position_type_id` (`position_type_id`,`shift_times_id`),
  KEY `shift_times_id` (`shift_times_id`),
  CONSTRAINT `op_shift_time_position_ibfk_1` FOREIGN KEY (`shift_times_id`) REFERENCES `op_shift_times` (`shift_times_id`),
  CONSTRAINT `op_shift_time_position_ibfk_3` FOREIGN KEY (`position_type_id`) REFERENCES `op_position_type` (`position_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=990532 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_shift_times`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_shift_times` (
  `shift_name_id` bigint(20) DEFAULT NULL,
  `shift_instance` varchar(64) DEFAULT NULL,
  `start_time` varchar(32) DEFAULT NULL,
  `end_time` varchar(32) DEFAULT NULL,
  `shift_times_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `notes` longtext DEFAULT NULL,
  `add_shift_time` tinyint(1) DEFAULT 0,
  `remove_shift_time` tinyint(1) DEFAULT 0,
  `update_shift_time` tinyint(1) DEFAULT 0,
  `meal` varchar(32) DEFAULT NULL,
  `datename` varchar(64) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `start_time_text` varchar(32) DEFAULT NULL,
  `time_zone` varchar(64) DEFAULT NULL,
  `start_date_id` bigint(20) DEFAULT NULL,
  `end_date_id` bigint(20) DEFAULT NULL,
  `end_time_text` varchar(10) DEFAULT NULL,
  `canceled` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`shift_times_id`),
  UNIQUE KEY `shift_instance` (`shift_instance`),
  KEY `shift_name_id` (`shift_name_id`),
  KEY `datename` (`datename`),
  KEY `start_date_id` (`start_date_id`),
  KEY `end_date_id` (`end_date_id`),
  CONSTRAINT `op_shift_times_ibfk_1` FOREIGN KEY (`shift_name_id`) REFERENCES `op_shift_name` (`shift_name_id`),
  CONSTRAINT `op_shift_times_ibfk_2` FOREIGN KEY (`datename`) REFERENCES `op_dates` (`datename`),
  CONSTRAINT `op_shift_times_ibfk_4` FOREIGN KEY (`start_date_id`) REFERENCES `op_dates` (`date_id`),
  CONSTRAINT `op_shift_times_ibfk_5` FOREIGN KEY (`end_date_id`) REFERENCES `op_dates` (`date_id`)
) ENGINE=InnoDB AUTO_INCREMENT=965662 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_trainings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_trainings` (
  `training_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `training_name` varchar(128) DEFAULT NULL,
  `role_id` bigint(20) DEFAULT NULL,
  `code` varchar(64) DEFAULT NULL,
  `url` varchar(512) DEFAULT NULL,
  `create_training` tinyint(1) DEFAULT 0,
  `update_training` tinyint(1) DEFAULT 0,
  `delete_training` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`training_id`),
  UNIQUE KEY `training_name` (`training_name`),
  UNIQUE KEY `code` (`code`),
  KEY `fk_training_role` (`role_id`),
  CONSTRAINT `fk_training_role` FOREIGN KEY (`role_id`) REFERENCES `op_roles` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_volunteer_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_volunteer_roles` (
  `shiftboard_id` bigint(20) NOT NULL,
  `role_id` bigint(20) NOT NULL,
  `add_role` tinyint(1) DEFAULT 0,
  `remove_role` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`shiftboard_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `op_volunteer_roles_ibfk_1` FOREIGN KEY (`shiftboard_id`) REFERENCES `op_volunteers` (`shiftboard_id`),
  CONSTRAINT `op_volunteer_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `op_roles` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_volunteer_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_volunteer_shifts` (
  `shiftboard_id` bigint(20) NOT NULL,
  `shiftboard_shift_id` bigint(20) NOT NULL DEFAULT 0,
  `noshow` varchar(10) DEFAULT NULL,
  `add_shift` tinyint(1) DEFAULT 0,
  `remove_shift` tinyint(1) DEFAULT 0,
  `update_shift` tinyint(1) DEFAULT 0,
  `rating` int(11) DEFAULT NULL,
  `notes` longtext DEFAULT NULL,
  `time_position_id` bigint(20) NOT NULL,
  `signed_up_at` datetime DEFAULT NULL,
  PRIMARY KEY (`shiftboard_id`,`time_position_id`),
  KEY `time_position_id` (`time_position_id`),
  CONSTRAINT `op_volunteer_shifts_ibfk_1` FOREIGN KEY (`shiftboard_id`) REFERENCES `op_volunteers` (`shiftboard_id`),
  CONSTRAINT `op_volunteer_shifts_ibfk_5` FOREIGN KEY (`time_position_id`) REFERENCES `op_shift_time_position` (`time_position_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `op_volunteers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_volunteers` (
  `shiftboard_id` bigint(20) NOT NULL DEFAULT 0,
  `playa_name` varchar(128) DEFAULT NULL,
  `world_name` mediumtext DEFAULT NULL,
  `email` mediumtext DEFAULT NULL,
  `okta_id` varchar(255) DEFAULT NULL,
  `phone` mediumtext DEFAULT NULL,
  `passcode` varchar(6) DEFAULT NULL,
  `account_id` varchar(10) DEFAULT NULL,
  `core_crew` int(11) NOT NULL DEFAULT 0,
  `new_shiftboard_id` int(11) NOT NULL DEFAULT 0,
  `create_volunteer` tinyint(1) DEFAULT 0,
  `update_volunteer` tinyint(1) DEFAULT 0,
  `delete_volunteer` tinyint(1) DEFAULT 0,
  `notes` longtext DEFAULT NULL,
  `location` longtext DEFAULT NULL,
  `emergency_contact` longtext DEFAULT NULL,
  `arrival_date_id` bigint(20) DEFAULT NULL,
  `arrival_auto_set` tinyint(1) NOT NULL DEFAULT 0,
  `sap_date_override` date DEFAULT NULL,
  `sap_notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`shiftboard_id`),
  UNIQUE KEY `idx_okta_id` (`okta_id`),
  KEY `passcode` (`passcode`,`shiftboard_id`),
  KEY `idx_vol_arrival` (`arrival_date_id`),
  CONSTRAINT `fk_vol_arrival_date` FOREIGN KEY (`arrival_date_id`) REFERENCES `op_dates` (`date_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

