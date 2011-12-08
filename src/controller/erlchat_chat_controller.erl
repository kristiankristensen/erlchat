-module(erlchat_chat_controller, [Req]).
-compile(export_all).

index('GET', []) ->
    {ok, []}.    

send_test_message('GET', []) ->
    TestMessage = message:new(id, "This is a test message from the browser"),
    boss_mq:push("test-channel", TestMessage),
    boss_mq:push("test-channel", TestMessage),
    {output, "Message sent"}.

send_message('POST', [Channel]) ->
    boss_mq:push(Channel, Req:post_param("msg")).

receive_chat('GET', [Channel, LastTimestamp]) ->
    {ok, Timestamp, Messages} = boss_mq:pull(Channel, list_to_integer(LastTimestamp)),
    %{output, [{messags, Timestamp}]}.
    {json, [{timestamp, Timestamp}, {messages, Messages}]}.

live('GET', [Channel]) ->
    Timestamp = boss_mq:now(Channel),
    {ok, [{timestamp, Timestamp}, {channel, Channel}]}.

login('GET', [Username]) ->
    {output, string:concat("You logged in as ", Username)}.

logout('GET', [Username]) ->
    {output, string:concat("You logged out as ", Username)}.
   
