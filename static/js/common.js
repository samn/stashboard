// Common functions used on all pages

var stashboard = {};

// Display a message
stashboard.displayMessage = function(message, klass){
    $("#notice span").text(message);
    $("#notice").removeClass().addClass(klass).show();
};

// Display an error message
stashboard.error = function(message){
    stashboard.displayMessage(message, "error");
};

// Display an error message
stashboard.success = function(message){
    stashboard.displayMessage(message, "success");
};

// Display an info message
stashboard.info = function(message){
    stashboard.displayMessage(message, "info");
};

stashboard.rfc1123 = function(date){
    var rfc = $.datepicker.formatDate("D, d M yy", date);
    rfc = rfc + " " + date.getHours() + ":";
    rfc = rfc + date.getMinutes() + ":" + date.getSeconds();
    var offset = date.getTimezoneOffset();
    var minutes = offset % 60;
    var hours = (offset - minutes) / 60;
    var off;

    if (offset < 0) {
        off = "+";
	hours = -hours;
    } else {
        off = "-";
    }
  
    if (hours < 10) {
        off += "0";
    } 
    off += hours.toString();

    if (minutes < 10) {
        off += "0";
    }
    off += minutes.toString();
    return rfc + " " + off;
};

stashboard.fillLegend = function(isAdmin) {
    var createStatusRow = function(data){
        var tr = $("<tr />");

        $("<td />", {"class": "icon"}).append(
            $("<img />", {
                src: data.image,
                alt: data.name
            })
        ).appendTo(tr);

        $("<td />", {"class": "description", text: data.description}).appendTo(tr);

        if (isAdmin) {

            var edit = $("<a />", {text: "Edit", href: data.url});

            $("<td />", {"class": "level", text: data.level}).appendTo(tr);
            $("<td />", {html: edit}).appendTo(tr);
            $("<td />", {html: 
                $("<a />", {text: "Delete", href: data.url, "class": "delete-status"})
            }).appendTo(tr);

            edit.click(function(e) {
                e.preventDefault();
                var a = $(e.target);
                var tr = a.parent().parent();
                var img = tr.children(".icon").children("img");
                //This is somewhat ugly
                var value = img.attr("src").split("/").pop().slice(0, -4);

                $("#status-name").val(img.attr("alt"));
                $("#status-description").val(tr.children(".description").text());
                $("#statusLevel").val(tr.children(".level").text());
                $("input[name=status-image]:checked").attr("checked", false);
                $("input[value=" + value + "]").attr("checked", true);

                $("#add-status-modal").dialog({
                    height: 515,
                    width: 460,
                    resizable: false,
                    autoOpen: true,
                    modal: true,
                    buttons: {
                        'Save': function(){
                            $.ajax({ 
                                type: "POST",
                                url: a.attr("href"),
                                data: { 
                                    name: $("#status-name").val(), 
                                    description: $("#status-description").val(),
                                    image: $("input[name=status-image]:checked").val(),
                                    level: $("#statusLevel").val()
                                },
                                dataType: 'json', 
                                context: tr,
                                success: function(data){ 
                                    $("#add-status-modal").dialog('close');
                                    this.children(".description").text(data.description);
                                    this.children(".level").text(data.level);
                                    this.children(".icon").children("img").attr("alt", data.name);
                                    this.children(".icon").children("img").attr("src", data.image);
                                },
                                error: function(){ 
                                    $("#add-status-modal").dialog('close');
                                    stashboard.error("Could not save status");
                                }
                            });
                        },
                        'Cancel': function(){
                            $(this).dialog('close');
                        }
                    }
                });
          });
      }
      $("#legend-body").append(tr);
    };

    $("#add-status").click(function(){
        $("#status-name").val("");
        $("#status-description").val("");
        $("#statusLevel").val("");
        $("#add-status-modal").dialog('open');
        $("input[name=status-image]").attr("checked", false);
    });


    $.ajax({ 
        type: "GET",
        url: "/api/v1/statuses",
        dataType: 'json', 
        success: function(data){ 

            if (data){
                var statuses = data.statuses;
                for (var i=0; i < statuses.length; i++) {
                    createStatusRow(statuses[i]);
                }
            }

        },
        error: function(){}
    });

    $.ajax({
          type: "GET",
          url: "/api/v1/levels",
          dataType: "json",
          context: $("#statusLevel"),
          success: function(data){
              if (data){
                  var levels = data.levels;
                  for (var i=0; i < levels.length; i++) {
                      $("<option />", {
                          "name": "level",
                          val: levels[i],
                          text: levels[i]
                          }).appendTo($(this)
                      );
                  }
              }
          },
          error: function(){}
      });

      $("#add-status-modal").dialog({
          height: 515,
          width: 460,
          resizable: false,
          modal: true,
          autoOpen: false,
          buttons: {
              'Create Status': function(){
                  $.ajax({ 
                      type: "POST",
                      url: "/api/v1/statuses",
                      data: { 
                          name: $("#status-name").val(), 
                          description: $("#status-description").val(),
                          image: $("input[name=status-image]:checked").val(),
                          level: $("#statusLevel").val()
                      },
                      dataType: 'json', 
                      context: $(".legend").children('tbody'), 
                      success: function(data){ 
                          $("#add-status-modal").dialog('close');
                          createStatusRow(data);
                      },
                      error: function(){ 
                          $("#add-status-modal").dialog('close');
                          stashboard.error("Could not create new status due to missing information");
                      }
                  });
              },
              'Cancel': function(){
                  $(this).dialog('close');
              }
          }
      });


      $(".delete-status").live('click', function(e){
          e.preventDefault();
          var a = $(e.target);
          $("#delete-status-modal").dialog({
              resizable: false,
              modal: true,
              buttons: {
                  'Delete Status': function(){
                      $.ajax({ 
                          type: "DELETE",
                          url: a.attr("href"),
                          dataType: 'json',
                          context: $("#delete-status-modal"),
                          success: function(data){
                              a.parent().parent().remove();
                              this.dialog('close');
                          },
                          error: function(){
                              this.dialog('close');
                              stashboard.error("Unable to delete status");
                          }	      
                      });
                  },
                  'Cancel': function(){
                      $(this).dialog('close');
                  }
              }
          });

      });
};

