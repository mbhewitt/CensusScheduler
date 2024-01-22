cd ~/git/CensusData/data/sql
git pull
cat shiftboard_roles.sql bm_dates.sql bm_volunteers.sql review_notes.sql shiftboard2.sql shiftboard_pinfo.sql shiftboard_rinfo2.sql subject_category.sql volunteer_flags.sql|mysql -uroot census
