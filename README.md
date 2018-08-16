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

Dev Setup:
1. Install mongodb
2. Create "rpgworldbuilder" database
3. npm install
4. npm run build
5. Start you mongodb server
6. Create a database, mine is called rpgworldbuilder
7. Store a database url in an environment variable called RPGWORLDBUILDER_DB.
8. In the server directory execute: node server.js
9. Point a browser at port 3000
10. The port can be changed in server/server.js

Production: HTTPS with Nginx on an Ubuntu 16 AWS EC2
1. Open port 80 and 433 on EC2
2. Point your domain name at the EC2
3. Install mongodb
4.  sudo service mongod start
5. Create "rpgworldbuilder" database
6. Create a user "rpgworldbuilder" with access to the rpgworldbuilder database
     mongo
     use rpgworldbuilder;
     db.createUser({user:"rpgworldbuilder", pwd:"*****", roles:["readWrite"]}); 
6. Store a database url in an environment variable called RPGWORLDBUILDER_DB
       mongodb://rpgworldbuilder:********@127.0.0.1:27017/rpgworldbuilder
7. Install node 6.x (+?)
8. If "node" doesn't exist:  sudo ln -s /usr/bin/nodejs /usr/bin/node
9. Install Nginx
10. Configure Nginx to serve from /data/www (or any other dir)
11. Put a temporary index.html in /data/www (or the other dir)
12. Confirm http access
13. Follow instructions at https://letsencrypt.org/ for Nginx and Ubuntu 16
14. Confirm https access
15. Upload project files to server .../rpgworldbuilder?
16. npm install
17. npm install forever
18. From ../server, 
      forever start server.js  (Stop with: forever stop server.js)
19.   curl http://localhost:3000 to check if the node part is running
20. Reconfigure Nginx to point https to port 3000 and test
        location / {
             proxy_pass http://127.0.0.1:3000;
        }
