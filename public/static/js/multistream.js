var chat_hidden = false;
var num_streams = -1;
var streams = new Array();
var chat_tabs;

function optimize_size(n) {
  // Call with n = -1 to use previously known quantity
  if (n == -1) {
    if (num_streams == -1) {
      return;
    } else {
      n = num_streams;
    }
  } else {
    if (n == 0) {
      $("#helpbox").show();
      hide_chat();
    } else {
      $("#helpbox").hide();
      if (num_streams == 0) {
        show_chat();
        chat_tabs.tabs({ active: 0 });
      }
    }
    num_streams = n;
  }

  // Resize chat
  // height is off by 16 due to body margin
  var height = $(window).innerHeight() - 16;
  var width = $("#streams").width();
  if (!chat_hidden) {
    var chat_width = 360;
    var wrapper_width = $("#wrapper").width();
    width = wrapper_width - chat_width - 5;
    var chat_height = height - $("#tablist").height() - 60;
    $("#streams").width(width);
    $("#chatbox").width(chat_width);
    $(".stream_chat").height(chat_height);
  } else {
    var wrapper_width = $("#wrapper").width();
    width = wrapper_width;
    $("#streams").width(width);
  }

  var best_height = 0;
  var best_width = 0;
  var wrapper_padding = 0;
  for (var per_row = 1; per_row <= n; per_row++) {
    var num_rows = Math.ceil(n / per_row);
    var max_width = Math.floor(width / per_row) - 4;
    var max_height = Math.floor(height / num_rows) - 4;
    if ((max_width * 9) / 16 < max_height) {
      max_height = (max_width * 9) / 16;
    } else {
      max_width = (max_height * 16) / 9;
    }
    if (max_width > best_width) {
      best_width = max_width;
      best_height = max_height;
      wrapper_padding = (height - num_rows * max_height) / 2;
    }
  }
  $(".stream").height(Math.floor(best_height));
  $(".stream").width(Math.floor(best_width));
  $("#streams").css("padding-top", wrapper_padding);
}

function absolute_center(object) {
  var window_height = $(window).height();
  var window_width = $(window).innerWidth();
  var obj_height = object.height();
  var obj_width = object.width();
  var pos_x = (window_width - obj_width) / 2;
  var pos_y = (window_height - obj_height) / 2;
  if (pos_x < 0) {
    pos_x = 0;
  }
  if (pos_y < 0) {
    pos_y = 0;
  }
  object.css("position", "absolute");
  object.css("left", pos_x);
  object.css("top", pos_y);
}

function hide_chat() {
  chat_hidden = true;
  $("#chatbox").hide();
  optimize_size(-1);
}

function hide_streams() {
  $("#streams").hide();
}

function show_streams() {
  $("#streams").show();
}

function show_chat() {
  chat_hidden = false;
  $("#chatbox").show();
  optimize_size(-1);
}

function toggle_chat() {
  if (chat_hidden) {
    show_chat();
    if (screen.width <= 550) {
      hide_streams();
    }
  } else {
    hide_chat();
    show_streams();
  }
}

function change_streams() {
  absolute_center($("#change_streams"));
  $("#change_streams").show();
  focus_last_stream_box();
}

function add_stream_item(input) {
  if (input === "Twitch") {
    $("#streamlist_items").append($(twitch_string));
  } else {
    $("#streamlist_items").append($(yt_string));
  }
  absolute_center($("#change_streams"));
  focus_last_stream_box();
}

function stream_item_keyup(e) {
  if (e.keyCode == 13 || e.which == 13) {
    add_stream_item();
    return false;
  }
  return true;
}

function stream_object(name) {
  var out;
  if (name[0] === "@") {
    name = name.substring(1);
    var newName = name.split("=")[0];
    var newUrl = name.split("=")[1];
    out = $(
      '<iframe id="embed_' +
        newName +
        '" src="https://www.youtube.com/embed/' +
        newUrl +
        '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" class="stream" allowfullscreen></iframe>'
    );
  } else {
    out = $(
      '<iframe id="embed_' +
        name +
        '" src="https://player.twitch.tv/?muted=true&channel=' +
        name +
        '&parent=multistreamers.com&parent=www.multistreamers.com" class="stream" allowfullscreen="true"></iframe>'
    );
  }
  return out;
}

