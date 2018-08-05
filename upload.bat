REM -r in main dir would include node_modules, which would be bad.
pscp -i C:\AWS\rpgworldbuilder\keys\rpgworldbuilder.ppk * ec2-user@ec2-54-185-30-11.us-west-2.compute.amazonaws.com:/home/ec2-user/rpgworldbuilder
pscp -r -i C:\AWS\rpgworldbuilder\keys\rpgworldbuilder.ppk server ec2-user@ec2-54-185-30-11.us-west-2.compute.amazonaws.com:/home/ec2-user/rpgworldbuilder