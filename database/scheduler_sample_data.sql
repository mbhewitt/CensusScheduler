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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `op_doodles`
--

LOCK TABLES `op_doodles` WRITE;
/*!40000 ALTER TABLE `op_doodles` DISABLE KEYS */;
INSERT INTO `op_doodles` VALUES
(1,'','2024-06-18 00:49:42');
/*!40000 ALTER TABLE `op_doodles` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `op_dates`
--

LOCK TABLES `op_dates` WRITE;
/*!40000 ALTER TABLE `op_dates` DISABLE KEYS */;
INSERT INTO `op_dates` VALUES
('2024','2024-08-31','BurnSat'),
('2024','2024-08-16','EarlyFri'),
('2024','2024-08-17','EarlyMan'),
('2024','2024-08-15','EarlyThur'),
('2024','2024-08-30','Fri'),
('2024','2024-08-26','Mon'),
('2024','2024-08-25','OpenSun'),
('2024','2024-09-02','PostMon'),
('2024','2024-09-03','PostTue'),
('2024','2024-09-04','PostWed'),
('2024','2024-08-23','PreFri'),
('2024','2024-08-19','PreMon'),
('2024','2024-08-24','PreSat'),
('2024','2024-08-18','PreSun'),
('2024','2024-08-22','PreThur'),
('2024','2024-08-20','PreTue'),
('2024','2024-08-21','PreWed'),
('2024','2024-09-01','TempleSun'),
('2024','2024-08-29','Thur'),
('2024','2024-08-10','Training'),
('2024','2024-08-27','Tue'),
('2024','2024-08-28','Wed');
/*!40000 ALTER TABLE `op_dates` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `op_messages`
--

LOCK TABLES `op_messages` WRITE;
/*!40000 ALTER TABLE `op_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `op_messages` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `op_position_type`
--

LOCK TABLES `op_position_type` WRITE;
/*!40000 ALTER TABLE `op_position_type` DISABLE KEYS */;
INSERT INTO `op_position_type` VALUES
('Airport Sampler',43174,0,0,14,'PREREQ: Online Random Sampler Training pre-event. Good mobility, punctuality, enthusiasm, ability to stand for at least 2 hours in the heat and dust, and communication skills are essential for this role! Random Samplers might be asked to work as Traffic Tamers.',1,0,0,0,0,0),
('Traffic Tamer',43174,0,0,14,'These rugged volunteers will be stationed on Gate Road ahead of the Samplers to improve visibility and keep traffic moving. PREREQ: Online Random Sampler Training pre-event. Good mobility, punctuality, enthusiasm, ability to stand for at least 2 hours in the heat and dust, and communication skills are essential for this role! Traffic Tamers might be asked to work as Random Samplers conducting interviews.  NOTE: volunteers who wish to receive early arrival through Census will need to meet all Setup Access Pass criteria: 12+ \'SAP points\' total (see shift descriptions for points per shift), from the day after your arrival, sign up for one shift per day every day until Gate opens. Each eligible volunteer will receive a SAP for the day before their first shift. ',2,0,0,0,0,0),
('Gate Sampler',43174,0,0,14,'PREREQ: Online Random Sampler Training pre-event. Good mobility, punctuality, enthusiasm, ability to stand for at least 2 hours in the heat and dust, and communication skills are essential for this role! Random Samplers might be asked to work as Traffic Tamers. NOTE: volunteers who wish to receive early arrival through Census will need to meet all Setup Access Pass criteria: 12+ \'SAP points\' total (see shift descriptions for points per shift), from the day after your arrival, sign up for one shift per day every day until Gate opens. Each eligible volunteer will receive a SAP for the day before their first shift. ',3,0,0,0,0,0),
('Naked Gate Sampler',NULL,0,0,14,'PREREQ: Online Random Sampler Training pre-event. Good mobility, punctuality, enthusiasm, ability to stand for at least 2 hours in the heat and dust, and communication skills are essential for this role! Random Samplers might be asked to work as Traffic Tamers.',4,0,0,0,0,0),
('Naked Traffic Tamer',NULL,0,0,14,'These rugged volunteers will be stationed on Gate Road ahead of the Samplers to improve visibility and keep traffic moving. PREREQ: Online Random Sampler Training pre-event. Good mobility, punctuality, enthusiasm, ability to stand for at least 2 hours in the heat and dust, and communication skills are essential for this role! Traffic Tamers might be asked to work as Random Samplers conducting interviews. ',5,0,0,0,0,0),
('Traffic Tamer 5 SAP',NULL,0,0,14,'These rugged volunteers will be stationed on Gate Road ahead of the Samplers to improve visibility and keep traffic moving. PREREQ: Online Random Sampler Training pre-event. Good mobility, punctuality, enthusiasm, ability to stand for at least 2 hours in the heat and dust, and communication skills are essential for this role! Traffic Tamers might be asked to work as Random Samplers conducting interviews. ',6,0,0,0,0,0),
('Gate Sampler 5 SAP',NULL,0,0,14,'PREREQ: Online Random Sampler Training pre-event. Good mobility, punctuality, enthusiasm, ability to stand for at least 2 hours in the heat and dust, and communication skills are essential for this role! Random Samplers might be asked to work as Traffic Tamers.',7,0,0,0,0,0),
('Gate Sampling Lead',95152,1,1,15,'The Gate Sampler Lead is a leadership role responsible for overseeing the data collection at Gate. Their primary duties include: Coordinating and managing the Random Samplings and Traffic Tamers, Ensuring accurate and efficient data collection at the gate, Providing guidance and training to Gate Random Samplers. Leads are expected to arrive 30 min early and stay until all tasks are completed. PREREQ: The Shift Lead Class on Friday PreEvent',8,30,30,0,0,0),
('Airport Sampling Lead',95152,1,1,15,'The Airport Sampler Lead is a leadership role responsible for overseeing the data collection at Airport. Their primary duties include: Coordinating and managing the Random Samplings and Traffic Tamers, Ensuring accurate and efficient data collection at the gate, Providing guidance and training to Gate Random Samplers. Leads are expected to arrive 30 min early and stay until all tasks are completed. PREREQ: The Shift Lead Class on Friday PreEvent',9,30,30,0,0,0),
('DataBeast Driver',36983,0,1,NULL,'Census DataBeast Drivers must be excellent, safe drivers with experience handling a large vehicle on-playa. Navigation will be handled by a shift lead. Drivers are expected to arrive 30 minutes prior to the shift start time. Must give copy of Driver license to Census Staff. ',10,30,0,0,0,0),
('Sampling Lead Trainee',NULL,0,0,NULL,'In the Sampling Lead Class, a Sampling Shift Lead Trainee will learn: Leadership and management skills to effectively lead a sampling team. Strategies for ensuring data quality and integrity. Techniques for troubleshooting common issues and challenges. How to provide guidance and training to samplers. Best practices for maintaining a smooth and efficient sampling operation. Radio Operation. Playa Navagation.',11,0,0,0,0,0),
('Sampling Lead Trainer',95155,1,1,NULL,'Trainer for the Sampling Lead Class',12,30,30,0,0,0),
('Lab Host Lead Trainee',NULL,0,0,NULL,'In the Lab Host Lead Class, a Lab Host Shift Lead Trainee will learn: Leadership and management skills to effectively lead a team of Lab Hosts.  Strategies for creating a welcoming and inclusive environment. Techniques for troubleshooting common issues and challenges. Effective communication and interpersonal skills.  How to provide guidance and training to Lab Hosts.  Best practices for maintaining a smooth and efficient Lab operation. How to respond to participant questions and concerns. On Playa Navagation. Radio use.',13,0,0,0,0,0),
('Lab Host Lead Trainer',95155,1,1,NULL,'Trainer for the Lab Host Lead Class',14,30,30,0,0,0),
('Census Lab Host',NULL,0,0,13,'As a Census Lab Host, you will play a crucial role in creating a welcoming and inclusive environment for participants to share their data. Your responsibilities will include: Greeting participants and making them feel comfortable. Serving Drinks. Setting up the Lab. Inviting Burners into the Lab & onboard the DataBeast.  Running Games and Events. Inviting Burners to complete questions in our Field Note Journals, Explaining the Census Lab\'s purpose and data collection process. Answering questions and addressing concerns. Providing a positive and supportive experience for all participants. PREREQ: To become a Census Lab Host, you must first complete the Online Lab Hosting Class, which covers essential skills and knowledge for success in this role. By serving as a Census Lab Host, you will contribute to the Census Lab\'s mission of collecting valuable data and fostering a sense of community among participants.',15,0,0,0,0,0),
('Lab Host Lead',95154,1,1,17,'As a Census Lab Host Lead, you will play a crucial role in creating a welcoming and inclusive environment for participants to share their data. Your responsibilities will include: Greeting participants and making them feel comfortable.. Serving Drinks. Setting up the Lab. Running Games and Events. Explaining the Census Lab\'s purpose and data collection process. Answering questions and addressing concerns. Providing a positive and supportive experience for all participants PREREQ: LabHost Lead Class on Sunday.  By serving as a Census Lab Host, you will contribute to the Census Lab\'s mission of collecting valuable data and fostering a sense of community among participants.',16,30,30,0,0,0),
('Census Art Tour',NULL,0,0,NULL,'Limited capacity, first come, first seated. If you get their late your seat may be given to someone else.',17,0,0,0,0,0),
('Art Tour Lead',95154,1,1,NULL,'You will be the docent on the Art Tour. ',18,30,0,0,0,0),
('Data Entry Shift Lead',36985,1,1,NULL,'Data Entry Leads coordinate the volunteers who assist with data entry for the forms collected during the random sampling process. Data Entry Wizzes are detail-oriented volunteers who are quick, accurate typists, and you will be responsible for briefing them on the process, checking their work, and providing additional oversight and guidance as needed. Leads are expected to arrive 30 minutes prior to the shift start time.',19,30,30,0,0,0),
('Data Entry Wiz',NULL,0,0,NULL,'Data Entry Wizzes are detail-oriented volunteers who are quick, accurate typists.',20,0,0,0,0,0),
('Party Support',NULL,0,0,NULL,'Kick off 2024 by welcoming back the 4am Sampling shift with drinks and Help us get our party on! ',21,0,0,0,0,0),
('Pre Event Construction',NULL,0,0,NULL,'This role involves heavy lifting, tool use, and an eye for space beautification. Please discuss any limitations with the Construction Lead. NOTE: volunteers who wish to receive early arrival through Census will need to meet all Setup Access Pass criteria: 12+ \'SAP points\' total (see shift descriptions for points per shift), from the day after your arrival, sign up for one shift per day every day until Gate opens. Each eligible volunteer will receive a SAP for the day before their first shift. ',22,0,0,0,0,0),
('Construction',NULL,0,0,NULL,'This role involves heavy lifting, tool use, and an eye for space beautification. Please discuss any limitations with the Construction Lead. ',23,0,0,0,0,0),
('Deconstruction',NULL,0,0,NULL,'This role involves heavy lifting, tool use, and an eye for MOOPing Please discuss any limitations with the DeConstruction Lead. ',24,0,0,0,0,0),
('Deconstruction Lead',95153,1,1,NULL,'Construction Leads oversee the Construction volunteers.',25,30,30,0,0,0),
('Construction Lead',95153,1,1,NULL,'Construction Leads oversee the Construction volunteers.',26,30,30,0,0,0),
('Data Disseminator',NULL,0,0,NULL,'Disseminators will meet at Census Lab and be provded with on-site training, plus a stack of preliminary reports. Once trained and equipped, Disseminators can do their work anywhere people can be found in BRC.  A bike or other personal conveyance may be useful for this shift, but aren’t required - intrepid volunteers willing to disseminate data on foot are also welcome!',27,0,0,0,0,0),
('Artist',NULL,1,0,NULL,'',28,0,0,0,0,0),
('Statistician',19962,1,1,NULL,'',29,0,0,0,0,0),
('Infoboard creator',NULL,1,0,NULL,'',30,0,0,0,0,0),
('Tech Support',19962,1,0,NULL,'',31,0,0,0,0,0),
('Random Sampling Training',NULL,0,0,NULL,'',32,0,0,0,0,0),
('Random Sampling Trainer',95155,1,1,NULL,'Trainer for Random Sampling Class',33,30,30,0,0,0),
('Lab Host Training',NULL,0,0,NULL,'',34,0,0,0,0,0),
('Lab Host Trainer',95155,1,1,NULL,'Traiiner for Lab Hosting Class',35,30,30,0,0,0),
('Census PopUp Lab Host',NULL,0,0,13,'As a Census Lab Host, you will play a crucial role in creating a welcoming and inclusive environment for participants to share their data. Your responsibilities will include: Greeting participants and making them feel comfortable. Serving Drinks. Setting up the Lab. Inviting Burners into the Lab & onboard the DataBeast.  Running Games and Events. Inviting Burners to complete questions in our Field Note Journals, Explaining the Census Lab\'s purpose and data collection process. Answering questions and addressing concerns. Providing a positive and supportive experience for all participants. PREREQ: To become a Census Lab Host, you must first complete the Online Lab Hosting Class, which covers essential skills and knowledge for success in this role. By serving as a Census Lab Host, you will contribute to the Census Lab\'s mission of collecting valuable data and fostering a sense of community among participants.',36,0,0,0,0,0);
/*!40000 ALTER TABLE `op_position_type` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `op_roles`
--

LOCK TABLES `op_roles` WRITE;
/*!40000 ALTER TABLE `op_roles` DISABLE KEYS */;
INSERT INTO `op_roles` VALUES
(1,'SuperAdmin',1,'tablet',0,0,0),
(2,'Admin',1,'tablet',0,0,0),
(13184,'Core Crew',1,'rinfo',0,0,0),
(19962,'IT Tech',1,'rinfo',0,0,0),
(21215,'Construction',1,'rinfo',0,0,0),
(25312,'Data Entry',1,'rinfo',0,0,0),
(25313,'Data Entry - Veteran',0,'rinfo',0,0,0),
(25314,'Data Visualization',0,'rinfo',0,0,0),
(25315,'Data Analysis - Release Signed',0,'rinfo',0,0,0),
(25407,'Census Lab Host',1,'rinfo',0,0,0),
(25408,'Census Lab Host - Veteran',0,'rinfo',0,0,0),
(27504,'Blog Writer',0,'rinfo',0,0,0),
(29611,'BxB Sampler',0,'rinfo',0,0,0),
(34863,'Census Airport Sampling Lead',0,'rinfo',0,0,0),
(35155,'Special Project',1,'rinfo',0,0,0),
(36983,'Census Driver',1,'rinfo',0,0,0),
(36984,'Census Gate Sampling Lead',0,'rinfo',0,0,0),
(36985,'Census Data Entry Lead',1,'rinfo',0,0,0),
(43173,'Census Random Sampler - Veteran',0,'rinfo',0,0,0),
(43174,'Census Random Sampler',1,'rinfo',0,0,0),
(46488,'Training',0,'rinfo',0,0,0),
(65890,'Not This Year',0,'rinfo',0,0,0),
(92220,'Shift Lead',0,'rinfo',0,0,0),
(95152,'Census Sampling Lead',1,'rinfo',0,0,0),
(95153,'Census Construction Lead',1,'rinfo',0,0,0),
(95154,'Census OutReach Lead',1,'rinfo',0,0,0),
(95155,'Census Training Lead',1,'rinfo',0,0,0),
(1000010,'Camping With Census',1,'flags',0,0,0),
(1000011,'Passed online RS-test-out',0,'flags',0,0,0),
(1000012,'Signed Behavioral Standards',1,'flags',0,0,0);
/*!40000 ALTER TABLE `op_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `op_shift_category`
--

DROP TABLE IF EXISTS `op_shift_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_shift_category` (
  `department` varchar(128) NOT NULL,
  `shift_category` varchar(128) NOT NULL,
  `shift_category_id` bigint NOT NULL AUTO_INCREMENT,
  `create_category` tinyint(1) DEFAULT '0',
  `delete_category` tinyint(1) DEFAULT '0',
  `update_category` tinyint(1) DEFAULT '0',
  `description` longtext,
  PRIMARY KEY (`shift_category_id`),
  UNIQUE KEY `shift_category` (`shift_category`),
  KEY `department` (`department`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `op_shift_category`
--

LOCK TABLES `op_shift_category` WRITE;
/*!40000 ALTER TABLE `op_shift_category` DISABLE KEYS */;
INSERT INTO `op_shift_category` VALUES
('Sampling','Airport Sampling',1,0,0,0,'Airport Sampling is the process of collecting survey data from Burning Man participants as they arrive at the BRC airport (88NV). This data helps Burning Man organizers,researchers, and governments understand the demographics, interests, and experiences of the community.'),
('Sampling','Gate Sampling',2,0,0,0,'Gate Sampling is the process of collecting survey data from Burning Man participants as they arrive on-playa via Gate Road. This crucial initiative helps Burning Man organizers,researchers, and governments understand the demographics, interests, and experiences of the community.'),
('Special','Special',3,0,0,0,'Special'),
('OutReach','Data Bash',4,0,0,0,'Data Bashes are presentations of Census Data'),
('Sampling','BxB Sampling',5,0,0,0,'Sampling of the BxB riders'),
('OutReach','Lab Host',6,0,0,0,'Lab Hosting is a vital role within the Census Lab, responsible for hosting daily activities and ensuring a welcoming and engaging environment for participants with Data and support Data Bashes, parties, games, and other events.'),
('OutReach','Pop Up Lab Host',7,0,0,0,'Pop Up Labs play a critical role in Census outreach efforts. The DataBeast is sent to a random location on playa to set up a Pop-Up Census Lab, inviting Burners to learn more about Census by exploring past years\' results, participating in on-playa data collection by answering question sets in our Field Note Journals, etc. '),
('OutReach','Data Disseminator',8,0,0,0,'Data Dissemination is the process of sharing and distributing preliminary Census results to the Burning Man community across the playa.'),
('ConDecon','Construction',9,0,0,0,'The Construction team is responsible for building and decorating the Census Lab, creating a welcoming and functional space for participants to engage with our activities.'),
('DataEntry','Data Entry',10,0,0,0,'Data Entry is a vital step in the Census Lab\'s data analysis process. During this step, survey data collected from the random sampling process is accurately and efficiently entered into our computer system while on playa, preparing it for further analysis later in the week. This work takes place in our air conditioned office.'),
('Sampling','Decom Sampling',11,0,0,0,'Sampling at Decompression'),
('ConDecon','Deconstruction',12,0,0,0,'The Deconstruction team is responsible for dismantling and de-MOOPing (Removing Matter Out Of Place) the Census Lab, ensuring a thorough cleanup and restoration of the area to its original state. This crucial step helps preserve the Playa and maintains the community\'s commitment to Leave No Trace principles.'),
('Training','Lab Host Training',13,0,0,0,'This is a placeholder for The Online Lab Host Training which can be completed at your own pace through hive. Please sign up for this shift if you are an lab host for tracking purposes and complete the hive training at your leasure.'),
('Training','Random Sampling Training',14,0,0,0,'This is a placeholder for The Online Sampling Training which can be completed at your own pace through hive. Please sign up for this shift if you are an Airport Sampler, Gate Sampler, or Traffic Tamer for tracking purposes and complete the hive training at your leasure.'),
('Training','Shift Lead Training',15,0,0,0,'The Sampling Shift Lead Training class prepares experienced Samplers to take on leadership roles as Shift Leads for Sampling Shifts. This class covers the essential skills and knowledge required to effectively manage a team of Samplers, ensure data quality, and maintain a positive and inclusive sampling environment. This is Mandatory for All Sampling Leads.'),
('ConDecon','Art',16,0,0,0,'Census Art is a vital part of our presence at Burning Man, and it can take many forms. While it may be inspired by data, it\'s not limited to data-related themes. Our art can be a sculpture, painting, mixed media, or any other creative expression that showcases our imagination and talent. Census Art adds an extra layer of depth and meaning to our participation in the Burning Man community.'),
('Training','Lab Host Lead Training',17,0,0,0,'The Lab Host Shift Lead Training class prepares experienced Lab Hosts to take on leadership roles as Shift Leads for Lab Host shifts. This class covers the essential skills and knowledge required to effectively manage a team of Lab Hosts. The training will conclude with participants running the Sunday Lab Hosting Events.'),
('OutReach','Party Support',18,0,0,0,'We need amazing support volunteers to help with setup, event management, and clean up for a couple fun Census parties! Roll will include getting supplies/cocktails prepped, making sure things stay replenished during the event, and after event clean up. '),
('Tech','Tech',19,0,0,0,'Tech Support'),
('OutReach','Art Tour',20,0,0,0,'The Art Tour is a fun guided jaunt around the playa on the DataBeast looking at the amazing art of burning man for all Census volunteers.'),
('Tech','Statatition',21,0,0,0,'Our Statistician is the mastermind behind the numbers, transforming raw data into meaningful insights. They take the data entered on playa and work their magic to create our preliminary analysis, which is then shared with the community at the highly anticipated Data Release Bash. With their expertise, they uncover trends, patterns, and findings that help us better understand the Burning Man community and its evolution.'),
('OutReach','InfoBoard',22,0,0,0,'Creating the Census Data Infoboard entails designing and developing a visually engaging and informative display that showcases key findings and insights from the Census data. The Census Data Infoboard serves as a central hub for participants to explore and interact with the Census data while on playa, sparking conversations, insights, and connections within the Burning Man community.');
/*!40000 ALTER TABLE `op_shift_category` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `op_shift_name`
--

LOCK TABLES `op_shift_name` WRITE;
/*!40000 ALTER TABLE `op_shift_name` DISABLE KEYS */;
INSERT INTO `op_shift_name` VALUES
(1,0,2,1,'Gate Sampling is the process of collecting survey data from Burning Man participants as they arrive on-playa via Gate Road. This crucial initiative helps Burning Man organizers,researchers, and governments understand the demographics, interests, and experiences of the community.','PreEvent Gate Sampling',0,0,0),
(1,0,2,2,'Gate Sampling is the process of collecting survey data from Burning Man participants as they arrive on-playa via Gate Road. This crucial initiative helps Burning Man organizers,researchers, and governments understand the demographics, interests, and experiences of the community.','PreFriday Sampling',0,0,0),
(1,0,2,3,'Gate Sampling is the process of collecting survey data from Burning Man participants as they arrive on-playa via Gate Road. This crucial initiative helps Burning Man organizers,researchers, and governments understand the demographics, interests, and experiences of the community.','Event Gate Sampling',0,0,0),
(1,0,2,4,'Gate Sampling is the process of collecting survey data from Burning Man participants as they arrive on-playa via Gate Road. This crucial initiative helps Burning Man organizers,researchers, and governments understand the demographics, interests, and experiences of the community.','Naked Gate Sampling',0,0,0),
(1,0,1,5,'Airport Sampling is the process of collecting survey data from Burning Man participants as they arrive at the BRC airport (88NV). This data helps Burning Man organizers,researchers, and governments understand the demographics, interests, and experiences of the community.','Airport Sampling',0,0,0),
(1,0,1,6,'Airport Sampling is the process of collecting survey data from Burning Man participants as they arrive at the BRC airport (88NV). This data helps Burning Man organizers,researchers, and governments understand the demographics, interests, and experiences of the community.','Late Week Airport Sampling',0,0,0),
(0,0,15,7,'The Sampling Shift Lead Training class prepares experienced Samplers to take on leadership roles as Shift Leads for Sampling Shifts. This class covers the essential skills and knowledge required to effectively manage a team of Samplers, ensure data quality, and maintain a positive and inclusive sampling environment. This is Mandatory for All Sampling Leads.','Sampling Shift Lead Training',0,0,0),
(0,0,17,8,'The Lab Host Shift Lead Training class prepares experienced Lab Hosts to take on leadership roles as Shift Leads for Lab Host shifts. This class covers the essential skills and knowledge required to effectively manage a team of Lab Hosts. The training will conclude with participants running the Sunday Lab Hosting Events.','Lab Host Lead Training',0,0,0),
(1,0,6,9,'Lab Hosting is a vital role within the Census Lab, responsible for hosting daily activities and ensuring a welcoming and engaging environment for participants with Data and support Data Bashes, parties, games, and other events.','Lab Hosting',0,0,0),
(1,0,7,10,'Pop Up Labs play a critical role in Census outreach efforts. The DataBeast is sent to a random location on playa to set up a Pop-Up Census Lab, inviting Burners to learn more about Census by exploring past years\' results, participating in on-playa data collection by answering question sets in our Field Note Journals, etc. ','Pop Up Lab Hosting',0,0,0),
(0,0,20,11,'The Art Tour is a fun guided jaunt around the playa on the DataBeast looking at the amazing art of burning man for all Census volunteers.','Art Tour',0,0,0),
(1,0,10,12,'Data Entry is a vital step in the Census Lab\'s data analysis process. During this step, survey data collected from the random sampling process is accurately and efficiently entered into our computer system while on playa, preparing it for further analysis later in the week. This work takes place in our air conditioned office.','Data Entry',0,0,0),
(0,0,18,13,'We need amazing support volunteers to help with setup, event management, and clean up for a couple fun Census parties! Roll will include getting supplies/cocktails prepped, making sure things stay replenished during the event, and after event clean up. ','Party',0,0,0),
(0,0,9,14,'The Construction team is responsible for building and decorating the Census Lab, creating a welcoming and functional space for participants to engage with our activities.','Pre Event Construction',0,0,0),
(0,0,9,15,'The Construction team is responsible for building and decorating the Census Lab, creating a welcoming and functional space for participants to engage with our activities.','Construction',0,0,0),
(0,0,12,16,'The Deconstruction team is responsible for dismantling and de-MOOPing (Removing Matter Out Of Place) the Census Lab, ensuring a thorough cleanup and restoration of the area to its original state. This crucial step helps preserve the Playa and maintains the community\'s commitment to Leave No Trace principles.','Deconstruction',0,0,0),
(1,0,8,17,'Data Dissemination is the process of sharing and distributing preliminary Census results to the Burning Man community across the playa.','Data Dissemination',0,0,0),
(0,0,16,18,'Census Art is a vital part of our presence at Burning Man, and it can take many forms. While it may be inspired by data, it\'s not limited to data-related themes. Our art can be a sculpture, painting, mixed media, or any other creative expression that showcases our imagination and talent. Census Art adds an extra layer of depth and meaning to our participation in the Burning Man community.','On Playa Art',0,0,0),
(1,0,21,19,'Our Statistician is the mastermind behind the numbers, transforming raw data into meaningful insights. They take the data entered on playa and work their magic to create our preliminary analysis, which is then shared with the community at the highly anticipated Data Release Bash. With their expertise, they uncover trends, patterns, and findings that help us better understand the Burning Man community and its evolution.','Statistician Makes Magic',0,0,0),
(1,0,22,20,'Creating the Census Data Infoboard entails designing and developing a visually engaging and informative display that showcases key findings and insights from the Census data. The Census Data Infoboard serves as a central hub for participants to explore and interact with the Census data while on playa, sparking conversations, insights, and connections within the Burning Man community.','Infoboard',0,0,0),
(0,0,19,21,'Tech Support','Tech Support',0,0,0),
(0,1,14,22,'This is a placeholder for The Online Sampling Training which can be completed at your own pace through hive. Please sign up for this shift if you are an Airport Sampler, Gate Sampler, or Traffic Tamer for tracking purposes and complete the hive training at your leasure.','Random Sampling Training',0,0,0),
(0,1,13,23,'This is a placeholder for The Online Lab Host Training which can be completed at your own pace through hive. Please sign up for this shift if you are an lab host for tracking purposes and complete the hive training at your leasure.','Lab Host Training',0,0,0),
(1,0,2,24,'Gate Sampling is the process of collecting survey data from Burning Man participants as they arrive on-playa via Gate Road. This crucial initiative helps Burning Man organizers,researchers, and governments understand the demographics, interests, and experiences of the community.','SatSun Gate Sampling',0,0,0),
(1,0,6,25,'Lab Hosting is a vital role within the Census Lab, responsible for hosting daily activities and ensuring a welcoming and engaging environment for participants with Data and support Data Bashes, parties, games, and other events.','Friday Lab Hosting',0,0,0),
(1,0,7,26,'Pop Up Labs play a critical role in Census outreach efforts. The DataBeast is sent to a random location on playa to set up a Pop-Up Census Lab, inviting Burners to learn more about Census by exploring past years\' results, participating in on-playa data collection by answering question sets in our Field Note Journals, etc. ','Sat PopUp Lab',0,0,0),
(0,0,9,27,'The Construction team is responsible for building and decorating the Census Lab, creating a welcoming and functional space for participants to engage with our activities.','PreSun Construction',0,0,0),
(0,0,20,28,'The Art Tour is a fun guided jaunt around the playa on the DataBeast looking at the amazing art of burning man for all Census volunteers.','Special Tour',0,0,0);
/*!40000 ALTER TABLE `op_shift_name` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `op_shift_position`
--

LOCK TABLES `op_shift_position` WRITE;
/*!40000 ALTER TABLE `op_shift_position` DISABLE KEYS */;
INSERT INTO `op_shift_position` VALUES
(3,8,1,4,1,0,0,0),
(2,2,1,4,2,0,0,0),
(8,3,1,4,3,0,0,0),
(10,1,1,4,4,0,0,0),
(3,8,2,4,5,0,0,0),
(2,2,2,4,6,0,0,0),
(10,1,2,4,7,0,0,0),
(3,14,24,4,8,0,0,0),
(2,4,24,4,9,0,0,0),
(8,3,24,4,10,0,0,0),
(10,1,24,4,11,0,0,0),
(7,14,3,5,12,0,0,0),
(6,4,3,5,13,0,0,0),
(8,3,3,4,14,0,0,0),
(10,1,3,4,15,0,0,0),
(4,14,4,4,16,0,0,0),
(5,4,4,4,17,0,0,0),
(8,3,4,4,18,0,0,0),
(10,1,4,4,19,0,0,0),
(1,3,5,4,20,0,0,0),
(9,2,5,4,21,0,0,0),
(1,4,6,4,22,0,0,0),
(9,2,6,4,23,0,0,0),
(11,20,7,2,24,0,0,0),
(12,5,7,5,25,0,0,0),
(13,5,8,2,26,0,0,0),
(14,2,8,5,27,0,0,0),
(15,4,9,4,28,0,0,0),
(16,1,9,4,29,0,0,0),
(36,6,10,3,30,0,0,0),
(16,1,10,3,31,0,0,0),
(10,1,10,3,32,0,0,0),
(17,30,11,0,33,0,0,0),
(18,1,11,3,34,0,0,0),
(10,1,11,3,35,0,0,0),
(19,1,12,4,36,0,0,0),
(20,6,12,3,37,0,0,0),
(21,2,13,2,38,0,0,0),
(16,1,13,2,39,0,0,0),
(22,10,14,4,40,0,0,0),
(26,1,14,4,41,0,0,0),
(23,10,15,4,42,0,0,0),
(26,1,15,4,43,0,0,0),
(24,15,16,4,44,0,0,0),
(25,1,16,4,45,0,0,0),
(27,15,17,2,46,0,0,0),
(28,1,18,4,47,0,0,0),
(29,1,19,12,48,0,0,0),
(30,1,20,12,49,0,0,0),
(31,3,21,4,50,0,0,0),
(32,100,22,0,51,0,0,0),
(33,0,22,0,52,0,0,0),
(34,100,23,0,53,0,0,0),
(35,0,23,0,54,0,0,0),
(15,6,25,3,55,0,0,0),
(16,2,25,3,56,0,0,0),
(10,1,17,3,57,0,0,0),
(15,10,26,3,58,0,0,0),
(16,1,26,3,59,0,0,0),
(10,1,26,3,60,0,0,0),
(26,10,27,2,61,0,0,0),
(10,1,28,4,62,0,0,0),
(18,1,28,4,63,0,0,0);
/*!40000 ALTER TABLE `op_shift_position` ENABLE KEYS */;
UNLOCK TABLES;

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
  `shift_instance` varchar(64) DEFAULT NULL,
  `start_time_lt` varchar(32) DEFAULT NULL,
  `end_time_lt` varchar(32) DEFAULT NULL,
  `shift_times_id` bigint NOT NULL AUTO_INCREMENT,
  `notes` longtext,
  `add_shift_time` tinyint(1) DEFAULT '0',
  `remove_shift_time` tinyint(1) DEFAULT '0',
  `update_shift_time` tinyint(1) DEFAULT '0',
  `end_time` datetime NULL DEFAULT NULL,
  `start_time` datetime NULL DEFAULT NULL,
  `meal` varchar(32) DEFAULT NULL,
  `lead_assigned_shiftboard_ids` text,
  PRIMARY KEY (`shift_times_id`),
  UNIQUE KEY `date` (`date`,`shift_instance`),
  KEY `shift_name_id` (`shift_name_id`),
  CONSTRAINT `op_shift_times_ibfk_1` FOREIGN KEY (`shift_name_id`) REFERENCES `op_shift_name` (`shift_name_id`)
) ENGINE=InnoDB AUTO_INCREMENT=256 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `op_shift_times`
--

