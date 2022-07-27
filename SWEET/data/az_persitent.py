from azure.storage.blob import BlobClient
from datetime import date, datetime
import json

class AzurePersitentDict(dict):

    def __init__(self, connection, container, blobname):
        super().__init__()
        self.client = BlobClient.from_connection_string(connection, container, blobname)
        self.reload()

    def commit(self):
        self.client.upload_blob(json.dumps(self), overwrite=True)

    def reload(self):
        self.clear()
        if self.client.exists():
            self.update(json.loads(self.client.download_blob().readall()))

class AzurePersistentList(list):
    
    def __init__(self, connection, container, blobname):
        super().__init__()
        self.client = BlobClient.from_connection_string(connection, container, blobname)
        self.reload()

    def commit(self):
        self.client.upload_blob(json.dumps(self), overwrite=True)

    def reload(self):
        self.clear()
        if self.client.exists():
            self.extend(json.loads(self.client.download_blob().readall()))

class AzurePersistentString():

    def __init__(self, connection, container, blobname):
        self.client = BlobClient.from_connection_string(connection, container, blobname)
        self.reload()

    def reload(self):
        if self.client.exists():
            self.client.download_blob().readall()

def getInitDate(connection, container, blobname):
    client = BlobClient.from_connection_string(connection, container, blobname)
    strDate = client.download_blob().readall().decode('utf-8')
    return datetime.strptime(strDate, '%Y-%m-%d').date()
