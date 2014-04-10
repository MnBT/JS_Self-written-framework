Profile.Controller.Basic = function()
{
    var
        a = {}, Self = {}, preloader_counter = 0,city_box_count = 0,city_limit = 50,
        That = { View: {}, Events: {}, Controller: {}, Model: {} };

    Self =
    {
        has_profile_data: false,

        get_profile_xhr: { abort: function() {} },

        cacheObjects: function()
        {
            var transData = Controller.ProfileHelper.getTranslation();
            $( "#user_profile_tmpl" ).tmpl( transData ).prependTo( '.content' );
            var context = $( ".user-profile-context" ).hide();

            Self.nodes = a =
            {
                context:         context,
                profile_editor:  context.find( ".profile_editor" ),
                profile_wrapper: context.find( ".profile_wrapper" ),
                profile_content: context.find( ".profile_content" ),
                about_tab:       context.find( ".profile_menu ul li.about_tab"),
                save:            context.find( ".profile__save" ),
                cancel:          context.find( ".profile__cancel" ),
                tabs:            context.find( ".profile_menu UL LI" ),
                close:           context.find( ".profile__close" ),

                maiden_name:     context.find( "input[ name='maiden_name' ]" ),
                first_name:      context.find( "input[ name='first_name' ]" ),
                middle_name:     context.find( "input[ name='middle_name' ]" ),
                display_name:    context.find( "input[ name='display_name' ]" ),

                man_last_name:   context.find( ".man_container   input[ name='last_name' ]" ),
                woman_last_name: context.find( ".woman_container input[ name='last_name' ]" ),

                first_name_visibility: context.find( "#first_name_vis" ),
                last_name_visibility: context.find( "#last_name_vis" ),
                middle_name_visibility: context.find( "#middle_name_vis" ),
                maiden_name_visibility: context.find( "#maiden_name_vis" ),
                birthday_visibility: context.find( "#birthday_vis" ),
                email_visibility:   context.find("#email_vis"),
                phone_visibility:   context.find("#phone_vis"),

                birth_day:            context.find("#birth_day"),
                birth_month:          context.find("#birth_month"),
                birth_year:           context.find("#birth_year"),

                country:         $( "#country_loc" ),
                city:            $( "#city_loc" ),

                country_select:  $("#country_select"),
                city_select:     $("#city_select"),

                birth_wday:      context.find( ".birth_wday"),
                birth_site:      context.find( "#birth_site"),

                avatar: $( ".avatar-context" ),

                request_data: { live: {} }
            };
        },

        getLiveRequest: function()
        {
            var data = a.request_data.live =
            {
                session_id:   Model.session_id,
                profile_id:   Model.profile_id,

                first_name:   a.first_name.val(),
                middle_name:  a.middle_name.val(),
                display_name: a.display_name.val(),

                country_id:   a.country.val(),
                city_id:      a.city.val(),
                language: "en_US",

                birthday: Controller.ProfileHelper.getDate( a.context ),
                gender: Self.getGender( a.context ),
                email_visibility: Controller.ProfileHelper.getVisibility("#email_vis",a.context),
                cphone_visibility: Controller.ProfileHelper.getVisibility("#phone_vis",a.context),
                first_name_visibility:  Controller.ProfileHelper.getVisibility( "a#first_name_vis", a.context ),
                middle_name_visibility: Controller.ProfileHelper.getVisibility( "a#middle_name_vis", a.context ),
                birthday_visibility:    Controller.ProfileHelper.getVisibility( "a#birthday_vis", a.context )
            };
            if ( data.gender === "F" )
            {
                data.last_name   = a.woman_last_name.val();
                data.last_name_visibility = Controller.ProfileHelper.getVisibility('#last_name_vis',a.context);
                data.maiden_name = a.maiden_name.val();
                data.maiden_name_visibility = Controller.ProfileHelper.getVisibility("#maiden_name_vis", '.woman_container' );
            }
            else
            {
                data.last_name = a.man_last_name.val();
                data.last_name_visibility = Controller.ProfileHelper.getVisibility('#last_name_vis',a.context);
            }

            if ( data.birthday.match( /-/g ).length > 2 )
            {
                View.displayInnerNotice( App.TMPL.data.profile_set[ "ERROR_BIRTHDAY_FORMAT" ], "error" );
                return false;
            }

            return data;
        },

        sendLiveRequest: function()
        {
            if ( !Self.getLiveRequest() ) { return false; }

            View.showUploadPreloader( a.save );

            Model.getRequest( a.request_data.live, "profile_set", function( json )
            {
                if ( json.result === "RESULT_OK" )
                {
                    App.Widget.close( a.context );
                    View.clearProfileMenu();
                    View.displayInnerNotice( json.result.toLowerCase(), "success" );
                    Controller.setDisplayNameToCookies(a.request_data.live.display_name, 720);
                    Controller.updateAvatarBlock(a.request_data.live.display_name);
                    App.ProfileMenu.initAdditional();
                }
                else
                {
                    View.displayInnerNotice( json.result.toLowerCase(), "error" );
                }

                View.hideUploadPreloader( a.save );
            });
        },

        getGender: function( form )
        {
            var gender = $( "select[ name='gender' ] option:selected", form ).attr( "class" );

            if      ( gender === "woman" ) { gender = "F"; }
            else if ( gender === "man" )   { gender = "M"; }

            return gender;
        },

        getProfileData: function () {
            Controller.ProfileHelper.scrollInit(a.profile_content);
            if (!Self.has_profile_data) {
                Model.profile = Model.profile_data;
                Model.account_id = Model.profile_data.account_id;

                Controller.setSessionIdToCookies(null, 720);
                Controller.setDisplayNameToCookies(Model.profile_data.display_name, 720);

                Self.initProfileTmpl(Model.profile);
                $('.chosen_no_search').chosen({"disable_search": true});

                Self.buildBirthDaySite(Model.profile_data.created);
                Self.buildWeekday(Model.profile_data.birthday);
                var user_country = Model.profile_data.country_id;
                var user_city = { id: Model.profile_data.city_id, name: Model.profile_data.city_name };
                Controller.ProfileHelper.setUserLocation(user_country, user_city);
                var data = {language_code: App.Language.getCurrentLanguage()};
                $.extend(data, Model.getRequestData());
                Model.getRequest(data, "country_list", function (json) {
                    Controller.ProfileHelper.setCountries(json);
                    $("#country_loc_tmpl").tmpl(json).appendTo(a.country);
                    a.country.val(user_country);
                    a.country.chosen({});
                    if (!user_country)
                        user_country = a.country.find("option:first-child").val();
                    Controller.ProfileHelper.getCity(user_country, city_limit, 0, null, function (city) {
                        if (city) {
                            Controller.ProfileHelper.buildCity(city, user_city, true, a.city, a.country);
                            Controller.ProfileHelper.resize(a.profile_content);
                            Self.has_profile_data = true;
                        } else {
                            console.log('## error load city');
                        }
                    })
                });
            }
        },

        getAvatarId: function()
        {
            return Model.profile_data.avatar_id;
        },

        setAvatarId: function( avatar_id )
        {
            Model.profile_data.avatar_id = avatar_id;
        },

        initProfileTmpl: function( data )
        {
            var qdata =
            {
                first_name:   a.first_name,
                middle_name:  a.middle_name,
                display_name: a.display_name,
                maiden_name:  a.maiden_name,
                last_name:    data.gender === "F" ? a.woman_last_name : a.man_last_name
            };


            for ( var i in qdata )
            {
                qdata[ i ].val( data[ i ] );
            }

            var qvisibility =
            {
                first_name_visibility: a.first_name_visibility,
                last_name_visibility: a.last_name_visibility,
                middle_name_visibility: a.middle_name_visibility,
                maiden_name_visibility: a.maiden_name_visibility,
                birthday_visibility: a.birthday_visibility,
                cphone_visibility: a.phone_visibility,
                email_visibility: a.email_visibility
            };


            for ( var i in qvisibility )
            {
                qvisibility[ i ].addClass('eye_'+data[i]);
            }

            Controller.ProfileHelper.setDate( data.birthday, a.context );
            Controller.ProfileHelper.changeGender( a.context, data.gender, true );
            Controller.ProfileHelper.setVisibility(data);
        },

        buildBirthDaySite: function(birthday) {
            var date = birthday.split(' ');
            var parts = date[0].split('-');
            var birthday = {
                days: [
                    {value:parts[2].substr(0,1)},
                    {value:parts[2].substr(1,1)}
                ],
                months: [
                    {value:parts[1].substr(0,1)},
                    {value:parts[1].substr(1,1)}
                ],
                years: [
                    {value:parts[0].substr(0,1)},
                    {value:parts[0].substr(1,1)},
                    {value:parts[0].substr(2,1)},
                    {value:parts[0].substr(3,1)}
                ]
            };

            $("#birthday_site_tmpl").tmpl(birthday).appendTo(a.birth_site);
        },

        buildWeekday: function(birthday) {
            var birthday = birthday;
            var week_day = new Date(birthday).getDay();
            var trans_days = App.Language.getTranslationForGroup('WEEKDAYS');
            week_day = trans_days["WEEK_DAY_"+week_day];
            var weekd_chars = {chars:[]};
            for (var i = 0; i < week_day.length; i++) {
                weekd_chars.chars.push({value: week_day.charAt(i)});
            }
            $("#weekday_tmpl").tmpl(weekd_chars).appendTo(a.birth_wday);
        },

        buildAvatar: function()
        {
            That.Controller.ProfileAvatar.on( "success_upload", function( e, photo_data )
            {
                Self.downloadAvatar();
                Self.setAvatarId( photo_data.photo_id );

                App.PhotoGallery.addAvatar( photo_data );
            });

            That.Controller.GlobalAvatar.on( "success_upload", function( e, photo_data )
            {
                Self.downloadAvatar();
                Self.setAvatarId( photo_data.photo_id );

                App.PhotoGallery.addAvatar( photo_data );
            });

            That.Controller.ProfileAvatar.on( "show_preloader", function()
            {
                Self.showPreloader();
            });

            That.Controller.GlobalAvatar.on( "show_preloader", function()
            {
                Self.showPreloader();
            });

            That.Controller.ProfileAvatar.on( "hide_preloader", function()
            {
                Self.hidePreloader();
            });

            That.Controller.GlobalAvatar.on( "hide_preloader", function()
            {
                Self.hidePreloader();
            });
        },

        hidePreloader: function()
        {
            That.Controller.GlobalAvatar.hidePreloader();
            That.Controller.ProfileAvatar.hidePreloader();
        },

        showPreloader: function()
        {
            That.Controller.GlobalAvatar.showPreloader();
            That.Controller.ProfileAvatar.showPreloader();
        },

        setNewAvatar: function( avatar_id )
        {
            Self.showPreloader();
            Self.downloadAvatar();
            Self.setAvatarId( avatar_id );
        },

        downloadAvatar: function()
        {
            Controller.initAvatarImage.apply
            (
                That.Controller.GlobalAvatar.nodes,
                [ Model.profile_id, 150, 150, That.Controller.GlobalAvatar.hidePreloader ]
            );

            Controller.initAvatarImage.apply
            (
                That.Controller.ProfileAvatar.nodes,
                [ Model.profile_id, 50, 50, That.Controller.ProfileAvatar.hidePreloader ]
            );
        },

        bindEvents: function()
        {
            this.onSaveClick();
            this.onCancelClick();
            this.onCloseClick();
            this.onWidgetOpen();
            this.onWidgetOpenFirstTime();
            this.onWidgetOpenByUrlChange();
            this.onOpenAboutTab();
            this.onChangeCountry();
            this.onChangeCity();
            this.onChangeDate();
            this.onResize();
            Controller.ProfileHelper.onMoreCity(a.city,a.country,'live');
        },

        onWidgetOpenByUrlChange: function()
        {
            App.Router.on( "about", function( event, data )
            {
                App.Widget.open( a.context );

                if ( Model.profile.result !== "RESULT_OK" )
                {
                    Self.getProfileData();
                }
            });
        },

        onWidgetOpenFirstTime: function()
        {
            $( ".profile-myAbout" ).one( "click", function()
            {
                Self.getProfileData();
            });
        },

        onOpenAboutTab: function() {
            a.about_tab.click(function() {
                Self.getProfileData();
            })
        },

        onResize: function()
        {
            $( window).bind("resize", function() {
                Controller.ProfileHelper.resize(a.profile_content);
            });
        },

        onSaveClick: function()
        {
            a.save.click( function()
            {
                var _this = $(this);
                if ( a.save.data().blocked ) { return false; }

                var
                    current_li = a.tabs.filter( ".act" ),
                    index      = a.tabs.index( current_li );
                switch(index) {
                    case 0:
                        Self.sendLiveRequest();
                        break;
                    case 2:
                        That.Controller.Work.save(_this);
                        break;
                }
                return false;
            });
        },

        onCancelClick: function()
        {
            a.cancel.click( function()
            {
                $('.profile-myAbout').removeClass('active');
                App.Widget.close( a.context );
                View.clearProfileMenu();

                return false;
            });
        },

        onCloseClick: function()
        {
            a.close.click( function()
            {
                $('.profile-myAbout').removeClass('active');
                App.Widget.close( a.context );
                View.clearProfileMenu();
                return false;
            });
        },

        onWidgetOpen: function()
        {
            $( ".profile-myAbout" ).click( function()
            {
                if (a.context.is( ":visible" )) {
                    App.Widget.close( a.context );
                    $(this).removeClass('active');
                } else {
                    App.Widget.open( a.context, { widget_name: "about" } );
                    $(this).addClass('active');
                }
                return false;
            });
        },

        onChangeCountry: function () {
            a.country.live('change', function () {
                var country_id = $(this).val();
                Controller.ProfileHelper.getCity(country_id, city_limit, 0,null, function(city) {
                    if (city) {
                        Controller.ProfileHelper.buildCity(city,null,false, a.city,a.country);
                    } else {
                        console.log('## error load city');
                    }
                });

            });
        },

        onChangeCity: function() {
            a.city.live('change', function() {
                var city_id = $(this).val();
                if (city_id == '...') {
                    a.save.addClass('blocked_btn');
                    a.save.find('.b-button__button').addClass('blocked_btn');
                    a.save.data('blocked',true);
                } else {
                    a.save.removeClass('blocked_btn');
                    a.save.find('.b-button__button').removeClass('blocked_btn');
                    a.save.data('blocked',false);
                }
            })
        },

        onChangeDate: function()
        {
            a.birth_day.live('change',function() {
                Self.buildWeekday(Self.getDate());
            });
            a.birth_month.live('change',function() {
                Self.buildWeekday(Self.getDate());
            });
            a.birth_year.live('change',function() {
                Self.buildWeekday(Self.getDate());
            });
        },

        getDate: function()
        {
            return $('#birth_month option:selected').attr('class')
                +'-'+$('#birth_day').val()
                +'-'+$('#birth_year').val();
        },

        init: function()
        {
            Self.build();
            Self.bindEvents();
        },

        build: function()
        {
            Self.cacheObjects();
            Controller.ProfileHelper.showProfileEditor( a.context );

            That.Controller.ProfileAvatar = Profile.Controller.Avatar( a.context );
            That.Controller.GlobalAvatar  = Profile.Controller.Avatar( a.avatar );

            That.Controller.Work = Profile.Controller.Work( a.context );

            Self.showPreloader();
            Self.downloadAvatar();
            Self.buildAvatar();
        }
    };

    return Self;
};