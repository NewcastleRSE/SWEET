import json
from os import path, makedirs

class PersistentDict(dict):

    def __init__(self, filepath, filename):
        super().__init__()
        # ensure target directory is created:
        makedirs(filepath, exist_ok=True)

        self.filepath = path.join(filepath, filename)

        # if the file already exists load the data.
        self.reload()

    def commit(self):
        with open(self.filepath, 'w') as f:
            json.dump(self, f)

    def reload(self):
        with open(self.filepath) as f:
            self.clear()
            self.update(json.load(f))