stashboard.fillIndex = function() {
    var thead = $("#service-list thead tr");
    var numDays = (stashboard.endDate.getTime() - stashboard.startDate.getTime()) / 86400000;

    var createDates = function(numDays) {
        var today = $('th.today');
        var d = new Date(stashboard.startDate.getTime() + 86400000);
        for (var i=0; i < numDays; i++) {
            $("<th />", {
                "class": "date",
                text: (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear().toString().substr(2)
            }).insertAfter(today);
            d = new Date(d.getTime() + 86400000);
        }
    };

    updateTable = function() {
        var tbody = renderServices(stashboard.services);
        $(".services-body").html(tbody.html());
        $('.date').remove();
        createDates(numDays);
    };

    $('#tabs').tabs({
        select: function(event, ui) {
            $.ajax({
                url: '/api/v1/services?region='+$(ui.tab).html(),
                dataType: 'json',
                success: function(data) {
                    stashboard.services = data.services
                    updateTable();
                }
            });
        }
    });

    $('th.today').prev().append(
        $('<a />', {
            'class': 'arrow',
            'text': '<<'
        }).button().click(function() {
            stashboard.startDate = stashboard.endDate;
            stashboard.endDate = new Date(stashboard.startDate.getTime() + 86400000*numDays);
            
            // don't display statuses from the future
            if (stashboard.endDate > new Date()) {
                stashboard.endDate = new Date(new Date().getTime() - 86400000);
                stashboard.startDate = new Date(stashboard.endDate - 86400000*numDays);
            }
            updateTable();
        })
    );
        
    createDates(numDays);

    $('<th />').append(
        $('<a />', {
            'class': 'arrow',
            'text': '>>'
        }).button().click(function() {
            stashboard.endDate = stashboard.startDate;
            stashboard.startDate = new Date(stashboard.endDate.getTime() - 86400000*numDays);

            if (new Date().getTime() - stashboard.startDate.getTime() - 86400000 >= 86400000*(stashboard.historySize+1)) {
                stashboard.endDate = new Date(new Date().getTime() - 86400000);
                stashboard.startDate = new Date(stashboard.endDate - 86400000*numDays);
            }
            updateTable();
        })
    ).appendTo(thead);


    var createServiceRow = function(data, fetchStatuses){
        var informationImage = "/images/status/question-white.png";
        var defaultImage = "/images/status/tick-circle.png";
        var imageRow = defaultImage;
        var tr = $('<tr />', {id: data.id});

        $('<td />').append(
            $('<a />', {
                href: 'services/' + data.id,
                text: data.name
            })
        ).appendTo(tr);

        if (fetchStatuses) {
            imageRow = informationImage;
        }
        
        $('<td />', {"class": "status highlight"}).append(
            $('<a />', {
                href: 'services/' + data.id,
                html: $("<img />", {
                    src: imageRow,
                    alt: "Unknown Status"
                })
            })
        ).appendTo(tr);

        for (var i=0; i < numDays; i++) {
            $("<td />", {"class": "status"}).append(
                $("<img />", {
                    src: imageRow,
                    alt: "Unknown Status"
                })
            ).appendTo(tr);
        }

        if (fetchStatuses){

            $.ajax({ 
                type: "GET",
                url: "/api/v1/services/" + data.id + "/events/current",
                dataType: 'json', 
                success: function(evt){ 
                    $("#" + data.id + " td.highlight img")
                        .attr("src", evt.status.image);

                    if (evt.informational) {
                        $("#" + data.id + " td.highlight a").append(
                            $("<img />", {
                                src: "/images/small-information.png", 
                                "class": "information"
                            })
                        );
                    }
                },
                error: function(evt){ 
                    $("#" + data.id + " td.highlight img")
                        .attr("src", defaultImage);
                }
            });

            var url = "/api/v1/services/" + data.id + "/events";
            url += "?start=" + stashboard.rfc1123(stashboard.startDate);
            url += "&end=" + stashboard.rfc1123(stashboard.endDate);

            $.ajax({ 
                type: "GET",
                url: url,
                dataType: 'json', 
                success: function(results){ 
                    var calendar = {};
                    var days = [];
                    var end = stashboard.endDate;

                    for (var i=0; i < numDays; i++) {
                        days.push(end);
                        calendar[end.getDate()] = false;
                        end = new Date(end.getTime() - 86400000);
                    }

                    var events = results.events;

                    for (i=0; i < events.length; i++) {
                        var e = events[i];
                        var evtDate = new Date(e.timestamp);
                        calendar[evtDate.getDate()] = e.informational || e.status.level !== "NORMAL";
                    }

                    for (i= days.length-1; i >= 0; i--) {
                        var d = days[i];
                        var td = $("#" + data.id).children("td").eq(i+2);

                        url = "/services/" + data.id + "/" + d.getFullYear() + "/";
                        url += (d.getMonth() + 1) + "/" + d.getDate();

                        if (calendar[d.getDate()]) {
                            td.html($("<a />", {href: url}).append(
                                $("<img />",{src: "/images/status/information.png"}))
                            );
                        } else {
                            td.html($("<a />", {href: url}).append(
                                $("<img />",{src: defaultImage}))
                            );
                        }
                    }

                },
                error: function(){ 

                }
            });
        }

        return tr;
    };

    $.ajax({ 
        type: "GET",
        url: "/api/v1/services?region="+$("#tabs a:first").html(),
        dataType: 'json', 
        success: function(data){ 
            stashboard.services = data.services
            var tbody = renderServices(stashboard.services);
            $("#service-list").fadeIn('fast', function(){    
                $(tbody).replaceAll(".services-body")
            });
        },
        error: function(){ }
    });

    var renderServices = function(services) {
        var tb = $("<tbody />", {"class": "services-body"});
        for (var i=0; i < services.length; i++) {
            var row = createServiceRow(services[i], true);
            tb.append(row);
        }
        return tb;
    };

    $("#statusBox").click(function(){
        if($(this).is(":checked")){
            $("#submit .status").removeAttr('disabled');
        } else {
            $("#submit .status").attr('disabled', 'disabled');
        }
    });

    $("#messageBox").click(function(){
        if($(this).is(":checked")){
            $("#submit .message").removeAttr('disabled');
        } else {
            $("#submit .message").attr('disabled', 'disabled');
        }
    });

    $("#add-service").click(function(){
        $("#add-service-modal").dialog('open');
    });

    $("#add-service-region").button().click(function() {
        $.ajax({
            type: 'GET',
            url: '/api/v1/regions',
            dataType: 'json',
            success: function(data) {
                var regions = data.regions;
                var select = $('<select>', {'name': 'service-region', 'id': 'service-region'});
                for (var i=0, l=regions.length; i < l; i++) {
                    $('<option />', {
                      'value': data.regions[i].name,
                      'text': data.regions[i].name
                    }).appendTo(select);
                }
                $('#add-service-region').replaceWith($('<div>') 
                    .append($('<label>', {
                      'for': 'service-region',
                      'text': 'Region (optional)'
                    })).append(select));
            }
        });
    });


    $("#add-service-modal").dialog({
        height: 360,
        width: 460,
        resizable: false,
        modal: true,
        autoOpen: false,
        buttons: {
            'Create Service': function(){
                $.ajax({ 
                    type: "POST",
                    url: "/api/v1/services",
                    data: { 
                        name: $("#service-name").val(), 
                        description: $("#service-description").val(),
                        region: $("#service-region").val()
                    },
                    dataType: 'json', 
                    context: $("#service-list"), 
                    success: function(data){ 
                        $("#add-service-modal").dialog('close');
                        createServiceRow(data, false);
                    },
                    error: function(evt){ 
                        $("#add-service-modal").dialog('close');
                        stashboard.error("Could not create service. Make sure Name and Description are valid");
                    }
                });

            },
            'Cancel': function(){
                $(this).dialog('close');
            }
        }
    });

    $("#add-region").click(function(){
        $("#add-region-modal").dialog('open');
    });

    $("#add-region-modal").dialog({
        height: 170,
        width: 460,
        resizable: false,
        modal: true,
        autoOpen: false,
        buttons: {
            'Create Region': function(){
                $.ajax({ 
                    type: "POST",
                    url: "/api/v1/regions",
                    data: { 
                        name: $("#region-name").val()
                    },
                    dataType: 'json', 
                    context: $("#service-list"), 
                    success: function(data){ 
                        $("#add-region-modal").dialog('close');
                    },
                    error: function(evt){ 
                        $("#add-region-modal").dialog('close');
                        stashboard.error("Could not create region. Make sure Name is unique");
                    }
                });

            },
            'Cancel': function(){
                $(this).dialog('close');
            }
        }
    });
};

stashboard.adminRegionTabs = function() {
    $("#tabs").tabs().find(".ui-tabs-nav").sortable({
        axis: "x",
        update: function(event, ui) {
            var list = [];
            $(this).children().each(function(idx) {
                list[idx] = $(this).children().html();
            });
            $.ajax({
                type: 'POST',
                url: '/api/v1/regions',
                data: {regions: list.toString()}
            });
        }
    });
    
};

stashboard.fillService = function(serviceName, isAdmin, start_date, end_date) {
    var createRow = function(data) {
        var d = new Date(data.timestamp);
        var time = $.datepicker.formatDate("MM d, ", d);
        var hour;
        var period; 

        if (d.getHours() < 12) {
            if (d.getHours() === 0) {
                hour = 12;
            } else {
                hour = d.getHours();
            }
            period = "AM";
        } else if (d.getHours() == 12){
            hour = d.getHours();
            period = "PM";
        } else {
            hour = d.getHours() - 12;
            period = "PM";
        }

        if (d.getMinutes() < 10) {
            time += hour + ":0" + d.getMinutes() + period; 
        } else {
            time += hour + ":" + d.getMinutes() + period;
        }

        var tr = $('<tr />');

        $('<td />', {text: time}).appendTo(tr);

        if (data.informational) {
            image = "/images/status/information.png";
        } else {
            image = data.status.image;
        }

        $('<td />', {"class": "status highlight"}).append(
            $('<img />', {
                src: image, 
                alt: data.status.name
            })
        ).appendTo(tr);

        $('<td />', {text: data.message}).appendTo(tr);

        if (isAdmin) {

            $('<td />', {"class": "delete"}).append(
                $('<a />', {href: data.url}).append(
                    $('<img />', {
                        src: "/images/status/minus-circle.png",
                        alt: "Delete"
                    })
                )
            ).appendTo(tr);

        }

        return tr;
    };


    $.ajax({
        type: "GET",
        url: "/api/v1/services/" + serviceName,
        dataType: "json",
        success: function(service){

            $("h2 span").text(service.name);
            $("#serviceDescription").text(service.description);
            $("#serviceRegion").text(service.region);

            var populatStatuses = function(current) {

                $.ajax({
                    type: "GET",
                    url: "/api/v1/statuses",
                    dataType: "json",
                    context: $("#statusValue"),
                    success: function(data){

                        var statuses = data.statuses;

                        for (var i=0; i < statuses.length; i++) {

                            var selected = false;
                            if (current === statuses[i].name){
                                selected = true;
                            }
                            $("<option />", {
                                "name": "severity",
                                val: statuses[i].id,
                                text: statuses[i].name,
                                selected: selected
                            }).appendTo($(this));
                        }
                    },
                    error: function(){}
                });
                
            };

            eventsURL = "/api/v1/services/" + service.id + "/events";

            if (start_date){
                var start = stashboard.rfc1123(start_date);
                var end = stashboard.rfc1123(end_date);
                eventsURL += "?start=" + start;
                eventsURL += "&end=" + end;
            }

            $.ajax({ 
                type: "GET",
                url: eventsURL,
                dataType: "json",
                context: $(".event-log").children('tbody'), 
                success: function(data){

                    var events = data.events;
                    var length = events.length;

                    if (length > 0) {
                        populatStatuses(events[0].status.name);
                        for (var i=0; i < length; i++) {
                            var tr = createRow(events[i]);
                            $(this).append(tr);  
                        }
                    } else {
                        populatStatuses();
                    }
                },
                error: function(){
                    populatStatuses();
                }
            });

            $("#delete-service").click(function(event){
                $("#delete-service-modal").dialog({
                    resizable: false,
                    modal: true,
                    buttons: {
                        'Delete Service': function(){
                            $.ajax({ 
                                type: "DELETE",
                                url: "/api/v1/services/" + service.id,
                                dataType: 'json', 
                                success: function(data){
                                    location.replace("/");  
                                }
                            });
                        },
                        'Cancel': function(){
                            $(this).dialog('close');
                        }
                    }
                });
            });

            $("#update-status").click(function(event){
                event.preventDefault();
                $("#add-event-modal").dialog({
                    height: 290,
                    width: 460,
                    resizable: false,
                    modal: true,
                    buttons: {
                        'Update Status': function(){
                            $.ajax({ 
                                type: "POST",
                                url: "/api/v1/services/" + service.id + "/events",
                                data: {
                                    status: $("#statusValue").val(),
                                    message: $("#eventMessage").val()
                                },
                                dataType: "json",
                                context:$("#add-event-modal"), 
                                success: function(data){
                                    this.dialog('close');
                                    var tr = createRow(data);
                                    $(".event-log").children('tbody').prepend(tr);
                                },
                                error: function(){
                                    this.dialog('close');
                                    stashboard.error("Could not create event due to missing form data");
                                }
                            });
                        },
                        'Cancel': function(){
                            $(this).dialog('close');
                        }
                    }
                });
            });

            $("#add-note").click(function(event){
                event.preventDefault();
                $("#add-note-modal").dialog({
                    height: 250,
                    width: 460,
                    resizable: false,
                    modal: true,
                    buttons: {
                        'Add Note': function(){
                            $.ajax({ 
                                type: "POST",
                                url: "/api/v1/services/" + service.id + "/events",
                                data: {
                                    message: $("#noteMessage").val(),
                                    informational: "true"
                                },
                                dataType: "json",
                                context:$("#add-note-modal"), 
                                success: function(data){
                                    this.dialog('close');
                                    var tr = createRow(data);
                                    $(".event-log").children('tbody').prepend(tr);
                                },
                                error: function(){
                                    this.dialog('close');
                                    stashboard.error("Could not create note due to missing message");
                                }
                            });
                        },
                        'Cancel': function(){
                            $(this).dialog('close');
                        }
                    }
                });
            });

            $("#service-name").val(service.name);
            $("#service-description").val(service.description);
            $("#service-region").append($('<option>', {
                'value': service.region,
                'text': service.region
            }));


            $("#edit-service").click(function(e){
                e.preventDefault();

                // populate the regions dropdown
                $.ajax({
                    type: 'GET',
                    url: '/api/v1/regions',
                    dataType: 'json',
                    success: function(data) {
                        var select = $('#service-region');
                        var existing = select.children().val();
                        var regions = data.regions;
                        for (var i=0, l=regions.length; i < l; i++) {
                            if (regions[i].name != existing) {
                                $('<option />', {
                                  'value': data.regions[i].name,
                                  'text': data.regions[i].name
                                }).appendTo(select);
                            }
                        }
                    }
                });

                $("#edit-service-modal").dialog({
                    height: 360,
                    width: 460,
                    resizable: false,
                    modal: true,
                    buttons: {
                        'Edit Service': function(){
                            $.ajax({ 
                                type: "POST",
                                url: "/api/v1/services/" + service.id,
                                data: { 
                                    name: $("#service-name").val(), 
                                    description: $("#service-description").val(),
                                    region: $("#service-region").val()
                                },
                                dataType: 'json', 
                                success: function(data){ 
                                    $("#edit-service-modal").dialog('close');
                                    $("#serviceDescription").text(data.description);
                                    $("#serviceRegion").text(data.region);
                                    $("h2 span").text(data.name);
                                    $("#service-name").val(data.name);
                                    $("#service-description").val(data.description);
                                    $("#service-region").val(data.region);
                                },
                                error: function(evt){ 
                                    $("#edit-service-modal").dialog('close');
                                    stashboard.error("Could not create edit service information");
                                }
                            });

                        },
                        'Cancel': function(){
                            $(this).dialog('close');
                        }
                    }
                });
            });

        },
        error: function(){}
    });

    $("td.delete a").live('click', function(e){
        e.preventDefault();
        $.ajax({ 
            type: "DELETE",
            data: {},
            url: $(this).attr("href"), 
            context: $(this).parent().parent(), 
            success: function(){
                $(this).fadeOut('fast', function(){
                    $(this).remove();
                });
            },
            error: function(){
                stashboard.error("Could not deleted event. Please try again");
            }
        });
    });
};
  
