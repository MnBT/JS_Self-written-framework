App.Source.Search.Core = function() {};

App.Source.Search.Core.prototype =
{
    setVars: function()
    {
        this.Events        = {};
        this.Model         = {};
        this.View          = {};
        this.Controller    = {};
        this.Navigator     = {};

        this.curr_list     = {};
        this.prev_list     = {};
        this.tmp           = {};

        this.search_xhr    = { abort: function() {} };

        this.search_field  = $();
        this.context       = $();
        this.search_node   = $();
        this.search_btn    = $();
        this.search_form   = $();
        this.search_type   = "contacts";

        this.search_str    = null;

        this.needed_page   = 0;
        this.search_length = 0;

        this.smiles_events = false;
        this.card_events   = false;
        this.update        = false;
    },

    cacheObjects: function()
    {
        var transData = App.Language.getTranslationForGroup('CONTACT_LIST');
        this.context      = $( "#search-context__tmpl" ).tmpl(transData).appendTo( ".content" );
        this.search_btn   = $( ".b-button_search" );
        this.search_node  = $( ".search_result b" );
        this.search_field = $( "#q" );
        this.search_form  = $( ".sform" );

    },

    initView: function()
    {
        var gallery_contacts, table_contacts;
        
        this.View.Card.save();

        this.curr_list = this.Model.getListParams();

        this.Navigator.gallery.init( this.search_length, this.curr_list.gallery.perPage );
        this.Navigator.table  .init( this.search_length, this.curr_list.table.perPage );
        
        gallery_contacts = this.Model.sliceContactsData( this.Model.getPageCoord( "gallery", 1 ) );
        table_contacts   = this.Model.sliceContactsData( this.Model.getPageCoord( "table",   1 ) ); 
        
        this.View.initGalleryContactsTmpl( gallery_contacts );
        this.View.initTableContactsTmpl  ( table_contacts );

        this.View.reverseMenu( this.curr_list.gallery.perWidth );

        this.search_node.text( this.search_str );
    },

    initBasic: function()
    {
        this.Model = Contacts.Model( this.context );
        this.View  = new Contacts.View.Basic( this.context );

        Controller.addContactNotice = Contacts.Controller.Add( this.context );

        this.View.initFiltersTmpl( this.Model.getContactListFilters() );
    },

    initNavigator: function()
    {
        var Navigator, _data =
        {
            gallery: [ "#tmpl-navigator", 20, "gallery-navigator", this.View.nodes.gallery_scroll_case ],
            table:   [ "#tmpl-navigator", 7,  "table-navigator",   this.View.nodes.table_scroll_case ]
        };
        
        Navigator = Contacts.Controller.Navigator;

        this.Navigator.gallery = Navigator.apply( Navigator, _data.gallery );
        this.Navigator.table   = Navigator.apply( Navigator, _data.table );

        this.navigate( this.Navigator.gallery, "gallery" );
        this.navigate( this.Navigator.table,   "table" );

        this.View.cacheNavigator();
    },

    initCard: function()
    {
        this.View.initCardTmpl();
        this.View.Card = new Contacts.Controller.Card( this.context );

        this.smiles_events ? this.bindSmilesEvents() : null;
    },

    initEvents: function()
    {
        this.Events = Contacts.Events.Basic( this );

        this.Events.bindContactMenuEvents();
        this.Events.bindTableButtonsEvents();
        this.Events.bindControlButtonsEvents();

        this.card_events ? this.Events.bindCardEvents() : null;

        new App.Source.Search.Events( this, this.context );
    },

    bindSmilesEvents: function()
    {
        App.Smiles.bindEvents
        (
            this.View.Card.nodes.smiles,
            this.View.Card.nodes.area,
            this.View.Card.nodes.cblock,
            this.View.nodes.gallery
        );

        App.Smiles.bindEvents
        (
            this.View.Card.table.smiles,
            this.View.Card.table.area,
            this.View.Card.table.chat,
            this.View.nodes.table_scroll_case
        );
    },

    preparationForResize: function()
    {
        if ( this.context.is( ":visible" ) && this.Model.checkDataLength() )
        {
            this.prev_list = $.extend( true, {}, this.curr_list );
            this.curr_list = this.Model.getListParams();

            if ( this.Model.compareListParams( this.curr_list, this.prev_list ) || this.update )
            {
                this.resize();
                console.log( "Search list resize." );
            }
        }
    },

    resize: function()
    {
        var
            obj = [ "gallery", "table" ],
            contact_id = this.View.getContactId(),
            type, active_page;

        for ( var i = 0; i < 2; i++ )
        {
            type = obj[ i ];
            active_page = this.Navigator[ type ].getNavHistory().activePage;

            type === "gallery" && contact_id !== false ?
                this.needed_page = this.Model.calcNeededPage( contact_id, this.curr_list, this.prev_list, type, true ) :
                this.needed_page = this.Model.calcNeededPage( active_page, this.curr_list, this.prev_list, type, false );

            this.Navigator[ type ].init( this.search_length, this.curr_list[ type ].perPage );
            this.needed_page = this.Navigator[ type ].selectPageByNum( this.needed_page );

            this.parseNavHistory( { activePage: this.needed_page, prevActivePage: this.needed_page - 1 }, type );
        }
    },

    navigate: function( NavObj, type )
    {
        var self = this;

        NavObj.nodes.navigator.delegate( ".passive_page", "click", function()
        {
            NavObj.selectPage( $( this ) ); anonymous(); return false;
        });

        NavObj.nodes.first.click( function() { NavObj.getFirstPage(); anonymous(); return false; } );
        NavObj.nodes.last.click(  function() { NavObj.getLastPage();  anonymous(); return false; } );
        NavObj.nodes.next.click(  function() { NavObj.getNextPage();  anonymous(); return false; } );
        NavObj.nodes.prev.click(  function() { NavObj.getPrevPage();  anonymous(); return false; } );

        function anonymous()
        {
            self.parseNavHistory( NavObj.getNavHistory(), type );
        }
    },

    parseNavHistory: function ( history, type )
    {
        var obj =
        {
            type: type,
            perWidth: this.curr_list[ type ].perWidth,

            activePage:     this.Model.getPageCoord( type, history.activePage ),
            prevActivePage: this.Model.getPageCoord( type, history.prevActivePage )
        };

        obj.data = this.Model.sliceContactsData( obj.activePage );

        if ( history.activePage === history.prevActivePage && !this.update )
        {
            return false;
        }

        this.View.Card.save();
        this.View.displayContacts( obj );
    },

    searchCrossingContacts: function( data )
    {
        for ( var j = 0; j < data.length; j++ )
        {
            for ( var i = 0; i < Model.contacts.length; i++ )
            {
                if ( data[ j ].profile_id === Model.contacts[ i ].contact_id )
                {
                    data[ j ].in_contact_list = true;
                    break;
                }
            }
        }
    }    
};