function chat_object(name) {
  var out;
  if (name[0] === "@") {
    name = name.substring(1);
    var newName = name.split("=")[0];
    var newUrl = name.split("=")[1];
    out = $(
      '<div id="chat-' +
        newName +
        '" class="stream_chat"><iframe frameborder="0" scrolling="no" id="chat-' +
        newName +
        '-embed" src="https://www.youtube.com/live_chat?is_popout=1&v=' +
        newUrl +
        '&embed_domain=multistreamers.com&parent=www.multistreamers.com" height="100%" width="100%"></iframe></div>'
    );
  } else {
    out = $(
      '<div id="chat-' +
        name +
        '" class="stream_chat"><iframe frameborder="0" scrolling="no" id="chat-' +
        name +
        '-embed" src="https://twitch.tv/embed/' +
        name +
        '/chat?darkpopout&parent=multistreamers.com&parent=www.multistreamers.com" height="100%" width="100%"></iframe></div>'
    );
  }
  return out;
}

function chat_tab_object(name) {
  if (name[0] === "@") {
    name = name.substring(1);
    name = name.split("=")[0];
  }
  return $('<li><a href="#chat-' + name + '">' + name + "</a></li>");
}

var twitch_string =
  '<div class="streamlist_item twitch_item"><input type="text" class="stream_name" placeholder="Twitch Streamer" onkeyup="stream_item_keyup(event)" /></div>';

var yt_string =
  '<div class="streamlist_item yt_item"><input type="text" class="streamer_name" placeholder="Youtube Streamer" onkeyup="stream_item_keyup(event)" /><input type="text" class="stream_id" placeholder="Livestream ID" onkeyup="stream_item_keyup(event)" /></div>';

function update_stream_list() {
  // Update the contents of #streamlist to match streams
  $("#streamlist .streamlist_item").remove();
  $("#streamlist_items .streamlist_item").remove();
  var streamName;
  for (var i = 0; i < streams.length; i++) {
    if (streams[i][0] === "@") {
      streamName = streams[i].substring(1);
      streamName = streamName.split("=")[0];
    } else {
      streamName = streams[i];
    }
    $("#streamlist").append(
      $(
        '<div class="streamlist_item"><input type="checkbox" class="check" checked=true" /> <span>' +
          streamName +
          "</span></div>"
      )
    );
  }
}

function focus_last_stream_box() {
  stream_boxes = $("#streamlist .stream_name");
  if (stream_boxes.length > 0) {
    stream_boxes[stream_boxes.length - 1].focus();
  }
}

function add_stream(name) {
  $("#streams").append(stream_object(name));
  $("#chatbox").append(chat_object(name));
  $("#tablist").append(chat_tab_object(name));
}

function close_change_streams(apply) {
  var new_streams;
  if (apply) {
    // Remove all the streams that got unchecked
    new_streams = new Array();
    var stream_elements = $("#streams .stream");
    var chat_elements = $("#chatbox .stream_chat");
    var chat_tab_elements = $("#tablist li");
    var list_checks = $("#streamlist .check");
    for (var i = 0; i < streams.length; i++) {
      if (!list_checks[i].checked) {
        stream_elements[i].remove();
        chat_elements[i].remove();
        chat_tab_elements[i].remove();
      } else {
        new_streams.push(streams[i]);
      }
    }
    // add new streams
    var new_twitch_inputs = $(".twitch_item .stream_name");
    var new_yt_names = $(".yt_item .streamer_name");
    var new_yt_ids = $(".yt_item .stream_id");

    if (new_twitch_inputs.length > 0) {
      for (var i = 0; i < new_twitch_inputs.length; i++) {
        var stream_name = new_twitch_inputs[i].value;
        if (stream_name == "") {
          continue;
        }
        new_streams.push(stream_name);
        add_stream(stream_name);
        chat_tabs.tabs("refresh");
      }
    }

    if (new_yt_names.length > 0) {
      for (var i = 0; i < new_yt_names.length; i++) {
        var stream_name = new_yt_names[i].value;
        var stream_id = new_yt_ids[i].value;
        if (stream_name == "" || stream_id == "") {
          continue;
        }
        var stream = "@" + stream_name + "=" + stream_id;
        new_streams.push(stream);
        add_stream(stream);
        chat_tabs.tabs("refresh");
      }
    }

    streams = new_streams;
    optimize_size(streams.length);
    var new_url = "";
    for (var i = 0; i < streams.length; i++) {
      new_url = new_url + "/" + streams[i];
    }
    history.replaceState(null, "", new_url);
  }
  $("#change_streams").hide();
  update_stream_list();
}
