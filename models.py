# Copyright (c) 2010 Twilio Inc.
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

from google.appengine.ext import db
import datetime
from wsgiref.handlers import format_date_time
from time import mktime
from datetime import timedelta
from datetime import date
from utils import slugify
import config
import urlparse

class Level(object):
    """
    A fake db.Model object, just in case we want to actually store things
    in the future
    """
    levels = {
        "NORMAL": 10,
        "WARNING": 30,
        "ERROR": 40,
        "CRITICAL": 50,
    }
    
    normal  = "NORMAL"
    warning = "WARNING"
    critial = "CRITICAL"
    error   = "ERROR"
    
    @staticmethod
    def all():
        llist = []
        for k in Level.levels.keys():
            llist.append((k, Level.levels[k]))
        
        return map(lambda x: x[0], sorted(llist, key=lambda x: x[1]))
        
    @staticmethod
    def get_severity(level):
        try:
            return Level.levels[level]
        except:
            return False
            
    @staticmethod
    def get_level(severity):
        for k in Level.levels.keys():
            if Level.levels[k] == severity:
                return k
        return False
     

class Region(db.Model):
    """ Represents the physical location of a Service """
    name = db.StringProperty(required=True)
    # the order of this region in the region tabbar
    # an index of 3142 indicates that the region has not been
    # given an explicit order, and will be shown at the end of the list
    index = db.IntegerProperty(required=True, default=3142)

    @staticmethod
    def all_regions():
        """ Return a list of all regions ordered by index """
        regions = []
        for region in Region.all().order("index").fetch(100):
            regions.append({"name": str(region.name)})
        return regions

    @staticmethod
    def get_by_name(name):
        return Region.all().filter('name = ', name).get()

class Service(db.Model):
    """A service to track

        Properties:
        name        -- string: The name of this service
        description -- string: The function of the service
        slug        -- string: URL friendly version of the name
        region      -- region: The region that the service is located in

    """
    @staticmethod
    def get_by_slug(service_slug):
        return Service.all().filter('slug = ', service_slug).get()
        
    def current_event(self):
        event = self.events.order('-start').get()
        return event

    def events_for_days(self, start, end):
        """ Return a list of the events that occurred
            between start and end (inclusive)
            Assumes start < end """
        lowest = Status.default()
        severity = lowest.severity
        
        events = self.events.filter('start >=', start) \
            .filter('start <=', end).fetch(100)
        
        stats = {}
        
        for i in range(end.toordinal() - start.toordinal()):
            stats[start.toordinal()] = {
                "image": lowest.image,
                "day": start,
            }
            start = start + timedelta(days=1)
       
        for event in events:
            if event.status.severity > severity:
                key = event.start.toordinal()
                stats[key]["image"] = "information"
                stats[key]["information"] = True

        results = []

        keys = stats.keys()
        keys.sort()
        keys.reverse()

        for k in keys:
            results.append(stats[k])
            
        return results
        
        
    def events_for_day(self, day):
        """ Return the largest severity (of events) for a given day. If no 
        events occured, return the lowest severity rating.
        
        Arguments: 
        day         -- Date object: The day to summarize
        
        """
        
        next_day = day + timedelta(days=1)
        
        return self.events.filter('start >=', day) \
            .filter('start <', next_day).fetch(40)
            
    def compare(self, other_status):
        return 0
    
    slug = db.StringProperty(required=True)
    name = db.StringProperty(required=True)
    description = db.StringProperty(required=True)
    region = db.ReferenceProperty(Region, required=False)
    
    def sid(self):
        return str(self.key())
        
    def resource_url(self):
        return "/services/" + self.slug
        
    def rest(self, base_url):
        """ Return a Python object representing this model"""

        m = {}
        m["name"] = str(self.name)
        m["id"] = str(self.slug)
        m["description"] = str(self.description)
        if self.region:
            m["region"] = str(self.region.name)
        m["url"] = base_url + self.resource_url()
        
        event = self.current_event()
        if event:
            m["current-event"] = event.rest(base_url)
        else:
            m["current-event"] = None

        return m

    @staticmethod
    def slugify(name, region=''):
        return slugify.slugify(region +'-' + name)

