App.Source.Search.Events = function( That, list )
{
    this.That        = That;
    this.list        = list;
    this.add_data    = {};
    this.remove_data = {};

    this.onOpenAddContactCard( this );
    this.onDeleteContact( this );
    this.onAddGroup( this );
    this.onAddContact( this );
    this.onFocusSearchInput();
};

App.Source.Search.Events.prototype =
{
    onOpenAddContactCard: function( self )
    {
        this.list.delegate( ".add_to_cl", "click", function()
        {
            if ( self.tryToOpenAddContactsCard() )
            {
                self.openAddContactCard( this );
            }
        });
    },

    tryToOpenAddContactsCard: function()
    {
        if ( !App.IsInit.login ) { return false; }

        if ( !Model.checkRequest( "add_contact" ) )
        {
            View.displayInnerNotice( "Дождитесь добавления контакта", "info" );

            return false;
        }

        return true;
    },

    openAddContactCard: function( btn )
    {
        this.add_data = this.prepareInformation( $( btn ) );

        Controller.addContactNotice.showNotice();
    },

    onDeleteContact: function( self )
    {
        this.list.delegate( ".del_from_cl", "click", function()
        {
            if ( self.tryToDeleteContacts() )
            {
                self.setRemoveData( this );
                self.deleteContactHandler( this );
            }
        });
    },

    tryToDeleteContacts: function()
    {
        if ( !App.IsInit.login ) { return false; }

        if ( !Model.checkRequest( "remove_contact" ) )
        {
            View.displayInnerNotice( "Дождитесь удаления контакта", "info" );
            return false;
        }

        return true;
    },

    setRemoveData: function( btn )
    {
        this.remove_data = this.prepareInformation( $( btn ) );
    },

    deleteContactHandler: function()
    {
        var self = this;

        Model.getRequest( this.remove_data.contact_data, "remove_contact", function( json )
        {
            if ( json.result === "RESULT_OK" )
            {
                self.deleteContact( json );
            }
        });
    },

    deleteContact: function()
    {
        var id = this.remove_data.contact.profile_id;

        this.setContactStatus( "out-contact-list", "add_to_cl", this.remove_data );

        this.That.Model.removeContactFromList( id );

        Controller.ContactList.removeContact( id );
        Controller.Chat.deleteUser( this.remove_data.contact.profile_id );
    },

    onAddGroup: function( self )
    {
        App.PubSub.subscribe( "contacts", "add_group", function( data )
        {
            self.addGroupHandler( data );
        });
    },

    onAddContact: function( self )
    {
        App.PubSub.subscribe( "contacts", "accept_add", function( group_id )
        {
            self.addContactsHandler( group_id );
        });
    },

    addGroupHandler: function( data )
    {
        var self = this;
        Model.getRequest( data, "add_group", function( json )
        {
            if ( json.result === "RESULT_OK" ) {
                var d = {
                    group_id: json.group_id,
                    parent_id: null
                }
                Controller.ContactList.addGroup(d);
                self.addContactsHandler( json.group_id );
            }
        });
    },

    addContactsHandler: function( group_id )
    {
        var self = this;

        if ( group_id !== "null" )
        {
            this.add_data.contact_data.group_id = group_id;
        }

        Controller.addContactNotice.showPreloader();

        Model.getRequest( this.add_data.contact_data, "add_contact", function( json )
        {
            if ( json.result === "RESULT_OK" )
            {
                self.successAddContact( group_id );
            }

            self.hideAddContactCard();
        });
    },

    successAddContact: function( group_id )
    {
        this.setContactStatus( "in-contact-list", "del_from_cl", this.add_data );
        this.addContactsToOtherWidgets();
        this.addContact( group_id );
    },

    addContactsToOtherWidgets: function()
    {
        Controller.Chat.addUser( this.add_data.contact );
        Controller.Sticker.addUser( this.add_data.contact );
        Controller.TextStatus.addUser( this.add_data.contact );
    },

    hideAddContactCard: function()
    {
        Controller.addContactNotice.hidePreloader();
        Controller.addContactNotice.hideSelect();
        Controller.addContactNotice.hideNotice();
    },

    addContact: function( group_id )
    {
        this.add_data.contact.in_contact_list = true;
        this.add_data.contact.contact_id      = this.add_data.contact.profile_id;
        this.add_data.contact.group_id        = group_id;

        Controller.ContactList.addContact( this.add_data.contact );

        this.That.Model.addContactToList( this.add_data.profile_id );
    },

    setContactStatus: function( status, button, obj )
    {
        var table_contact = this.That.View.nodes.table_scroll_case.find( "#profile-id-" + obj.profile_id );

        if ( obj.container === ".contact" &&
            Model.activated_profile.profile_id == obj.profile_id )
        {
            button === "add_to_cl" ?
                this.That.View.Card.notInList() : this.That.View.Card.inList();
        }

        if ( table_contact.length )
        {
            switch( status )
            {
                case "in-contact-list":
                {
                    table_contact.find( ".in-contact-list" ).addClass( "display-block" );
                    table_contact.find( ".out-contact-list" ).hide();
                }
                break;

                case "out-contact-list":
                {
                    table_contact.find( ".in-contact-list" ).removeClass( "display-block" );
                    table_contact.find( ".out-contact-list" ).show();
                }
                break;
            }
        }
    },

    prepareInformation: function( btn )
    {
        var o = {};

        o.container  = this.That.View.getContactContainer();
        o.profile_id = btn.closest( o.container ).attr( "id" ).substr( 11 );
        o.contact    = this.That.Model.getContactsData( o.profile_id );

        o.contact_data =
        {
            contact_id: o.contact.profile_id,
            session_id: Model.session_id,
            profile_id: Model.profile_id
        };

        return o;
    },

    onFocusSearchInput: function()
    {
        var advanced = $( ".advanced" );

        $( "#q" ).click( function()
        {
            advanced.show();
        });

        $( "#q" ).blur( function()
        {
            advanced.hide();
        });
    }
};