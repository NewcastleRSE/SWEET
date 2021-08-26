from .az_persitent import AzurePersitentDict
from ..secrets import connstr as az_connection

from . import recursiveUpdate

__structure = AzurePersitentDict(az_connection, "$web", "structure.json")
__content = AzurePersitentDict(az_connection, "$web", "content.json")
__resources = AzurePersitentDict(az_connection, "$web", "resources.json")

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
            struct = next(i for i in struct['pages'] if i['slug'] == slug)

    # need to return a copy of the information to avoid contaminating the underlying data
    output = { "title": struct['title'], "slug": struct['slug']}
    if 'prev' in struct:
        output['prev'] = struct['prev']
    if 'next' in struct:
        output['next'] = struct['next']
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
    if "title" in details or "prev" in details or "next" in details:
        struct = __structure
        slugs = details["path"][1:].split("/")
        for slug in slugs:
            if slug in struct:
                struct = struct[slug]
            else:
                struct = next(i for i in struct['pages'] if i['slug'] == slug)
        
        if "title" in details:
            struct['title'] = details['title']

        if "prev" in details:
            struct['prev'] = details['prev']

        if "next" in details:
            struct['next'] = details['next']

        __structure.commit()

def getResources():
    return __resources
        
def getResource(name):
    if name in __resources:
        r = __resources[name]
        output = { "name": name, "description": r['description']}

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
    input = { 'description': newres['description'], 'content-type': newres['content-type'], 'filename': newres['filename'] }
    if 'source' in newres:
        input['source'] = newres['source']

    if 'blob' in newres:
        input['blob'] = newres['blob']

    __resources[newres['name']] = input
    __resources.commit()
