SET time_zone = '-07:00';
-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: census
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `op_dates`
--

DROP TABLE IF EXISTS `op_dates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_dates` (
  `date` date NOT NULL,
  `datename` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '',
  `date_id` bigint NOT NULL AUTO_INCREMENT,
  `create_date` tinyint DEFAULT '0',
  `update_date` tinyint DEFAULT '0',
  `delete_date` tinyint DEFAULT '0',
  PRIMARY KEY (`date_id`),
  UNIQUE KEY `datename_2` (`datename`),
  KEY `datename` (`datename`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_doodles`
--

DROP TABLE IF EXISTS `op_doodles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_doodles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image_url` longtext,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_messages`
--

DROP TABLE IF EXISTS `op_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_messages` (
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `name` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `email` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `to` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `wants_reply` tinyint(1) DEFAULT '0',
  `sent` tinyint(1) DEFAULT '0',
  `row_id` bigint NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`row_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_position_type`
--

DROP TABLE IF EXISTS `op_position_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_position_type` (
  `position` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `role_id` bigint DEFAULT NULL,
  `lead` tinyint(1) DEFAULT NULL,
  `critical` tinyint(1) DEFAULT NULL,
  `prerequisite_id` bigint DEFAULT NULL,
  `position_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `position_type_id` bigint NOT NULL AUTO_INCREMENT,
  `start_time_offset` int DEFAULT '0',
  `end_time_offset` int DEFAULT '0',
  `create_position` tinyint(1) DEFAULT '0',
  `delete_position` tinyint(1) DEFAULT '0',
  `update_position` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`position_type_id`),
  UNIQUE KEY `position` (`position`),
  KEY `role_id` (`role_id`),
  KEY `prerequisite_id` (`prerequisite_id`),
  CONSTRAINT `op_position_type_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `op_roles` (`role_id`),
  CONSTRAINT `op_position_type_ibfk_2` FOREIGN KEY (`prerequisite_id`) REFERENCES `op_shift_category` (`shift_category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=955995 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_roles`
--

DROP TABLE IF EXISTS `op_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_roles` (
  `role_id` bigint NOT NULL AUTO_INCREMENT,
  `role` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `display` tinyint(1) DEFAULT '1',
  `role_src` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `create_role` tinyint(1) DEFAULT '0',
  `delete_role` tinyint(1) DEFAULT '0',
  `update_role` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=1001322 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_shift_category`
--

DROP TABLE IF EXISTS `op_shift_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_shift_category` (
  `department` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `shift_category` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `shift_category_id` bigint NOT NULL AUTO_INCREMENT,
  `create_category` tinyint(1) DEFAULT '0',
  `delete_category` tinyint(1) DEFAULT '0',
  `update_category` tinyint(1) DEFAULT '0',
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`shift_category_id`),
  UNIQUE KEY `shift_category` (`shift_category`),
  KEY `department` (`department`)
) ENGINE=InnoDB AUTO_INCREMENT=73712 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_shift_name`
--

DROP TABLE IF EXISTS `op_shift_name`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_shift_name` (
  `core` tinyint(1) DEFAULT NULL,
  `off_playa` tinyint(1) DEFAULT NULL,
  `shift_category_id` bigint DEFAULT NULL,
  `shift_name_id` bigint NOT NULL AUTO_INCREMENT,
  `shift_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `shift_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `create_shift` tinyint(1) DEFAULT '0',
  `delete_shift` tinyint(1) DEFAULT '0',
  `update_shift` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`shift_name_id`),
  UNIQUE KEY `shift_name` (`shift_name`),
  KEY `shift_category_id` (`shift_category_id`),
  CONSTRAINT `op_shift_name_ibfk_1` FOREIGN KEY (`shift_category_id`) REFERENCES `op_shift_category` (`shift_category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=64064 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_shift_time_position`
--

DROP TABLE IF EXISTS `op_shift_time_position`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_shift_time_position` (
  `time_position_id` bigint NOT NULL AUTO_INCREMENT,
  `shift_times_id` bigint NOT NULL,
  `position_alias` varchar(64) DEFAULT NULL,
  `slots` int DEFAULT '0',
  `sap_points` int DEFAULT '0',
  `add_time_position` tinyint DEFAULT '0',
  `remove_time_position` tinyint DEFAULT '0',
  `update_time_position` tinyint DEFAULT '0',
  `position_type_id` bigint DEFAULT NULL,
  PRIMARY KEY (`time_position_id`),
  UNIQUE KEY `position_type_id` (`position_type_id`,`shift_times_id`),
  KEY `shift_times_id` (`shift_times_id`),
  CONSTRAINT `op_shift_time_position_ibfk_1` FOREIGN KEY (`shift_times_id`) REFERENCES `op_shift_times` (`shift_times_id`),
  CONSTRAINT `op_shift_time_position_ibfk_3` FOREIGN KEY (`position_type_id`) REFERENCES `op_position_type` (`position_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=990527 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_shift_times`
--

DROP TABLE IF EXISTS `op_shift_times`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_shift_times` (
  `shift_name_id` bigint DEFAULT NULL,
  `shift_instance` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `start_time` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `end_time` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `shift_times_id` bigint NOT NULL AUTO_INCREMENT,
  `notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `add_shift_time` tinyint(1) DEFAULT '0',
  `remove_shift_time` tinyint(1) DEFAULT '0',
  `update_shift_time` tinyint(1) DEFAULT '0',
  `meal` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `datename` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `start_time_text` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `time_zone` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `start_date_id` bigint DEFAULT NULL,
  `end_date_id` bigint DEFAULT NULL,
  `end_time_text` varchar(10) COLLATE utf8mb4_bin DEFAULT NULL,
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

--
-- Table structure for table `op_volunteer_roles`
--

DROP TABLE IF EXISTS `op_volunteer_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_volunteer_roles` (
  `shiftboard_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  `add_role` tinyint(1) DEFAULT '0',
  `remove_role` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`shiftboard_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `op_volunteer_roles_ibfk_1` FOREIGN KEY (`shiftboard_id`) REFERENCES `op_volunteers` (`shiftboard_id`),
  CONSTRAINT `op_volunteer_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `op_roles` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_volunteer_shifts`
--

DROP TABLE IF EXISTS `op_volunteer_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_volunteer_shifts` (
  `shiftboard_id` bigint NOT NULL,
  `shiftboard_shift_id` bigint NOT NULL DEFAULT '0',
  `noshow` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `add_shift` tinyint(1) DEFAULT '0',
  `remove_shift` tinyint(1) DEFAULT '0',
  `update_shift` tinyint(1) DEFAULT '0',
  `rating` int DEFAULT NULL,
  `notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `time_position_id` bigint NOT NULL,
  PRIMARY KEY (`shiftboard_id`,`time_position_id`),
  KEY `time_position_id` (`time_position_id`),
  CONSTRAINT `op_volunteer_shifts_ibfk_1` FOREIGN KEY (`shiftboard_id`) REFERENCES `op_volunteers` (`shiftboard_id`),
  CONSTRAINT `op_volunteer_shifts_ibfk_5` FOREIGN KEY (`time_position_id`) REFERENCES `op_shift_time_position` (`time_position_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_volunteers`
--

DROP TABLE IF EXISTS `op_volunteers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_volunteers` (
  `shiftboard_id` bigint NOT NULL DEFAULT '0',
  `playa_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `world_name` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `email` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `phone` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `passcode` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `account_id` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `core_crew` int NOT NULL DEFAULT '0',
  `new_shiftboard_id` int NOT NULL DEFAULT '0',
  `score` decimal(14,4) DEFAULT NULL,
  `rs_shifts` decimal(23,0) DEFAULT NULL,
  `total_shifts` decimal(23,0) DEFAULT NULL,
  `create_volunteer` tinyint(1) DEFAULT '0',
  `update_volunteer` tinyint(1) DEFAULT '0',
  `delete_volunteer` tinyint(1) DEFAULT '0',
  `notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `location` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `emergency_contact` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`shiftboard_id`),
  KEY `passcode` (`passcode`,`shiftboard_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

insert ignore into op_volunteers (shiftboard_id,playa_name,world_name,passcode) values (1, "Admin","Admin","123456");
insert ignore into op_roles (role_id,role,display,role_src) values (1,"SuperAdmin",1,"tablet"),(2,"Admin",1,"tablet");
insert ignore into op_volunteer_roles (shiftboard_id,role_id) values (1,1),(1,2);
insert ignore into op_doodles (id,image_url) values (1,"");
