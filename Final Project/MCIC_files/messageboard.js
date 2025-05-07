$(function() {
	messageboard_main();
});

function messageboard_main(){
	var tTimer;
	addmessagehandler();


	var $input = $("#mbsearchtxt").off();

	if($input.length)
	{
	$input.on('keyup',function () {
		clearTimeout(tTimer);
		tTimer = setTimeout(domsearch,1500);
	});

	$input.on('keydown',function() {
		clearTimeout(tTimer);
	});


	$input.on('paste',function() {
		clearTimeout(tTimer);
		domsearch();
	});

	$("#mbwhen, #mbdepth, #mbgroups, #mbread").change(function() { domsearch(); });

	}

	 movetofirstunread();

	 if($(".unread").length){
		 if($("#logmeout").length) checkunread();
	 }

	 lockselect();

	 $("#mbsearchexpand").click( function() {

	 	$("#mbsearchmore").show();
	 	$(this).hide();
	 });



	 $("#ma_reply_0").trigger('click').remove();

	 $("#ma_hide_deleted").click(function(){
		 var target = $(this).attr("target");
		 window.location.replace("/mesg-"+target+".html");
	 });

	$("#ma_show_deleted").click(function(){
		var target = $(this).attr("target");
		window.location.replace("/mesg-"+target+".html?sd=1");
	});


	 $("#mb_sendthatmessage").click(function() {

	 	var txt = $("#mb_newdirectcontent").val();
	 	var mid = $("#mb_newdirectcontent").attr("mid");
	 	var uid =   $("#mb_newdirectcontent").attr("uid");
	 	if(txt.length>2){
			$.post("/message_direct.php",{message: txt, mid: mid, uid: uid}, function(data){
				$(".mb_direct_messageblock").first().before(data);
				$("#mb_newdirectcontent").val("");




			});









		}




	 });




	 $("#bug_status,#bug_assigned, #bug_section,#bug_priority").change(function() {

	 	$("#bug_button").addClass("bugme");

	 });
}


function lockselect()
{

	if($(".message_content").length)
	 {
		$(".message_wrap").find("*").not("br").not("html").not("body").css("user-select","none");
		$(".message_wrap").not("br").css("user-select","text");
		$(".message_wrap").find("*").not(".message_actions").not("br").css("user-select","text");
		$(".message_actions").find("*").css("user-select","none");

	 }
}

function unlinklinks()
{
	$("#metext A").click(function(){
		return false;
	});
}




function mprint(markup,simple,clean)
{
	var html;



	if(markup!='--')
	{
	$.ajax({
		url: "/mprint.php",
		method: "POST",
		data: {text: markup, s: simple}
	}).done(function (html)
	{
		if(simple)
			pasterawHTML(html,clean);
		else
			pasterawHTML(markup+html,0);
	});
	}
}


function checklocalurls(url)
{
	var host = 'https://'+window.location.hostname;

	var regex = /photo-([0-9]+).html/gm;

	var m;

	if(m = regex.exec(url))
	{
		if(m[1])
		{
			return(insertphoto(m[1]));

		}
	}



}

function insertphoto(id)
{
	// set the photo if not already
	id = parseInt(id);
	if($("#picid").length)
	{
		return("<pic id='"+id+"' width=600></pic>");
		postok();
	} else
	{
		// fake upload

		  $.ajax({
	            url: '/mb_photoupload.php',
	            type: 'get',
	            data: {pid: id},

	            success: function(response){

	            if(response != 0)
	                {
	                	$("#mephotoimg").html(response).show();
	                	$("#pcloseme").show();
	                	$("#mephoto").hide().html("Click here to add a photo or video");
	                }
	            },
	        });
		  return('--');
	}
}

