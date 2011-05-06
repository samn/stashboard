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

import os

from google.appengine.ext.webapp import RequestHandler, template

from models import Event, Service, FeedData, Announcement
from utils.url import get_host
import config

class CustomRequestHandler(RequestHandler):
    def send_404(self, message):
        self.error(404)
        self.response.out.write(message)

    def send_xml(self, data):
        self.response.headers.add_header('Content-type', 'application/atom+xml')
        self.response.headers.add_header('charset', 'utf-8')
        self.response.out.write(data)

class ServicesEventsFeed(CustomRequestHandler):
    def get(self, service_slug = None, limit = 20):
        events = Event.all()

        if service_slug:
            service = Service.get_by_slug(service_slug)
            path = 'feed/services/%s/events' % (service_slug)
            url = '%s/%s' % (config.SITE['root_url'], path)

            if not service:
                self.send_404('Invalid service: %s' % (service_slug))
                return

            announcements = Announcement.get_active(service.region)
            events.filter('service = ', service)
        else:
            service = None
            path = 'feed/services/events'
            url = '%s/%s' % (config.SITE['root_url'], path)
            announcements = Announcement.get_active()

        events = events.order('-start').fetch(limit)

        items = [i.feed_data() for i in events + announcements]
        items.sort(key=lambda a: a.start)
        items.reverse()
        items = items[0:limit]

        if items:
            updated = items[0].start
        else:
            updated = None

        template_data = {'config': config, 'events': items, 'url': url, \
                         'host': get_host(url), 'path': path, 'updated': updated, \
                         'service': service, \
                         'events_count': limit}
        template_path = os.path.join(config.SITE['template_path'], 'atom', \
                                     'events.xml')
        template_rendered = template.render(template_path, template_data)
        self.send_xml(template_rendered)
