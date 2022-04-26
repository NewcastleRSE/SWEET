import random
from .az_persitent import AzurePersitentDict
from ..secrets import connstr as az_connection, datasource as az_content_cntr, structure, content, resources, goal_messages, profiler_responses

from . import recursiveUpdate

__structure = AzurePersitentDict(az_connection, az_content_cntr, structure)
__content = AzurePersitentDict(az_connection, az_content_cntr, content)
__resources = AzurePersitentDict(az_connection, az_content_cntr, resources)
__goalMessages = AzurePersitentDict(az_connection, az_content_cntr, goal_messages)
__profilerResponses = AzurePersitentDict(az_connection, az_content_cntr, profiler_responses)

# utilities for user-related content:
def getGoalResponses():
    return __goalMessages.copy()

def getProfilerResponses():
    return __profilerResponses.copy()

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
        k: { 'name': k, 'description': v['description'], 'caption': v.get("caption", ""), 'source': v['source'] if 'source' in v else 'none' }
        for k,v in __resources.items()
    }
        
def getResource(name):
    if name in __resources:
        r = __resources[name]
        output = { "name": name, "description": r['description'], "caption": r.get('caption', "")}

        if 'content-type' in r:
            output['content-type'] = r['content-type']
        else:
            if 'source' in r and r['source'].startswith("data:"):
                output['content-type'] = r['source'][5:r['source'].find(';')]
            else:
                return None

        if 'source' in r:
            output['source'] = r['source']
        else:
            output['source'] = "useblob"

        return output
    
    return None

def getResourceBlob(name):
    if name not in __resources:
        return None

    r = __resources[name]

    if 'blob' not in r:
        return None

    from io import BytesIO
    from base64 import b64decode

    f = BytesIO(b64decode(r['blob'].encode('utf8')))
    t = r['content-type']
    n = r['filename']

    return {'name': name, 'file': f, 'content-type': t, 'downloadName': n }

def saveResource(newres):
    name = newres['name']

    if name in __resources:
        del newres['name']
        __resources[name].update(newres)
        __resources.commit()
        return
    
    input = { 'description': newres['description'], 'content-type': newres['content-type'], 'filename': newres['filename'], 'caption': newres.get('caption', "") }
    if 'source' in newres:
        input['source'] = newres['source']

    if 'blob' in newres:
        input['blob'] = newres['blob']

    __resources[name] = input
    __resources.commit()

def getGoalMessage(goal, which):
    messages = getGoalResponses()

    msglist = messages[goal['goaltype']][goal['outcome']]
    message = msglist[which]
    index = 0 if which+1 == len(msglist) else which+1

    return message, index