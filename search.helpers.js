App.Source.Search.Helpers = function() {};

App.Source.Search.Helpers.prototype =
{
    search: function( callback )
    {
        var self = this;
        var data = Model.getRequestData();
        $.extend(data,{ type: "user", searchstr: this.search_str });
        this.search_xhr = Model.getRequest(data, "search", function( json )
        {
            if ( json.result === "RESULT_OK" )
            {
                self.dataParse( json.data );
                self.initView();
            }
            else
            {
                self.View.hideLists();
            }

            callback();
        });
    },

    dataParse: function( data )
    {
        var tmp;
        var transContactList = App.Language.getTranslationForGroup('CONTACT_LIST');
        this.search_length = data.length;

        for ( var i = this.search_length; i--; )
        {
            tmp = data[ i ];

            tmp.in_contact_list = false;

            if ( tmp.text_status )  {} else { tmp.text_status  = null; }
            if ( tmp.city_name )    {} else { tmp.city_name    = transContactList["TEXT_CITY_UNKNOWN"];}
            if ( tmp.age )          {} else { tmp.age          = transContactList["TEXT_AGE_UNKNOWN"]; }
            if ( tmp.country_name ) {} else { tmp.country_name = transContactList["TEXT_COUNTRY_UNKNOWN"]; }
        }

        this.Model.setContactsData( data );
        this.searchCrossingContacts( data );

        Model.search_result = data;
    },

    onCloseList: function()
    {
        this.context.delegate( ".cl__close", "click", function()
        {
            if ( App.IsInit.login && !App.IsInit.dicon_drag )
            {
                View.setDraggableDicons();

                App.IsInit.dicon_drag = true;
            }

            return false;
        });
    },

    onResize: function()
    {
        var self = this;

        $( window ).bind( "resize", function()
        {
            self.preparationForResize();
        });
    },

    onSubmit: function()
    {
        this.search_form.submit( function() { return false; } );
    },

    onSearch: function()
    {
        var self = this;

        this.search_btn.click( function()
        {
            Controller.addContactNotice.hideNotice();

            self.validate() ? self.updateList() : self.startSearch();
        });
    },

    startSearch: function()
    {
        this.setSearchStr();
        this.openWidget();
        this.clearProfileMenu();
        this.sendXhr();
        this.blockSearchBtn();
    },

    validate: function ()
    {
        return !Model.checkRequest( "search" );
    },

    setSearchStr: function( search_str )
    {
        if ( search_str !== undefined )
        {
            this.search_str = search_str;
            this.search_field.val( search_str );
        }
        else
        {
            this.search_str = this.search_field.val();
        }
    },

    openWidget: function()
    {
        App.Widget.open( this.context,
        {
            widget_name: "search",
            search_type: this.search_type,
            search_str:  this.search_str
        });
    },

    clearProfileMenu: function()
    {
        View.clearProfileMenu();
    },

    sendXhr: function()
    {
        var self = this;

        this.search( function()
        {
            View.hideUploadPreloader( self.search_btn );
        });
    },

    blockSearchBtn: function()
    {
        View.showUploadPreloader( this.search_btn );
    },

    abortXhr: function()
    {
        this.search_xhr.abort();
    },

    updateList: function()
    {
        this.update = true;
        this.preparationForResize();
        this.update = false;
    },

    build: function()
    {
        this.cacheObjects();
        this.initBasic();
        this.initNavigator();
        this.initCard();
    },

    bindEvents: function()
    {
        this.initEvents();
        this.onCloseList();
        this.onResize();
        this.onSearch();
        this.onSubmit();
    }
};