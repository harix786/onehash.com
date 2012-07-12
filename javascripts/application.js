jQuery(function() {
    EVENTS = [
        'loadstart', 
        'loadedmetadata', 
        'loadeddata',
        'loadedalldata',
        'play',
        'pause',
        'timeupdate',
        'ended',
        'durationchange',
        'progress',
        'resize',
        'volumechange',
        'error',
        'fullscreenchange'
    ];

    ERROR_CODES = {
        1: 'MEDIA_ERR_ABORTED',
        2: 'MEDIA_ERR_NETWORK',
        3: 'MEDIA_ERR_DECODE',
        4: 'MEDIA_ERR_SRC_NOT_SUPPORTED'
    };

    SUPPORTED_EXTENSIONS = [
         'mp4', 'avi', 'mkv'
    ];

    STATUS_MESSAGES = {
        'plugin:plugin_installed': 'plugin installed',
        'plugin:plugin_running': 'plugin running',
        'plugin:client_installed': 'client installed',
        'pairing:attempt': 'checking client port',
        //'pairing:check_version': 'checking client version',
        'plugin:client_running': 'client running',
        'pairing:attempt': 'pairing attempt',
        'pairing:found': 'pairing found',
        'client:connected': 'client connecting',
        'client:disconnected': 'client disconnected',
        'sync': 'client connected',
        'client:error': 'error',
    };

    var FileView = Backbone.View.extend({
        initialize: function() {
            this.template = _.template($('#video_template').html());
            this.model.on('destroy', this.destroy, this);
        },
        destroy: function() {
            var player = _V_(this.id);
            this.unbindPlayerEvents(player);
            this.remove();
        },
        render: function() {
            this.id = 'video' + Math.floor(Math.random() * 1024);
            this.$el.html(this.template({
                name: this.model.get('name'),
                id: this.id
            }));
            _.defer(_.bind(this.ready, this));
            return this;
        },
        ready: function() {
            var player = _V_(this.id);
            player.ready(_.bind(function() {
                this.bindPlayerEvents(player);
                player.src(this.model.get('streaming_url'));
            }, this));
        },
        onPlayerEvent: function(event, data) {
            console.log(event, data);
            if(event === 'error') {
                console.log('error: ' + ERROR_CODES[data.originalEvent.currentTarget.error.code]);
                console.log('cannot play ' + this.model.get('name'));
                this.destroy();
            }
        },
        bindPlayerEvents: function(player) {
            _.each(EVENTS, function(event) {
                //player.addEvent(event, _.bind(this.onPlayerEvent, this, event));
            }, this);

            var video = this.$el.find('video')[0];
            video.addEventListener("readystatechange", function(evt) { console.log('readystatechange'); } );
            video.addEventListener("stalled", function(evt) { console.log("stalled",evt); } );
            video.addEventListener("durationchange", function(evt) { console.log('durationchange',evt); } );
            video.addEventListener("loadstart", function(evt) { console.log("load start",evt); } );
            video.addEventListener("abort", function(evt) { console.log("abort",evt); } );
            video.addEventListener("loadedmetadata", function(evt) { console.log("got metadata",evt); } );
            video.addEventListener("error", function(evt) { 
                console.log("got error", evt); 
                console.log('video state: ',video.readyState); 
            } );
            video.addEventListener("canplay", function(evt) { console.log('canplay',evt); } );
            video.addEventListener("progress", function(evt) { console.log("progress"); } );
            video.addEventListener("seek", function(evt) { console.log('seek',evt); } );
            video.addEventListener("seeked", function(evt) { console.log('seeked',evt); } );
            video.addEventListener("ended", function(evt) { console.log('ended',evt); } );
            //video.addEventListener("timeupdate", function(evt) { console.log('timeupdate',evt); } );
            video.addEventListener("pause", function(evt) { console.log('pause',evt); } );
            video.addEventListener("play", function(evt) { console.log('play',evt); } );
            video.addEventListener("suspend", function(evt) { console.log('suspend event',evt); });
        },
        unbindPlayerEvents: function(player) {
             _.each(EVENTS, function(event) {
                player.removeEvent(event, _.bind(this.onPlayerEvent, this, event));
            }, this);
        }
    });

    var InputView = Backbone.View.extend({
        initialize: function() {
            this.template = _.template($('#input_template').html());
        },
        render: function() {
            this.$el.html(this.template({
            }));
            this.$el.find('form').submit(_.bind(function(event) {
                 window.location = '#' + this.$el.find('input').val();
            }, this));
            return this;
        }
    });

    var StatusView = Backbone.View.extend({
        initialize: function() {
            this.status = 'uninitialized';
            this.model.on('all', this.update, this);
        },
        update: function(e) {
            console.log(e);
            if(e in STATUS_MESSAGES) {
                this.status = STATUS_MESSAGES[e];
                this.render();
            }
        },
        render: function() {
            $('.toolbox').text(this.status);
            return this;
        }
    });

    var link = window.location.hash.substring(1);
    console.log('link: ' + link);
    if(link) {
        window.btapp = new Btapp();

        var status = new StatusView({model: btapp});

        btapp.connect({});

        btapp.live('torrent * file * properties', function(properties, file, file_list, torrent, torrent_list) {
            console.log('uri: ' + torrent.get('properties').get('uri'));
            if(torrent.get('properties').get('uri') === link) {
                var name = properties.get('name');
                console.log('file in the correct torrent: ' + name);
                if(_.include(SUPPORTED_EXTENSIONS, name.substr(name.length - 3))) {
                    var view = new FileView({model: properties});
                    $('body > .container').append(view.render().el);
                }
            }
        });

        btapp.on('add:add', function(add) {
            console.log('adding: ' + link);
            add.torrent(link);
        });
    } else {
        var input = new InputView();
        $('body > .container').append(input.render().el);
    }
});