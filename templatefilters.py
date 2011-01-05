from datetime import timedelta
from google.appengine.ext import webapp

register = webapp.template.create_template_register()

@register.filter
def delta(value, arg):
    """ returns the date arg days from value """
    return value + timedelta(days=arg)
