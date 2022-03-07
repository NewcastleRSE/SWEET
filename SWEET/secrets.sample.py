connstr = "<YOUR CONNECTION STRING>"
key = b"<APPLICATION SECRET KEY>"
fernetkey = b"<YOU MUST GENERATE THIS KEY WITH cryptography.fernet.Fernet.generate_key()>"
email = {
    "server": "<your providers smtp server>",
    "port": 587, # the port for smtp: usually 587 for smtp with tls encryption
    "user": "<your smtp username>",
    "password": "<your smtp password>",
    "from": "<the address for sending, usually in format: 'Full Name <email@address>' >",
    "notify": "<The address(es) to send user & system notifications to>"
}
firetext = {
    "endpoint": "https://www.firetext.co.uk/api/sendsms",
    "apikey": "<YOUR API KEY - obtain from your firetext account>"
}
admin_password = "<ADMIN USER PASSWORD>"
admin_email = "<ADMIN USER EMAIL>"
hostname = "<YOUR WEB SERVER HOSTNAME>"

datasource = "<YOUR SOURCE CONTAINER NAME>"
structure = "<YOUR STRUCTURE FILENAME/PATH>"
content = "<YOUR CONTENT FILENAME/PATH>"
resources = "<YOUR RESOURCES FILENAME/PATH>"
usersource = "<YOUR USERDATA CONTAINER NAME>"
userdatastore = "<DIRECTORY FOR USER-GENERATED DATA>"
usertable = "<YOUR USERDATA FILENAME/PATH>"
userlist = "<YOUR USER-EMAIL MAPPING FILENAME/PATH>"
userlog = "<YOUR USER VISIT LOG FILENAME/PATH>"
registration_list = "<YOUR USER REGISTRATION CODES FILENAME/PATH>"
usergoals = "<YOUR USER GOALS FILENAME/PATH>"
userdiary = "<YOUR USER DIARY FILENAME/PATH>"
admin_user = "<ADMIN USER ID>"
admin_fullName = "<ADMIN USER FULL NAME>"
admin_role = "<ADMIN USER SYSTEM ROLE>"


