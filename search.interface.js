App.Source.Search.Interface = function()
{
    this.SearchClass = function() {};

    $.extend( this.SearchClass.prototype, App.Source.Search.Core.prototype );
    $.extend( this.SearchClass.prototype, App.Source.Search.Helpers.prototype );

    this.SearchEntity = new this.SearchClass();

    this.SearchEntity.setVars();
    this.SearchEntity.build();
    this.SearchEntity.bindEvents();
    this.bindActionsByURLType();
};

App.Source.Search.Interface.prototype =
{
    openWidget: function()
    {
        this.SearchEntity.openWidget();
    },

    search: function( search_str )
    {
        this.SearchEntity.setSearchStr( search_str );
        this.SearchEntity.clearProfileMenu();
        this.SearchEntity.blockSearchBtn();
        this.SearchEntity.abortXhr();
        this.SearchEntity.sendXhr();
    },

    bindOpenProfile: function()
    {
        this.SearchEntity.Events.onOpenGalleryProfile();
        this.SearchEntity.Events.onOpenTableProfile();
    },

    bindCardEvents: function()
    {
        this.SearchEntity.Events.bindCardEvents ?
            this.SearchEntity.Events.bindCardEvents() : card_events = true;
    },

    bindSmileEvents: function()
    {
        App.Smiles && this.SearchEntity.View.Card ?
            this.SearchEntity.bindSmilesEvents() : smiles_events = true;
    },

    updateList: function()
    {
        this.SearchEntity.updateList();
    },

    block: function()
    {
        $( ".b-button_search" ).data( { blocked: true } );
    },

    unblock: function()
    {
        $( ".b-button_search" ).data( { blocked: false } );
    },

    bindActionsByURLType: function()
    {
        var self = this;

        App.Router.on( "search", function( event, data )
        {
            switch ( data[ 2 ] )
            {
                case "contacts":
                {
                    self.search( data[ 3 ] );
                    App.Widget.open( self.SearchEntity.context );
                }
            }
        });
    }
};