SET time_zone = '-07:00';
-- MySQL dump 10.13  Distrib 8.0.33, for macos11.7 (x86_64)
--
-- Host: localhost    Database: census
-- ------------------------------------------------------
-- Server version	8.0.33

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
-- Table structure for table `op_volunteer_shifts`
--

DROP TABLE IF EXISTS `op_volunteer_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_volunteer_shifts` (
  `shift_position_id` varchar(210) CHARACTER SET latin1 NOT NULL,
  `shiftboard_id` bigint NOT NULL,
  `shiftboard_shift_id` bigint NOT NULL DEFAULT '0',
  `noshow` varchar(10) CHARACTER SET latin1 DEFAULT NULL,
  `add_shift` tinyint(1) DEFAULT '0',
  `remove_shift` tinyint(1) DEFAULT '0',
  `update_shift` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`shiftboard_id`,`shift_position_id`,`shiftboard_shift_id`),
  KEY `shift_position_id` (`shift_position_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_volunteer_roles`
--

DROP TABLE IF EXISTS `op_volunteer_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_volunteer_roles` (
  `shiftboard_id` bigint NOT NULL,
  `roles` varchar(256) CHARACTER SET latin1 NOT NULL,
  `add_role` tinyint(1) DEFAULT '0',
  `remove_role` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`shiftboard_id`,`roles`),
  KEY `roles` (`roles`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_volunteers`
--

DROP TABLE IF EXISTS `op_volunteers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_volunteers` (
  `shiftboard_id` bigint NOT NULL DEFAULT '0',
  `playa_name` varchar(128) CHARACTER SET latin1 DEFAULT NULL,
  `world_name` text,
  `email` text,
  `phone` text,
  `passcode` varchar(4) CHARACTER SET latin1 DEFAULT NULL,
  `account_id` varchar(10) CHARACTER SET latin1 DEFAULT NULL,
  `core_crew` int NOT NULL DEFAULT '0',
  `new_shiftboard_id` int NOT NULL DEFAULT '0',
  `score` decimal(14,4) DEFAULT NULL,
  `rs_shifts` decimal(23,0) DEFAULT NULL,
  `total_shifts` decimal(23,0) DEFAULT NULL,
  `create_volunteer` tinyint(1) DEFAULT '0',
  `update_volunteer` tinyint(1) DEFAULT '0',
  `delete_volunteer` tinyint(1) DEFAULT '0',
  `notes` longtext,
  `location` longtext,
  `emergency_contact` longtext,
  PRIMARY KEY (`shiftboard_id`),
  KEY `passcode` (`passcode`,`shiftboard_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_shifts`
--

DROP TABLE IF EXISTS `op_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_shifts` (
  `year` varchar(4) DEFAULT NULL,
  `datename` varchar(64) CHARACTER SET latin1 DEFAULT NULL,
  `date` date DEFAULT NULL,
  `shift` varchar(100) CHARACTER SET latin1 DEFAULT NULL,
  `position` varchar(100) CHARACTER SET latin1 DEFAULT NULL,
  `total_slots` decimal(32,0) DEFAULT NULL,
  `free_slots` decimal(32,0) DEFAULT NULL,
  `role` varchar(100) CHARACTER SET latin1 DEFAULT NULL,
  `category` varchar(16) CHARACTER SET latin1 DEFAULT NULL,
  `core` tinyint(1) DEFAULT '0',
  `lead` tinyint(1) DEFAULT '0',
  `critical` tinyint(1) DEFAULT '0',
  `position_category` varchar(128) CHARACTER SET latin1 DEFAULT NULL,
  `prerequisite` varchar(128) CHARACTER SET latin1 DEFAULT NULL,
  `off_playa` tinyint(1) DEFAULT '1',
  `shift_category` varchar(128) CHARACTER SET latin1 DEFAULT NULL,
  `shift_id` varchar(110) CHARACTER SET latin1 DEFAULT NULL,
  `shift_position_id` varchar(210) CHARACTER SET latin1 NOT NULL,
  `details` text CHARACTER SET latin1,
  `wap_points` float DEFAULT '0',
  `start_time_lt` varchar(111) CHARACTER SET latin1 DEFAULT NULL,
  `end_time_lt` varchar(111) CHARACTER SET latin1 DEFAULT NULL,
  `shiftname` varchar(230) CHARACTER SET latin1 DEFAULT NULL,
  `shortname` varchar(64) CHARACTER SET latin1 DEFAULT NULL,
  `create_shift` tinyint(1) DEFAULT '0',
  `delete_shift` tinyint(1) DEFAULT '0',
  `update_shift` tinyint(1) DEFAULT '0',
  `notes` longtext,
  PRIMARY KEY (`shift_position_id`),
  KEY `shift_id` (`shift_id`),
  KEY `year` (`year`,`off_playa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_messages`
--

DROP TABLE IF EXISTS `op_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_messages` (
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `name` text,
  `email` text,
  `to` text,
  `message` longtext,
  `wants_reply` tinyint(1) DEFAULT '0',
  `sent` tinyint(1) DEFAULT '0',
  `row_id` bigint NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`row_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_roles`
--

DROP TABLE IF EXISTS `op_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_roles` (
  `roles` varchar(50) NOT NULL,
  `create_role` tinyint(1) DEFAULT '0',
  `delete_role` tinyint(1) DEFAULT '0',
  `display` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`roles`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Test shfits now and in future
INSERT INTO `op_shifts` (year,datename,date,shift,position,total_slots,free_slots,role,category,core,`lead`,critical,position_category,prerequisite,off_playa,shift_category,shift_id,shift_position_id,details,wap_points,start_time_lt,end_time_lt,shiftname,shortname) VALUES 
(left(date_sub(now(), interval 2 day),4),'OffPlaya',left(date_sub(now(), interval 2 day),10),'01:00 - 23:00','Test Subject1',2,2,'',NULL,0,0,0,NULL,NULL,0,NULL,concat(left(date_sub(now(), interval 2 day),10),'Test'),concat(left(date_sub(now(), interval 2 day),10),'Test','Test Subject1'),'No Description only test',0,concat(left(date_sub(now(), interval 2 day),10),' 01:00'),concat(left(date_sub(now(), interval 2 day),10),' 23:00'),'2023 Test Shift Prev2','Test SHift'),
(left(date_sub(now(), interval 1 day),4),'OffPlaya',left(date_sub(now(), interval 1 day),10),'01:00 - 23:00','Test Subject5',2,2,'',NULL,0,0,0,NULL,NULL,0,NULL,concat(left(date_sub(now(), interval 1 day),10),'Test'),concat(left(date_sub(now(), interval 1 day),10),'Test','Test Subject5'),'No Description only test',0,concat(left(date_sub(now(), interval 1 day),10),' 01:00'),concat(left(date_sub(now(), interval 1 day),10),' 23:00'),'2023 Test Shift Prev','Test SHift'),
(left(now(),4),'OffPlaya',left(now(),10),'01:00 - 23:00','Test Subject4',2,2,'',NULL,0,0,0,NULL,NULL,0,NULL,concat(left(now(),10),'Test'),concat(left(now(),10),'Test','Test Subject4'),'No Description only test',0,concat(left(now(),10),' 01:00'),concat(left(now(),10),' 23:00'),'2023 Test Shift','Test SHift'),
(left(date_add(now(), interval 1 day),4),'OffPlaya',left(date_add(now(), interval 1 day),10),'01:00 - 23:00','Test Subject3',2,2,'',NULL,0,0,0,NULL,NULL,0,NULL,concat(left(date_add(now(), interval 1 day),10),'Test'),concat(left(date_add(now(), interval 1 day),10),'Test','Test Subject3'),'No Description only test',0,concat(left(date_add(now(), interval 1 day),10),' 01:00'),concat(left(date_add(now(), interval 1 day),10),' 23:00'),'2023 Test Shift after','Test SHift');
alter table op_volunteers add timestamp timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
alter table op_volunteer_shifts add timestamp timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
alter table op_shifts add end_time timestamp,add start_time timestamp;
update op_shifts set start_time=concat(start_time_lt,':00-07:00'),end_time=concat(end_time_lt,':00-07:00');
