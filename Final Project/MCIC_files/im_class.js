$(function() {
    // Attach click event to all elements with class 'im'
    $(".im").click(function() {
        // Remove any existing modal
        $("#im_modal").remove();

        // Retrieve user ID and username from clicked element
        var uid = $(this).attr("uid");
        var username = $(this).attr("username");

        // Validate messaging request
        $.get("/im_valid.php?u=" + uid, function(data) {
            if (data.length > 10) {
                // If valid, append the messaging modal to the body
                $("BODY").append(
                    "<div id='im_modal'>" +
                    "<div id='im_main'>" +
                    "<span>X</span>" +
                    "<h1></h1>" +
                    "<input type='text' id='im_subject' placeholder='Enter the subject of your message'>" +
                    "<textarea placeholder='Enter your message here'></textarea>" +
                    "<button id='im_send_btn' value='Send'>Send Message</button>" +
                    "</div>" +
                    "</div>"
                );

                // Set the header with the username
                $("#im_main h1").html("Send a private message to " + username);

                // Close modal action
                $("#im_main span").click(function() {
                    $("#im_modal").remove();
                });

                // Send message action
                $("#im_main button").click(function() {
                    var content = $("#im_main textarea").val();
                    var subject = $("#im_subject").val();

                    if (content.length > 2 && subject.length > 2) {
                        // Disable the send button to prevent multiple submissions
                        $(this).prop('disabled', true).text('Sending...');

                        // Post message data
                        $.post("/message_direct.php", {message: content, subject: subject, mid: 0, uid: uid}, function(data) {
                            // Message sent feedback
                            $("#im_modal").remove();
                            alert("Message sent");
                        });
                    } else {
                        alert('Please enter a subject and message');
                    }
                });
            }
        });
    });
});