//Namespace management idea from http://enterprisejquery.com/2010/10/how-good-c-habits-can-encourage-bad-javascript-habits-part-1/
(function( cursorManager ) {

    //From: http://www.w3.org/TR/html-markup/syntax.html#syntax-elements
    var voidNodeTags = ['AREA', 'BASE', 'BR', 'COL', 'EMBED', 'HR', 'IMG', 'INPUT', 'KEYGEN', 'LINK', 'MENUITEM', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR', 'BASEFONT', 'BGSOUND', 'FRAME', 'ISINDEX'];

    //From: https://stackoverflow.com/questions/237104/array-containsobj-in-javascript
    Array.prototype.contains = function(obj) {
        var i = this.length;
        while (i--) {
            if (this[i] === obj) {
                return true;
            }
        }
        return false;
    }

    //Basic idea from: https://stackoverflow.com/questions/19790442/test-if-an-element-can-contain-text
    function canContainText(node) {
        if(node.nodeType == 1) { //is an element node
            return !voidNodeTags.contains(node.nodeName);
        } else { //is not an element node
            return false;
        }
    };

    function getLastChildElement(el){
        var lc = el.lastChild;
        while(lc && lc.nodeType != 1) {
            if(lc.previousSibling)
                lc = lc.previousSibling;
            else
                break;
        }
        return lc;
    }

    //Based on Nico Burns's answer
    cursorManager.setEndOfContenteditable = function(contentEditableElement)
    {

        while(getLastChildElement(contentEditableElement) &&
              canContainText(getLastChildElement(contentEditableElement))) {
            contentEditableElement = getLastChildElement(contentEditableElement);
        }

        var range,selection;

        range = document.createRange();//Create a range (a range is a like the selection but invisible)
		range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
		range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
		selection = window.getSelection();//get the selection object (allows you to change selection)
		selection.removeAllRanges();//remove any selections already made
		selection.addRange(range);//make the range you have just created the visible selection

    }

}( window.cursorManager = window.cursorManager || {}));

$.fn.cleanPaste = function() {

	 this.find(".message_actions").remove();
	 this.find(".message_topimgcredit").remove();
	 this.find(".message_edit").remove();
	 this.find("h1").remove();
	 this.find("a").replaceWith(function() { return $('<span />', { html: this.innerHTML}); });

	// this.find("a").not(".message_username a").remove();
	 this.find(".mbtpdate").remove();
	 this.find("img").remove();
	 this.find("iframe").remove();
	 this.find(".message_content").removeClass("message_content");
	 this.find(".message_wrap").removeClass("message_wrap");

	 this.find("*").removeAttr("id").removeAttr("href").removeAttr("style").removeAttr("src");

	 this.find("*").not(".msg_quoted").not(".msg_quoted_author").removeAttr("class");


	 this.removeAttr("id").removeAttr("href").removeAttr("style").removeAttr("src");


	return this;
};

/* thanks https://stackoverflow.com/users/624466/eyecatchup */
function ytVidId(url) {
	  var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
	  return (url.match(p)) ? RegExp.$1 : false;
	}

function Utils() {

}

Utils.prototype = {
    constructor: Utils,
    isElementInView: function ($element, fullyInView) {
        var pageTop = $(window).scrollTop();
        var pageBottom = pageTop + $(window).height();
        var elementTop = $element.offset().top;
        var elementBottom = elementTop + $element.height();

        if (fullyInView === true) {
            return ((pageTop < elementTop) && (pageBottom > elementBottom));
        } else {
            return ((elementTop <= pageBottom) && (elementBottom >= pageTop));
        }
    }
};

var Utils = new Utils();

/*
function pasterawHTML(text,clean)
{
	   var sel, range;

	   if(!$("#metext").is(":focus"))  $("#metext").focus();

		   if (window.getSelection && (sel = window.getSelection()).rangeCount) {
			   range = sel.getRangeAt(0);
			   //	debugger;
			   if (clean) {

				   var $e = $("<div>" + text + "</div>");


				   $e.children().removeAttr('style').removeAttr('class');

				   $e.children().removeAttr('src');


				   text = $e[0].outerHTML


			   }


			   var frag = range.createContextualFragment(text);

			   if (clean) {

			   }

			   range.insertNode(frag);

			   range.collapse(false);

			   sel.removeAllRanges();
			   sel.addRange(range);

			   unlinklinks();

		   } else alert('Cannot paste');

}
*/
function pasterawHTML(text, clean) {
	if (!$("#metext").is(":focus")) $("#metext").focus();

	let sanitizedText = text;
	if (clean) {
		// Clean the HTML content
		let $e = $("<div>" + text + "</div>");
		$e.children().removeAttr("style").removeAttr("class");
		$e.children().removeAttr("src");
		sanitizedText = $e.html();
	}

	// Use execCommand to insert the sanitized HTML
	document.execCommand("insertHTML", false, sanitizedText);

	unlinklinks(); // Additional cleaning logic, if needed
}

function pasteHTML(text, mode) {
	if (!$("#metext").is(":focus")) $("#metext").focus();

	let sel = window.getSelection();
	if (sel && sel.rangeCount > 0) {
		let range = sel.getRangeAt(0);

		let formattedText;
		if (mode === 0) {
			formattedText = `<div><span class="msg_quoted" contenteditable="false">${text.replace(/\n/g, "<br>")}</span></div>`;
		} else {
			formattedText = `<div>${text.replace(/\n/g, "<br>")}</div>`;
		}

		// Use execCommand to insert the formatted HTML
		document.execCommand("insertHTML", false, formattedText);

		unlinklinks(); // Additional cleaning logic, if needed
	} else {
		alert("Cannot paste");
	}
}



/*
function pasteHTML(text,mode) {
    var sel, range;

	if(!$("#metext").is(":focus"))  $("#metext").focus();
    switch(mode) {

		case 0:
			if (window.getSelection && (sel = window.getSelection()).rangeCount) {
				range = sel.getRangeAt(0);
				range.collapse(true);
				var div = document.createElement("div");
				var span = document.createElement("span");
				div.appendChild(span);
				span.classList.add("msg_quoted");

				var parts = text.replace(/\r/g, "").split(/\n/);

				var total = parts.length;


				for (var i = 0; i < total; i++) {

					if(i>0) span.appendChild(document.createElement('br'));
					span.appendChild(document.createTextNode(parts[i]));

				}
				$("#metext")[0].contentEditable = false;

				range.insertNode(div);
				range.setEndAfter(div);
				range.collapse(false);

				var tn = document.createElement('br');
				tn.id = "tmpChromebuster";

				range.insertNode(tn);

				range.setStartAfter(tn);

				//  range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
				$("#metext")[0].contentEditable = true;


				$("#tmpChromebuster").html('').removeAttr("id");

				$(".msg_quoted").attr("contenteditable", "false");

				unlinklinks();
			} else alert('Cannot paste');
			break;
		case 1:
			if (window.getSelection && (sel = window.getSelection()).rangeCount) {
				range = sel.getRangeAt(0);
				range.collapse(true);
				var div = document.createElement("div");
				var span = document.createElement("span");
				div.appendChild(span);


				var parts = text.replace(/\r/g, "").split(/\n/);

				var total = parts.length;


				for (var i = 0; i < total; i++) {

					if(i>0) span.appendChild(document.createElement('br'));
					span.appendChild(document.createTextNode(parts[i]));

				}
				$("#metext")[0].contentEditable = false;

				range.insertNode(div);
				range.setEndAfter(div);
				range.collapse(false);

				var tn = document.createElement('br');
				tn.id = "tmpChromebuster";

				range.insertNode(tn);

				range.setStartAfter(tn);

				//  range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
				$("#metext")[0].contentEditable = true;


				$("#tmpChromebuster").html('').removeAttr("id");



				unlinklinks();
			} else alert('Cannot paste');
			break;
	}
}

//todo: new thread message posted at bottom of screen instead of top
*/
function checkunread()
{

	$(".unread").each(function() {
		var $container = $(this);
		$(this).find(".mbtpdate").each(function() {
			if(Utils.isElementInView($(this), true))
			{
				var mid=$(this).attr("mid");

				mid = parseInt(mid);

				if(mid)
				{
				$.ajax({
					url: '/mb_markread.php',
					data: {
							id: mid

						  }
				});

				}
				$(this).attr("mid",0);
			}
		});
	});

	setTimeout(function(){ checkunread();  }, 2000);

}



function movetofirstunread()
{

	if(typeof isarticle == 'undefined') {


			var $first = $(".unread").first();

			if ($first.length) {
				var
					viewportHeight = $(window).height(),
					documentScrollTop = $(document).scrollTop(),

					elementOffset = $first.offset(),
					elementHeight = $first.height(),

					minTop = documentScrollTop,
					maxTop = documentScrollTop + viewportHeight;


				if (
					(elementOffset.top > minTop && elementOffset.top + elementHeight < maxTop)
				) {

				} else {
					$('html,body').animate({
						scrollTop: $first.offset().top - 150
					}, 500);
				}
			}

			//todo: system time vs mysql time issues for message age?

	}
}



function domsearch()
{
	var search = $("#mbsearchtxt").val();
	var when = $("#mbwhen").val();
	var depth = $("#mbdepth").val();
	var group = $("#mbgroups").val();
	var read = $("#mbread").val();

	$("#mbsearchresults").html('');


	if(group=="-1")
		var url="/message_direct.php";
	else
		var url = "/message_search.php";



	//if(search.length>1)
	if(1)
	{
		$.get(url, {text: search, d: depth, w: when, g: group, r:read, a:1}).done(function (data) {
			$("#mbsearchresults").html(data);
		});
	}
}

var $msgbody = null;


function behave()
{
	$("#mb_behave").html("Please Behave");
}

function addattachmsghandler()
{
	$(".mb_delete_attach").off().click(function() {



		var did = $(this).attr("did");

		if(confirm("Are you sure you want to delete this attachment?"))
		{

			$.get("/mb_attach_delete.php", {did: did}).done(function (data) {

				$("#mb_attach_row_"+did).remove();



			});





		}




	});
}
var getRandomInt = function( min, max ) {
	return Math.floor( Math.random() * ( max - min + 1 ) ) + min;
}

function uid() {

	var length = 8;
	var timestamp = +new Date;




	var ts = timestamp.toString();
	var parts = ts.split( "" ).reverse();
	var id = "";

	for( var i = 0; i < length; ++i ) {
			var index = getRandomInt( 0, parts.length - 1 );
			id += parts[index];
		}

	return id;
}


function addmessagehandler()
{

	/*
	$(".ma_select").off().click(function()
	{
		var target = $(this).attr("target");
		var containerid="message_"+target+"_wrap";


		window.getSelection().removeAllRanges();

	            var range = document.createRange();
	            range.selectNodeContents(document.getElementById(containerid));
	            window.getSelection().addRange(range);


	    $("#ma_reply_"+target).trigger("click");



	});
	*/

	$(".ma_moderate").off().click(function()
	{
		var target = $(this).attr("target");

		$("#ma_moderate_row_"+target).toggle();

	});

	$(".ma_move").off().click(function()
	{
		var target = $(this).attr("target");

		var html = "<select id='movethread'><option value='0'>- Select Destination -</option>";


		for(key in groupadmin)
		{
			if(groupadmin.hasOwnProperty(key))
			{
				html+="<option value='"+key+"'>"+groupadmin[key]+"</option>";
			}

		}

		html+="</select><button id='movethreadgo'>Move</button>";

		$(this).after(html);

		$("#movethreadgo").click(function() {

			var newgroup = parseInt($("#movethread").val());
			var newgroupname = $("#movethread option:selected").text();

			if(newgroup)
			$.get("/message_moderate.php", {move: newgroup, mid: target}).done(function (data) {


				$(".message_group").html(newgroupname);
				$("#movethread").remove();
				$("#movethreadgo").remove();


			});

		});

	});



	$(".ma_close").off().click(function()
	{
		var target = $(this).attr("target");



		$.get("/message_moderate.php", {close: 1, mid: target}).done(function (data) {


			$(".ma_close, .ma_edit, .ma_delete, .ma_reply, .ma_report").hide();
			$(".ma_open, .ma_closedmessage").show();


		});
	});


	$(".ma_bug").off().click(function() {

		var target = $(this).attr("target");


		if(confirm("Do you really want to convert this into a bug report?")) {

			$.get("/message_moderate.php", {bug: 1, mid: target}).done(function (data) {

				window.location.replace("/mesg-"+target+".html");


			});

		}
	});

	$("#submit_split").off().click(function() {
		var checkedValues = $(".ma_split_cb:checked").map(function() {
			return this.value;
		}).get();

		// a) Check if the array is empty and alert the user if so
		if(checkedValues.length === 0) {
			alert("Please select at least one item to split.");
			return; // Stop the function from proceeding further
		}

		// b) Sort the array of values in ascending order
		checkedValues.sort(function(a, b) {
			return a - b;
		});

		if(confirm("Do you really want to split these items?")) {
			$.post("/message_moderate.php", {split: checkedValues}).done(function(data) {
				// c) Redirect to mesg-<ID>.html where <ID> is the first value in the sorted array
				var lowestID = checkedValues[0]; // Since the array is sorted, the first element is the lowest
				window.location.href = "/mesg-" + lowestID + ".html";

				});
		}
	});



	$(".ma_open").off().click(function()
	{
		var target = $(this).attr("target");
		$.get("/message_moderate.php", {open: 1, mid: target}).done(function (data) {

			$(".ma_open, .ma_closedmessage").hide();
			$(".ma_close, .ma_edit, .ma_delete, .ma_reply, .ma_report").show();
		});

	});


	$(".ma_report").off().click(function() {

		var target = $(this).attr("target");

		var $thisbutton = $(this);

		$(".ma_reportarea").html('');

		var $area = $("#ma_reportarea_" + target);


		$("#ma_moderate_row_"+target).hide();

		$area.html("Does this message violate our <a target='_blank' href='/a/community_guidelines'>community guidelines</a>? <span id='reportme'>Yes</a></span> <span id='noreportme'>No</span>");

		$("#noreportme").click(function() {$area.html('');});

		$("#reportme").click(function()
		{
			$.get("/message_report.php?mid="+target,function(data) {
				$thisbutton.remove();
				$area.html('Message has been reported to the managers. Thank you.');


			});

		});



	});


	$(".ma_delete").off().click(function()
	{
		var target = $(this).attr("target");

		if(confirm('Are you sure you want to delete this message?')) {
			$.get("/message_delete.php?mid=" + target, function (d) {

//

				var arr = JSON.parse(d);

				if (arr.length) {
					for (var i = 0; i < arr.length; i++) {
						//		alert(arr[i]);

						var $msg = $("[fullmsg=" + arr[i] + "]")

						if ($msg.length) {
							if ($msg.hasClass("message_wrap")) {
								// this is a primary message!

								$(".mainmsg").first().html("This thread has been removed").removeClass('mainmsg');
								$(".mainmsg").remove();


							} else {
								$msg.remove();
								$("#comtarget_" + arr[i]).remove();
							}
						}


					}
				}


			});
		}
	});

	$(".ma_reply, .ma_edit").off().click(function()
	{

		var target = $(this).attr("target");
		var item = $(this).attr("item");
		var subject=0;
		var tparent = $(this).attr("tp");
		var tstamp = parseInt($(this).attr("ts"));
		var g=parseInt($(this).attr("group"));


		var edit=0;
		if($(this).hasClass("ma_edit"))
		{
			if(confirm('Are you sure you want to edit this message? (You might want to REPLY instead)')) {
				edit = 1;


			} else
			{
				return;
			}
		}


		var currentpid=0;


		$("#closeme").trigger("click");

		$(".comtarget").remove();

		// find place to put comtarget here

		if(edit)
		{
			var $msgbody = $(this).closest(".mainmsg");

			currentpid = parseInt($(this).attr("pid"));

			$msgbody.after("<div class='comtarget' id='comtarget_"+target+"'></div>").hide();


		} else
		{
		if(tparent=='0')
		{

			currentpid = parseInt($(this).attr("pid"));

			$(".fpbox720p, #articlemessages").append("<div class='comtarget' id='comtarget_"+target+"'></div>");
		}
		else
			$("[tparent='"+tparent+"']").last().after("<div class='comtarget' id='comtarget_"+target+"'></div>");
		}
		$("#ma_final_actions").appendTo(".fpbox720p, #articlemessages");
		//$(".fpbox720p, #articlemessages").append($('#ma_final_actions'));

		/// 	💬 need to put code here to add timestamp compare



		$("#comtarget_"+target).html("<div id='message_edit' uid=''><span id='medittitle'><span id='closeme'>╳</span><span id='metoptitle'>Add your reply</span></span><span id='pcloseme'>╳</span><div id='mephotoimg'></div><div id='mephoto'>Click here to add a photo or video<div id='mephotosub'></div></div><input type='text' id='mesubject' value='' placeholder='Please enter a subject'><div id='mebuttons'></div><div id='metext' new='1' contenteditable='true' style='-webkit-user-select: text !important'><span style='color: #aaa'>Edit your reply here</span></div><div id='meditmodal'><button id='meditpasteplain'>Paste as plain text</button><button  id='meditpastehtml'>Paste with formatting</button><button id='meditpastequote'>Paste as quotation</button><button id='meditpastecancel'>Cancel</button></div><div id='meditbottom'><span id='mb_behave'>Please behave</span><select id='meinsert'><option value=0>Insert Item</option><option value=1>Mindat Photo</option><option value=2>Formula</option><option value=3>Formula from Mineral name</option><option value=4>Link to Mineral</option><option value=5>Link to Locality</option><option value=6>Link to Glossary</option><option value=7>Mineral Information Box</option></select><div id='mesubmit'>Post ➤</div>");

		if(target=='0') $("#closeme").remove();

		if(tparent=='0' && g=='11')
		{
			$('#mephotosub').html("<ul><li>Take a photo/video of the DRY specimen on a plain white or black background.</li><li>Taking a photo outdoors in daytime is usually a good idea.</li><li>Make sure your camera/phone has the specimen properly in focus.</li><li>If you can't clearly see what it is in the photo, neither can we.</li></ul>");


			$("#mesubject").attr('placeholder','Where did this come from? (location and how you obtained it)');

			$('#metext').html('<span style=\'color: #aaa\'>Describe anything you can that gives us more information than we can tell from the photo/video.</span>');

			$("#mesubject").before('<div class="meimportant">You MUST answer all these questions if you want us to help identify your specimen.</div>');

			$("<div class='mehardrow'><label for='mehard1'>Can it scratch glass?</label> <select id='mehard1'><option value='0'>- Please Select -</option><option value=1>No</option><option value='2'>Yes</option><option value='3'>Unable to test</option></select> " +
				"</div><div class='mehardrow'><label for='mehard2'>Can you scratch it with your fingernail?</label> <select id='mehard2'><option value='0'>- Please Select -</option><option value=1>No</option><option value='2'>Yes</option><option value='3'>Unable to test</option></select><div class='mehardrow'><label for='mehard3'>Is it light/heavy for the size?</label> <select id='mehard3'><option value='0'>- Please Select -</option><option value=1>Normal</option><option value='2'>Light</option><option value='3'>Heavy</option><option value='4'>Unable to test</option></select></div>"
			).insertAfter('#mesubject');





		}


		$("#message_edit").attr("uid",uid());

		$("#message_edit").append("<div id='mb_attach_temp' class='mb_attachments'></div>");
			if(edit) {
				if ($("#mb_attachments_" + target).length) {


					$("#mb_attachments_" + target).contents().appendTo("#mb_attach_temp");

					$("#mb_attach_temp TD").show();

					addattachmsghandler();


				}
			}

		var date = new Date();
		var timestamp = date.getTime() / 1000;


		var secs = timestamp - tstamp;
		var years = Math.round(secs / 31557600);


		$("#pcloseme").click(function() {
			$("#mephotoimg").html("").hide();
			$("#mephoto").show();
			$(this).hide();
		});




		$("#mebuttons").append("<button title='Bold' id='mebutton_bold' class='mebutton'><b>B</b></button>");
		$("#mebuttons").append("<button title='Italic' id='mebutton_italic' class='mebutton'><i>i</i></button>");
		$("#mebuttons").append("<button title='Underline' id='mebutton_underline' class='mebutton'><u>U</u></button>");
		$("#mebuttons").append("<button title='Strike through' id='mebutton_strike' class='mebutton'><s>S</s></button>");
		$("#mebuttons").append("<button title='Superscript' id='mebutton_superscript' class='mebutton'>²</button>");
		$("#mebuttons").append("<button title='Subscript' id='mebutton_subscript' class='mebutton'>₂</button>");
//		$("#mebuttons").append("<button title='List' id='mebutton_list' class='mebutton'>⋮</button>");
		$("#mebuttons").append("<button title='Quotation' id='mebutton_quote' class='mebutton'>&ldquo;&rdquo;</button>");
		$("#mebuttons").append("<button title='Remove quotation' id='mebutton_unquote' class='mebutton mebuttoncancelled'>&ldquo;&rdquo;</button>");
		$("#mebuttons").append("<button title='Clear formatting' id='mebutton_clear' class='mebutton'>a</button>");




		if($("#message_group_name").attr("extra")=="a") $("#mebuttons").append("<button title='Add Attachment'' id='mebutton_attach' class='mebutton mebuttonright'>📎</button>");


		$("#mebutton_bold").on('click', function() { document.execCommand('bold'); });

		$("#mebutton_italic").on('click', function() { document.execCommand('italic'); });

		$("#mebutton_underline").on('click', function() { document.execCommand('underline'); });

		$("#mebutton_strike").on('click', function() { document.execCommand('strikeThrough'); });

		$("#mebutton_superscript").on('click', function() { document.execCommand('superscript'); });

		$("#mebutton_subscript").on('click', function() { document.execCommand('subscript'); });

//		$("#mebutton_list").on('click', function() { document.execCommand('insertUnorderedList'); });

		$("#mebutton_clear").on('click', function() { document.execCommand('removeFormat'); });

		$("#mebutton_unquote").on('click',function() {

			$("#metext").find('*').removeClass("msg_quoted");

		});

		$("#mebutton_quote").on('click', function() {


			var span = document.createElement("div");
			span.className = "msg_quoted";

			if (window.getSelection) {
				var sel = window.getSelection();
				if (sel.rangeCount) {
					var range = sel.getRangeAt(0).cloneRange();
					range.surroundContents(span);
					sel.removeAllRanges();
					sel.addRange(range);
				}
			}

		});


		$("#mebutton_attach").on('click', function() {



			if($("#message_group_name").attr("extra")=="a") {

				$("#fileseltemp").remove();

				var $fileSelector = $('<input id="fileseltemp" style="display:none" type="file">').appendTo("BODY");


				$fileSelector.off().on("change", function(event)
				{


					var files = event.target.files;


					var uuid = $("#message_edit").attr("uid");

					switch(files[0].type)
					{
						case "text/plain":
						case "text/csv":
						case "text/rtf":
						case "application/vnd.geo+json":
						case "application/pdf":
						case "audio/mp4":
						case "application/zip":
						case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
						case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
						case "application/vnd.ms-powerpoint":
						case "application/msword":
						case "application/rtf":
						case "application/vnd.oasis.opendocument.presentation":
						case "application/vnd.oasis.opendocument.spreadsheet":
						case "application/vnd.oasis.opendocument.text":







							break;
						default:
							alert("Invalid file type. Please try another or ZIP the file. ( "+ files[0].type + ")");
							return;
							break;
					}
					var fd = new FormData();
					var files = $fileSelector[0].files[0];
					fd.append('file',files);

					if(edit)
						fd.append('mid',target);
					else
						fd.append('uuid',uuid);
//										$("#mephoto").html("Uploading attachment...");

					$.ajax({
						url: '/mb_attachupload.php',
						type: 'post',
						data: fd,
						xhr: function() {
						var xhr = new window.XMLHttpRequest();
						xhr.upload.addEventListener("progress", function(evt) {

							if(evt.lengthComputable)
							{
								var percent=evt.loaded/evt.total * 100;


								percent =Math.round(percent);

								$("#mb_behave").html("Uploading: "+percent+"%");


							}




						}, false);
						return xhr;
						},
						contentType: false,
						processData: false,
						success: function(response){
							behave();
							if(response != 0)
							{




								$("#mb_attach_temp").html(response);

								//

							}else{
							behave();
								alert("Could not upload attachment. Please try again");
								//	$("#mephoto").hide().html("Click here to add a photo or video");
							}


							$("#fileseltemp").remove();
						},
					});



				});



				$fileSelector.click();
			}







		});




//if(!target || target==tparent)

		if(tparent=='0')
		{
			$("#message_edit").addClass('message_edit_wider');
		}


		$("#meinsert").off().change(function(){

				insertoption = $(this).val();
				$(this).val(0);



				var def = window.getSelection().toString();

				switch(insertoption)
				{
					case '1':
						var id = prompt('Please enter a mindat photo ID',def);
						id = parseInt(id);
						if(id)
						{
							var markup = insertphoto(id);
							if(markup!='--') mprint(markup,0,0);
						}
					break;



					case '2':

						// we probably should do a pure JS version of formulaprint it wouldn't be hard.

					var form = prompt("Please enter a formula in mindat format eg Fe#3+#^2O^4",def);
					if(form) mprint("<f>"+form+"</f>",1,0);

					break;

					case '3':

					var form = prompt("Please enter a mineral name",def);
					if(form) mprint("<f name='"+form+"'></f>",1,0);

					break;

					case '4':

					var form = prompt("Please enter a mineral name",def);
					if(form) mprint("<m>"+form+"</m>",1,0);
					break;

					case '5':

					var form = prompt("Please enter a locality ID",def);
					if(form) mprint("<l id="+form+"></l>",1,0);
					break;

					case '6':

						var form = prompt("Please enter a glossary term",def);
						if(form) mprint("<g>"+form+"</g>",1,0);
					break;

					case '7':

						var form = prompt("Please enter a mineral name",def);
						if(form) mprint("<minbox light=1 name='"+form+"'></minbox>",0);

						break;

                    case '8':
                        var txt = prompt('Paste content into the box below and submit');
                        if(txt)
                        {
                           txt=$("<div/>").text(txt).html();
                           mprint(txt,0,0);
                        }
                        break;
					case '9':


                        break;

					case '1000':



						break;

				}
				 unlinklinks();
		});



		var editok=0;

		if(target=='0')
		{
			editok=1;

			if(g==11)
				$("#metoptitle").html("Complete this form for an identity help request");
			else
			if(g==106)
				$("#metoptitle").html("Start a new discussion about this photo");
			else
				if(g==105)
					$("#metoptitle").html("Start a new discussion about this locality");
				else
				if(g==104)
					$("#metoptitle").html("Start a new discussion about this mineral/rock name");
				else
				if(g)

				$("#metoptitle").html("Starting a new discussion in "+groupnames[g]);
			else

				$("#metoptitle").html("Starting a new discussion");

			subject=1;

			if((g==105)||(g==104))
			{


					$("#mesubject").val($("#mbsubject").html()).prop("readonly", true);

			}


		} else
		if(edit)
		{
			$("#metoptitle").html("Editing message");
			$("#mesubmit").html("Update ➤");

			$.ajax({
				url: "/mprint.php",
				method: "POST",
				data: {mid: target}
			}).done(function (html)
			{
	//			debugger;
				$("#metext").html(html);
				editok=1;
			});

			if(tparent!='0')
				$("#mesubject").remove();
			else
			{




				$("#mesubject").val($("#mbsubject").html());
			}


		}
		else
		{
			$("#mesubject").remove();
			var username = $("#message_"+target+"_user").html();
			if(username)
			{
				$("#metoptitle").html("Replying to "+username);
			}
			editok=1;

			if(years==1) $("#metoptitle").after("<div id='message_edit_alert'>Warning! You are replying to a message that is over a year old.</div>");
			if(years>1) $("#metoptitle").after("<div id='message_edit_alert'>Warning! You are replying to a message that is "+years+" years old.</div>");

			var ot =  $("#comtarget_"+target).offset().top;
			var html;
			var sel = window.getSelection();
			var m;
        	var p = sel.baseNode;
        	var mid=0;

        	const regex = /message_([\d]+)_wrap/g;
        	while(p)
        	{
        		var id = p.id;
            	m = regex.exec(id);
            	if(m)
            	{
            		mid=m[1];
           		}

          		p = p.parentElement;
        	}
        	if (sel.rangeCount)
        	{
        		var $container = $("<span></span>");
        		for (var i = 0, len = sel.rangeCount; i < len; ++i)
        		{
        			var $contents = $(sel.getRangeAt(i).cloneContents());
        			$container.append($contents);
        		}

        		if($container.html().length)

        		if($container.find("h2").not(".msg_quoted h2").length==0)
            	{
                	 if(mid)
                	 {
                		 $container.prepend($("#message_"+mid+"_wrap h2").first().clone());
                	 }
            	}

        		$container.cleanPaste();

        		html = $container.html();
             }
	//	stext = stext.replace(/<\/?[^>]+>/ig, " ");

		}



		if(html)
		{
			html = html.replace("<br><br>","<br>");
			$("#metext").html("<div class='msg_quoted'>"+html+"</div><div>&nbsp;</div>").attr("new",0);

			 unlinklinks();

		}

		if($('.mainmsg').length) {

				var
					viewportHeight = $(window).height(),
					documentScrollTop = $(document).scrollTop(),

					elementOffset = $("#comtarget_" + target).offset(),
					elementHeight = $("#comtarget_" + target).height(),

					minTop = documentScrollTop,
					maxTop = documentScrollTop + viewportHeight;


				if (
					(elementOffset.top > minTop && elementOffset.top + elementHeight < maxTop)
				) {

				} else {
					$('html,body').animate({
						scrollTop: $("#comtarget_" + target).offset().top
					}, 500);
				}
			}

		$("#closeme").off().click(function() {

			if($msgbody)
			{
				$msgbody.show();
				$msgbody = null;
			}
		$("#message_edit").remove();


		});

		if(currentpid)
		{
			var frag = "<span id='picid' picid='" + currentpid + "'></span>";
			if(edit) {


				frag += $("#message_" + target + "_wrap .message_topimg").html();

				$("#mephotoimg").html(frag).show();

				$("#mephotoimg A").contents().unwrap();
				$("#pcloseme").show();
			} else
			{
				$("#mephotoimg").html(frag);

			}

			$("#mephoto").hide();

		}

		$("#mephoto").off().click(function() {



			if(editok)
			{

			$("#fileseltemp").remove();

			var $fileSelector = $('<input id="fileseltemp" style="display:none" type="file">').appendTo("BODY");






			$fileSelector.off().on("change", function(event) {



				var files = event.target.files;

				switch(files[0].type)
				{
					case "image/png":
					case "image/jpeg":
					case "video/mp4":

				break;
				default:
					$("#mephoto").html("Invalid file type. Please try another (jpeg/png/mp4 only)");
					return;
				break;
				}
				 var fd = new FormData();
				 var files = $fileSelector[0].files[0];
			        fd.append('file',files);

				$("#mephoto").html("Uploading...");

				  $.ajax({
			            url: '/mb_photoupload.php',
			            type: 'post',
			            data: fd,
			            contentType: false,
			            processData: false,
			            success: function(response){

			                if(response != 0)
			                {
			                //    $("#img").attr("src",response);
			                 //   $(".preview img").show(); // Display image element
			                //	alert(response);

			                	$("#mephotoimg").html(response).show();
			                	$("#pcloseme").show();
			                	$("#mephoto").hide().html("Click here to add a photo or video");
								postok();
			                }else{

			                	$("#mephoto").html("Could not upload file. Please try again.");
			                }


							$("#fileseltemp").remove();
			            },
			        });



			});
			 $fileSelector.click();
			}
		});


		$("#mesubject").off().on('keyup', function(e) {

			var sub = $(this).val();

			if((sub.length>3)&&(g!=106))
			{


					$.get("/message_search.php", {text: sub,newthread: 1}).done(function (data) {

						if(data.length) {

							if (!$("#mbsearchresults").length) {
								$("#message_edit").after("<h2 id='mbpostsimilar'></h2><div class='messageboard_group_main' id='mbsearchresults'></div>");
							}


							$("#mbsearchresults").html(data);


						}

					});
			}




		});


		/*

		   $('#metext').off().on('paste', function (e) {

			   if(editok) {



				   let dt = e.originalEvent.clipboardData;

				   let pastehtml = dt.getData("text/html");
				   let paste = dt.getData('text/plain');
				   let markup = '', markuplocal;


				   if (ytVidId(paste)) markup = "<vid class='hideduringedit'>" + paste + "</vid>";
				   else
				   {
					 	if(pastehtml=='') return;
				   		if (markuplocal = checklocalurls(paste)) markup = markuplocal;
				   }

				   e.preventDefault();


				   $("#meditmodal button").off();
				   $("#meditmodal").hide();







	if (markup) {

		mprint(markup, 0,0);

	} else {



			pastehtml = cleancontent(pastehtml);


			mprint(pastehtml,1,1);

			unlinklinks();

	}

	//	setTimeout(cleancontent,100);












				   return false;


			   }

		      });
*/


		$('#metext').off().on('paste', function (e) {
			if (editok) {
				let dt = e.originalEvent.clipboardData;
				let pastehtml = dt.getData("text/html");
				let paste = dt.getData('text/plain');
				let markup = '', markuplocal;

				// Save the cursor position
				let selection = window.getSelection();
				let range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

				if (ytVidId(paste)) {
					markup = "<vid class='hideduringedit'>" + paste + "</vid>";
				} else {
					if (pastehtml === '') return;
					if (markuplocal = checklocalurls(paste)) {
						markup = markuplocal;
					}
				}

				e.preventDefault();

				$("#meditmodal button").off();
				$("#meditmodal").hide();

				if (markup) {
					mprint(markup, 0, 0);
				} else {
					pastehtml = cleancontent(pastehtml);
					mprint(pastehtml, 1, 1);
					unlinklinks();
				}

				// Restore the cursor position
				if (range) {
					selection.removeAllRanges();
					selection.addRange(range);
				}

				return false;
			}
		});



		function postok()
		   {
		   		let valid = 1;
			   var pid = $("#picid").attr("picid");
			   	if($("#mehard1").length) {
					if ($("#mehard1").val() == "0") {
						valid = 0;

					}
					if(!pid) valid=0;
				}
			   if($("#mehard2").length)
			   {
				   if($("#mehard2").val()=="0") {
					   valid = 0;


				   }
			   }
			   if($("#mehard3").length)
			   {
				   if($("#mehard3").val()=="0") {
					   valid = 0;


				   }
			   }
			   if($("#mesubject").length)
			   if($("#mesubject").val().length<3)
			   {
			   	valid=0;


			   }
			   if($("#metext").text().length<2) {
			   	valid=0;


			   }


			   if(valid) $("#mesubmit").css("opacity","1");
			   else
				   $("#mesubmit").css("opacity","0.5")

			   return(valid);
		   }


		   $("#metext, #mehard1, #mehard2, #mehard3, #mesubject").on('change',postok);
		   $("#metext, #mesubject").on("keydown",postok);

		$("#metext").focus(function() {

			if(1)
			{
				if($(this).attr("new")=="1")
				{
					$(this).attr("new",0).html("");

				}

				var editableDiv = document.getElementById("metext");
				cursorManager.setEndOfContenteditable(editableDiv);

				$("#mesubmit").click(function()
				{


					if((editok)&&(postok()))
					{

					if($("#metext").attr("new")=="1")
					{

						return;
					}

					editok=0;
//					$(this).off(); //.hide();
					$("#metext").attr("new",1);
					$(this).css("opacity","0.5");

					$("#metext").find(".markuptemp").remove();
					$("#metext").find(".removeme").remove();
					$(".hideduringedit").removeClass("hideduringedit");

					var txt = $("#metext").html();

					// todo: we need to validate subject is within suitable length parameters before continuing

					if($("#mesubject").length)

						var subject = $("#mesubject").val();
					else
						var subject = '';


					var pid = $("#picid").attr("picid");

					if(!pid) pid=0;

					if(subject.length>4)
					{
						if(subject==subject.toUpperCase())
						{
							alert('No need to shout - your subject must not be all upper-case');
							editok=1;
							$(this).css("opacity","1");
							$("#metext").attr("new",0);
						}
					}
						if(txt.length>4)
						{
							if(txt==txt.toUpperCase())
							{
								alert('No need to shout - your message must not be all upper-case');
								editok=1;
								$(this).css("opacity","1");
								$("#metext").attr("new",0);
							}
						}




					if(editok) {

					} else
					if(target=='0' && subject.length<3)
					{
						if(txt.length<3)
						{
							alert('Please enter a message and subject');
							editok=1;
							$(this).css("opacity","1");
							$("#metext").attr("new",0);
						} else
						{
							alert("Please enter a subject");
							editok=1;
							$(this).css("opacity","1");
							$("#metext").attr("new",0);
						}



					} else
					if(txt.length>2)
					{

						var uuid = $("#message_edit").attr("uid");

						/* add conditional data from the identity form */

						if($("#mehard1").length) {

							txt+="<br><br><b>Questions Answered</b><br>Can it scratch glass? : ";

							switch ($("#mehard1").val())
							{
								case "1":
									txt+="No";
									break;
								case "2":
									txt+="Yes";
									break;
								case "3":
									txt+="Unable to test";
									break;
							}
						}
						if($("#mehard2").length) {

							txt+="<br>Can you scratch it with your fingernail? : ";

							switch ($("#mehard2").val())
							{
								case "1":
									txt+="No";
									break;
								case "2":
									txt+="Yes";
									break;
								case "3":
									txt+="Unable to test";
									break;
							}
						}
						if($("#mehard3").length) {

							txt+="<br>Is it light/heavy for the size? : ";

							switch ($("#mehard3").val())
							{
								case "1":
									txt+="Normal";
									break;
								case "2":
									txt+="Light";
									break;
								case "3":
									txt+="Heavy";
									break;
								case "4":
									txt+="Unable to test";
									break;
							}
						}

					$.ajax({







					        type: "POST",
					        url: "/message_submit.php",
					        dataType: "text",
					        data: {
					        	"text": txt,
								"subject": subject,
					        	"pid": pid,

								"uuid": uuid,
					        	"group": g,
								"item": item,
					        	"mid": target,
					        	"emode": edit
					        }
					      }).done(function(data) {

					    	  var first = data.substr(0,7);

					    	  // done: tab actions on edit message

					        if(first!='*FAIL*:')
					        {

					        	var html = data;
					        	if($msgbody) $msgbody.remove();
								if($msgbody)
								{
									$msgbody.remove();
									$msgbody = null;
								}
								if($(".messageboard_group_main").length) {
									$(".messageboard_group_main").remove();
									$("#comtarget_" + target).html('').after(html);

									target = $(".ma_reply").attr("target");

									history.replaceState(null,'','/message.php?m='+target);



								} else {
									$("#comtarget_" + target).html('').after(html);
								}
					        	//done: do we need to remove that comtarget and add new one on new thread?

					        	addmessagehandler();
					       	 	lockselect();

					        } else {
					  		  //  alert(data);
//								alert('Sorry, did not save correctly. Please try again.');
								$(this).css("opacity","1");
								editok=1;
								$("#metext").attr("new",0);
					        }
					      });
					    } else
					 	{
					 		alert('Please enter a message');
					 		editok=1;
							$(this).css("opacity","1");
							$("#metext").attr("new",0);
					 	}

					}




				});


			}

		});

		if($('.mainmsg').length) {
			$("#metext").focus();
		}



	});
}

function cleancontent(content)
{
	/* hi. We sanitize server-side too so don't get too excited */



	$("BODY").append("<div id='cc4temp' style='display: none'></div>");

	$("#cc4temp").append(content);

	$("#cc4temp").find("*").removeAttr("style").removeAttr("class");
	$("#cc4temp").find("script, input, select, option, button, object, svg, style, iframe").remove();
	$("#cc4temp").find("pre, table, tr, td, th, tbody, h1,h2, h3,h4,h5,h6").contents().unwrap();

	content = $("#cc4temp").html();


	$("#cc4temp").remove();

//content = content.replace(/>(\r\n|\n|\r)</gm, "");
	content = content.replace(/(\r\n|\n|\r)/gm, " ");


	return(content);
}