LOCK TABLES `op_shift_times` WRITE;
/*!40000 ALTER TABLE `op_shift_times` DISABLE KEYS */;
INSERT INTO `op_shift_times` VALUES
('2024','2024-08-21','11:30 AM  - 3:30 PM',1,'Gate PreWed1','2024-08-21 11:30','2024-08-21 15:30',1,'',0,0,0,NULL,NULL,'Lunch Before','3265, 5193, 33843'),
('2024','2024-08-22','2:30 PM  - 6:30 PM',1,'Gate PreThur2','2024-08-22 14:30','2024-08-22 18:30',2,'',0,0,0,NULL,NULL,'Dinner After','18998,24027, 20593'),
('2024','2024-08-23','11:00 AM  - 6:30 PM',7,'Lead Training PreFri3','2024-08-23 11:00','2024-08-23 18:30',3,'Both Lunch and Dinner are included for Shift Leads.',0,0,0,NULL,NULL,'Dinner After','18998, 5252, 24027, 839242, 20593, 3265, 836478, 3230, 5193, 836634, 29387'),
('2024','2024-08-23','12:30 PM  - 5:00 PM',2,'Gate PreFri4','2024-08-23 12:30','2024-08-23 17:00',4,'This sampling shift is very chaotic, please remember to be forgiving of the chaos.',0,0,0,NULL,NULL,'Lunch Before',''),
('2024','2024-08-24','6:30 PM  - 10:30 PM',24,'Gate PreSat5','2024-08-24 18:30','2024-08-24 22:30',5,'',0,0,0,NULL,NULL,'Dinner Before','20593, 3230, 33843'),
('2024','2024-08-25','4:00 AM  - 8:00 AM',24,'Gate OpenSun6','2024-08-25 04:00','2024-08-25 08:00',6,'',0,0,0,NULL,NULL,'Breakfast After','18998, 836634, 23697'),
('2024','2024-08-25','11:00 AM  - 3:00 PM',5,'Airport OpenSun7','2024-08-25 11:00','2024-08-25 15:00',7,'',0,0,0,NULL,NULL,'Lunch Before','5252, 836478'),
('2024','2024-08-25','6:30 PM  - 10:30 PM',24,'Gate OpenSun8','2024-08-25 18:30','2024-08-25 22:30',8,'',0,0,0,NULL,NULL,'Dinner Before','24027, 3265, 3230'),
('2024','2024-08-26','8:30 AM  - 12:30 PM',5,'Airport Mon9','2024-08-26 08:30','2024-08-26 12:30',9,'',0,0,0,NULL,NULL,'Lunch After','5252, 33843'),
('2024','2024-08-26','1:00 PM  - 5:00 PM',3,'Gate Mon10','2024-08-26 13:00','2024-08-26 17:00',10,'',0,0,0,NULL,NULL,'Lunch Before','839242, 3230, 836634'),
('2024','2024-08-26','6:30 PM  - 10:30 PM',3,'Gate Mon11','2024-08-26 18:30','2024-08-26 22:30',11,'',0,0,0,NULL,NULL,'Dinner Before','24027, 23697, 29387'),
('2024','2024-08-27','3:30 PM  - 7:30 PM',5,'Airport Tue12','2024-08-27 15:30','2024-08-27 19:30',12,'',0,0,0,NULL,NULL,'Dinner After','5252, 3265'),
('2024','2024-08-27','6:30 PM  - 10:30 PM',3,'Gate Tue13','2024-08-27 18:30','2024-08-27 22:30',13,'',0,0,0,NULL,NULL,'Dinner Before','24027, 3230, 29387'),
('2024','2024-08-28','7:30 AM  - 11:30 AM',5,'Airport Wed14','2024-08-28 07:30','2024-08-28 11:30',14,'',0,0,0,NULL,NULL,'Breakfast Before','3265, 33843'),
('2024','2024-08-28','2:00 PM  - 6:00 PM',4,'Gate Wed15','2024-08-28 14:00','2024-08-28 18:00',15,'NUDITY WARNING: In keeping with our 2016 agreement with Media Mecca, volunteers on this shift must be naked except for lab coat and closed-toe shoes. Please cover your bits in commissary. IF THIS DOES NOT SOUND FUN TO YOU, PLEASE SIGN UP FOR A DIFFERENT SHIFT.',0,0,0,NULL,NULL,'Dinner After','24027, 836478, 3230'),
('2024','2024-08-29','4:00 PM  - 8:00 PM',6,'Airport Thur16','2024-08-29 16:00','2024-08-29 20:00',16,'',0,0,0,NULL,NULL,'Dinner Before','5252, 839242'),
('2024','2024-08-30','10:30 AM  - 2:30 PM',6,'Airport Fri17','2024-08-30 10:30','2024-08-30 14:30',17,'',0,0,0,NULL,NULL,'Lunch Before','5252, 33843'),
('2024','2024-08-25','12:00 PM  - 6:00 PM',8,'LH Lead Training OpenSun18','2024-08-25 12:00','2024-08-25 18:00',18,'',0,0,0,NULL,NULL,'Dinner After','836634, 23697, 9957, 831716, 819845, 3265, 821391'),
('2024','2024-08-26','9:00 AM  - 12:00 PM',10,'PopUp Lab Mon19','2024-08-26 09:00','2024-08-26 12:00',19,'',0,0,0,NULL,NULL,'','821391'),
('2024','2024-08-26','2:00 PM  - 6:00 PM',9,'Lab Hosting Mon20','2024-08-26 14:00','2024-08-26 18:00',20,'Monday Talk “Get to Know Black Rock City Census” given by our Census Manger, Sonder',0,0,0,NULL,NULL,'Dinner After','9957'),
('2024','2024-08-27','10:00 AM  - 1:00 PM',10,'PopUp Lab Tue21','2024-08-27 10:00','2024-08-27 13:00',21,'',0,0,0,NULL,NULL,'','831716'),
('2024','2024-08-27','2:00 PM  - 6:00 PM',9,'Lab Hosting Tue22','2024-08-27 14:00','2024-08-27 18:00',22,'“Data Nerds Social” Meet our Lead Statistician Murrs & other Data Nerds',0,0,0,NULL,NULL,'Dinner After','819845'),
('2024','2024-08-27','2:00 PM  - 5:00 PM',11,'Art Tour Tue23','2024-08-27 14:00','2024-08-27 17:00',23,'',0,0,0,NULL,NULL,'','821391'),
('2024','2024-08-28','10:00 AM  - 1:00 PM',10,'PopUp Lab Wed24','2024-08-28 10:00','2024-08-28 13:00',24,'',0,0,0,NULL,NULL,'','831716'),
('2024','2024-08-28','2:00 PM  - 6:00 PM',9,'Lab Hosting Wed25','2024-08-28 14:00','2024-08-28 18:00',25,'“Sustainability” given by Lab Host Lead & Research Scientist, Kelly',0,0,0,NULL,NULL,'Dinner After','9957'),
('2024','2024-08-29','10:00 AM  - 1:00 PM',10,'PopUp Lab Thur26','2024-08-29 10:00','2024-08-29 13:00',26,'',0,0,0,NULL,NULL,'','23697'),
('2024','2024-08-29','2:00 PM  - 6:00 PM',9,'Lab Hosting Thur27','2024-08-29 14:00','2024-08-29 18:00',27,'“Bonkers Bike Data” given by Census volunteer & Bike Enthusiast, Ky',0,0,0,NULL,NULL,'Dinner After','819845'),
('2024','2024-08-28','7:00 PM  - 10:00 PM',11,'Art Tour Wed28','2024-08-28 19:00','2024-08-28 22:00',28,'',0,0,0,NULL,NULL,'','5174'),
('2024','2024-08-29','4:00 PM  - 10:00 PM',28,'Special Tour Thur29','2024-08-29 16:00','2024-08-29 22:00',29,'',0,0,0,NULL,NULL,'','875'),
('2024','2024-08-30','10:00 AM  - 1:00 PM',10,'PopUp Lab Fri30','2024-08-30 10:00','2024-08-30 13:00',30,'',0,0,0,NULL,NULL,'','836634'),
('2024','2024-08-30','2:00 PM  - 6:00 PM',25,'Lab Hosting Fri31','2024-08-30 14:00','2024-08-30 18:00',31,'This combo PopUp/ Regular Lab includes the Data Release Bash by our Lead Statistician, Murrs along with Cocktails & Correlations party and Data Dessemination',0,0,0,NULL,NULL,'Dinner After','3265, 5174'),
('2024','2024-08-31','11:00 AM  - 2:00 PM',26,'PopUp Lab BurnSat32','2024-08-31 11:00','2024-08-31 14:00',32,'',0,0,0,NULL,NULL,'','9957'),
('2024','2024-08-26','9:00 AM  - 12:00 PM',12,'Data Entry Mon33','2024-08-26 09:00','2024-08-26 12:00',33,'',0,0,0,NULL,NULL,'','15084'),
('2024','2024-08-26','3:30 PM  - 6:30 PM',12,'Data Entry Mon34','2024-08-26 15:30','2024-08-26 18:30',34,'',0,0,0,NULL,NULL,'','3265'),
('2024','2024-08-27','9:00 AM  - 12:00 PM',12,'Data Entry Tue35','2024-08-27 09:00','2024-08-27 12:00',35,'',0,0,0,NULL,NULL,'','15084'),
('2024','2024-08-27','3:30 PM  - 6:30 PM',12,'Data Entry Tue36','2024-08-27 15:30','2024-08-27 18:30',36,'',0,0,0,NULL,NULL,'','836634'),
('2024','2024-08-28','3:30 PM  - 6:30 PM',12,'Data Entry Wed37','2024-08-28 15:30','2024-08-28 18:30',37,'',0,0,0,NULL,NULL,'','15084'),
('2024','2024-08-29','3:30 PM  - 6:30 PM',12,'Data Entry Thur38','2024-08-29 15:30','2024-08-29 18:30',38,'',0,0,0,NULL,NULL,'','15084'),
('2024','2024-08-31','9:00 AM  - 12:00 PM',12,'Data Entry BurnSat39','2024-08-31 09:00','2024-08-31 12:00',39,'',0,0,0,NULL,NULL,'','15084'),
('2024','2024-08-25','7:00 AM  - 9:00 AM',13,'Party OpenSun40','2024-08-25 07:00','2024-08-25 09:00',40,'',0,0,0,NULL,NULL,'','875'),
('2024','2024-08-18','12:00 PM  - 4:00 PM',27,'Construction PreSun41','2024-08-18 12:00','2024-08-18 16:00',41,'Only volunteers with staff or ticket in hand are eligible for this shift. NO will call or ticket-aid',0,0,0,NULL,NULL,'Dinner After','5193, 5174, 23697, 3234, 834159, 3966, 875, 38872'),
('2024','2024-08-19','9:00 AM  - 1:00 PM',14,'Construction PreMon42','2024-08-19 09:00','2024-08-19 13:00',42,'Only volunteers with staff or ticket in hand are eligible for this shift. NO will call or ticket-aid',0,0,0,NULL,NULL,'Lunch After','38872'),
('2024','2024-08-19','2:00 PM  - 6:00 PM',14,'Construction PreMon43','2024-08-19 14:00','2024-08-19 18:00',43,'Only volunteers with staff or ticket in hand are eligible for this shift. NO will call or ticket-aid',0,0,0,NULL,NULL,'Dinner After','38872'),
('2024','2024-08-20','9:00 AM  - 1:00 PM',14,'Construction PreTue44','2024-08-20 09:00','2024-08-20 13:00',44,'',0,0,0,NULL,NULL,'Lunch After','38872'),
('2024','2024-08-20','2:00 PM  - 6:00 PM',14,'Construction PreTue45','2024-08-20 14:00','2024-08-20 18:00',45,'',0,0,0,NULL,NULL,'Dinner After','38872'),
('2024','2024-08-21','9:00 AM  - 1:00 PM',14,'Construction PreWed46','2024-08-21 09:00','2024-08-21 13:00',46,'',0,0,0,NULL,NULL,'Lunch After','38872'),
('2024','2024-08-21','2:00 PM  - 6:00 PM',14,'Construction PreWed47','2024-08-21 14:00','2024-08-21 18:00',47,'',0,0,0,NULL,NULL,'Dinner After','38872'),
('2024','2024-08-22','9:00 AM  - 1:00 PM',14,'Construction PreThur48','2024-08-22 09:00','2024-08-22 13:00',48,'',0,0,0,NULL,NULL,'Lunch After','38872'),
('2024','2024-08-22','2:00 PM  - 6:00 PM',14,'Construction PreThur49','2024-08-22 14:00','2024-08-22 18:00',49,'',0,0,0,NULL,NULL,'Dinner After','38872'),
('2024','2024-08-23','9:00 AM  - 1:00 PM',14,'Construction PreFri50','2024-08-23 09:00','2024-08-23 13:00',50,'',0,0,0,NULL,NULL,'Lunch After','38872'),
('2024','2024-08-23','2:00 PM  - 6:00 PM',15,'Construction PreFri51','2024-08-23 14:00','2024-08-23 18:00',51,'',0,0,0,NULL,NULL,'Dinner After','38872'),
('2024','2024-08-24','9:00 AM  - 1:00 PM',15,'Construction PreSat52','2024-08-24 09:00','2024-08-24 13:00',52,'',0,0,0,NULL,NULL,'Lunch After','38872'),
('2024','2024-08-24','2:00 PM  - 6:00 PM',15,'Construction PreSat53','2024-08-24 14:00','2024-08-24 18:00',53,'',0,0,0,NULL,NULL,'Dinner After','38872'),
('2024','2024-08-25','9:00 AM  - 1:00 PM',15,'Construction OpenSun54','2024-08-25 09:00','2024-08-25 13:00',54,'',0,0,0,NULL,NULL,'Lunch After','38872'),
('2024','2024-08-25','2:00 PM  - 6:00 PM',15,'Construction OpenSun55','2024-08-25 14:00','2024-08-25 18:00',55,'',0,0,0,NULL,NULL,'Dinner After','38872'),
('2024','2024-09-01','9:00 AM  - 1:00 PM',16,'Deconstruction TempleSun56','2024-09-01 09:00','2024-09-01 13:00',56,'',0,0,0,NULL,NULL,'Lunch After','834159'),
('2024','2024-09-01','2:00 PM  - 6:00 PM',16,'Deconstruction TempleSun57','2024-09-01 14:00','2024-09-01 18:00',57,'',0,0,0,NULL,NULL,'Dinner After','834159'),
('2024','2024-09-02','9:00 AM  - 1:00 PM',16,'Deconstruction PostMon58','2024-09-02 09:00','2024-09-02 13:00',58,'',0,0,0,NULL,NULL,'Lunch After','834159'),
('2024','2024-09-02','2:00 PM  - 6:00 PM',16,'Deconstruction PostMon59','2024-09-02 14:00','2024-09-02 18:00',59,'',0,0,0,NULL,NULL,'Dinner After','834159'),
('2024','2024-09-03','9:00 AM  - 1:00 PM',16,'Deconstruction PostTue60','2024-09-03 09:00','2024-09-03 13:00',60,'',0,0,0,NULL,NULL,'Lunch After','834159'),
('2024','2024-09-03','2:00 PM  - 6:00 PM',16,'Deconstruction PostTue61','2024-09-03 14:00','2024-09-03 18:00',61,'',0,0,0,NULL,NULL,'Dinner After','834159'),
('2024','2024-08-30','3:00 PM  - 6:00 PM',17,'Data Dissemination Fri62','2024-08-30 15:00','2024-08-30 18:00',62,'You may choose the option of traveling on the DataBeast to random locations on Playa to disseminate Census preliminary data. ',0,0,0,NULL,NULL,'',''),
('2024','2024-08-20','8:00 AM  - 2:00 PM',18,'Cova Art PreTue63','2024-08-20 08:00','2024-08-20 14:00',63,'',0,0,0,NULL,NULL,'','836085'),
('2024','2024-08-21','8:00 AM  - 2:00 PM',18,'Cova Art PreWed64','2024-08-21 08:00','2024-08-21 14:00',64,'',0,0,0,NULL,NULL,'','836085'),
('2024','2024-08-22','8:00 AM  - 2:00 PM',18,'Cova Art PreThur65','2024-08-22 08:00','2024-08-22 14:00',65,'',0,0,0,NULL,NULL,'','836085'),
('2024','2024-08-23','8:00 AM  - 2:00 PM',18,'Cova Art PreFri66','2024-08-23 08:00','2024-08-23 14:00',66,'',0,0,0,NULL,NULL,'','836085'),
('2024','2024-08-24','8:00 AM  - 2:00 PM',18,'Cova Art PreSat67','2024-08-24 08:00','2024-08-24 14:00',67,'',0,0,0,NULL,NULL,'','836085'),
('2024','2024-08-29','3:00 PM  - 10:00 PM',19,'Murrs magic Thur68','2024-08-29 15:00','2024-08-29 22:00',68,'',0,0,0,NULL,NULL,'','25134'),
('2024','2024-08-23','8:00 AM  - 8:00 PM',20,'infoboard PreFri69','2024-08-23 08:00','2024-08-23 20:00',69,'',0,0,0,NULL,NULL,'','33444'),
('2024','2024-08-25','11:00 AM  - 1:00 PM',21,'TechSupport OpenSun70','2024-08-25 11:00','2024-08-25 13:00',70,'',0,0,0,NULL,NULL,'','3234'),
('2024','2024-08-26','11:00 AM  - 1:00 PM',21,'TechSupport Mon71','2024-08-26 11:00','2024-08-26 13:00',71,'',0,0,0,NULL,NULL,'','835267'),
('2024','2024-08-27','11:00 AM  - 1:00 PM',21,'TechSupport Tue72','2024-08-27 11:00','2024-08-27 13:00',72,'',0,0,0,NULL,NULL,'','3234'),
('2024','2024-08-28','11:00 AM  - 1:00 PM',21,'TechSupport Wed73','2024-08-28 11:00','2024-08-28 13:00',73,'',0,0,0,NULL,NULL,'','835267'),
('2024','2024-08-29','11:00 AM  - 1:00 PM',21,'TechSupport Thur74','2024-08-29 11:00','2024-08-29 13:00',74,'',0,0,0,NULL,NULL,'','3234'),
('2024','2024-08-30','11:00 AM  - 1:00 PM',21,'TechSupport Fri75','2024-08-30 11:00','2024-08-30 13:00',75,'',0,0,0,NULL,NULL,'','835267'),
('2024','2024-08-10','11:00 AM  - 12:00 PM',22,'Random Sampling Training Training76','2024-08-10 11:00','2024-08-10 12:00',76,'',0,0,0,NULL,NULL,'',''),
('2024','2024-08-10','12:00 PM  - 1:00 PM',23,'Lab Host Training Training77','2024-08-10 12:00','2024-08-10 13:00',77,'',0,0,0,NULL,NULL,'','');
/*!40000 ALTER TABLE `op_shift_times` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `op_volunteer_roles`
--

LOCK TABLES `op_volunteer_roles` WRITE;
/*!40000 ALTER TABLE `op_volunteer_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `op_volunteer_roles` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `op_volunteer_shifts`
--

LOCK TABLES `op_volunteer_shifts` WRITE;
/*!40000 ALTER TABLE `op_volunteer_shifts` DISABLE KEYS */;
/*!40000 ALTER TABLE `op_volunteer_shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `op_volunteers`
--

DROP TABLE IF EXISTS `op_volunteers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_volunteers` (
  `shiftboard_id` bigint NOT NULL DEFAULT '0',
  `playa_name` varchar(128) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `world_name` text,
  `email` text,
  `phone` text,
  `passcode` varchar(6) DEFAULT NULL,
  `account_id` varchar(10) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
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
-- Dumping data for table `op_volunteers`
--

LOCK TABLES `op_volunteers` WRITE;
/*!40000 ALTER TABLE `op_volunteers` DISABLE KEYS */;
/*!40000 ALTER TABLE `op_volunteers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

insert ignore into op_volunteers (shiftboard_id,world_name,playa_name,passcode) values (1,'Admin','Admin','123456');
insert ignore into op_roles (role_id,role,display,role_src) values (1,'SuperAdmin',1,'tablet'),(2,'Admin',1,'tablet');
insert ignore into op_volunteer_roles (shiftboard_id,role_id) values (1,1),(1,2);
update op_shift_times set start_time=date_add(concat(start_time_lt,':00'),interval 7 hour) , end_time=date_add(concat(end_time_lt,':00'), interval 7 hour);
update op_position_type set role_id=NULL where role_id in ('43174','21215');

