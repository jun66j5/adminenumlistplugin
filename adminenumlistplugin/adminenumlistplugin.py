# -*- coding: utf-8 -*-
#
# Copyright (C) 2009 Stepan Riha <trac@nonplus.net>
# Copyright (C) 2012 Ryan J Ollos <ryan.j.ollos@gmail.com>
# Copyright (C) 2012 Jun Omae <jun66j5@gmail.com>
# All rights reserved.
#
# This software is licensed as described in the file COPYING, which
# you should have received as part of this distribution..
#

from genshi.builder import tag
from genshi.filters import Transformer
from trac.config import BoolOption
from trac.core import Component, implements
from trac.util.compat import any
from trac.web.api import IRequestFilter, ITemplateStreamFilter
from trac.web.chrome import Chrome, ITemplateProvider, add_script


class AdminEnumListPlugin(Component):

    implements(IRequestFilter, ITemplateProvider, ITemplateStreamFilter)

    hide_selects = BoolOption('adminenumlist', 'hide_selects', 'false',
        "Hide the 'Order' column of select elements.")

    _panels = ('priority', 'resolution', 'severity', 'type')
    _has_add_jquery_ui = hasattr(Chrome, 'add_jquery_ui')

    ### methods for IRequestFilter
    
    def pre_process_request(self, req, handler):
        return handler

    def post_process_request(self, req, template, data, content_type):
        path_info = req.path_info
        if any(path_info.startswith(panel, len('/admin/ticket/'))
               for panel in self._panels):
            add_script(req, 'adminenumlistplugin/adminenumlist.js')
            if not self._has_add_jquery_ui:
                add_script(req, 'adminenumlistplugin/jquery-ui-custom.js')
            else:
                Chrome(self.env).add_jquery_ui(req)

        return template, data, content_type

    ### methods for ITemplateStreamFilter

    def filter_stream(self, req, method, filename, stream, data):
        if filename == 'admin_enums.html':
            text = 'var hide_selects = %s' % ('false', 'true')[bool(self.hide_selects)]
            stream |= Transformer('//head').append(tag.script(text, type='text/javascript'))

        return stream

    ### methods for ITemplateProvider

    def get_htdocs_dirs(self):
        from pkg_resources import resource_filename
        return [('adminenumlistplugin', resource_filename(__name__, 'htdocs'))]

    def get_templates_dirs(self):
        return []
