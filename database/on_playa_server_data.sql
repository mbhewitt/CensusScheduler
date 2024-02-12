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
