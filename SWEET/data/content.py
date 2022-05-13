from .az_persitent import AzurePersitentDict
from ..secrets import connstr as az_connection, datasource as az_content_cntr, structure, content, resources, goal_messages, profiler_responses, email_messages

from . import recursiveUpdate, getContainer

__structure = AzurePersitentDict(az_connection, az_content_cntr, structure)
__content = AzurePersitentDict(az_connection, az_content_cntr, content)
__resources = AzurePersitentDict(az_connection, az_content_cntr, resources)
__goalMessages = AzurePersitentDict(az_connection, az_content_cntr, goal_messages)
__profilerResponses = AzurePersitentDict(az_connection, az_content_cntr, profiler_responses)
__emailMessages = AzurePersitentDict(az_connection, az_content_cntr, email_messages)

# utilities for user-related content:
def getGoalResponses():
    return __goalMessages.copy()

def getProfilerResponses():
    return __profilerResponses.copy()

def getEmailMessages():
    return __emailMessages.copy()

# content and structure
def getStructure():
    return __structure

def updateStructure(newStructure):
    recursiveUpdate(__structure, newStructure)
    __structure.commit()

def getPageDetails(path):
    struct = __structure

    for slug in path[1:].split("/"):
        if slug in struct:
            struct = struct[slug]
        else:
            try:
                struct = next(i for i in struct['pages'] if i['slug'] == slug)
            except StopIteration:
                return None

    # need to return a copy of the information to avoid contaminating the underlying data
    output = { "title": struct['title'], "slug": struct['slug']}

    if 'headerImage' in struct:
        output['headerImage'] = struct['headerImage']
    if 'pages' in struct:
        output['pages'] = [{"slug": p['slug'], 'title': p['title']} for p in struct['pages']]

    return output

def getPages():
    return __content

def getPageContents(path):
    return __content.get(path, "")

def updatePageContent(details):
    __content[details["path"]] = details["content"]
    __content.commit()

    #check for structure updates:
    if "title" in details or "headerImage" in details:
        struct = __structure
        slugs = details["path"][1:].split("/")
        for slug in slugs:
            if slug in struct:
                struct = struct[slug]
            else:
                struct = next(i for i in struct['pages'] if i['slug'] == slug)
        
        if "title" in details:
            struct['title'] = details['title']

        if "headerImage" in details:
            struct['headerImage'] = details['headerImage']

        __structure.commit()

def getResources():
    return { 
        k: getResource(k)
        for k in __resources
    }
        
def getResource(name):
    if name in __resources:
        r = __resources[name]
        output = { "name": name, "content-type": r['content-type'], "description": r['description'], "caption": r.get('caption', ""), "filename": r.get('filename', "")}

        if r['blobsize'] < 512*1024:
            blob = getResourceBlobString(name)
            output['source'] = f"data:{r['content-type']};base64,{blob}"
        
        return output
    
    return None

def getResourceBlobString(name):
    from base64 import b64encode
    return b64encode(loadResourceBlob(name)).decode()


def saveResource(newres):
    name = newres['name']
    input = { 
        'description': newres['description'], 
        'caption': newres['caption'], 
    }

    if name in __resources:
        if 'content-type' in newres or 'filename' in newres or 'blob' in newres:
            # only description and caption are editable for existing resources;
            # if we've been sent any other values it is an error.
            raise ValueError

        __resources[name].update(input)
        __resources.commit()
        return

    for field in ['content-type', 'filename', 'blob']:
        # for a new resource we require all fields to be present.
        if field not in newres:
            raise ValueError

    blob = newres['blob']

    input.update({'content-type': newres['content-type'], 'filename': newres['filename'], 'blobsize': len(blob)})
    
    __resources[name] = input
    __resources.commit()

    saveResourceBlob(name, blob)

def saveResourceBlob(name, blobstring):
    from base64 import b64decode
    cnt = getContainer(az_content_cntr)
    blobname = f"resourceblobs/{name}"
    cnt.upload_blob(blobname, b64decode(blobstring), overwrite=True)

def loadResourceBlob(name):
    if name not in __resources:
        return None

    cnt = getContainer(az_content_cntr)
    return cnt.download_blob(f"resourceblobs/{name}").readall()

def getGoalMessage(goal, which):
    messages = getGoalResponses()

    msglist = messages[goal['goaltype']][goal['outcome']]
    message = msglist[which]
    index = 0 if which+1 == len(msglist) else which+1

    return message, index