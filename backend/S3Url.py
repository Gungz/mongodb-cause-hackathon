from urllib.parse import urlparse 
class S3Url(object): 
    # From: https://stackoverflow.com/questions/42641315/s3-urls-get-bucket-name-and-path
    def __init__(self, url): 
        self._parsed = urlparse(url, allow_fragments=False) 

    @property 
    def bucket(self): 
        return self._parsed.netloc 

    @property 
    def key(self): 
        if self._parsed.query: 
            return self._parsed.path.lstrip("/") + "?" + self._parsed.query 
        else: 
            return self._parsed.path.lstrip("/") 

    @property 
    def url(self): 
        return self._parsed.geturl()