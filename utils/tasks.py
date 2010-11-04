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
# The MIT License

from google.appengine.api.labs import taskqueue

import config

def add_hub_notification_task(service_name = None):
    if not config.PUBSUBHUBBUB:
        return

    if not config.PUBSUBHUBBUB_URL:
        raise Exception('To use PubSubHubBub, you need to set PUBSUBHUBBUB_URL'
                        ' variable in the config file')
    taskqueue.add(queue_name = 'hub-notifications', url = '/tasks/notify_hub', \
                  method = 'POST')

    if service_name:
        taskqueue.add(queue_name = 'hub-notifications', url = '/tasks/notify_hub', \
                      method = 'POST', params = { 'service': service_name })
