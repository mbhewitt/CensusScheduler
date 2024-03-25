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
-- Table structure for table `op_dates`
--

DROP TABLE IF EXISTS `op_dates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_dates` (
  `year` varchar(4) DEFAULT NULL,
  `date` date NOT NULL,
  `datename` varchar(64) NOT NULL DEFAULT '',
  PRIMARY KEY (`date`,`datename`),
  KEY `year` (`year`,`datename`),
  KEY `datename` (`datename`)
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
-- Table structure for table `op_position_type`
--

DROP TABLE IF EXISTS `op_position_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_position_type` (
  `position` varchar(128) DEFAULT NULL,
  `role_id` bigint DEFAULT NULL,
  `lead` tinyint(1) DEFAULT NULL,
  `critical` tinyint(1) DEFAULT NULL,
  `prerequisite_id` bigint DEFAULT NULL,
  `position_details` longtext,
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
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_roles`
--

DROP TABLE IF EXISTS `op_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_roles` (
  `role_id` bigint NOT NULL AUTO_INCREMENT,
  `role` varchar(64) DEFAULT NULL,
  `display` tinyint(1) DEFAULT '1',
  `role_src` varchar(16) DEFAULT NULL,
  `create_role` tinyint(1) DEFAULT '0',
  `delete_role` tinyint(1) DEFAULT '0',
  `update_role` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=1000013 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_shift_category`
--

DROP TABLE IF EXISTS `op_shift_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_shift_category` (
  `category` varchar(128) NOT NULL,
  `shift_category` varchar(128) NOT NULL,
  `shift_category_id` bigint NOT NULL AUTO_INCREMENT,
  `create_category` tinyint(1) DEFAULT '0',
  `delete_category` tinyint(1) DEFAULT '0',
  `update_category` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`shift_category_id`),
  UNIQUE KEY `shift_category` (`shift_category`),
  KEY `category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  `shift_details` longtext,
  `shift_name` varchar(64) DEFAULT NULL,
  `create_shift` tinyint(1) DEFAULT '0',
  `delete_shift` tinyint(1) DEFAULT '0',
  `update_shift` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`shift_name_id`),
  UNIQUE KEY `shift_name` (`shift_name`),
  KEY `shift_category_id` (`shift_category_id`),
  CONSTRAINT `op_shift_name_ibfk_1` FOREIGN KEY (`shift_category_id`) REFERENCES `op_shift_category` (`shift_category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_shift_position`
--

DROP TABLE IF EXISTS `op_shift_position`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_shift_position` (
  `position_type_id` bigint DEFAULT NULL,
  `total_slots` int DEFAULT NULL,
  `shift_name_id` bigint DEFAULT NULL,
  `wap_points` int DEFAULT NULL,
  `shift_position_id` bigint NOT NULL AUTO_INCREMENT,
  `add_shift_position` tinyint(1) DEFAULT '0',
  `remove_shift_position` tinyint(1) DEFAULT '0',
  `update_shift_position` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`shift_position_id`),
  UNIQUE KEY `position_type_id` (`position_type_id`,`shift_name_id`),
  KEY `shift_name_id` (`shift_name_id`),
  CONSTRAINT `op_shift_position_ibfk_1` FOREIGN KEY (`shift_name_id`) REFERENCES `op_shift_name` (`shift_name_id`),
  CONSTRAINT `op_shift_position_ibfk_2` FOREIGN KEY (`position_type_id`) REFERENCES `op_position_type` (`position_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_shift_times`
--

DROP TABLE IF EXISTS `op_shift_times`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_shift_times` (
  `year` varchar(4) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `shift` varchar(32) DEFAULT NULL,
  `shift_name_id` bigint DEFAULT NULL,
  `shift_instance` varchar(32) DEFAULT NULL,
  `start_time_lt` varchar(32) DEFAULT NULL,
  `end_time_lt` varchar(32) DEFAULT NULL,
  `shift_times_id` bigint NOT NULL AUTO_INCREMENT,
  `notes` longtext,
  `add_shift_time` tinyint(1) DEFAULT '0',
  `remove_shift_time` tinyint(1) DEFAULT '0',
  `update_shift_time` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`shift_times_id`),
  UNIQUE KEY `date` (`date`,`shift_instance`),
  KEY `shift_name_id` (`shift_name_id`),
  CONSTRAINT `op_shift_times_ibfk_1` FOREIGN KEY (`shift_name_id`) REFERENCES `op_shift_name` (`shift_name_id`)
) ENGINE=InnoDB AUTO_INCREMENT=256 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `op_volunteer_shifts`
--

DROP TABLE IF EXISTS `op_volunteer_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_volunteer_shifts` (
  `shift_position_id` bigint NOT NULL,
  `shift_times_id` bigint DEFAULT NULL,
  `shiftboard_id` bigint NOT NULL,
  `shiftboard_shift_id` bigint NOT NULL DEFAULT '0',
  `noshow` varchar(10) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `add_shift` tinyint(1) DEFAULT '0',
  `remove_shift` tinyint(1) DEFAULT '0',
  `update_shift` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`shiftboard_id`,`shift_position_id`,`shiftboard_shift_id`),
  KEY `shift_times_id` (`shift_times_id`),
  KEY `shift_position_id` (`shift_position_id`),
  CONSTRAINT `op_volunteer_shifts_ibfk_1` FOREIGN KEY (`shiftboard_id`) REFERENCES `op_volunteers` (`shiftboard_id`),
  CONSTRAINT `op_volunteer_shifts_ibfk_2` FOREIGN KEY (`shift_position_id`) REFERENCES `op_shift_position` (`shift_position_id`),
  CONSTRAINT `op_volunteer_shifts_ibfk_3` FOREIGN KEY (`shift_times_id`) REFERENCES `op_shift_times` (`shift_times_id`)
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
  `passcode` varchar(6) DEFAULT NULL,
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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

insert ignore into op_volunteers (shiftboard_id,playa_name,passcode) values (1,'Admin','123456');
insert ignore into op_roles (role_id,role,display,role_src) values (1,'SuperAdmin',1,'tablet'),(2,'Admin',1,'tablet');
insert ignore into op_volunteer_roles (shiftboard_id,role_id) values (1,1),(1,2);
alter table op_volunteers add timestamp timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
alter table op_volunteer_shifts add timestamp timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
alter table op_shift_times add end_time timestamp,add start_time timestamp;
update op_shift_times set start_time=concat(start_time_lt,':00-07:00'),end_time=concat(end_time_lt,':00-07:00');
