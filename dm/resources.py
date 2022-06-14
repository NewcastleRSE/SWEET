from SWEET.data.az_persitent import AzurePersitentDict
from SWEET.secrets import connstr, datasource
from SWEET.data.content import saveResource


def transferLegacyResources(oldresfile):

    oldres = AzurePersitentDict(connstr, datasource, oldresfile)
    count = 0

    for k,v in oldres.items():
        newres = {
            "name": k,
            "description": v.get("description", ""),
            "caption": v.get("caption", ""),
            "content-type": v.get("content-type", ""),
            "filename": v.get("filename", "")
        }

        blob = v.get("blob", v.get("source", ""))

        if blob.startswith("data"):
            blob = blob[blob.find(",")+1:]

        newres["blob"] = blob

        saveResource(newres)
        count += 1

    print(f"Transferred {count} resources from '{oldresfile}' to new file structure")