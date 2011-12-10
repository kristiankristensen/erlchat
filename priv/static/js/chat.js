var Chat = (function($) {
  var $loginElements;           // elements shown when the user is logged out
  var $usernameField;           // allows the user to input a desired username
  var $loginButton;             // element to which a login function is bound
  var $loginErrors;             // an element where we will place login errors

  var $chatElements;            // elements shown when the user is logged in
  var $usernameDisplay;         // shows the user their current username
  var $messageContainer;        // element to hold messages as they arrive
//    var $messageTemplate = '<li class="{{msgtype}}">        <span class="message-username">{{nickname}}</span>        <span class="message-body">{{{message}}}</span>        <span class="message-timestamp">{{formattedTime}}</span>      </li>';          // a Mustache template for rendering messages
  var $composeMessageField;     // allows the user to input a chat message
  var $sendMessageButton;       // element to attach a "send message" function to
  var $logoutButton;            // element to which a logout function is bound
  var $chatErrors;              // an element where we will place chat errors

  var username = '';            // holds the currently logged in username.  If this
  var loggedIn = false;
  var lastMessageTimestamp = 0; // Timestamp of the last message received
                                // Timestamp is represented as unix epoch time, in
                                // milliseconds.  Probably should truncate that.

  // Removes (some) HTML characters to prevent HTML injection.
  var sanitize = function(text) {
    return text.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  }

  // Formats the message for display.
  // Replaces newlines with the <br /> element
  // replaces tabs with 2-spaces
  // replaces leading spaces with non-breaking spaces
  // replaces url's with active links (open a new window)
  var format = function(text) {
    return text.replace(/^\t*/, "&nbsp;&nbsp;")
    .replace(/\r\n/g, "<br/>")
    .replace(/\n/g, "<br/>")
    .replace(/\s/g, "&nbsp;")
    .replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, '<a href="$1" target="_blank">$1</a>');
  }


  // Scrolls the window to the bottom of the chat dialogue.
  var scrollToEnd = function() {
    $(document).scrollTop($(document).height() + 500);
  }

  // A primitve UI state controller. Call with true to show the "logged in" UI;
  // call with false to show the "logged out" UI.
  var setChatDisplay = function (enabled) {
    $loginElements.toggle(!enabled);
    $chatElements.toggle(enabled);
  }

  // Performs an ajax call to log the user in.  Sends an empty POST request
  // with the username in the request URL.
  var login = function() {
    var desiredUsername = $.trim($usernameField.val());
    $.ajax({
      type: "GET",
      url: "/chat/login/" + desiredUsername,
      async: true,
      cache: false,
      timeout: 5000,
      success: function(data){
        username = desiredUsername;
        loggedIn = true;
        $usernameDisplay.text(username);
        setChatDisplay(true);
        $loginErrors.toggle(false);
        $composeMessageField.focus();
        poll();
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        handleError($loginErrors, textStatus, errorThrown);
      }
    });
  };

  // Performs an ajax call to log the user out.  Sends an empty DELETE request
  // with the username in the request URL.
  var logout = function() {
    $.ajax({
      type: "DELETE",
      url: "/login/" + username,
      async: true,
      cache: false,
      timeout: 30000,
      success: function(data){
        // do nothing, we logout in complete
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        // do nothing, we logout in complete even if we fail
        handleErrors($loginErrors, textStatus, errorThrown);
      },
      complete: function() {
        logoutClient()
      }
    });
  }

  // performs all the local actions needed to log a user out
  // this will get called without logout ajax call when a session is expired
  var logoutClient = function() {
    setChatDisplay(false);
    username = '';
    loggedIn = false;
    $usernameField.val('');
    $usernameField.focus();
  }

    var updateTimestamp = function(timestamp) {
        if (lastMessageTimestamp === 0) {
            lastMessageTimestamp = timestamp;
        } else if (timestamp && timestamp > lastMessageTimestamp) {
            lastMessageTimestamp = timestamp;
        }
    };

    // Given a list of messages, appends them to the $messageContainer element,
    // according to the Mustache template defined as messageTemplate.
    var displayMessages = function(messages) {
        console.log("display messages");
        $(messages).each(function(){
            this.message = this.text;
            this.message = format(sanitize(this.message));
            $messageContainer.append(renderMessage(this));

        });
        scrollToEnd();
    };

    // Renders a message object using the Mustache template stored in the
  // variable messageTemplate.  Formats the timestamp accordingly. */
  var renderMessage = function(message) {
    var date = new Date();
      date.setTime(Date.parse(message.message_time));
      console.log(date);
      message.formattedTime = date.toString().split(' ')[4];
    return Mustache.to_html('<li class="{{msgtype}}"><span class="message-username">{{nickname}}</span><span class="message-body">{{{message}}}</span><span class="message-timestamp">{{formattedTime}}</span></li>', message);
  };

  // Given an input element and a button element, disables the button if the
  // input field is empty.
  var setButtonBehavior = function($inputField, $submitButton){
    var value = $.trim($inputField.val());
    if(value){
      $submitButton.removeAttr("disabled");
    } else {
      $submitButton.attr("disabled", "disabled");
    }
  };

  // processes a send message request.  The message is sent as a POST request,
  // with the message text defined in the POST body.
  var sendMessageClick = function(event) {
    var $this = $(this);
    var message = $.trim($composeMessageField.val());
    $this.attr("disabled", "disabled");
    $composeMessageField.blur();
    $composeMessageField.attr("disabled", "disabled");

    data = 'nickname=' + username + '&message=' + message;
    $.post('/chat/send_message/public', data)
      .success( function(){
        $composeMessageField.val("");
        $chatErrors.toggle(false);
      })
      .error( function(XMLHttpRequest, textStatus, errorThrown) {
        handleError($chatErrors, textStatus, errorThrown);
      })
      .complete( function(){
        $composeMessageField.removeAttr("disabled");
        $composeMessageField.focus();
        $this.removeAttr("disabled");
      });

    event.preventDefault();
    event.stopPropagation();
    return false;
  };

  // sends a GET request for new messages.  This function will recurse indefinitely.
  var poll = function() {
    if (!loggedIn) {
      return false;
    }
      console.log(lastMessageTimestamp)
    $.ajax({
      type: "GET",
      url: "/chat/receive_chat/public/" + lastMessageTimestamp,
      async: true,
      cache: false,
      timeout: 1200000,
      //data: 'since_timestamp=' + lastMessageTimestamp + '&nickname=' + username,
        success: function(data) {
            updateTimestamp(data.timestamp);
            displayMessages(data.messages);
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        handleError($chatErrors, textStatus, errorThrown);
      },
      complete: function() {
        poll();
      }
    });
  };

  // display our chat errors
  // if the session has timed out, boot them
  // if there is a network error, assume the server is down, boot them
  var handleError = function($errorElement, textStatus, errorThrown) {
        if(errorThrown === 'Authentication failed') {
          logoutClient();
          $loginErrors.text('Authentication failed! Perhaps your session expired.');
          $loginErrors.toggle(true);
        } else if (errorThrown === 'Not found' || errorThrown === 'timeout') {
          logoutClient();
          $loginErrors.text('Chat server can not be found. Perhaps it is down, or you have no network connection.');
          $loginErrors.toggle(true);
        } else {
          if (errorThrown ==='')
            errorThrown = 'Unable to contact server';
          $errorElement.text(errorThrown);
          $errorElement.toggle(true);
        }
  }

  // Our main setup function.  This function performs no dom manipulation directly,
  // so the layout of your page is preserved after it is called. Accepts a
  // config object as its only argument, which is used to specify jQuery
  // selectors of to bind event listeners to, as well as a Mustache template to
  // dictate how a message should be formatted.
  var buildChatWindow = function(config) {
    $chatElements = $(config.chatElements);
    $messageContainer = $(config.messageContainer);
    $loginButton = $(config.loginButton);
    $logoutButton = $(config.logoutButton);
    $loginElements = $(config.loginElements);
    $loginErrors = $(config.loginErrors);
    $sendMessageButton = $(config.sendMessageButton);
    $composeMessageField = $(config.composeMessageField);
    $usernameField = $(config.usernameField);
    $usernameDisplay = $(config.usernameDisplay);
    $chatErrors = $(config.chatErrors);
    messageTemplate = config.messageTemplate;

    $loginButton.click(function(event) {
      login();
      event.preventDefault();
    });

    $logoutButton.click(function(event) {
      logout();
      event.preventDefault();
    });

    $composeMessageField.keyup(function(event) {
      setButtonBehavior($(this), $sendMessageButton);
    });

    $composeMessageField.keydown(function(event) {
      if(event.keyCode == 13 && !event.shiftKey){
        if($.trim($composeMessageField.val())){
          $sendMessageButton.click();
        } else {
          return false;
        }
      }
    });

    $usernameField.keydown(function(event) {
      if(event.keyCode == 13 ){
        if($.trim($usernameField.val())){
          $loginButton.click();
        }
      }
    });


    $(window).unload(function(event){
      logout();
    });

    $usernameField.keyup(function(event) {
      setButtonBehavior($(this), $loginButton);
    });

    $sendMessageButton.click(function(event) {
      if($.trim($composeMessageField.val()))
        sendMessageClick(event);
    });
  };

  // set a short default timeout
  // we set this for most get requests that need to be longer
  $.ajaxSetup({ timeout: 3000 } );

  return {
    buildChatWindow: buildChatWindow
  };
})($);
