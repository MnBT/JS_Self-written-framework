Profile.Controller.Avatar = function( list )
{
    var a, Self;

    Self =
    {
        event_obj: $( {} ),

        on: function( event, callback )
        {
            this.event_obj.bind( event, function()
            {
                callback.apply( this, arguments );
            });
        },

        trigger: function( event, data )
        {
            this.event_obj.trigger( event, data );
        },

        cacheObjects: function( list )
        {
            Self.nodes = a =
            {
                avatar_block:  list.find( ".avatar__block" ),
                avatar_cap:    list.find( ".avatar__cap" ).show(),
                preloader:     list.find( ".avatar__preloader" ),
                def_avatar:    null,

                container:     list,
                form:          list.find( ".avatar-func__form" ),
                iframe_block:  list.find( ".avatar-func__iframe-wrapper" ),
                upload_field:  list.find( ".avatar-func__image" ),
                iframename:    list.find( ".avatar-func__iframename" ),
                file_name:     null
            };
        },

        hidePreloader: function( status )
        {
            a.preloader.hide();
            a.upload_field.show();

            if ( status === "success" )
            {
                list.find( ".avatar__image_tmp" ).remove();
                a.avatar_cap.hide();
            }
            else
            {
                list.find( ".avatar__image" ).removeClass( "b-opacity" );
            }
        },

        showPreloader: function()
        {
            a.preloader.show();
            a.upload_field.hide();

            list.find( ".avatar__image" ).addClass( "b-opacity avatar__image_tmp" );
        },

        setIframeParams: function()
        {
            a.iframename.val( 1 );
        },
        
        createIframe: function()
        {
            var iframe = "";

            var iframe_data =
            {
                "src":    "'javascript:true'",
                "id":     "'avatar-func__iframe'",
                "name":   "'avatar-func__iframe'",
                "width":  "'0px'",
                "height": "'0px'"
            };

            for ( var i in iframe_data )
            {
                iframe += i + "=" + iframe_data[ i ] + " ";
            }

            return "<iframe " + iframe + "></iframe>";
        },

        reset: function()
        {
            a.form.trigger( "reset" );
            a.iframe_block.empty();
        },

        changeFormAction: function()
        {
            Model.is_local ?
                a.form.attr( "action", "upload/avatar" ) :
                a.form.attr( "action", "http://avatar." + Model.host + "/set" );
        },

        onLoadStart: function()
        {
            Self.setIframeParams();

            a.iframe_block.append( Self.createIframe() );

            a.iframe_block.find( "iframe" )[ 0 ].onload = function()
            {
                Self.onLoadAvatar();
            };

            a.form.trigger( "submit" );

            Self.trigger( "show_preloader" );
        },

        onImageChange: function()
        {
            a.upload_field.change( function( e )
            {
                a.file_name = a.upload_field.val();
                App.XKey.getXEditKey( Self.onLoadStart, Self.onLoadError );

                console.log( "Выбран для загрузки файл: %s", a.file_name );
            });
        },

        onLoadError: function( msg )
        {
            View.displayInnerNotice( App.TMPL.data.avatar[ msg ], "error" );
        },

        onLoadAvatar: function( iframe )
        {
            var json = $.cookies.get( "response" );
            json ? null : json = { result: "ERROR_NOT_LOAD" };

            Self.reset();

            if ( json.result === "RESULT_OK" )
            {
                this.trigger( "success_upload", json.data );
            }
            else
            {
                View.displayInnerNotice( "Загрузка аватара невозможна", "error" );

                this.trigger( "hide_preloader" );
            }

            Controller.clearCookiesFromResponse();
            App.XKey.clearXEditKey();

            console.log( "load avatar: ", json );
        }
    };

    Self.cacheObjects( list );
    Self.onImageChange();
    Self.changeFormAction();

    return Self;
};