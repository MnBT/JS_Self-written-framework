Profile.Helpers.Basic = function()
{
    var Self = {},countries = {}, cities = {},size ={}, user_country = null, user_city = null,
        job_positions = {}, job_tab_build,
        city_box_count = 0,city_limit = 50,
        job_city_box_count = 0, job_city_limit = 50,
        months = [ "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JULY",
        "SEPTEMBER", "JUNE", "OCTOBER", "AUGUST", "NOVEMBER", "DECEMBER" ], trans_month, top_indent = 85, bottom_indent = 40;
    var live_search_live,live_search_job;
    var ScrollingControl;


    Self =
    {
        scroll_timeout: null,

        cacheObjects: function() {
            size = {
                document_width: $(document.body).width(),
                document_height: $(document.body).height(),
                content_width: null,
                content_width_min: 750
            }
        },

        getTranslation: function() {
            return App.Language.getTranslationForGroup('PROFILE_MENU');
        },

        showProfileEditor: function ( form )
        {
            var
                index = 0, item = $(),
                items    = form.find( ".profile_menu UL LI" ),
                sections = form.find( ".sections > .profile_section" );

            for ( var i = 0, ilen = items.length; i < ilen; i++ )
            {
                items.eq( i ).attr( "data-item-id", i );
            }

            items.click( function()
            {
                item.removeClass( "act" );
                item = $( this ).addClass( "act" );

                sections.eq( index ).hide();
                index = parseInt( item.data( "item-id" ) );
                sections.eq( index ).show();
            });

            items.eq( index ).click();

            Self.setFieldVisibility( form );
        },

        setFieldVisibility: function( form )
        {
            var eye, eye_class, eye_type, tooltip = Self.getVisibilityItems();

            form.find( ".eye" ).each( function()
            {
                eye       = $( this );
                eye_class = eye.attr( "class" );
                eye_type  = eye_class[ eye_class.length - 1 ];

                eye.attr( { "title": tooltip[ eye_type ] } );
            });

            form.find( ".eye" ).live('click', function()
            {
                eye = $( this );

                if ( eye.hasClass( "eye_2" ) )
                {
                    eye.removeClass( "eye_2" );
                    eye.addClass( "eye_1" ).attr( { "title": tooltip[ 1 ] } );
                }
                else if ( eye.hasClass( "eye_1" ) )
                {
                    eye.removeClass( "eye_1" );
                    eye.addClass( "eye_0" ).attr( { "title": tooltip[ 0 ] } );
                    if (eye.hasClass( "job")) {
                        eye.parents('.job_row').find('.job_title').css('color','#5D5D5D')
                    }
                }
                else if ( eye.hasClass( "eye_0" ) )
                {
                    eye.removeClass( "eye_0" );
                    eye.addClass( "eye_2" ).attr( { "title": tooltip[ 2 ] } );
                    if (eye.hasClass( "job")) {
                        eye.parents('.job_row').find('.job_title').css('color','#028989')
                    }
                }

                return false;
            });
        },

        getVisibilityItems: function()
        {
            var transData = App.Language.getTranslationForGroup('VISIBILITY_TOOLTIP');
            var visibility = App.TMPL.data.visibility_tooltip;
            visibility[0] = transData["HIDDEN_FOR_ALL"];
            visibility[1] = transData["ONLY_FRIENDS"];
            visibility[2] = transData["OPEN_ALL"];
            return visibility;
        },

        initMonths: function() {
            var transData = App.Language.getTranslationForGroup('MONTHS');
            App.TMPL.data.birthday.month[0].value = transData["OPTION_MONTH"];
            App.TMPL.data.birthday.month[1].value = transData["JANUARY"];
            App.TMPL.data.birthday.month[2].value = transData["FEBRUARY"];
            App.TMPL.data.birthday.month[3].value = transData["MARCH"];
            App.TMPL.data.birthday.month[4].value = transData["APRIL"];
            App.TMPL.data.birthday.month[5].value = transData["MAY"];
            App.TMPL.data.birthday.month[6].value = transData["JUNE"];
            App.TMPL.data.birthday.month[7].value = transData["JULY"];
            App.TMPL.data.birthday.month[8].value = transData["AUGUST"];
            App.TMPL.data.birthday.month[9].value = transData["SEPTEMBER"];
            App.TMPL.data.birthday.month[10].value = transData["OCTOBER"];
            App.TMPL.data.birthday.month[11].value = transData["NOVEMBER"];
            App.TMPL.data.birthday.month[12].value = transData["DECEMBER"];
            App.TMPL.data.birthday.year[0] = transData["OPTION_YEAR"];
            return App.TMPL.data.birthday;
        },

        setDate: function( date, form )
        {
            if ( date === null || date === "null" ) { return false; }
            App.TMPL.data.birthday = Self.initMonths();
            $( ".birthDayBox .birthday_box", form).empty().remove();
            $( "#birthday_tmpl" ).tmpl( App.TMPL.data.birthday ).prependTo( $( ".birthDayBox", form ) );
            $( "select[ name='birth_day' ]   option", form ).filter( "option[ class='" + date.substr( 8, 2 ) + "' ]" ).attr( "selected", "selected" );
            $( "select[ name='birth_month' ] option", form ).filter( "option[ class='" + date.substr( 5, 2 ) + "' ]" ).attr( "selected", "selected" );
            $( "select[ name='birth_year' ]  option", form ).filter( "option[ class='" + date.substr( 0, 4 ) + "' ]" ).attr( "selected", "selected" );
        },

        getDate: function( form )
        {
            var date = {};

            date.day   = $( "select[ name='birth_day' ]   option:selected", form ).val();
            date.month = $( "select[ name='birth_month' ] option:selected", form ).attr( "class" );
            date.year  = $( "select[ name='birth_year' ]  option:selected", form ).val();

            return date.year + "-" + date.month + "-" + date.day;
        },

        setVisibility: function( data )
        {

        },

        getLastName: function( form )
        {
            var
                gender = $( "select[ name='gender' ] option:selected", form ).attr( "class" ),
                data   = { "gender": "" },
                man    = $( ".man_container",   form ),
                woman  = $( ".woman_container", form );

            if ( gender === "man" )
            {
                return {
                    "gender": "m",
                    "last_name": $( "input[ name='last_name' ]", man ).val(),
                    "last_name_visibility": Self.getVisibility( ".last_name_vis", man )
                };
            }
            else if ( gender === "woman" )
            {
                return {
                    "gender": "f",

                    "last_name":   $( "input[ name='last_name' ]",   woman ).val(),
                    "maiden_name": $( "input[ name='maiden_name' ]", woman ).val(),

                    "last_name_visibility":   Self.getVisibility( ".last_name_vis",   woman ),
                    "maiden_name_visibility": Self.getVisibility( "#maiden_name_vis", woman )
                };
            }

            return data;
        },

        setContact: function( contact, form )
        {
            var length = /\d/.test( contact ) === false ? 0 : contact.match(/\d/g ), type;

            if ( length === contact.length || length === contact.length - 1 )
            {
                type = "phone";
            }
            else
            {
                type = "email";
            }

            $( "input[ name='" + type + "' ]", form )
                .attr( "disabled", "disabled" )
                .val( contact ).css( { color: "#000", border: "none", textAlign: "center" } );
        },

        getVisibility: function( content, form )
        {
            return $( content, form ).attr( "class" ).match( /\d+/g )[ 0 ];
        },

        changeGender: function( context, type, check )
        {
            var
                select = $( "select[ name='gender' ]", context ),
                woman  = $( ".woman_container", context ),
                man    = $( ".man_container",   context ),
                none   = $( ".none-gender",     context ),
                gender = null;

            select.change( function()
            {
                gender = select.find( "option:selected" );

                gender.hasClass( "woman" ) ? displayWoman() : null;
                gender.hasClass( "man" )   ? displayMan()   : null;

                check && !gender.hasClass( "none-gender" ) ? none.remove() : null;
            });

            function displayMan()   { woman.hide(); man.show(); }
            function displayWoman() { woman.show(); man.hide(); }

            if ( type )
            {
                if ( type === "M" )
                {
                    select.find( ".man" ).attr( "selected", "selected" );
                    displayMan();
                }
                else
                {
                    select.find( ".woman" ).attr( "selected", "selected" );
                    displayWoman();
                }

                none.remove();
            }
        },

        getCity: function( country_id, limit, offset, substr, callback ) {
            var data = {
                language_code: App.Language.getCurrentLanguage(),
                country_id: country_id,
                limit: limit
            };
            $.extend(data,Model.getRequestData());
            if (substr)
                $.extend(data,{substr: substr});
            if (offset)
                $.extend(data,{offset: offset});
            Model.getRequest( data, "city_list", function( json ) {
                if ( json.result === "RESULT_OK" ) {
                    Self.setCities(json.data);
                    callback ? callback(json.data) : callback = function() {};
                }
            });
        },

        buildCity: function( city , select_city, is_new, element, country_element) {
            element.empty().hide();
            var content = '<option value="...">...</option>';
            var exist = false;
            $.each(city, function (i, val) {
                if (select_city) {
                    if (city[i]['city_id'] == select_city.id) {
                        exist = true;
                    }
                }
                content += '<option value=' + city[i]['city_id'] + '>' + city[i]['city_name'] + '</option>';
            })
            if (!exist && is_new) {
                content += '<option value=' + select_city.id + '>' + select_city.name + '</option>';
            }
            content+='<option value="more_city_down">--more--</option>';
            element.html(content);
            element.removeAttr('disabled');
            if (select_city) {
                element.val(select_city.id);
            }
            if (is_new) {
                element.show();
                element.chosen({no_results_text: function(search_text) {
                    live_search_live = search_text;
                    search_text = search_text.charAt(0).toUpperCase() + search_text.slice(1);
                    Self.getCity(country_element.val(),city_limit,null,search_text,function(city) {
                        Self.buildCity(city,false,false,element,country_element);
                        element.next().find(".chosen-search input[type='text']").val(search_text);
                    });
                }});
            } else {
                element.trigger('chosen:updated');
            }

        },

        getMonth: function(month_id)
        {
            trans_month = App.Language.getTranslationForGroup('MONTHS');
            return trans_month[months[month_id]];
        },

        onMoreCity: function(element, country_element,tab) {
            var limit, box_count,prev = false;
            if (tab == 'live') {
                limit = city_limit;
                box_count = city_box_count;
            } else if (tab == 'job') {
                limit = job_city_limit;
                box_count = job_city_box_count;
            }
            var more_city_limit,more_city_offset;
            element.live('change',function() {
                more_city_limit = limit * 2;
                if ($(this).val() === 'more_city_down') {
                    more_city_offset = limit * box_count;
                    if (prev)box_count++;
                    Self.buildMoreCity(element,country_element,more_city_limit,more_city_offset,box_count);
                    box_count++;
                    prev = false;
                } else if ($(this).val() === 'more_city_up') {
                    more_city_offset = more_city_offset - limit;
                    prev?box_count--:box_count = box_count-2;
                    prev = true;
                    Self.buildMoreCity(element,country_element,more_city_limit,more_city_offset,box_count);
                }
            });
        },

        buildMoreCity: function(element,country_element,limit,offset,box_count) {
            Self.getCity(country_element.val(), limit,offset ,live_search_live, function(city) {
                if (city) {
                    var content = '<option value="...">...</option>';
                    if (box_count > 0) {
                        content += '<option value="more_city_up">--more--</option>';
                    }
                    $.each(city, function (i, val) {
                        content += '<option value=' + city[i]['city_id'] + '>' + city[i]['city_name'] + '</option>';
                    })
                    content+='<option value="more_city_down">--more--</option>';
                    element.find(':selected').remove();
                    element.html(content);
                    element.find('[value="..."]').attr('selected','selected');
                    element.removeAttr('disabled');
                    element.trigger('chosen:updated');
                    element.next().find(".chosen-search input[type='text']").val(live_search_live);
                } else {
                    console.log('## error load city');
                }
            });
        },

        getDataForStep1: function( form )
        {
            var data = {}, warning = [];

            data =
            {
                code:              $( ".confirm__code" ).val(),
                username:          $( "input[ name='login' ]",           form ).val(),
                password:          $( "input[ name='password' ]",        form ).val(),
                email:             $( "input[ name='email' ]",           form ).val(),
                cphone:            $( "input[ name='phone' ]",           form ).val(),
                secret_question:   $( "input[ name='secret_question' ]", form ).val(),
                secret_answer:     $( "input[ name='secret_answer' ]",   form ).val(),

                email_visibility:  Self.getVisibility( "a#email_vis",    form ),
                cphone_visibility: Self.getVisibility( "a#phone_vis",    form )
            };

            if ( data.username.length === 0 )
            {
                warning.push( "login" );
            }

            if ( data.email.length === 0 && data.cphone.length === 0 )
            {
                warning.push( "email" );
            }

            if ( data.secret_question.length === 0 )
            {
                warning.push( "secret_question" );
            }
            else if ( data.secret_answer.length === 0 )
            {
                warning.push( "secret_answer" );
            }

            if ( data.password.length < 6 )
            {
                warning.push( "password" );
            }
            else if ( data.password !== $( "input[ name='re_password' ]", form ).val() )
            {
                warning.push( "re_password" );
            }

            for ( var i = 0; i < warning.length; i++ )
            {
                $( "input[ name='" + warning[ i ] + "' ]", form )
                    .css( "border", "1px solid red" )
                    .one( "click", function()
                    {
                        $( this ).css( "border", "1px solid #AFAFAF" );
                    });
            }

            if ( warning.length > 0 )
            {
                return { result: "ERROR" };
            }
            else
            {
                return { result: "RESULT_OK", data: data };
            }
        },

        getDataForStep2: function( form )
        {
            var data, lastNameObj;

            data =
            {
                profile_id: Model.profile_id,
                session_id: Model.session_id,
                username:   Model.username,

                first_name:   $( "input[ name='first_name' ]",   form ).val(),
                middle_name:  $( "input[ name='middle_name' ]",  form ).val(),
                display_name: $( "input[ name='display_name' ]", form ).val(),

                first_name_visibility:  Self.getVisibility( "a#first_name_vis",  form ),
                middle_name_visibility: Self.getVisibility( "a#middle_name_vis", form ),
                birthday_visibility:    Self.getVisibility( "a#birthday_vis",    form ),

                birthday: Controller.ProfileHelper.getDate( form )
            };

            lastNameObj = Self.getLastName( form );

            $.extend( data, lastNameObj );

            if ( data.display_name === "" && data.first_name === "" &&
                 data.middle_name  === "" && data.gender     === "" &&
                 data.birthday     === "-----" )
            {
                return { result: "SUCCESS_SKIP_TAB" };
            }
            else
            {
                return { result: "RESULT_OK", data: data };
            }
        },

        setCountries: function( _countries )
        {
            countries = _countries;
        },

        getCountries: function() {
            return countries;
        },

        setCities: function( _cities )
        {
            cities = _cities;
        },

        setUserLocation: function( country, city)
        {
            user_country = country;
            user_city = city;
        },

        getUserLocation: function() {
            return {
                country : user_country,
                city : user_city
            }
        },

        getCityById: function(city_id, callback) {
            var data = $.extend({city_id:city_id},{language_code:App.Language.getCurrentLanguage()});
            Model.getRequest( data, "city_name_by_id", function( json ) {
                if ( json.result === "RESULT_OK" ) {
                    callback(json.city_name);
                } else {
                    callback("");
                }
            });
        },

        setContentHeight: function(content)
        {
            var menu_height = content.find('.profile_menu').height();
            var content_height = $( document.body).height() - top_indent - bottom_indent - menu_height;
            if (content_height < 407) {
                content_height = 407;
            }
            content.height(content_height);
        },

        setContentWidth: function(content)
        {
            var content_width = Self.getContentWidth(content);
            if (content_width < size.content_width_min) {
                content_width = size.content_width_min;
            }

            content.width(content_width);
            content.find('.profile_content').css("cssText",'width:'+ (content_width-10)+'px !important');
            size.content_width = content_width;
        },

        getContentWidth: function(content)
        {
            var left_offset = content.find('.profile_menu').offset().left;
            var right_margin = 30;
            var content_width = $( document.body).width() - left_offset - right_margin;
            return content_width;
        },

        setWindowSize: function() {
            size.document_height = $(document.body).height();
            size.document_width = $(document.body).width();
        },

        resize: function(wrapper)
        {
            Self.scrollInit(wrapper);
            if (wrapper.find('.jspVerticalBar').length == 0) {
                $('.buttons_content').css(
                    {
                        position: 'absolute',
                        bottom: 0
                    }
                );
            } else {
                $('.buttons_content').css(
                    {
                        position: 'relative'
                    }
                );
            }
            var api = wrapper.data('jsp');
            api.reinitialise();
            /*
            if ($(document.body).width() != size.document_width  ) {
                if (size.content_width > size.content_width_min) {
                    Self.scrollInit(wrapper);
                } else {
                    size.content_width = Self.getContentWidth(wrapper.closest('.profile_editor'));
                }
            } else {
                if (size.content_width > size.content_width_min) {
                    Self.scrollInit(wrapper);
                }

            }
            Self.setWindowSize();*/
        },

        scrollInit: function( wrapper)
        {
            //wrapper.css('padding','0px');
            Self.setContentHeight(wrapper.closest('.profile_editor'));
            if ( $.browser.msie )
            {
                if ( Self.scroll_timeout ) { return false; }

                Self.scroll_timeout = setTimeout( function()
                {
                    wrapper.jScrollPane( { showArrows: true, animateScroll: true } );
                    Self.scroll_timeout = null;

                }, 300 );
            }
            else
            {
                wrapper.jScrollPane( { showArrows: true, animateScroll: true } );
            }
            Self.setContentWidth(wrapper.closest('.profile_editor'));
            //wrapper.css('padding','5px');
            //var scroll_track =  wrapper.find(".jspVerticalBar .jspTrack");
            //scroll_track.height(scroll_track.height() - 10);
        }
    };

    Self.cacheObjects();

    //Self.build();
    return Self;
};