class Status(db.Model):
    """A possible system status

        Properties:
        name        -- string: The friendly name of this status
        slug        -- stirng: The identifier for the status
        description -- string: The state this status represents
        image       -- string: Image in /images/status
        severity    -- int: The serverity of this status

    """
    @staticmethod
    def get_by_slug(status_slug):
        return Status.all().filter('slug = ', status_slug).get()
        
    @staticmethod
    def default():
        """
        Return the first status with a NORMAL level.
        """
        normal = Level.get_severity(Level.normal)
        return Status.all().filter('severity == ', normal).get()

    @staticmethod
    def install_defaults():
        """
        Install the default statuses. I am not sure where these should live just yet
        """
        # This should be Level.normal.severity and Level.normal.text
        normal = Level.get_severity(Level.normal)
        warning = Level.get_severity(Level.warning)
        error = Level.get_severity(Level.error)

        d = Status(name="Down", slug="down", image="cross-circle", severity=error, \
                       description="The service is currently down")
        u = Status(name="Up", slug="up", image="tick-circle", severity=normal, \
                       description="The service is up")
        w = Status(name="Warning", slug="warning", image="exclamation", severity=warning, \
                       description="The service is experiencing intermittent problems")

        d.put()
        u.put()
        w.put()

        s = Setting(name="installed_defaults")
        s.put()
        
        
    name = db.StringProperty(required=True)
    slug = db.StringProperty(required=True)
    description = db.StringProperty(required=True)
    image = db.StringProperty(required=True)
    severity = db.IntegerProperty(required=True)
    
    def image_url(self):
        return "/images/status/" + unicode(self.image) + ".png"
        
    def resource_url(self):
        return "/statuses/" + str(self.slug)
        
    def rest(self, base_url):
        """ Return a Python object representing this model"""

        m = {}
        m["name"] = str(self.name)
        m["id"] = str(self.slug)
        m["description"] = str(self.description)
        m["level"] = Level.get_level(int(self.severity))
        m["url"] = base_url + self.resource_url()
        # This link shouldn't be hardcoded
        
        o = urlparse.urlparse(base_url)
        m["image"] = o.scheme + "://" +  o.netloc + self.image_url()
        
        return m
    

class Event(db.Model):

    start = db.DateTimeProperty(required=True, auto_now_add=True)

    # We want this to be required, but it would break all current installs
    # Instead, we handle it in the rest method
    informational = db.BooleanProperty(default=False)

    status = db.ReferenceProperty(Status, required=True)
    message = db.TextProperty(required=True)
    service = db.ReferenceProperty(Service, required=True, 
        collection_name="events")
        
    def duration(self):
        # calculate the difference between start and end
        # should evantually be stored
        pass
        
    def sid(self):
        return str(self.key())
        
    def resource_url(self):
        return self.service.resource_url() + "/events/" + self.sid()
    
    def rest(self, base_url):
        """ Return a Python object representing this model"""
        
        m = {}
        m["sid"] = self.sid()

        stamp = mktime(self.start.timetuple())
        m["timestamp"] = format_date_time(stamp)
        m["status"] = self.status.rest(base_url)
        m["message"] = str(self.message)
        m["url"] = base_url + self.resource_url()

        if self.informational:
            m["informational"] = self.informational
        else:
            m["informational"] = False
        
        return m
        
class Profile(db.Model):
    owner = db.UserProperty(required=True)
    token = db.StringProperty(required=True)
    secret = db.StringProperty(required=True)

class AuthRequest(db.Model):
    owner = db.UserProperty(required=True)
    request_secret = db.StringProperty()

class Setting(db.Model):
    name = db.StringProperty(required=True)

class Announcement(db.Model):
    """An announcement on the front page of the site,
        a general status field.
       
       Messages can be restricted to a specific region
         or displayed for all.

        Properties:
        message        -- text: The message to display
        active         -- boolean: If False the message won't be displayed
        last_updated  -- datetime: The last modified date
        region         -- region: The region that the message is located in
                                    if none the message will be displayed 
                                    for all regions.
    """
    message = db.TextProperty(required=True)
    active = db.BooleanProperty(required=False, default=True)
    last_updated = db.DateTimeProperty(required=True, auto_now=True)
    region = db.ReferenceProperty(Region, required=False, default=None)

    @staticmethod
    def get_active(region=None):
        """ Return all announcements that should be displayed, with the most
            recent first.  Filters by region is specified (but still includes
            global announcements), if not retrieves only global announcements.
            Returns a list of dictionary repersentations of announcements.
        """
        q = Announcement.all()
        q.order("-last_updated")
        q.filter('active = ', True)
        q.filter('region IN ', (None, region))
        
        return [announcement.to_json() for announcement in q.fetch(100)]

    def to_json(self):
        """ Return a dictionary representation of this object
                (that can be serialized in json). 
        """
        d = {}
        d['message'] = str(self.message)
        d['key'] = str(self.key())
        d['last_updated'] = self.last_updated.strftime('%m/%d/%Y')
        if self.region:
            d['region'] = str(self.region.name)

        return d
