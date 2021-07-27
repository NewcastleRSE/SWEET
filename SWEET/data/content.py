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

    return struct

def getPages():
    return __content

def getPageContents(path):
    return __content.get(path, "")

def updatePageContent(details):
    __content[details["path"]] = details["content"]
    __content.commit()

    if "title" in details:
        struct = __structure
        slugs = details["path"][1:].split("/")
        for slug in slugs:
            if slug in struct:
                struct = struct[slug]
            else:
                struct = next(i for i in struct['pages'] if i['slug'] == slug)
        
        struct['title'] = details['title']

        __structure.commit()

def getResources():
    return __resources
        
def getResource(name):
    if name in __resources:
        return { "name": name, "source": __resources[name]['source'], "description": __resources[name]['description']}
    
    return None

def saveResource(newres):
    __resources[newres['name']] = { 'source': newres['source'], 'description': newres['description']}
    __resources.commit()


