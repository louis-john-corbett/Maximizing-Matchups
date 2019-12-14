const Joi = require('@hapi/joi');

const express = require('express');
const request = require('request');
const $ = require('cheerio');

const app = express();

app.use(express.json());

// Probable Pitchers - HTML
const probablePitcherUrl = 'https://www.mlb.com/probable-pitchers';

// Teams - JSON
const mlbTeamsUrl = 'https://statsapi.mlb.com/api/v1/teams/?sportId=1';

// Player Search - JSON
const playerLookupUrl = "http://lookup-service-prod.mlb.com/json/named.search_player_all.bam?sport_code='mlb'&active_sw='Y'&name_part="

// Player by ID - JSON
const playerByIdUrl = 'https://statsapi.mlb.com/api/v1/people/';

// Games Today - JSON
const gamesTodayUrl = 'http://statsapi.mlb.com/api/v1/schedule/games/?sportId=1'

const batterVsPitcherUrl = 'https://statsapi.mlb.com/api/v1/people/';
const batterVsPitcherParams = '/stats?stats=vsTeam&group=pitching&opposingPlayerId=';

//in memory db for now
let teams = [];
let games = [];
let batterNames = ['Omar Narvaez', 'C.J. Cron', 'Justin Turner', 'Danny Santana', 'Eric Hosmer', 'Mitch Garver', 'Shohei Ohtani', 'Ketel Marte', 'Tommy La Stella', 'Joey Votto', 'Nolan Arenado', 'Hunter Renfroe', 'Yasiel Puig', 'Tommy Pham', 'Jorge Polanco'];
let batters = []
let pitchers = [];
let matchups = []

app.get('/api/teams/', (req, res) => {
    //if (teams.length > 0) return res.send(teams);;

    getTeams.then((result) => {
        console.log("Successfully retrieved teams");
        res.send(result);
    }).catch(() => {
        console.log("Didn't get as many results as was expected when retrieving teams.");
        res.status(404).send();
    });
});

let getTeams = new Promise((resolve, reject) => {
    request(mlbTeamsUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            const teamsJson = JSON.parse(body);
            for (let i = 0; i < teamsJson.teams.length; i++) {
                const team = teamsJson.teams[i];
                teams.push(
                {
                    id: parseInt(team.id),
                    name: team.name
                });
            }
        }
        else{
            reject('uh oh');
        }
    });

    resolve(teams);
});

app.get('/api/batters/', (req, res) => {
    getBatters.then((result) => {
        console.log("Successfully retrieved batters");
        res.send(result);
    }).catch(() => {
        console.log("Issue while retrieving batters.");
        res.status(404).send();
    });
});

let getBatters = new Promise((resolve, reject) => {
    for (let i = 0; i < batterNames.length; i++){
        request (`${playerLookupUrl}'${batterNames[i]}'`, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                const batter = JSON.parse(body).search_player_all.queryResults.row;
                
                if (!batters.find(p => p.id === parseInt(batter.player_id))){
                    batters.push({
                        id: parseInt(batter.player_id),
                        name: batter.name_display_first_last,
                        teamId: parseInt(batter.team_id)
                    });
                }
                else if (batters.find(p => p.teamId !== parseInt(batter.team_id))){
                    let tradedBatter = batters.find(c => c.id === parseInt(batter.id));
                    const index = batters.indexOf(tradedBatter);
                    batters.splice(index, 1);

                    batters.push({
                        id: parseInt(batter.player_id),
                        name: batter.name_display_first_last,
                        teamId: parseInt(batter.team_id)
                    });
                }
            }
            else {
                console.log("Didn't get as many results as was expected when retrieving batters.");
                reject('Couldn\'t get some batters');
            }
        });
    };

    resolve(batters);
});

app.get('/api/games/', (req, res) => {
    games = [];
    
    getGames.then((result) => {
        console.log("Successfully retrieved games");
        return res.send(result);
    }).catch((result) => {
        console.log("Issue while retrieving games.");
    });
});

let getGames = new Promise((resolve, reject) => {
    request(gamesTodayUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            const games = JSON.parse(body);

            if (games.totalGames == 0){
                return;
            }

            let gamesArray = dates[0].games;

            for (let i = 0; i < gamesArray.length; i++) {
                const game = gamesArray[i];
                games.push(
                {
                    id: parseInt(game.gamePk),
                    teams: [ 
                    {
                        id: game.teams.away.team.id, 
                        name: game.teams.away.team.name
                    },
                    {
                        id: game.teams.home.team.id, 
                        name: game.teams.home.team.name
                    }
                    ]
                });
            }
        }
        else{
            reject('issue while getting games');
        }
    });

    resolve(games);
});

app.get('/api/pitchers/', (req, res) => {
    getPitchers.then((result) => {
        console.log("Successfully retrieved pitchers");
        return res.send(result);
    }).catch((result) => {
        console.log("Issue while retrieving pitchers.");
    });
});

let getPitchers = new Promise((resolve, reject) => {
    request(probablePitcherUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            const pitcherDom = $('.probable-pitchers__pitcher-name-link', body);
            for (let i = 0; i < pitcherDom.length; i++) {
                pitcherUrl = pitcherDom[i].attribs.href;
                const words = pitcherUrl.split('-');
                const pitcherId = words[words.length - 1];

                request(`${playerByIdUrl}${pitcherId}?hydrate=currentTeam`, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        const pitcher = JSON.parse(body).people[0];

                        pitchers.push({
                            id: parseInt(pitcher.id),
                            name: pitcher.fullName,
                            teamId : pitcher.currentTeam.id
                        });
                    }
                });
            }
        } 
        else{
            reject('issue while getting pitchers');
        }
    });
    resolve(pitchers);
});

app.get('/api/matchups/', (req, res) => {
    Promise.all([
        getTeams,
        getGames,
        getBatters,
        getPitchers
    ]).then(() => {
        console.log('Promise.all finished');
        console.log(teams);
        console.log(games);
        console.log(batters);
        console.log(pitchers);
        getMatchups;
    }).then(() => {
        return res.send(matchups);
    }).catch(() => {
        console.log('Something went wrong');
    });
});

let getMatchups = new Promise((resolve, reject) => {
    console.log('got to the matchup promise');
    for (let i = 0; i < batters.length; i++){
        let game = games.find(game => game.teams.find(team => team.id === batters[i].teamId));

        if (game){
            const opponent = game.teams.find(team => team.id !== batters[i].teamId);
            const pitcher = pitchers.find(pitcher => pitcher.teamId === opponent.id);
            
            request(`${batterVsPitcherUrl}${pitcher.id}${batterVsPitcherParams}${batters[i].id}`, function(error, response, body) {
                if (!error && response.statusCode == 200) {

                    const matchupStats = JSON.parse(body).stats[0];
                    let matchupSplits;
                    if (matchupStats) matchupSplits = matchupStats.splits;

                    if (matchupSplits){
                        for (let j = 0; j < matchupSplits.length; j++){
                            matchups.push({
                                batter: batters[i].name,
                                pitcher: pitcher.name,
                                year: matchupSplits[j].season,
                                stats: matchupSplits[j].stat
                            });
                        }
                    }
                }
                else{
                    reject('Something went wrong while getting matchups.');
                }
            });
        }
    };
    console.log("split added");

    resolve(matchups);
});


const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Listening on port ${port}...`));
