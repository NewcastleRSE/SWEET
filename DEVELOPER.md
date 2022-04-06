# Developer Docs

## Architecture Diagram (Mark)

Mark - Figma

## Data Flow (Mark)

Mark - Figma

## Folder Structure

Root folder for the app is `SWEET` and is a Python package using `__init__.py` at the folder level which initializes the app. It has one route `/` which loads the home page.

### Blueprints

There are a number of blueprint files performing specific functions that group routes with similar functions

**admin.py**  
Content management and user management

**auth.py**  
Login, registration and password reset

**content.py**  
All the page content and resources

**myapp.py**  
Handles user data retrieval and storage

**schemas.py**  
Metadata for user data functionality - data types for form inputs

**secrets.py**  
sensitive runtime data. Sample file provides file structure but actual file is not to be pushed to repo.

### Automation

Python package

**email.py**  
Helper functions for sending emails via Google. Uses keys from `secrets.py`. Email templates are in this file.

**scheduling**  
Retrieves a schedule for every reminder due today and triggers the emails and texts to go out. Possible to stop scheduling via admin UI.

**sms**  
Pass responsibility of sms reminders to firetext via helper functions. Uses keys from `secrets.py`

### Data

Python package. Init file ensure all Azure containers and files are setup correctly, handles encryption/decryption and get token. Tokens are used for password resets, auth and session storage.

**az_persistent.py**  
Handles the persistence of user data back to Azure storage

**content.py**  
CRUD operations on all content, backed by Azure storage.

**userdata.py**  
Handles all CRUD for all user entered data.

**users.py**  
Handles all CRUD to user account - userID, passwords, contact details etc.

### Static

#### CSS

Modularized css files to style different page elements.

#### Icons

Icons for use on ???

#### Images

Images for site wide stuff like header logos

#### Scripts

**admin.js**  
Holds all the rendering logic for the admin section

**app.js**  
Base factory function for creating the app. Provides functionality for rendering, app storage and events

**customfont.js**  
Script for changing the font size 

**SWEET.js**  
Uses app.js to create and customize the app and listens to events.

##### Editors (Jim)
Contains scripts for custom elements for the CMS. These allow admins to create and edit content. 

**editors.js**  
Export file to group all the editor files together

**SWEET-editor.js**  
Uses app.js to create custom app for live preview tool.

##### Extensions

Contains helper functions imported by SWEET.js.

**calendar.js**  
Renders calendar component as a reusable component

**modal.js**  
Generic modal component for use across the app

##### Libraries

**lz-string.js**  
(Compression algorithm)[https://github.com/pieroxy/lz-string] to compress and decompress content from the CMS.

**sentry.bundle.js** 
Library for sending errors and stack traces to Sentry.

##### Renderers (Jim)
Contains scripts for custom elements to be rendered on relevant pages. 

**renders.js** 
Export file to group all the renderer files together

### Templates

**admin**  
Template for entire admin area, sections rendered via JS  

**index**  
Main template for site. Other templates inherit from it and can overwrite sections. See examples from `admin.html`

**login**  
Template for login and register forms

**pages**  
Content management system, accessible only to admins. Could do with refactor but very low priority.

**preview**  
Content management system component for live previews

**printdiary**  
Print view of the diary entries. Jinja template to enable print to PDF

**resetpwd**  
Form for resetting the user password

## Key Principles (Jim)

Schema descriptions of key data items

### Goals
### Thoughts
### Side-Effects
### Reminders
### Plans

## Deployment (Mark)

### Terraform (Mark)

### GitHub Workflows (Mark)

## Third-Party Connections

### Firetext

(API documentation)[https://www.firetext.co.uk/docs#sendingsms]

Requests for originate `automation\sms.py`

### Google Inbox

Uses (SMTPlib)[https://docs.python.org/3/library/smtplib.html]

Requests for originate `automation\email.py`

Google requires higher levels of auth to confirm the account can send emails. Team Google Account is setup with a 16 character app password and MFA to meet the requirements needed by Google.

### Sentry (Mark)

### PowerBI (Mark)
