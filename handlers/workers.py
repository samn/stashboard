# The MIT License
#
# Copyright (c) 2008 William T. Katz
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to
# deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
# DEALINGS IN THE SOFTWARE.

from google.appengine.api import urlfetch
import urllib

from google.appengine.api.labs import taskqueue
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

import config

from utils import slugify

class HubNotificationWorker(webapp.RequestHandler):
    def post(self):
        service_name = self.request.get('service')
        self.notify_hub(service_name = service_name)

    def notify_hub(self, service_name = None):
        if service_name:
            service_slug = slugify.slugify(service_name)
            url = '%s/feed/services/%s/events' % (config.SITE['root_url'], \
                                                   service_slug)
        else:
            url = '%s/feed/services/events' % (config.SITE['root_url'])

        data = urllib.urlencode({
                'hub.url': url,
                'hub.mode': 'publish'
                })

        response = urlfetch.fetch(url = config.PUBSUBHUBBUB_URL, payload = data,
                                  method = urlfetch.POST, deadline = 8)

        if not (200 <= response.status_code <= 299):
            raise Exception('Notifying hub about update failed')

def main():
    run_wsgi_app(webapp.WSGIApplication([
        ('/tasks/notify_hub', HubNotificationWorker),
    ]))

if __name__ == '__main__':
    main()
