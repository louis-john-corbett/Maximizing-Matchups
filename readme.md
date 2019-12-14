# Maximizing Matchups

Simple express/node web app to help determine which batters to start for Fantasy Baseball leagues based on past performance of expected matchups. At present there's no frontend and just about all of the configuration around teams is currently hardcoded to my 2019 roster. 

Probable Pitchers are scraped from the MLB Probable Pitchers Page.
All other statistics are sourced using MLB's API.

Future planned functionality:
-Build frontend to display results in a table format
-Build frontend to allow the input of rosters (will not persist at first)
-Improve aggregation of batting stats (MLB API currently breaks down by season)
-Allow multiple user accounts
-Allow saving of roster
-Add same functionality but for pitchers, to help optimize matchups
-Recommend batters based on batting history
-Automatically recommend optimal lineup
-Allow for future-dated games? (very dependent on how robust the Probable Pitchers page is a few days out -- will certainly be limited to ~5 days max)
-Expand to other leagues?


## Getting Started

I will need to generalize this once there's more to work with. Currently, the following endpoints exist:

/api/teams/  (populates the array of teams in MLB)
/api/batters/  (populates the array of batters, which is currently my 2019 Fantasy Roster)
/api/games/  (populates the array of games taking place on a given day, defaulted to today for now)
/api/pitchers/ (populates the pitchers likely to pitch in today's games)
/api/matchups/ (populates the matchup data based on the probable pitchers in today's games and the provided lineup, which for now is hardcoded to my 2019 Roster)


## Authors

* **Louis "Jack" Corbett** - *Initial work* - [Jack Corbett](https://github.com/louis-john-corbett)
