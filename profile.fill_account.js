Profile.Controller.FillAccount = function()
{
    var THelper = Controller.ProfileHelper, a = {}, Self = {}, Events = {};
    var That = { View: {}, Events: {}, Controller: {}, Model: {} };

    Events =
    {
        onSendFinalRequest: function()
        {
            a.context.delegate( ".profile__send", "click", function()
            {
                Self.sendFinalRequest();
                return false;
            });
        },

        onTabChange: function()
        {
            a.context.delegate( ".profile_sheet_right UL LI", "click", function( e )
            {
                Self.changeTab( $( this ) );
            });
        },

        onPasswordKeyup: function()
        {
            a.context.delegate( "input[ name='password' ]", "keyup", function()
            {
                Self.validatePassword();
            });
        },

        onRepeatPasswordKeyup: function()
        {
            a.context.delegate( "input[ name='re_password' ]", "keyup", function()
            {
                Self.validateRepeatPassword();
            });
        }
    };

    Self =
    {
        cacheObjects: function()
        {
            $("#profile_tmpl").tmpl().prependTo('body');
            var context = $( ".profile-content").hide();
            a =
            {
                context:          context,
                send_btn:         context.find( ".profile__send" ),
                active_section:   context.find( ".profile_section" ).eq( 0 ).show(),
                active_tab:       context.find( "UL LI:first" ).addClass( "act" ),
                tabs:             context.find( ".profile_sheet_right UL LI" ),
                sections:         context.find( ".profile_section" ),
                pwd_field:        context.find( "input[ name='password' ]" ),
                pwd_repeat_field: context.find( "input[ name='re_password' ]" ),
                pwd_security:     context.find( "#pass-security" ),
                upload_field:     context.find( ".avatar-func__image" ),
                index:            0,
                steps:            [ 0, 0, 0, 0, 0, 0, 0, 0 ],
                request:          {},
                prev_tab:         [ 0 ]
            };
        },

        blockSearch: function()
        {
            //App.Search.block();
        },

        openWidget: function()
        {
            App.Widget.open( a.context );
        },

        validateRepeatPassword: function()
        {
            var pwd_value = a.pwd_field.val();

            a.pwd_repeat_field.val() !== pwd_value ?
                a.pwd_repeat_field.addClass( "b-border_red" ) :
                a.pwd_repeat_field.removeClass( "b-border_red" );
        },
        
        validatePassword: function()
        {
            var
                protection = App.TMPL.data.protection_level,
                pwd_length = a.pwd_field.val().length;

            if ( a.pwd_security.is( ":hidden" ) )
            {
                a.pwd_security.show();
            }

            pwd_length < 6 ?
                a.pwd_field.addClass( "b-border_red" ) :
                a.pwd_field.removeClass( "b-border_red" );

            a.pwd_repeat_field.trigger( "keyup" );

            if ( pwd_length <= 5 )
            {
                a.pwd_security.attr( "class", "pass-low-security" );
                a.pwd_security.text( protection.bad );
            }
            else if ( pwd_length <= 9 )
            {
                a.pwd_security.attr( "class", "pass-middle-security" );
                a.pwd_security.text( protection.middle );
            }
            else if ( pwd_length >= 10 )
            {
                a.pwd_security.attr( "class", "pass-high-security" );
                a.pwd_security.text( protection.high );
            }     
        },
        
        changeTab: function( item )
        {
            a.index = a.tabs.index( item.get( 0 ) );

            if ( Model.session_id === null )
            {
                a.clicked = item;
                Self.validateStep1( false );
                return false;
            }

            if ( a.prev_tab[ a.prev_tab.length - 1 ] === 1 && a.index !== 1 && !a.steps[ 1 ] &&
                 THelper.getDataForStep2( a.context ).result !== "SUCCESS_SKIP_TAB" )
            {
                a.clicked = item;
                Self.validateStep2();
                return false;
            }

            Self.showProfileTab( item );      
        },

        sendFinalRequest: function()
        {
            if ( a.index === 1 && !a.steps[ a.index ] &&
                 THelper.getDataForStep2( a.context ).result !== "SUCCESS_SKIP_TAB" )
            {
                a.clicked = a.send_btn;
                Self.validateStep2();
                return false;
            }

            if ( Model.session_id )
            {
                Self.showAuthForm();
                return false;
            }

            Self.validateStep1( true );
        },

        validateStep1: function( auth )
        {
            if ( !Model.checkRequest( "fill_account" ) ) { return false; }
    
            a.request.step1 = THelper.getDataForStep1( a.context );
    
            if ( a.request.step1.result !== "RESULT_OK" )
            {
                return false;
            }

            this.sendFirstStepRequest( auth );

            return true;
        },

        sendFirstStepRequest: function( auth )
        {
            Model.getRequest( a.request.step1.data, "fill_account", function( json )
            {
                if ( json.result === "RESULT_OK" )
                {
                    Model.session_id = json.session_id;
                    Model.username   = a.request.step1.data.username;
                    App.XKey = App.Source.XKey();
                    Self.buildAvatar();
                    a.steps[ 0 ] = true;

                    if ( auth )
                    {
                        Self.showAuthForm();
                    }
                    else
                    {
                        View.showServerAnswer( "success", App.TMPL.data.fill_account[ json.result ], ".toEnterReport" );
                        Self.showProfileTab( a.clicked );
                    }
                }
                else
                {
                    View.showServerAnswer( "error", App.TMPL.data.fill_account[ json.result ], ".toEnterReport" );
                }
            });
        },

        validateStep2: function()
        {
            if ( !Model.checkRequest( "fill_account_profile" ) ) { return false; }
    
            a.request.step2 = THelper.getDataForStep2( a.context );
    
            if ( a.request.step2.result !== "RESULT_OK" )
            {
                return false;
            }

            this.sendSecondStepRequest();

            return true;
        },

        sendSecondStepRequest: function()
        {
            Model.getRequest( a.request.step2.data, "fill_account_profile" , function( json )
            {
                if ( json.result === "RESULT_OK" )
                {
                    a.steps[ 1 ] = true;
                    Self.showProfileTab( a.clicked );
                    View.showServerAnswer( "success", App.TMPL.data.fill_account_profile[ json.result ], ".toLiveReport" );
                }
                else
                {
                    View.showServerAnswer( "error", App.TMPL.data.fill_account_profile[ json.result ], ".toLiveReport" );
                }
            });
        },

        showAuthForm: function()
        {
            a.context.hide();
            $( ".sing" ).show();
            $( ".dicon-context" ).show();
    
            Controller.setSessionIdToCookies( Model.session_id, 720 );
            Controller.setDisplayNameToCookies( Model.username, 720 );
            Controller.Auth.validate( Model.username );
            //App.Search.unblock();
        },
        
        hideAuthForm: function()
        {
            $( ".sign" ).hide();     
        },

        showProfileTab: function( tab )
        {
            if ( tab.get( 0 ) === a.send_btn.get( 0 ) )
            {
                Self.showAuthForm();
                return false;
            }
    
            a.active_tab.removeClass( "act" );
            a.active_tab = tab.addClass( "act" );

            a.active_section.hide();
            a.active_section = a.sections.eq( a.index ).show();

            a.prev_tab.push( a.tabs.index( a.active_tab ) );
    
            return true;
        },

        buildAvatar: function()
        {
            That.Controller.ProfileAvatar.on( "success_upload", function( e, photo_data )
            {
                Self.downloadAvatar();
                Self.setAvatarId( photo_data.photo_id );

                App.PhotoGallery.addAvatar( photo_data );
            });

            That.Controller.ProfileAvatar.on( "show_preloader", function()
            {
                Self.showPreloader();
            });

            That.Controller.ProfileAvatar.on( "hide_preloader", function()
            {
                Self.hidePreloader();
            });
        },

        hidePreloader: function()
        {
            That.Controller.ProfileAvatar.hidePreloader();
        },

        showPreloader: function()
        {
            That.Controller.ProfileAvatar.showPreloader();
        },
        setAvatarId: function( avatar_id )
        {
            Model.profile.avatar_id = avatar_id;
        },

        downloadAvatar: function()
        {
            Controller.initAvatarImage.apply(
                That.Controller.ProfileAvatar.nodes,
                    [ Model.profile_id, 50, 50, That.Controller.ProfileAvatar.hidePreloader ]
            );
        },

        init: function( contact )
        {
            Self.build( contact );
            Self.bindEvents();
        },

        build: function( contact )
        {
            Self.cacheObjects();
            Self.openWidget();
            Self.hideAuthForm();
            Self.blockSearch();

            THelper.setFieldVisibility( a.context );
            THelper.changeGender( a.context );
            THelper.setContact( contact, a.context );
            That.Controller.ProfileAvatar = Profile.Controller.Avatar( a.context );
        },

        bindEvents: function()
        {
            Events.onSendFinalRequest();
            Events.onTabChange();
            Events.onPasswordKeyup();
            Events.onRepeatPasswordKeyup();
        }
    };
    
    return Self;
};