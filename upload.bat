REM -r in main dir would include node_modules, which would be bad.
pscp -i C:\AWS\rpgworldbuilder\keys\rpgworldbuilder.ppk * ubuntu@fritzpassow.com:/home/ubuntu/rpgworldbuilder
pscp -r -i C:\AWS\rpgworldbuilder\keys\rpgworldbuilder.ppk server ubuntu@fritzpassow.com:/home/ubuntu/rpgworldbuilder