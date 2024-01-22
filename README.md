# CensusScheduler

Census Scheduler Volunteer Management when there is no internet access.


3 cases of check-in types:

- Up to 1 hour before start of shift
  - Admins can add/remove anyone to any shift with any role
  - Authenticated individuals can add/remove themselves to a role they are qualified for; provided there is space
  - Unauthenticated individuals can not add/remove anyone
  - No one can check in
- From 1 hour prior to shift to 2 hours after shift
  - Admins, authenticated, and unauthenticated individuals can check in or add anyone to a shift
  - Admins can remove someone from a shift
- After 2 hours after end of shift
  - Admins can add/remove and check in / uncheck in anyone to a prior shift
  - Authenticated and unauthenticated individuals can not make any changes to prior shift
- For admins; warning pops up if there is not enough space in a shift when added.

3 user types:

- Admin - has `core_crew` flag set
- Individual users - everyone who has signed up for shifts prior to playa

Authentication roles:

- No Authentication
  - Checking in for a shift (but limited to 1 hour before the shift starts and 2 hours after the shift ends)
  - Adding an existing user to a shift during the check-in process.
  - Listing all shifts
  - Creating a new account
  - Sending a note to census
- User Authentication
  - Seeing ones schedule
  - Seeing ones information (but not changing it unless they are a new account)
  - Changing ones schedule
  - Sending a note to census tagged with that user
- Admin
  - Looking up any user's information
  - Changing any user's schedule
  - Seeing who is on any shift
  - Checking someone in for any shift
