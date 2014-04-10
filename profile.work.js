Profile.Controller.Work = function( context )
{
    var a = {}, Self = {}, city_limit = 50, work_build = false, job_positions = {},tran_profile;

    Self =
    {
        cacheObjects: function() {
            var work_tab = context.find(".work");
            Self.nodes = a =
            {
                job_tab:            context.find(".profile_menu ul li.job_tab"),
                profile_editor:     context.find(".profile_editor"),
                profile_content:    context.find(".profile_content"),
                job_country:        work_tab.find("#job_country"),
                job_city:           work_tab.find("#job_city"),
                job_position:       work_tab.find("#job_position"),
                job_description:    work_tab.find("#job_description"),
                job_status:         work_tab.find("#job_status"),
                jobs:               work_tab.find("#jobs_table"),
                job_status_vis:     work_tab.find("#job_status_vis"),
                period_month_since: work_tab.find("#period_month_since"),
                period_year_since:  work_tab.find("#period_year_since"),
                period_month_until: work_tab.find("#period_month_until"),
                period_year_until:  work_tab.find("#period_year_until"),
                job_company:        work_tab.find("#job_company"),
                job_row:            work_tab.find(".job_row "),
                new_job:            work_tab.find(".new_job"),
                turn:               work_tab.find(".turn"),
                to_date_checkbox:   work_tab.find("#to_date"),
                add_more_job:       work_tab.find("#add_more_work"),
                user_location:      null
            }
            tran_profile = Controller.ProfileHelper.getTranslation();
        },

        bindEvents: function() {
            Self.onCheckCurrently();
            Self.onAddMoreJobs();
            Self.onDeleteJob();
            Self.onChangeCountry();
            Self.onWorkOpenByUrlChange();
            Self.onOpenWorkTab();
            Self.onSetVisibilityJob();
            Self.onHideAddingJob();
            Self.onChangeStatus();
            Controller.ProfileHelper.onMoreCity(a.job_city,a.job_country,'job');
        },

        getWorkData: function() {
            Controller.ProfileHelper.scrollInit(a.profile_content);
            if (!work_build) {
                Self.getJobs(function(json) {
                    Self.buildJobs(json.data);
                });
                Self.getJobPositions(function(positions, is_new) {
                    a.job_position.empty().hide();
                    var content = '',position_group = '', first_group = true;
                    Self.initPeriodContent();
                    $.each(positions, function (i, val) {
                        if (position_group != positions[i]['occupation_group_name']) {
                            if (!first_group) {
                                content += '</optgroup>';
                            }
                            position_group = positions[i]['occupation_group_name'];
                            content += '<optgroup label="'+position_group+'">';
                            first_group = false;
                        }
                        content += '<option value=' + positions[i]['occupation_id'] + '>' + positions[i]['occupation_name'] + '</option>';
                    })
                    content += '</optgroup>';
                    a.job_position.html(content);
                    a.job_position.show();
                    if (is_new)
                        a.job_position.chosen({});
                    else
                        a.job_position.trigger('chosen:updated');
                });
                $("#country_loc_tmpl").tmpl( Controller.ProfileHelper.getCountries()).appendTo(a.job_country);
                a.user_location = Controller.ProfileHelper.getUserLocation();
                a.job_country.val(a.user_location.country);
                a.job_country.chosen({});
                var select_country = a.user_location.country;

                if (!select_country)
                    select_country = a.job_country.find("option:first-child").val();
                Controller.ProfileHelper.getCity(select_country,city_limit,0,null,function(city) {
                    if (city) {
                        Controller.ProfileHelper.buildCity(city,a.user_location.city, true,$('#job_city'),$("#job_country"));
                        Self.buildJobStatus();
                        Controller.ProfileHelper.resize(a.profile_content);
                    } else {
                        console.log('## error load city');
                    }
                })

                work_build = true;
            } else {
                //Controller.ProfileHelper.scrollInit(a.profile_content);
            }
        },

        getJobPositions: function( callback )
        {
            var count = 0, i;
            for (i in job_positions) {
                if (job_positions.hasOwnProperty(i)) {
                    count++;
                }
            }
            if (count == 0) {
                var data = Model.getRequestData();
                $.extend(data,App.Language.getCurrentLanguage());
                Model.getRequest( data, "occupation_list", function( json )
                {
                    if ( json.result === "RESULT_OK" )
                    {
                        job_positions = json.data
                        callback(job_positions, true);
                    }
                });
            } else {
                callback(job_positions, false);
            }
        },

        getJobs: function(callback)
        {
            Model.getRequest( Model.getRequestData(), "job_list", function( json ) {
                callback(json);
            })
        },

        buildJobStatus: function()
        {
            var options = Controller.ProfileHelper.getVisibilityItems();
            $.each(options, function(key, value) {
                a.job_status
                    .append($("<option></option>")
                        .attr("value",key)
                        .text(value));
            });
            a.job_status.val(1);
            a.job_status.chosen({});
        },

        buildJobs: function(data) {
            a.jobs.empty();
            $.each(data,function(i,val) {
                var _data = data[i];
                if (_data.job_end == null) {
                    _data.job_end = tran_profile['TEXT_TO_DATE'];
                } else {
                    var end_date = new Date(data[i].job_end);
                    _data.job_end = Controller.ProfileHelper.getMonth(end_date.getMonth() + 1) +' '+end_date.getFullYear();
                }
                switch(_data.visibility) {
                    case 0:
                        _data.visibility = 'eye_0';
                        break;
                    case 1:
                        _data.visibility = 'eye_1';
                        break;
                    case 2:
                        _data.visibility = 'eye_2';
                        break;
                }
                var start_date = new Date(data[i].job_start);
                _data.job_start = Controller.ProfileHelper.getMonth(start_date.getMonth() + 1) +' '+start_date.getFullYear();
                Controller.ProfileHelper.getCityById(_data.city_id, function(city_name) {
                    _data.city_name = city_name;
                    $('#jobs_tmpl').tmpl(_data).prependTo(a.jobs);
                    Controller.ProfileHelper.resize(a.profile_content);
                });
            })
        },


        onCheckCurrently: function()
        {
            a.to_date_checkbox.change(function() {
                if ($(this).is(':checked')) {
                    $('#period_month_until').attr('disabled','disabled');
                    $('#period_year_until').attr('disabled','disabled');
                } else {
                    $('#period_month_until').removeAttr('disabled');
                    $('#period_year_until').removeAttr('disabled');
                }
                $('#period_month_until').trigger('chosen:updated');
                $('#period_year_until').trigger('chosen:updated');
            });
        },

        onAddMoreJobs: function()
        {
            a.add_more_job.click(function() {
                if (!a.new_job.is(":visible")) {
                    a.new_job.slideDown();
                }
                return false;
            });
        },

        onChangeCountry: function () {
            a.job_country.live('change', function () {
                var country_id = $(this).val();
                Controller.ProfileHelper.getCity(country_id, city_limit, 0,null, function(city) {
                    if (city) {
                        Controller.ProfileHelper.buildCity(city,null,false, a.job_city,a.job_country);
                    } else {
                        console.log('## error load city');
                    }
                });

            });
        },

        onDeleteJob: function () {
            $('#jobs_table').delegate('.job_delete','click',function () {
                var _this = $(this);
                var data = Model.getRequestData();
                var job_id = $(this).parents('.job_row').find('.job_id').val();
                $.extend(data, {job_id: job_id});
                Model.getRequest(data, "job_remove", function (json) {
                    _this.parents('.job_row').empty().remove();
                    Controller.ProfileHelper.resize(a.profile_content);
                });
                return false;
            });
        },

        onWorkOpenByUrlChange: function()
        {
            App.Router.on( "work", function( event, data )
            {
                App.Widget.open( context );

                if ( Model.profile.result !== "RESULT_OK" )
                {
                    Self.getWorkData();
                }
            });
        },

        onOpenWorkTab: function() {
            a.job_tab.click(function() {
                Self.getWorkData();
            })
        },

        onHideAddingJob: function() {
            a.turn.click(function() {
                a.new_job.slideUp();
            });
            a.new_job.delegate('.job_delete','click', function() {
                a.new_job.slideUp();
            })
        },

        onChangeStatus: function()
        {
            a.job_status_vis.click(function() {
                if ($(this).hasClass('eye_0')) {
                    a.job_status.val(2);
                } else if ($(this).hasClass('eye_1')) {
                    a.job_status.val(0);
                } else {
                    a.job_status.val(1);
                }
                a.job_status.trigger('chosen:updated');
            })

            a.job_status.change(function() {
                a.job_status_vis.removeClass();

                if ($(this).val() == 0) {
                    a.job_status_vis.addClass('eye eye_0')
                } else if ($(this).val() == 1) {
                    a.job_status_vis.addClass('eye eye_1')
                } else {
                    a.job_status_vis.addClass('eye eye_2')
                }
            })
        },

        save: function (_this) {
            var data = Model.getRequestData();
            var start_job = $('#period_year_since').val() + '-' + $('#period_month_since').val() + '-01';
            $.extend(data, {job_start: start_job});
            if (!$('#to_date').is(':checked')) {
                var end_job = $('#period_year_until').val() + '-' + $('#period_month_until').val() + '-01';
                $.extend(data, {job_end: end_job});
            }
            $.extend(data, {company: a.job_company.val()});
            if ($('#job_project').val() != '') {
                $.extend(data, {project: $('#job_project').val()});
            }
            $.extend(data, {occupation_id: $('#job_position').val()});
            $.extend(data, {description: $('#job_description').val()});
            $.extend(data, {country_id: $('#job_country').val()});
            $.extend(data, {city_id: $('#job_city').val()});

            if (a.job_status_vis.hasClass('eye_1')) {
                $.extend(data, {visibility: 1});
            } else if (a.job_status_vis.hasClass('eye_2')) {
                $.extend(data, {visibility: 2});
            } else {
                $.extend(data, {visibility: 0});
            }
            Model.getRequest(data, "add_job", function (json) {
                if (json.result === 'RESULT_OK') {
                    Self.getJobs(function (json) {
                        Self.buildJobs(json.data);
                    });
                    _this.parents('.keyvalue').css('display', 'none');
                } else {
                    console.log('#### Error save a job', json.result);
                }
            })

        },

        onSetVisibilityJob: function() {
            a.jobs.delegate('.vision_field .eye','click',function() {
                if ($(this).hasClass('eye_1')) {
                    $(this).closest('.job_row').addClass('disable');
                } else {
                    $(this).closest('.job_row').removeClass('disable');
                }
            });
        },

        initPeriodContent: function() {
            App.TMPL.data.birthday = Controller.ProfileHelper.initMonths();
            a.new_job.find('.periodBlock .period_box').empty().remove();
            $( "#period_tmpl" ).tmpl( App.TMPL.data.birthday ).prependTo( a.new_job.find('.periodBlock'));

            $('#period_month_since').chosen({});
            $('#period_year_since').chosen({});
            $('#period_month_until').chosen({});
            $('#period_year_until').chosen({});
        },

        clearJob: function() {
            a.job_company.val("");
            a.job_description.val("");
            a.job_position.val([]);
            $('#period_month_since').val([]);
            $('#period_year_since').val([]);
            $('#period_month_until').val([]);
            $('#period_year_until').val([]);
            a.job_position.trigger('chosen:updated');
            $('#period_month_since').trigger('chosen:updated');
            $('#period_year_since').trigger('chosen:updated');
            $('#period_month_until').trigger('chosen:updated');
            $('#period_year_until').trigger('chosen:updated');
            a.to_date_checkbox.attr('checked', false);

        },

        init: function()
        {
            Self.build();
            Self.bindEvents();
        },

        build: function()
        {
            Self.cacheObjects();
        }
    }

    Self.init();

    return Self;
};