#RPG World Builder

This is a Single Page Web Application using 
* React
* Node.js
* Express
* Mongodb

It provides a form with questions, options, hints to help users create 
campaigns for traditional paper-and-pencil-and-dice roleplaying games. 
And users can see and clone other people's campaigns.

A campaign is like the premise of a TV series, or a story arc within a
long-running series. And individual adventures are like episodes.

The goal is to help users create campaigns in which:
   1. It's easy to write lots of adventures.
   2. Play flows well because the players have a clear direction.
   2. People have fun because they have lots of action and Cool Stuff.

The code is really a general-purpose system to allow users to create, read,
update, delete, and copy sets of form data. Everything that relates 
to RPG campaigns is in def.json.

The main page is rpgworldbuilder.html.

index.html is introductory text for the user.

To set up and run:
1. npm install
2. npm run build
3. Start you mongodb server
4. Create a database, mine is called rpgworldbuilder
5. Store a database url in an environment variable called RPGWORLDBUILDER_DB.
6. In the server directory execute: node server.js
7. Point a browser at port 3000
8. The port can be changed in server/server.js
