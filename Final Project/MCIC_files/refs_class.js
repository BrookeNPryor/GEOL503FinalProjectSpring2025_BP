
/* globals */
let journals_array=[];
let reloadme=0;
let update='';
let thebutton=null;
let refpage=0;
let brandnew=0;

$(function() {

    $.ensure = function (selector) {
        var promise = $.Deferred();
        var interval = setInterval(function () {
            if ($(selector)[0]) {
                clearInterval(interval);
                promise.resolve();
            }
        }, 1);
        return promise;
    };


    $(".reflinebox").click(processrefline);
    $(".editcite").click(processrefline);
    $(".refciteadd").click(processrefline);
    $(".refpersadd").click(processrefline);
    $("#addrefbutton").click(processrefline);

    $(".dmca").click(function() {

        $(".dmca").removeClass("dmca").html("<b>To report a copyright violation please provide the following information:</b><br>"
            +"<br><ul><li>The full URL of each page with your copyrighted material</li>"+
        "<li>Proof of copyright</li>"+
        "<li>Confirm that you are the copyright owner or the official representative of the owner</li>"+
            "</ul><br><br><b>Reports without all of the above information may not receive a response. Please allow 28 days for processing, most issues will be dealt with in 24 hours.</b><br><br>Email to: jolyon@mindat.org");

    });


    /*
    $('.pdfviewbutton').click(function() {

        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const id = urlParams.get('id');
        const url = '/reference.php?id='+id+'&a='+$(this).attr('data_a')+'&b='+ $(this).attr('data_b');

        window.location.href = url;
    });
    */

});


function processrefline()
{
    thebutton=$(this);
    let cit = parseInt($(this).attr("citid"));
    refpage = $(this).attr('refpage');
    let min = $(this).attr("min");
    let loc = $(this).attr("loc");
    brandnew = $(this).attr("brandnew");
    reloadme = $(this).attr("refresh");
    let article = $(this).attr("article");
    let glossary = $(this).attr("glossary");
    let photo = $(this).attr("photo");
    let ukey = $(this).attr("ukey");
 //   if(!ukey) ukey = $("#ukeyukey").val();
    let type = $(this).attr("reftype");
    let update = $(this).attr("update");
    let ref = parseInt($(this).attr("refid"));
    let parent = $(this).attr("parentid");
    let single = $(this).attr("single");



    let copyparent = $(this).attr("copyparent");

    if(copyparent)
    {
        if(!confirm("Do you want to pre-fill the details from the parent entry?"))
        {
            copyparent=0;
        }
    }


    let head;

    if(cit) head="Edit"; else head="Add";

    if(type=="personal") head+=" Personal Reference"; else head+=" Citation";

    $("<div id='SRblock'></div>").appendTo('body');
    $("<div id='RCeditor'><div id='RCclose'>╳</div><h1>"+head+"</h1><div id='RCstuff'></div></div>").appendTo("#SRblock");

    resizer('#RCeditor');

    $(window).resize(function() { resizer('#RCeditor');});

    $("#RCclose").click(function()
    {
        $("#SRblock").fadeOut().remove();
        $('html,body').css('overflow','auto');
    });

    $.get("/refs_callback.php",{c: cit,r: ref, m: min, l: loc, a: article, g: glossary, p: photo, u: ukey, t: type, si: single}, function(data) {
        $("#RCstuff").html(data);

        if(ref||parent)
        {
            SReditref(1,ref,0, {parent: parent, type: type, copyparent: copyparent});
            resizer('#Reditor');
            return;
        }
        resizer('#RCeditor');

        $("#SPsource").change(function() {

            let source = $(this).val();

            switch(source)
            {
                case 0:
                    // hide submit
                    $("#SPinsti").hide();
                    resizer('#RCeditor');
                    break;
                case 3:
                case 4:
                    $("#SPinsti").show();
                    resizer('#RCeditor');
                    break;
                default:
                    $("#SPinsti").hide();
                    resizer('#RCeditor');
                    break;
            }




        });




        $.ensure("#SCcitationbox").then(function() {

            SCsaveinit(min,loc,article,photo,glossary,ukey,type,update);

            $("#SCcitationbox input, #SCcitationbox select").change(function() {
                $(this).attr("changed",1);
                $("#SCsaveall").show();
            });


            resizer('#RCeditor');

            let rltimer = null;

            $("#reflivesearch").on("keyup paste",function() {

                if (rltimer)
                {
                    clearTimeout(rltimer);
                    rltimer = null;
           //         console.log("clear timer");
                }

                rltimer = setTimeout(function() {

             //       console.log("doing search");
                    let text = $("#reflivesearch").val();
                    if(text.length > 4) {
                       internalsearch = text;
                        $("#SCsearchrefgo").click();
                    }
                }, 800);

            });

            var simcallback = null;
            let internalsearch=null;
            $("#SCsearchrefgo").click(function() {


                let results=0;

                let str = $("#SCsearchref").val();



                if(internalsearch)
                {
                    str=internalsearch;
                    internalsearch=null;
                }

                str = str.replace(/ABSTRACT\s*=\s*\{[^}]*\},?/g, '');

                console.log("searching:");
                console.log(str);

                if(str)
                {

                    str=str.replace("https://doi.org/","doi:");

                    let doi = is_doi(str);


                    $("#SRsimilarref").remove();

                    if(simcallback)
                    {
                        simcallback.abort();
                        simcallback = null;
                    }
                    let mtype = $("#SRmatchtype").val();

               //     console.log("Match type: "+mtype);
                  simcallback = $.get("/refs_callback.php", {r: 0, c: 0, ea: 3, cs: str, mt: mtype}, function (data)
                    {

                        $("#searchrefhead").html("Reference Search");

                        $("#SRmatcharea").append(data);
                        $('.selectablerefidtd').click(searchtdlinks);

                        $('.refinsidelink').click(function() {

                          let addto = $(this).attr("parent");
                          let addtype = $(this).attr("reftype");

                          $("#SCeditref").attr("addto",addto).attr("addtype",addtype).click();

                        });




                        $('.selectablerefidtd').click(expand_children);

                        resizer('#RCeditor');


                        if((!doi)||($(".selectablerefidtd").length==0))
                        {
                            $("#SCeditref").removeAttr("disabled");
                        }
                    });
                }
            });


            $("#SCopenrefurl").click(function() {

                let ref = parseInt($(this).attr("refid"));
                if(ref>0)
                {
                    let url = "/reference.php?id="+ref;

                    window.open(url,'_blank');
                }
            });


            $("#SCdelete").click(function()
            {
                if(confirm("Are you sure you want to delete this? This CANNOT BE UNDONE!")) {
                    $.get("/refs_callback.php", {c: cit, del: 1}, function (data) {

                        if(single)
                        {


                            /*

<span class="refciteadd nogloss" update="type_description_ref" single="1" ukey="3094902126" reftype="min" min="12554" loc="0" article="0" photo="0" glossary="0">Add Reference Citation</span>

<div class="reflinebox refcitesingle" year="1988" auth="" tit="Bedload transport and sediment yield in the Onyx River, Antarctica" pub="Wiley" citid="2266539" min="12552" loc="0" article="0" photo="0" glossary="0" ukey="2618533603" single="1" update="type_description_ref"><b>Mosley, M. P. (1988) Bedload transport and sediment yield in the Onyx River, Antarctica. <i>Earth Surface Processes and Landforms</i>, 13 (1) 51-67 <span target="_blank" href="https://doi.org/10.1002/esp.3290130108">doi:10.1002/esp.3290130108</span></b></div>



                             */

                            let thediv =$('div[update="' + update + '"]');



                            var formattedText = `<span class="refciteadd nogloss" update="${update}" single="1" ukey="${ukey}" reftype="${type}" min="${min}" loc="${loc}" article="${article}" photo="${photo}" glossary="${glossary}">Add Reference Citation</span>`;


                            thediv.replaceWith(formattedText);
                            $("#"+ update).val("0");


                        } else {
                            $("#SCallrefs").html(data);
                        }
                        $("#SRblock").fadeOut().remove();
                        $(".reflinebox, .refciteadd").off("click", processrefline).on("click", processrefline);

                        if(reloadme)  location.reload();
                        $('html,body').css('overflow','auto');
                    });
                }
            });


            $("#SCeditref").click(function() {
                let ref = $(this).attr("ref");
                SReditref(1,ref,0,{});
                resizer('#RCeditor');
            });

            $('.selectablerefidtd').click(searchtdlinks);



            $("#SCeditcopyref").click(function() {

                if (confirm('This will separate this citation record from all other records for this reference. Only do this if you are changing the reference for THIS ENTRY ONLY (eg to change from a volume/issue reference to a specific article within it)')) {

                    let ref = $(this).attr("ref");



                    SReditref(0, ref, 0,{});
                }
            });
        });

    });

}

function searchtdlinks()
{
    console.log("searching td links");

    $("#SCreferencebox").remove();
    $("#SCsearchrefgo, #SCsearchref").show();
    resizer('#RCeditor');

    let ref = $(this).attr("refid");
    let par = $(this).attr("childitems");

    $("#SCrefid").val(ref);
    $("#SCsave").removeAttr("disabled");
    $("#SCcitationbox").show();
    $("<div id='SCreferencebox' class='Rbox'><b>Reference</b><p>"+ $(this).html() + "</p><button type='button' id='SCeditref' ref='"+$(this).attr("refid")+"'>Edit</button><div class='clearer'></div></div>").prependTo("#SCcitation");
    if($("#SCreferencebox .moremoremore").length) {
        $("#SCreferencebox .moremoremore").remove();
        $("#SCreferencebox").append("<div class='ihavechild'>You probably want to select one of the sub-entries listed below!</div>");
    }
    resizer('#RCeditor');
    $("#SCeditref").click(function() {

        let addto = $(this).attr("addto");
        let addtype = $(this).attr("addtype");
        SReditref(1,ref,0,{});
    });
    if (typeof(par) != "undefined")
    {
        internalsearch='>'+ref;
        $("#SCsearchrefgo").click();
    }
}



function loadgooglebuttons()
{
    let out = encodeURIComponent($("#SRfulltext").val());

    let url1 = "https://google.com/search?q="+out;
    $("#SRgclicker").attr("href",url1);
    let url2 = "https://scholar.google.com/scholar?q="+out;
    $("#SRgsclicker").attr("href",url2);

}


//                    $("#SCeditref").attr("addto",addto).attr("addtype",addtype).click();


function SCsaveinit(min,loc,article,photo,glossary,ukey,type,update)
{




    $("#SCsave, #SCsaveall").click(function()
    {

        let data = {};
        if($(this).attr("id")=="SCsaveall")
        {
            if(!confirm("Warning! This will update your new citation details (page numbers and note) for ALL uses of this specific reference. Is that what you really want?"))
            {
                return;
            }
            data.updateall=1;

        }

        if(update=="") update=0;



        data.refid = $("#SCrefid").val();
        data.citid = $("#SCcitid").val();
        data.code = $("#SCcode").val();
        data.pfrom = $("#SCfrom").val();
        data.pto=$("#SCto").val();

        data.comments=$("#SCcomments").val();
        data.min=min;
        data.loc=loc;
        data.article=article;
        data.photo=photo;
        data.glossary=glossary;
        data.ukey=ukey;
        data.type=type;

        // data ready to post.

        let comp = JSON.stringify(data);


   //     console.log("SENDING");
    //    console.log(comp);
    //    console.log(update);


        $.post("/refs_callback.php", {sc: comp, up: update}, function (data) {

   //    console.log("UPDATE");
   //    console.log(data);

            $("#SRblock").fadeOut().remove();

            if(reloadme)  location.reload();
            $('html,body').css('overflow','auto');
            if(update)
            {
                $("#citewrap_"+update).html(data);
            } else
            {
                $("#SCallrefs").html(data);

            }
            $(".reflinebox").off("click", processrefline).on("click", processrefline);



        });


    });
}



function SReditref(editall,ref,cit,extra)
{
    $("#RCeditor").hide();
    $('html,body').css('overflow','hidden');
    let title;

    let parent=0;
    if(extra.parent) parent=parseInt(extra.parent);
    let newtype=0;
    if(extra.type) newtype=extra.type;

    let copyparent=0;
    if(extra.copyparent) copyparent=parseInt(extra.copyparent);

    if(ref==0)
        title="Add Reference";
    else
    if(editall)
        title="Edit Reference";
    else {

        title = "Edit Copy Reference";
        $("#SCeditcopyref").remove();
        $("#SCeditref").html("Edit Reference");
    }
    $("<div id='Reditor'><div id='Rclose'>╳</div><h1>"+title+"</h1><div id='Rstuff'></div></div>").appendTo("#SRblock");

    $.ensure("#Rclose").then(function() {


        $(window).resize(function() { resizer('#Reditor');});

        resizer('#Reditor');

        $("#Rclose").click(function () {

            if($("#SRfilehide:hidden ").length)
            {
                alert("Please complete your file upload before closing");
                return;
            }

            if($("#SRtempid").val())
            {
                if($("#SRfilecount").text()!="0")
                {
                    if(!confirm("You have uploaded a file. Are you sure you want to quit?")) return;
                }
            }




            $("#Reditor").fadeOut().remove();
            if($("#EDITREFONLY").length) {
                $("#SRblock").remove();

                if(brandnew)
                {

                        window.location.href="/reference.php";
                        return;

                }



                if(reloadme)  location.reload();
                $('html,body').css('overflow','auto');
            } else
                $("#RCeditor").show();
        });

        /* reference display */
        $.get("/refs_callback.php", {r: ref, c: cit, ea: editall + 1, newtype: newtype, parent: parent, copyparent: copyparent}, function (data)
        {
            $("#Rstuff").html(data);

            $('html, body').css('overflow','hidden');
            console.log("doing body");
            if(!editall) ref=0;

            if(parent>0) $("#SRparent").val(parent);

            if(newtype)
            {
                $("#referencetype").val(newtype);
            }

            console.log("ref =" + ref);
            console.log(  $("#reflivesearch").val());

            $("#SRstructuredbox input, #SRstructuredbox select").change(function() {

                $(this).attr("changed",1);
            });


            let initial_search_text;



            $.ensure("#SCcitationbox").then(function () {

                fixlabels();
                loadgooglebuttons();

                if(ref=="0")
                {
                    initial_search_text=$("#reflivesearch").val();
                    $("#SRfulltext").text(initial_search_text);


                    initial_search_text=is_doi(initial_search_text);

                    if(initial_search_text)
                    {

                        $("#referencetype").val(35);            // set to journal article (default) - can be overridden by DOI
                        $("#SRdoi").val(initial_search_text);
                     // do our doi loading here.
                        $("#doiimport").removeAttr("disabled");
                        decodepasted(initial_search_text);
                        fixlabels();


                    }
                }
                resizer('#Reditor');
                /*
                console.log("start timer");
                setTimeout(function() {
                    resizer('#Reditor');
                    console.log("end timer");
                },500);
*/
                $("#referencetype").change(function() {

             //      console.log("New value = "+$(this).val());

                    let newtype = parseInt($("#referencetype").val());


                    if(newtype)
                    {
                        $("#SRunstructured").hide();
                        $(".SRstructured").show();
                        $("#SRlangs, #SRlangsminor").chosen();
                    //    $("#SRfulltext").attr("readonly",true);
                        $("#SRlangs").chosen().change(do_we_show_the_language_boxes);

                    } else
                    {
                        $("#SRunstructured").show();
                        $(".SRstructured").hide();
                    //    $("#SRfulltext").removeAttr("readonly");
                    }
                    resizer('#Reditor');




                    fixlabels();



                    switch(newtype)
                    {

                        case 63:
                        case 35:
                        case 34:
                        case 70:
                        case 60:
//                            alert("You chose a journal!");
                            $( "#SRjournal" ).autocomplete({
                                source: journals_array,
                                select: function (event, ui)
                                {
                                    let v = ui.item.label;
                                    v = v.split(" [");
                                    if(v.length>1)
                                    {
                                        $("#SRjournal").val(v[0]);
                                        v = v[1].split("]");
                                        $("#SRpublisher").val(v[0]);

                                    }
                                    $("#SRjournal").trigger('change');
                                    return false;
                                }
                            });
                        break;

                            $( "#SRjournal" ).autocomplete("destroy");

                        default:

                    }






                });
                $("#referencetype").trigger("change");

                resizer('#Reditor');
                $("#SRcancel").click(function () {
                    $("#Reditor").fadeOut().remove();

                });


                $("#SRcomatchbutton").click(function() {

                    let txt = $("#SRfulltext").val();



                    var txt2= txt.replace(/[\W_]+/g," ");



                    let out = '';

                    let parts = txt2.split(" ");

                    for(let i=0;i<parts.length;i++)
                    {
                        if(parts[i].length>2)
                        {
                            if(out) out+=" ";
                            out+=parts[i];
                        }


                    }



                    out = encodeURIComponent(out);
                    let url = "https://core.ac.uk/api-v2/search/"+out+"?page=1&pageSize=20&apiKey=NVFfDrizuQJqPodbe76RpL1950TIKElO";   // Do not use our API key for anything else.



                    $("#SRmatcharea").remove();
                    $("<div id='SRmatcharea' class='Rbox'><b><button id='SRhidemerge'>Hide</button>CORE References</b><p id='SRcrosswait'>Please wait - downloading data from CORE.ac.uk</p></div>").appendTo("#Reditor");
                    resizer('#Reditor');
                    $.get(url,function (data) {


                        console.log(data.data);

                                if(data.data.length)
                                {

                                    $("<table id='SRcrossreftable'></table>").appendTo("#SRmatcharea");
                                    data.data.forEach(function(v,k) {




                                        v=v._source;


                                        //  try {

                                        let doi = v.doi;

                                        let result='';

                                        for(let i=0;i<v.authors.length;i++)
                                        {
                                            if(result) result+=", ";
                                            result+=v.authors[i];
                                        }

                                        if(v.year)
                                            result+=" ("+v.year+") ";

                                        result+=v.title;

                                        if(v.publisher) result+=", <i>"+v.publisher+"</i>";





                                        $("<tr><td class='coredata' coreid='"+k+"'>"+result+"</td></tr>").appendTo("#SRcrossreftable");



                                    });

                                    $(".doiclicker").click(function() {

                                        /* we need to do this manually here */


                                    });

                                }
                        resizer('#Reditor');



                    });


                });


                $("#SRcrclicker, #SRcrmatchbutton").click(function() {

                    let out = encodeURIComponent($("#SRfulltext").val());
                    let url = "https://api.crossref.org/works?mailto=jolyon@mindat.org&query="+out;
                    $("#SRmatcharea").remove();

                    $("<div id='SRmatcharea' class='Rbox'><b><button id='SRhidemerge'>Hide</button>Crossref References</b><p id='SRcrosswait'>Please wait - downloading data from crossref.org</p></div>").appendTo("#Reditor");
                    resizer('#Reditor');
                    $.get(url,function (data) {


                        console.log(data);

                        $("#SRcrosswait").remove();
                        if(data.message)
                            if(data.message.items)
                            if(data.message.items.length)
                            {
                                var Cite = require('citation-js');
                                let cite = new Cite();
                                let opt={
                                    format: 'string',
                                    type: 'html',
                                    lang: 'English',
                                    style: 'citation-apa'
                                }
                                $("<table id='SRcrossreftable'></table>").appendTo("#SRmatcharea");
                                data.message.items.forEach(function(v,k) {







                                    //  try {

                                    let doi = v.DOI;
                                    delete v.DOI;
                                    delete v.URL;



                                    let result = cite.set(v).get(opt);


                                    $("<tr><td class='doiclicker' doi='"+doi+"'>"+result+"</td></tr>").appendTo("#SRcrossreftable");



                                });

                                $(".doiclicker").click(function() {

                                    let doi = $(this).attr("doi");
                                    $("#SRdoi").val(doi);
                                    $("#doiimport").attr("disabled","disabled");
                                    decodepasted(doi);
                                    $("#SRmatcharea").remove();
                                    resizer('#Reditor');
                                });

                            }
                        resizer('#Reditor');



                    });


                });


                $("#SRfulltext").on('change',loadgooglebuttons);


                addnew();

                $("#SRdoi").on("change keyup",function() {

                    if($(this).val().length) $("#doiimport").removeAttr("disabled");
                    else $("#doiimport").attr("disabled","disabled");

                });
                $("#SRisbn").on("change keyup",function() {

                    if($(this).val().length) $("#isbnimport").removeAttr("disabled");
                    else $("#isbnimport").attr("disabled","disabled");

                });


                $("#SRulpush").on("change",function() {

                    switch($(this).val())
                    {
                        case "1":
                        case "2":
                        case "3":
                        case "5":
                        case "6":
                            $("#SRcoverpage").show();
                            break;
                        default:
                            $("#SRcoverpage").hide();
                            break;
                    }

                });



                $("#isbnimport").click(function() {

                    let stuff = $("#SRisbn").val();
                    if(stuff.length) classifyoclc(stuff,"isbn");
                });

                /*
                $("#ddcimport").click(function() {
                    ddcoclc();
                });
                */
                $("#rc_clearauthors").click(function() {

                    $(".refauthorname").val("");
                    $(".refauthortype").val(0);

                });

                let button = document.querySelector('#titlecase');
                button.disabled = true;
                let button2 = document.querySelector('#fixspaces');
                button2.disabled = true;

// Enable button when any text in an input field is selected
                let inputFields = document.querySelectorAll('input[type=text]');
                for (let field of inputFields) {
                    field.addEventListener('input', function() {
                        if (field.selectionStart !== field.selectionEnd) {
                            button.disabled = false;
                            button2.disabled = false;
                        } else {
                            button.disabled = true;
                            button2.disabled = true;
                        }
                    });
                    field.addEventListener('select', function() {
                        if (field.selectionStart !== field.selectionEnd) {
                            button.disabled = false;
                            button2.disabled = false;
                        } else {
                            button.disabled = true;
                            button2.disabled = true;
                        }
                    });
                }
                button.addEventListener('click', convertSelectedTextToTitleCase);
                button2.addEventListener('click',removeSpaces);




                    $('#SRddc').on('paste', function(e) {
                        // Prevent the default pasting event
                        e.preventDefault();

                        // Get the text that was pasted
                        var pastedText = '';
                        if (e.originalEvent.clipboardData && e.originalEvent.clipboardData.getData) {
                            pastedText = e.originalEvent.clipboardData.getData('text/plain');
                        }

                        // Filter the pastedText to only include numbers and decimal points
                        var filteredText = pastedText.replace(/[^0-9.]/g, '');

                        // Insert the filtered text into the input
                        $(this).val(filteredText);
                    });





                $("#SRurl").on("paste",function(ev){

                    // check for auto URL parsing here

              //     console.log("URL paste");


                    setTimeout(function() {
                        let url = $("#SRurl").val();

                  //     console.log("Got " + url);

                        // https://www.geokniga.org/books/27209

                        let parsedURL=0;

                        try {
                            parsedURL = new URL(url);
                        } catch (e) {
                            if(e instanceof TypeError) {
                                alert("Invalid URL pasted");
                                return;
                            }
                            return;
                        }


                       console.log(parsedURL);

                //        console.log("parsedURL.hostname = "+parsedURL.hostname);

                        /*
                        if(
                            (parsedURL.protocol === 'https:' && (parsedURL.hostname === 'scholarworks.iu.edu'))||
                            (parsedURL.hostname === 'www.bullmineral.cz') ||
                            (parsedURL.hostname === 'www.cambridge.org')

                                )
                        */

                        if(parsedURL.protocol === 'https:' || parsedURL.protocol === 'http:')
                        {
                   //         console.log("Running");
                            let secureURL = "/get_ext_url.php?url2=" + encodeURIComponent(url);
                            let volume = 0;

                           console.log("Secure URL: " + secureURL);

                            $.get(secureURL, function (data) {

                              console.log(data);

                                if(data["citation_volume"])
                                {
                                    volume = data["citation_volume"][0]
                                    $("#SCvol").val( volume);
                                } else volume = $("#SCvol").val();

                                if(parsedURL.hostname === 'www.bullmineral.cz')
                               {
                                   $("#referencetype").val(35);
                                   fixlabels();
                                   if(volume>24)
                                       $("#SRjournal").val("Bulletin Mineralogie Petrologie");
                                   else
                                       $("#SRjournal").val("Bulletin mineralogicko-petrologického oddělení Národního muzea v Praze");
                                   $("#SRpublisher").val("Mgr. Jiří Sejkora");

                               } else        if(data["citation_journal_title"]) $("#SRjournal").val(data["citation_journal_title"][0]);



                                if (data["citation_date"] && Array.isArray(data["citation_date"]) && data["citation_date"][0]) {
                                    $("#SCyear").val(data["citation_date"][0].substring(0,4));
                                }

                                if (data["citation_publication_date"] && Array.isArray(data["citation_publication_date"]) && data["citation_publication_date"][0]) {
                                    $("#SCyear").val(data["citation_publication_date"][0].substring(0,4));
                                }

                                if (data["citation_pdf_url"] && Array.isArray(data["citation_pdf_url"]) && data["citation_pdf_url"][0]) {
                                    let fileUrl = data["citation_pdf_url"][0];

                                    // Check if the fileUrl starts with '/'
                                    if (fileUrl.startsWith('/')) {
                                        try {
                                            // Parse the base URL from #SRurl
                                            let baseUrl = new URL($("#SRurl").val());

                                            // Construct the full URL
                                            fileUrl = baseUrl.protocol + "//" + baseUrl.host + fileUrl;
                                        } catch (error) {
                                            console.error("Error constructing the full URL:", error);
                                        }
                                    }

                                    $("#SRfileurl").val(fileUrl);
                                }
                                $("#SRulpush").val(1);
                                if(data["dc.relation"]) {
                                    let parts = data["dc.relation"];
                                    if (data["dc.relation"].length == 1) {
                                        parts = data["dc.relation"][0].split(";");
                                    }
                                    //    $("#SRjournal").val(parts[0].trim());
                                    if (parts.length > 1) {
                                        let trimmedInput = parts[1].replace(/^\s*0+/, '');

                                        $("#SCissue").val(trimmedInput);


                                    } else {
                                        $("#SCissue").val(getLastElement(parts[0]));
                                    }
                                }

                                if(data["citation_issue"]) $("#SCissue").val(data["citation_issue"][0]);




                                if(data["abstract"]) $("#SRabstract").val(data["abstract"][0]);


                                if(data["citation_title"]) $("#SRtitle").val(data["citation_title"][0]);

                                if(data["citation_publisher"]) data["dc.publisher"]=data["citation_publisher"];

                                if (data && data["dc.publisher"] && Array.isArray(data["dc.publisher"]) && data["dc.publisher"][0]) {

                                   switch (data["dc.publisher"][0]) {
                                        case "GeoScienceWorld":
                                            // for aggregators don't bother to store publisher as it's wrong.
                                            break;
                                        default:
                                            $("#SRpublisher").val(data["dc.publisher"][0]);
                                    }
                                }

                                if (!data["dc.creator"]) {

                                    data["dc.creator"] = data["citation_author"];

                                }

                                if (data && data["dc.creator"] && Array.isArray(data["dc.creator"]) && data["dc.creator"][0]) {
                                    {

                                        for (let i = 0; i < data["dc.creator"].length; i++) {
                                            if ($(".refauthorname").last().val()) {
                                                newauthorrow();
                                            }

                                            // are the authors reversed? there's no way to check reliably 100%
                                            // but all strings must have at least one comma for it to be reversed.
                                            if (data["dc.creator"].every((creator) => {
                                                return creator.includes(",");
                                            }))
                                                $(".refauthorname").last().val(data["dc.creator"][i]);
                                            else
                                                $(".refauthorname").last().val(reverse_author(data["dc.creator"][i]));
                                        }

                                    }
                                }
                                if (data && data["dc.identifier"] && Array.isArray(data["dc.identifier"]) && data["dc.identifier"][0]) {
                                    let identifier = data["dc.identifier"].find(item => item.startsWith("10."));
                                    if (identifier) $("#SRdoi").val(identifier);
                                }


                                if(data["citation_firstpage"])
                                {
                                    $("#SRfrom, #SRto").val(data["citation_firstpage"][0]);
                                }
                                if(data["citation_lastpage"])
                                {
                                    $("#SRto").val(data["citation_lastpage"][0]);
                                }

                                if(data["citation_title_cz"])
                                {
                                    $("#SRlangs option[value='cs']").prop("selected", true);
                                    $('.chosen-select').trigger("chosen:updated");
                                    $("#SRtitleE").val(data["citation_title"][0]);
                                    $("#SRtitle").val(data["citation_title_cz"][0]);
                                    do_we_show_the_language_boxes();
                                }



                            });
                        }

                        function fixMalformedUtf8(str) {
                            return decodeURIComponent(escape(str));
                        }

                        if (url.includes('geokniga.org')) {
                         //   console.log("URL match");


                            url = url.replace("https://www.geokniga.org/books/", "");

                         //   console.log("raw ID " + url);

                            let bookid = parseInt(url);

                         //   console.log("book ID " + bookid);

                            if (!isNaN(bookid) && bookid > 0) {
                                url = "/get_gk.php?id=" + bookid;
                                console.log("get " + url);
                                $.get(url, function (data) {

                                    //   console.log(data);


                                    data = JSON.parse(data);

                                    console.log(data);

                                    $("#SRfileurl").val(data.file);
                                    $("#SRulpush").val(6);
//                                    $("#SRjournal").val(data.title);

                                    var currentJournal = $("#SRjournal").val().trim();
                                    var newTitle = data.title.trim();

                                    if (currentJournal === "" || !newTitle.startsWith(currentJournal)) {
                                        $("#SRjournal").val(newTitle);
                                        $("#SRtitle").val(''); // Clear the title if the journal is replaced
                                        $("#SRtitleE").val(''); // Clear the title if the journal is replaced
                                    } else {
                                        var newTitleSuffix = newTitle.substring(currentJournal.length).trim();
                                        $("#SRtitle").val(newTitleSuffix);
                                        $("#SRtitleE").val(''); // Clear the title if the journal is replaced
                                    }

                                    $("#SRpublisher").val(data.pub);
                                    $("#SRplace").val(data.place);
                                    $("#SCyear").val(data.year);

                                    if (data.language) {
                                        $("#SRlangs option[value='" + data.language + "']").attr('selected', 'selected');
                                        $("#SRlangs").trigger("chosen:updated");
                                        do_we_show_the_language_boxes();
                                    }

                                    if (data.editor) {
                                        $(".refauthortype").val(4);
                                    }

                                    for (let i = 0; i < data.authors.length; i++)
                                    {
                                        if($(".refauthorname").last().val())
                                        {
                                            newauthorrow();
                                        }
                                        $(".refauthorname").last().val(data.authors[i]);
                                    }


                                });

                            }


                        } else    if (url.includes('neliti.com'))
                        {
                            $.ajax({
                                url: 'url_metadata.php',
                                type: 'GET',
                                dataType: 'json',
                                data: { s: url },
                                success: function(response) {
                                    console.log(response);

                                    $('#referencetype').val(35);

                                    if($('#SRJournal').val()=='') {
                                        if (response.citation_journal_title) {
                                            $('#SRjournal').val(response.citation_journal_title);
                                        }
                                    }
                                    if (response.citation_title) {
                                        $('#SRtitle').val(response.citation_title);
                                    }

                                    if (response.citation_publisher) {
                                        $('#SRpublisher').val(response.citation_publisher);
                                    }

                                    if (response.citation_firstpage) {
                                        $('#SRfrom').val(response.citation_firstpage);
                                    }
                                    if (response.citation_lastpage) {
                                        $('#SRto').val(response.citation_lastpage);
                                    }
                                    if (response.citation_doi) {
                                        $('#SRdoi').val(response.citation_doi);
                                    }
                                    if (response.citation_publication_date) {
                                        $('#SCyear').val(response.citation_publication_date);
                                    }
                                    if (response.citation_issue) {
                                        $('#SCissue').val(response.citation_issue);
                                    }
                                    if (response.citation_volume) {
                                        $('#SCvol').val(response.citation_volume);
                                    }
                                    if (response.citation_pdf_url) {
                                        $('#SRfileurl').val(response.citation_pdf_url);
                                        $('#SRulpush').val(1);
                                    }
                                    for (let i = 0; i < response.citation_author.length; i++)
                                    {
                                        if($(".refauthorname").last().val())
                                        {
                                            newauthorrow();
                                        }
                                        $(".refauthorname").last().val(reverse_author(response.citation_author[i]));
                                    }

                                    // Set other parameters from the JSON response if needed
                                },
                                error: function(xhr, status, error) {
                                    console.error(error);
                                }
                            });
                        }
                    },1);


                });



                $("#SRstructuredbox").on("dragover",function(ev){

                    ev.stopPropagation();
                    ev.preventDefault();
                    ev.originalEvent.dataTransfer.dropEffect = "copy";
                    $(this).css("background-color","#ff4");

                });

                $("#SRstructuredbox").on("dragleave",function(ev){

                    ev.stopPropagation();
                    ev.preventDefault();
                    ev.originalEvent.dataTransfer.dropEffect = "copy";
                    $(this).css("background-color","#EFF8F8");

                });

                $("#SRstructuredbox").on("drop",function(ev) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    console.log(ev.originalEvent.dataTransfer.files[0]);
                    $(this).css("background-color","#EFF8F8");
                    handlefile(ev);

               //     "#hidfile"

                });




                $("#doiimport").click(function() {

                    let stuff = $("#SRdoi").val();
                    decodepasted(stuff);
                    fixlabels();

                });





                function changefileurl()
                {

                    let url = $("#SRfileurl").val().replaceAll("_","-");
                    url = url.replaceAll("%20","-");
                    url = url.replaceAll(".","-");


                    let m, regex;
                    let year=0, month=0, day=0;
                    console.log("change value "+url);

                    // get year-month-day
                    regex = /\D((19|20)(\d\d))-(\d\d)-(\d\d)\D/;
                    if ((m = regex.exec(url)) !== null) {
                        year = m[1];
                        month= m[4]*1;
                        day = m[5];

                    } else
                    {

                        regex = /\D((19|20)(\d\d))-(\d\d)\D/;
                        if ((m = regex.exec(url)) !== null) {
                            year = m[1];
                            month= m[4]*1;
                        } else {
                            // get year
                            regex = /\D((19|20)(\d\d))\D/;

                            if ((m = regex.exec(url)) !== null) {
                                year = m[1];
                            } else
                            {
                                regex = /\D((19|20)(\d\d))(\d\d)\D/;

                                if ((m = regex.exec(url)) !== null) {
                                    year = m[1];
                                    month = m[4]*1;
                                }
                            }

                            if(url.includes("Jan")) month=1; else
                            if(url.includes("Feb")) month=2; else
                            if(url.includes("March")) month=3;else
                            if(url.includes("Apr")) month=4;else
                            if(url.includes("May")) month=5;else
                            if(url.includes("June")) month=6;else
                            if(url.includes("July")) month=7;else
                            if(url.includes("August")) month=8;else
                            if(url.includes("Sept")) month=9;else
                            if(url.includes("October")) month=10;else
                            if(url.includes("Nov")) month=11;else
                            if(url.includes("December")) month=12;else

                            if(url.includes("Spring")) month=13;else
                            if(url.includes("Summer")) month=14;else
                            if(url.includes("Fall")) month=15;else
                            if(url.includes("Autumn")) month=15;else
                            if(url.includes("Winter")) month=16;


                        }

                    }

                    if((year)&&($("#SCyear").val()=="")) $("#SCyear").val(year);
                    if((month)&&($("#SCmonth").val()=="0")) $("#SCmonth").val(month);
                    if((day)&&($("#SCday").val()=="")) $("#SCday").val(day);



                }


                $('#SRfileurl').parent().on('paste', async function(event) {
                    const clipboardItems = await navigator.clipboard.read();
                    for (const clipboardItem of clipboardItems) {
                        for (const type of clipboardItem.types) {
                            if (type.startsWith('image/')) {
                                const blob = await clipboardItem.getType(type);
                                const dataUrl = await getDataUrlFromBlob(blob);
                                $('#SRfileurl').val(dataUrl);
                                event.preventDefault();
                                return;
                            }
                        }
                    }
                });

                async function getDataUrlFromBlob(blob) {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                }



                $("#SRfileurl").on("paste",function(e) {


                    /* special paste handlers for fileurl */

                    setTimeout(function() {
                        let url = $("#SRfileurl").val();

                        changefileurl();

                        if (url.includes("dropbox.com"))
                        {
                            $("#SRcoverpage").show();


                            $("#SRulpushopen, #SRulpushclosed").remove();
                            $("#SRulpush").attr("disabled","1").css("opacity","50%");


                            $("#SRsave").hide().before("<button type='button' id='SRulpushopen'>🔓 Open</button><button type='button' id='SRulpushclosed'>🔒 No Access</button>");


                            $("#SRulpushopen").click(function() {
                                $("#SRulpush").val(1);
                                $("#SRsave").click();
                            });

                            $("#SRulpushclosed").click(function() {
                                $("#SRulpush").val(3);
                                $("#SRsave").click();
                            });

                            let year = $("#SCyear").val();
                            if(year)
                            {
                                year=year * 1;
                                let curyear = new Date().getFullYear();
                                if(year<(curyear-95)) $("#SRulpushclosed").hide();
                            }


                        }

                    },1);

                });


                $("#SRopenurl").click(function() {

                    let url = $("#SRurl").val();
                    if(url.length)
                    {

                        window.open(url,'_blank');
                    }
                });

                $("#SRarchiveurl").click(function() {

                    let url = $("#SRurl").val();
                    if(url.length)
                    {
                        url=url.replace("http://","");
                        url=url.replace("https://","");

                        url = "https://web.archive.org/web/*/"+url;

                        window.open(url,'_blank');
                    }
                });

                $("#SRopefileurl").click(function() {

                    let url = $("#SRfileurl").val();
                    if(url.length)
                    {

                        window.open(url,'_blank');
                    }
                });

                $("#hidfile").change(handlefile);

                function handlefile(ev) {

                 //   console.log("handlefile");
                  //  console.log(ev);

                    let reader = new FileReader();
                    let uuid=0;
                    let perm=0;
                    let dtype=0;
                    let com='';
                    let fn='';
                    $("#SRfileuploadbox").remove();
                    $("<div id='SRfileuploadbox' class='Rbox'><b><button id='SRfilehide' type='button'>Close</button>File Upload</b><div id='SRfup'></div></div>").insertAfter("#SRstructuredbox");



                    let file;


                    if(ev.type=='drop') {
                    //    console.log("drop");
                        file = ev.originalEvent.dataTransfer.files[0];
                    }
                    else
                    {
                     //   console.log("click");
                        file = document.getElementById('hidfile').files[0];
                    }




                    let html="<div id='SRfilenamerow'><headleft>Filename:</headleft><input id='SRfileuploadname' type='text' class='padleft80' value='"+encodeURI(file.name)+"'></div><div id='SRfilesizerow'><headleft>Size:</headleft><div class='padleft80 SRfiledivtext'>"+nicesize(file.size)+" &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; File type: &nbsp; "+file.type+"</div></div><div id='SRfilecommentrow'><headleft>Comment:</headleft><input id='SRfilecomment' type='text' class='padleft80'></div>" +
                        "<div class='SRline'><headleft>Doc type:</headleft><select class='padleft80' id='SRuploadtype'><option value='0'>- Please select -</option><option value='1'>Primary Document</option><option value='2'>Media / Plate / Map</option><option value='3'>Supplementary Document</option>";

                    html+="<option value='5'>Archive</option><option value='8'>Erratum</option>";
                    if(file.type=="image/png" || file.type=="image/jpeg" || file.type=="image/gif") {
                        html += "<option value='4'>Cover Artwork</option>";

                    }
                    html+="</select>";


                    let year = $("#SCyear").val();
                    if(year!='') year = parseInt(year); else year=0;



                    html+="&nbsp; Permission: <select id='SRfilepermission'><option value='0'>All Members</option><option value='1'>Approved members only (Level 1+)</option><option value='2'>No Public Access</option></select>";



                    html+="&nbsp; Cover Page: <input id='SRfileuploadcover' placeholder='1'>";

                    html+="<button id='SRuploadme'>Upload File</button></div>";

                    html+="<div class='SRline'><headleft>Quick Upl.:</headleft><button type='button' class='padleft80' id='SRqs_open'>🔓 All Members</button> <button type='button' id='SRqs_closed'>🔒 No Access</button>";

                    if(file.type=="image/png" || file.type=="image/jpeg" || file.type=="image/gif") {
                        html += "<button type='button' id='SRqs_cover'>🖼️ Cover Art</button>";
                    }
                    html+="</div></div>";

                    $(html).appendTo("#SRfup");

                    $("#SRqs_open").click(function() {
                        $("#SRfilepermission").val(0).show();
                        if($("#SRuploadtype").val()=='0') $("#SRuploadtype").val(1);
                        $("#SRuploadme").click();
                    });

                    $("#SRqs_closed").click(function() {

                        $("#SRfilepermission").val(2);
                        if($("#SRuploadtype").val()=='0') $("#SRuploadtype").val(1);
                        $("#SRuploadme").click();
                    });

                    $("#SRqs_cover").click(function() {
                        $("#SRuploadtype").val(4);
                        $("#SRfilepermission").val(0).hide();
                        $("#SRuploadme").click();
                    });


                    $("#SCyear").change(uploadyear);
                    uploadyear();

                    function uploadyear()
                    {
                        let year = $("#SCyear").val();
                        if(isNormalInteger(year))
                            year = parseInt(year);
                        else
                            year=0;

                        if((year==0) || (year>new Date().getFullYear()-96))
                        {
                            $("#SRfilepermission").removeAttr('disabled');
                        } else
                        {
                            $("#SRfilepermission").prop('disabled', 'disabled').val(0);
                        }


                    }


                    function isNormalInteger(str) {
                        return /(0|[1-9]\d*)$/.test(str);
                    }


                    $("#SRuploadtype").on("change",function() {

                        switch($(this).val())
                        {
                            case "4":
                                $("#SRfilepermission").val(0).hide();
                                break;
                            default:
                                $("#SRfilepermission").show();
                                break;
                        }

                    });

                    resizer('#Reditor');



                    $("#SRfilehide").click(function() {
                        $("#SRfileuploadbox").remove();
                    });



                    $("#SRuploadme").click(function() {

                        //check stuff here

                        dtype= parseInt($("#SRuploadtype").val());
                        com = $("#SRfilecomment").val();
                        cov = $("#SRfileuploadcover").val();
                        fn = $("#SRfileuploadname").val();

                         $("#SRfilehide").hide();

                         if(dtype) {


                             perm = $("#SRfilepermission").val();
                             // don't try to copyright when it's not
                             let year = $("#SCyear").val();
                             if(year>100 && year<1926) perm=0;

                             uuid = randomId();

                             $("#SRfup").html("<div><headleft>Uploading:</headleft><div class='padleft80' id='SRprogress'></div></div>");

                             uploadFile(file);
                         } else alert("Please select a document type (and check permission status)");
                    });

                    function randomId()
                    {
                        const uint32 = window.crypto.getRandomValues(new Uint32Array(1))[0];
                        return uint32.toString(16);
                    }


                    /*
                    const chunk_size= 5000 * 1024 ;
                    let uploadStartTime = 0; // Variable to track start time
                    let totalBytesTransferred = 0; // Variable to track total bytes transferred


                    function uploadFile(fileInput) {
                        uploadStartTime = new Date().getTime(); // Set start time when upload begins
                        totalBytesTransferred = 0; // Reset the total bytes transferred
                        _uploadChunk(fileInput, 0, chunk_size);
                    }








                    function _uploadChunk(file, offset, range) {
                        // if no more chunks, send EOF

                        let fref = ref;
                        if(!fref) fref = $("#SRtempid").val();

                        let url = '/ref_file_upload_ajax.php';

                        if(typeof ulurlmap == 'function') url = ulurlmap(url);
                        if (offset >= file.size) {

                            $.ajax({
                                type: 'post',
                                url: url,
                                crossDomain: true,

                                xhrFields: {
                                    withCredentials: true
                                },
                                data: {
                                    filename: fn,
                                    uuid: uuid,
                                    ref: fref,
                                    dtype: dtype,
                                    comment: com,
                                    permission: perm,
                                    cover: cov,
                                    eof: 1
                                }
                            });




                            $("#SRprogress").html("Upload complete!").attr("id","SRprogressdone");
                            $("#SRfilehide").show();
                            $("#SRfup").css("background","#00ff00");

                            // increment file counter on structured form
                            let cnt = parseInt($("#SRfilecount").html());
                            cnt++;
                            $("#SRfilecount").html(cnt);


                            return;
                        } // end if(offset >= file.size)

                        let progress = parseInt(offset * 100 / file.size);



                        if (offset > 0) { // Only calculate speed if some data has been sent
                            let currentTime = new Date().getTime();
                            totalBytesTransferred += range;
                            let timeElapsedInSeconds = (currentTime - uploadStartTime) / 1000;
                            let speedInKbps = (totalBytesTransferred / 128) / timeElapsedInSeconds;

                            $("#SRprogress").html(progress + "% uploaded <span style='float:right'>(" + speedInKbps.toFixed(2) + "kbps)</span>");
                        }

                        if((progress>1)&&(progress<100))
                        {

                            $("#SRfup").css("background", "linear-gradient(to right, rgb(255 51 5 / 30%) 0%,rgba(255,242,5,1) "+progress+"%,rgba(255,242,5,0) "+(progress)+"%,rgba(255,242,5,0) 100%)");
                        }



                        // prepare reader with an event listener
                        reader.addEventListener('load', function(e) {


                            var index = offset / chunk_size;
                            var data = e.target.result.split(';base64,')[1];



                            // build payload with indexed chunk to be sent
                            var payload = {
                                filename: fn,
                                index: index,
                                filesize: file.size,
                                uuid: uuid,
                                data: data,
                                ref: fref,
                                comment: com,
                                dtype: dtype,
                                permission: perm,
                                cover: cov
                            };


                            $.ajax({
                                type: 'post',
                                url: url,
                                crossDomain: true,
                                tryCount: 0,
                                retryLimit: 100,

                                xhrFields: {
                                    withCredentials: true
                                },
                                data: payload,
                                success:  function() {
                                    _uploadChunk(file, offset + range, chunk_size);
                                },
                                error: function(xhr, textStatus, errorThrown ) {

                                    console.log("chunk error");
                                    this.tryCount++;
                                    if (this.tryCount <= this.retryLimit) {
                                        //try again
                                        $.ajax(this);
                                        return;
                                    }
                                    return;

                            }

                        }); // end $.ajax



                        }, {once: true} ); // end addeventlistener

                        // chunk and read file data
                        var chunk = file.slice(offset, offset + range);
                        reader.readAsDataURL(chunk);
                    } // end upload_chunk

                     */

                    const chunk_size = 1500 * 1024;

                    console.log("Chunk size: "+chunk_size);

                    function uploadFile(fileInput) {
                        let uploadStartTime = new Date().getTime(); // Track upload start time
                        let totalBytesTransferred = 0; // Track total uploaded bytes

                        const updateProgress = (offset, fileSize) => {
                            const progress = Math.min((offset / fileSize) * 100, 100).toFixed(2);
                            const currentTime = new Date().getTime();

                            // Update total transferred bytes
                            totalBytesTransferred = offset;

                            // Calculate time elapsed in seconds
                            const timeElapsedInSeconds = (currentTime - uploadStartTime) / 1000;

                            // Calculate upload speed in kbps
                            const speedInKbps = timeElapsedInSeconds > 0 ? (totalBytesTransferred / 128) / timeElapsedInSeconds : 0;

                            // Update progress bar message with speed
                            document.getElementById("SRprogress").innerHTML =
                                `Uploading... ${progress}% <span style='float:right'>(${speedInKbps.toFixed(2)} kbps)</span>`;

                            // Update gradient background
                            if (progress > 1 && progress < 100) {
                                document.getElementById("SRfup").style.background = `
            linear-gradient(to right, rgb(255 51 5 / 30%) 0%, 
            rgba(255,242,5,1) ${progress}%, 
            rgba(255,242,5,0) ${progress}%, 
            rgba(255,242,5,0) 100%)`;
                            } else if (progress >= 100) {
                                document.getElementById("SRfup").style.background = "#00ff00"; // Solid green on completion
                            }
                        };


                        const _uploadChunk = (file, offset, range) => {
                            const fref = ref || document.getElementById("SRtempid").value;
                            const url = '/ref_file_upload_ajax.php';
                            const chunk = file.slice(offset, offset + range); // Slice as Blob

                            if (offset >= file.size) {
                                const fref = ref || document.getElementById("SRtempid").value;

                                const formData = new FormData();
                                formData.append('filename', fn);
                                formData.append('uuid', uuid); // Ensure uuid is sent
                                formData.append('ref', fref);
                                formData.append('dtype', dtype);
                                formData.append('comment', com);
                                formData.append('permission', perm);
                                formData.append('cover', cov);
                                formData.append('filesize', file.size); // Include the total file size
                                formData.append('eof', 1); // Flag for EOF

                  //              console.log("Sending EOF payload as FormData");

                                fetch('/ref_file_upload_ajax.php', {
                                    method: 'POST',
                                    credentials: 'include',
                                    body: formData
                                }).then(response => {
                                    if (response.ok) {
                 //                       console.log("EOF successfully sent.");
                                        document.getElementById("SRprogress").innerHTML = "Upload complete!";
                                        document.getElementById("SRfilehide").style.display = "block";
                                        document.getElementById("SRfup").style.background = "#00ff00";

                                        const cnt = parseInt(document.getElementById("SRfilecount").innerHTML);
                                        document.getElementById("SRfilecount").innerHTML = cnt + 1;
                                    } else {
                                        console.error("Failed to send EOF request.");
                                    }
                                }).catch(err => {
                                    console.error("Error sending EOF request:", err);
                                });

                                return;
                            }

                            // Build FormData
                            const formData = new FormData();
                            formData.append('filename', fn);
                            formData.append('index', Math.floor(offset / range));
                            formData.append('filesize', file.size);
                            formData.append('uuid', uuid);
                            formData.append('chunk', chunk);
                            formData.append('ref', fref);
                            formData.append('comment', com);
                            formData.append('dtype', dtype);
                            formData.append('permission', perm);
                            formData.append('cover', cov);


              //              console.log(`Uploading chunk at offset ${offset}: size ${chunk.size} bytes`);

                            // Send FormData with Fetch API
                            fetch(url, {
                                method: 'POST',
                                credentials: 'include',
                                body: formData
                            }).then(response => {
                                if (response.ok) {
             //                       console.log("Chunk uploaded successfully.");
                                    updateProgress(offset + range, file.size);
                                    _uploadChunk(file, offset + chunk.size, range);
                                } else {
                                    console.error("Chunk upload failed, retrying...");
                                    setTimeout(() => _uploadChunk(file, offset, range), 1000);
                                }
                            }).catch(error => {
                                console.error("Error during chunk upload:", error);
                                setTimeout(() => _uploadChunk(file, offset, range), 1000);
                            });
                        };

                        _uploadChunk(fileInput, 0, chunk_size);
                    }


                }

                function nicesize(size)
                {
                    if(size<10000)
                    {
                        return(size.toLocaleString()+" bytes");
                    }
                    size=size/1024;
                    if(size<1024)
                    {
                        return(size.toLocaleString()+" Kbytes");
                    }
                    size=size/1024;
                    if(size<1024)
                    {
                        return(size.toLocaleString()+" Mbytes");
                    }
                    size=size/1024;

                    return(size.toLocaleString()+" Gbytes");

                }

                if($("#referencetype").val()!="0") {
                              $("#SRlangs, #SRlangsminor").chosen();
                              $("#SRlangs").chosen().change(do_we_show_the_language_boxes);
                }
                $(".unionjack").click(function() {

                    let ctrl = $(this).siblings("input").attr("id");
                    ctrl = ctrl.slice(0,-1);
                    console.log("we have "+ctrl);

                    let str = encodeURIComponent($("#"+ctrl).val());
                    console.log("value: "+str);

                    let url = "https://translate.google.com/?sl=auto&tl=en&text="+str;

                    window.open(url, '_blank');

                });


                function do_we_show_the_language_boxes()
                {

                    let show=0;
                    if($("#SRjournalE").val().length) show=1;
                    if($("#SRtitleE").val().length) show=1;

                    if(!show)
                    {
                        let ar = $("#SRlangs").val();
                        for(let i=0; i<ar.length;i++)
                        {
                            if(ar[i]!=68) show=1;
                        }
                    }

                    if(show)
                    {
                        $("#SRjournalErow, #SRtitleErow").show();
                    } else
                    {
                        $("#SRjournalErow, #SRtitleErow").hide();
                    }


                }
                do_we_show_the_language_boxes();



                $("NEWFILE").click(function() {

                    if($("#SRfileuploadname, #SRprogress").length)
                    {
                        alert("Please complete your existing upload first");
                    } else {
                        $("#hidfile").click();
                    }
                });

                $("#SRsave").click(function() {

                    $("#SRmatcharea").remove();

                    if($("#SRfilehide:hidden, #SRuploadme:visible").length)
                    {
                        if(confirm("Are you sure you want to contine saving when the file has not yet uploaded? The file will not be attached."))
                        {
                            $("#SRfileuploadbox").remove();
                        }  else {
                            return;
                        }


                    }

                    /*
                    if($("#referencetype").val()=="0")
                    {

                        alert("Please select a reference type before saving");
                        return;
                    }
                    */


                    /*
                    if($("#SRfulltext").val()=="")
                    {
                        alert("You must complete the unstructured reference field or convert it from the structured data");
                        return;
                    }
                     */

                    /*
                    if($("[changed=1]").length)
                    {
                        if(!confirm("Are you sure you want to save without updating the unstructured reference?"))
                        {
                            return;
                        }
                    }
*/
                    let output = {};

                    $("#Rstuff INPUT, #Rstuff SELECT, #Rstuff TEXTAREA").each(function() {
                        output[$(this).attr('id')]=$(this).val();
                    });




                    let comp = JSON.stringify(output);


                    $("#SRsave, #SRulpushclosed, #SRulpushopen").off().attr("disabled", true).css("opacity","0.3");



                    $.post("/refs_callback.php", {r: ref, c: cit, sd: comp}, function (data) {
         //               console.log("Saving with ref = "+ref);
        //                console.log("return");
        //                console.log(data);

                        let ret = JSON.parse(data);




                        $("#SCrefid").val(ret.id);
                        $("#SCsave").removeAttr("disabled");
                        $("#SCcitationbox").show();
                        $("#SCpleasesearch").hide();

                        $("#currentrefforcitation").html(ret.txt);

                        // this needs to be changed to 'Edit' if there is an existing id?

                        $("#SCeditref").text("Re-enter Reference");

                        $("#Reditor").fadeOut().remove();
                        if($("#EDITREFONLY").length) {
                            $("#SRblock").remove();



                            if(brandnew)
                            {
                                if(data)
                                {
                                    data = JSON.parse(data);
                                    data = data.id;
                                    window.location.href="/reference.php?id="+data;
                                    return;
                                } else
                                {
                                    window.location.href="/reference.php";
                                    return;
                                }
                            }

                            if(reloadme)  location.reload();
                            $('html,body').css('overflow','auto');


                        }
                            else
                            $("#RCeditor").show();
                        rcshowhidden();
                    });


                });
                $("#authpaste").click(function() {

                    $("#SRauthpaste").remove();

                    $("#SRauthors").after("<div id='SRauthpaste' class='SRline'><button class='srfloatbut' id='authpastequit'>Close</button>" +
                        "<headleft>Paste:</headleft><input id='authpastein' type='text' class='padleft80' placeholder='Paste in here'>" +
                        "<select id='authpastego'><option value=0>- Select format to import-</option>" +
                        "<option value=1>Fred Bloggs, Joe Smith</option>" +
                        "<option value='2'>Bloggs F, Smith J</option>" +
                        "<option value='5'>Bloggs F; Smith J</option>" +
                        "<option value='3'>Bloggs, F; Smith, J</option>" +
                        "<option value='4'>Bloggs, F., Smith, J</option>" +

                        "</select></div>");
                    $("#authpastequit").click(function() {
                        $("#SRauthpaste").remove();
                    });

                    $("#authpastein").on('paste', function(event) {
                        event.preventDefault();

                        let clipboardData = (event.originalEvent || event).clipboardData || window.clipboardData;
                        let pastedData = clipboardData.getData('Text');

                        pastedData = pastedData.replace(/(\r\n|\n|\r)/g, ", ");

                        $(this).val(pastedData);
                    });


                    $('#authpastego').on("change",function() {
                        let content = $("#authpastein").val();

                        content = content.replace(/\d+/g, '');
                        content = content.replaceAll('&',",");
                        content = content.replaceAll('·',",");
                        content = content.replaceAll(" and ",", ");
                        content = content.replaceAll(", ,",",");
                        content = content.replaceAll(",,",",");
                        content = content.replaceAll("(Editor)","");
                        content = content.replaceAll("(editor)","");
                        content = content.replaceAll(", Jr."," Jr.");
                        content = content.replaceAll(", Sr."," Sr.");



                        let mode = $("#authpastego").val();

                        if(content=='')
                        {
                            $("#authpastego").val(0);
                            $("#authpastein").attr("placeholder","Paste in here FIRST!");
                        } else
                        {
                            let parts;
                            if(mode=="4")
                            {
                                content = replaceEverySecondComma(content);
                                mode="3";
                            }
                            if(mode=="5")
                            {
                                content = content.replace(";",",");
                                mode="2";
                            }

                            if(mode=="3")
                            {
                                parts = content.split(";");
                            } else {
                                parts = content.split(",");
                            }

                            let out;

                            for(let i=0;i<parts.length;i++) {

                                switch (mode)
                                {
                                    case "1":
                                        out = reverse_author(parts[i].trim());
                                    break;
                                    case "2":
                                        out = parts[i].trim().replace(" ", ", ");
                                    break;
                                    case "3":
                                        out = parts[i].trim();
                                        break;

                                }



                                if($(".refauthorname").last().val())
                                {
                                    newauthorrow();
                                }

                                out = out.trim();

                                $(".refauthorname").last().val(out);
                            }
                            $("#SRauthpaste").remove();

                        }


                    });


                });

				function replaceEverySecondComma(str) {
					let count = 0;
					return str.replace(/,/g, function(match) {
						count++;
						return (count % 2 === 0) ? ';' : match;
					});
				}


                $("#SRimport").click(function() {

                        $(this).hide();
                        $("<div id='SRimportbox'  class='Rbox'><b><button id='SRhideimport'>Hide</button>Import</b>" +
                            "<div id='SRimportpasterow'>" +
                            "<headleft>Paste here:</headleft>" +
                            "<textarea id='SRimporter' class='padleft80' rows='3'></textarea>" +
                            "</div>" +
                            "<div><button id='SRimportgo'>Import</button><input type='file' style='display: none' id='realimport'><button id='SRimportupload' class='padleft80'>Upload</button>" +
                            "</div>").prependTo("#Rstuff");

                        $("#SRhideimport").click(function() {

                            $("#SRimport").show();
                            $("#SRimportbox").remove();
                            resizer('#Reditor');
                        });

                        $("#SRimportgo").click(function() {

                            let stuff = $("#SRimporter").val();
                            decodepasted(stuff);
                        });

                        var control = document.getElementById("realimport");
                        control.addEventListener("change", function(event){
                            var reader = new FileReader();
                            reader.onload = function(event){
                                var contents = event.target.result;
                                document.getElementById('SRimporter').value = contents;
                                decodepasted(contents);
                            };
                            reader.onerror = function(event){
                                alert("File could not be read! Code " + event.target.error.code);
                            };
                            reader.readAsText(control.files[0]);

                        }, false);


                        $("#SRimportupload").click(function() {

                            $("#realimport").click();
                        });

                        $("#SRimporter").on("paste",function(e) {

                            $("#SRimporter").val("");
                            let stuff = e.originalEvent.clipboardData.getData('text');
                            decodepasted(stuff);
                        });

                    resizer('#Reditor');


                });

                $("#SRstructplus").click(function() {
                    $(this).hide();
                    $("#SRstructminus").show();
                    $("#SRallstruct").show();
                    resizer('#Reditor');
                });

                $("#SRstructminus").click(function() {
                    $(this).hide();
                    $("#SRstructplus").show();
                    $("#SRallstruct").hide();
                    resizer('#Reditor');
                });

                $("#SRabsplus").click(function() {
                    $(this).hide();
                    $("#SRabsminus").show();
                    $("#SRabstract").show();
                    resizer('#Reditor');
                });

                $("#SRabsminus").click(function() {
                    $(this).hide();
                    $("#SRabsplus").show();
                    $("#SRabstract").hide();
                    resizer('#Reditor');
                });

                    $('#SRdeepmatchbutton').click(function () {
                        $('#SRdeepmatchbutton').prop('disabled',true);
                            $("#SRmatcharea").remove();
                            $("<div id='SRmatcharea' class='Rbox'><b><button id='SRhidemerge'>Hide</button>Match Reference</b><div id='matchzone'><p>Please wait for search</p></div></div>").appendTo("#Reditor");
                            $('#SRstructminus').click();
                            $('#SRabsminus').click();
                    let str = $("#SRfulltext").val();
                    $.get("/refs_callback.php", {r: ref, c: cit, ea: 3, cs: str, automatch: 1}, function (data)
                    {


                            $("#matchzone").html(data);
                             $('.selectablerefidtd').click(expand_children);



                            resizer('#Reditor');



                        $('#SRdeepmatchbutton').prop('disabled',false);

                            $("#ref_nomatch").click(function () {
                                $('#SRstructplus').click();

                                let type = parseInt($('#referencetype').val());

//                            alert("Type "+type);

                            if(!type)
                            {
                                    $("#matchzone").html("Please select TYPE of record");
                                $("#referencetype").css("background-color",'#ff0').on('change',function()
                                {
                                        $("#referencetype").css("background-color", '');

                                        do_match();

                                    });


                            } else
                            {
                                    do_match();
                                }


                            });



                            function do_match() {
                                let type = parseInt($('#referencetype').val());
                                switch (type) {

                                    case 63:
                                        $("#matchzone").html("You are adding an entire new journal. Next you must add the volumes and/or issues that the article citations appear in. Do NOT link those citations to a new journal record.<br><br>You should probably only add a new journal (entire run) if you really know what you're doing.");
                                        break;
                                    case 34:
                                    case 35:
                                    case 70:
                                    case 60:
                                        $("#matchzone").html("Enter a journal name in the Journal box above, and then click the 'Continue...' button.");
                                        $("#matchzone").append("<br><br><button id='continue_merge' disabled>Continue...</button>");
                                    $("#SRjournal").css("background-color",'#ff0').on('change',function()
                                    {
           //                             console.log("Changed!");
                                        $("#continue_merge").removeAttr("disabled");
                                            if($("#SRjournal").val().length) {
                                                $("#SRjournal").css("background-color",'').off();
                                            }
                                        });







                                        break;
                                    default:
                                        $("#matchzone").html("We can't help automate this type of entry (YET), so please carefully fill in the fields above as best as you can.");

                                        break;


                                }
                            }
                          //  $('.selectablerefidtd').click(searchtdlinks);





                            $(".ref_mergerow").click(function () {

                                let merge_id = $(this).attr("refid");
                                let mergename = $(this).text();

            //                    console.log("new code!");
                                $(".ref_mergerow").css('background-color', '');
                                $(this).css('background-color', '#ff0 !important');

                                setTimeout(function () {


                                    if (confirm("Are you sure you want to merge this record into " + mergename + "?")) {
                                        $("#SRmatcharea").html("Merging...");

                                        $.get("/refs_callback.php", {r: ref, merge_from: merge_id}, function (data) {

              //                              console.log("Merging records");
              //                              console.log(data);

                                            if (data == "1") {

             //                                   console.log("Data is 1");

                                                let cit = $("#SCcitid").val();

             //                                   console.log("CIT is "+cit);

                                                if(typeof cit !== 'undefined' && cit != 0 && cit != "0") {
                                                    $.get("/refs_callback.php", {c: cit, refresh: 1}, function (data) {


                                                        $("#SCallrefs").html(data);
                                                        $(".reflinebox").off("click", processrefline).on("click", processrefline);

                                                        $("#SRblock").fadeOut().remove();
                                                        setTimeout(function() {
                                                            $(".reflinebox[citid='" + cit + "']").click();
                                                        }, 100); // waits 100ms before clicking
                                                    });
                                                } else {
                                                    $("#SRblock").fadeOut().remove();

                                                 //   console.log("checking reloadme "+reloadme);

// Check if the page is 'reference.php' and there's an 'id' query parameter
                                                    $('html,body').css('overflow','auto');
                                                    if(reloadme) location.reload();
                                                }
                                            } else {
                                                $("#SRmatcharea").html("Sorry, this didn't work. Please try again." + data);
                                            }

                                        });

                                    } else {
                                        $(".ref_mergerow").css('background-color', '');
                                    }

                                    $(this).css('background-color', '');
                                }, 1);
                            });


                        });

                    });



                $("#SRmatchbutton").click(function() {

                    $("#SRmatcharea").remove();
                    $('#SRstructminus').click();
                    $('#SRabsminus').click();
                    $("<div id='SRmatcharea' class='Rbox'><b><button id='SRhidemerge'>Hide</button>Similar References</b></div>").appendTo("#Reditor");
                    $.ensure("#SRmatcharea").then(function () {
                        let str = $("#SRfulltext").val();
                        $("#SRsimilarref").remove();
                        $("#SRhidemerge").click(function() {
                            $("#SRmatcharea").remove();
                            resizer('#Reditor');
                        });
                        $("#SRmatcharea").html("Please wait, searching...");

                        $.get("/refs_callback.php", {r: ref, c: cit, ea: 3, cs: str}, function (data) {

                            $("#SRmatcharea").html(data);
                                $("#SRmatcharea").append("<div id='SRmatchbuttonsrow'><button id='SRmergesel'>Merge Selected</button><div class='clearer'></div></div>");
                            resizer('#Reditor');


                            $.ensure("#SRmergesel").then(function () {
                                $("#SRmergesel").click(function () {

                                    //alert('merge');

                                    let $clicked = $(".SRcheckmerge:checked");

                                    if($clicked.length)
                                    {
                                        let merge = "<div id='SCmergeinfo'>For each entry you wish to merge ensure any citation-specific data such as specific page(s) numbers or comments are copied into the boxes or they will get lost!</div>";

                                        let ml = 10; let mlr=0;

                                        $clicked.each(function() {

                                            let tl=parseInt($(this).attr("reflev"));

                                            if(tl>ml)
                                            {
                                                ml=tl;
                                                mlr=parseInt( $(this).attr("refid"));
                                            }


                                        });

                                        let continu=1;
                                        if(mlr)
                                        {
                                            if(confirm("Reference "+mlr+" has detailed information. Continuing will overwrite this, or cancel and switch to that record."))
                                            {
                                                // fall through...

                                            } else
                                            {
                                                if(confirm("Do you want to switch to the more complete record?"))
                                                {
                                                    if(refpage)
                                                    {
                                                        window.location.href="/reference.php?id="+mlr+"&oe=1";

                                                    } else {


                                                        $("#Reditor").fadeOut().remove();
                                                        $("#SRblock").remove();

                                                        $("#RCeditor").show();
              //                                          console.log(thebutton);
                                                        thebutton.attr("refid", mlr);
                                                        thebutton.click();
              //                                          console.log('x2');
                                                    }
                                                    return;
                                                } else {
                                                    continu = 0;
                                                }
                                            }


                                        }

                                        if(continu)
                                        {

                                            $clicked.each(function () {

                                                let id = $(this).attr("refid");

                                                let str = $("TD[refid=" + id + "]").html();

                                                let tl=parseInt($(this).attr("reflev"));




                                                merge += "<div class='SCmergedatarow'>";
                                                merge += "<button class='SCmergeremove'>x</button>"

                                                merge += "<div>" + str + "</div>";
                                                if(tl>9)  merge+="<div class='display: none'>";
                                                merge += "<p><label>No.</label> <input class='SCcode' id='SCcode_" + id + "'>" + "<label>Page(s)</label> <input class='SCfrom' id='SCfrom_" + id + "'>" + " <label>to</label> <input class='SCto' id='SCto_" + id + "'>" + " <label>Note:</label> <input class='SCcomments' id='SCcomments_" + id + "'></p></div>";

                                                if(tl>9) merge+="</div>";


                                            });

                                            $("#SRsimilarref").html(merge);

                                            $(".SCmergeremove").click(function () {

                                                $(this).parent().remove();

                                                if ($(".SCmergeremove").length == 0) {
                                                    $("#SRmatcharea").remove();

                                                }
                                                resizer('#Reditor');

                                            });


                                            $("#SRmergesel").unbind().html("Complete Merge").addClass("SCms2").click(function () {

                                                let $ctrls = $("#SRsimilarref input");

                                                //         alert("Now we process the sim refs, merge to ref "+ref+", with "+$ctrls.length+" data items");

                                                let data = {};


                                                $ctrls.each(function () {

                                                    let ctrlname = $(this).attr("id");
                                                    let ctrlval = $(this).val();
                                                    data[ctrlname] = ctrlval;
                                                });
          //                                      console.log(data);
                                                let str = JSON.stringify(data);

                                                $.get("/refs_callback.php", {
                                                    r: ref,
                                                    c: cit,
                                                    merge: str
                                                }, function (data) {

                //                                    console.log(data);

                                                    $("#SRmatcharea").remove();

                                                });

                                                //  alert("Merging "+$clicked.length+" entries" );

                                            });
                                        }
                                    } else
                                    {

                                        alert("You haven't selected any references to merge");



                                    }

                                });
                            });




                        });
                    });


                });

                $("#SRother").on("change",function() {

                    let v = $(this).val();




                    if(v=="0") $("#SRaddsup").attr("disabled","disabled");
                    else $("#SRaddsup").removeAttr("disabled");


                });

                $("#SRaddsup").click(function() {

                    $("#SRCustoms headleft").remove();

                    let cid = $("#SRother").val();
                    let ctxt = $("#SRother option:selected").text();

                    $("<div id='SRsupitemrow'><headleft>Other:</headleft><div class='padleft80 SRsupitemlabel'>"+ctxt+" : </div><input type='text' id='sup_"+cid+"' class='SRsupiteminput'></div>").prependTo("#SRCustoms");

                    $("#sup_"+cid).attr("ctxt",ctxt);
                    $("#SRother").val(0);
                    $("#SRaddsup").attr("disabled","disabled");

                    $("#SRother option[value='"+cid+"']").remove();
                    resizer('#Reditor');

                });

            });

        });

    });

}
var sfa;
function pushall(item)
{

    if(item)
    if(Array.isArray(item))
    {
        for(let i=0;i<item.length;i++)
        {
            if(item[i].sfa.length) sfa.push(item[i].sfa);
        }
    } else
    {
        if(item.sfa.length) sfa.push(item.sfa);
    }
}

function processclassify(data) {
    if (data.classify.recommendations.ddc) {

        sfa = [];
        pushall(data.classify.recommendations.ddc.mostPopular);
        pushall(data.classify.recommendations.ddc.latestEdition);
        pushall(data.classify.recommendations.ddc.mostRecent);
        sfa = [...new Set(sfa)];
        $("#SRddc").val(sfa.join(","));

        //        addotherfield("DDC",data.classify.recommendations.ddc.mostPopular.sfa);


    }
    if (data.classify.recommendations.lcc) {
        sfa = [];
        pushall(data.classify.recommendations.lcc.mostPopular);
        pushall(data.classify.recommendations.lcc.latestEdition);
        pushall(data.classify.recommendations.lcc.mostRecent);
        sfa = [...new Set(sfa)];
        $("#SRlcc").val(sfa.join(","));
    }
}

function ddcoclc(doauthor=1) {

    let type = $("#referencetype").val();
    let title;
    let author = '';

    switch (type)
    {
        case "34":
        case "60":
        case "77":
        case "47":
            title = $("#SRtitle").val();
            break;
        default:
            title = $("#SRjournal").val();
        break;
    }

    if(doauthor) author = $("#refauthorname_0").val();

    $.get("/classify_details.php",{a: author,t: title}, function(data)
    {
   //    console.log("returned (v2)");
    //   console.log(data)
       data = JSON.parse(data);
    //   console.log(data);
        $("#SRddc").val(data.ddc);
        $("#SRlcc").val(data.lcc);

    });

    if(0)
    {
        // this doesn't work any more.
    $.get("/ref_classify_gw.php",{type: 'at', author: author, title: title},
        function(data)
        {
     //       console.log("returned");
     //       console.log(data);

            data = parseXml(data);

            //      console.log(data);

            if(typeof data == "object") {
                if(data.classify.recommendations)
                {
                    processclassify(data);
                } else
                {
                    if(data.classify.works)
                    {
       //                 console.log("Works");
      //                  console.log(data.classify.works);
     //                   console.log(data.classify.works.work.length);
                        $("#SRclassify").remove();
                        $("#SRddcrow").after("<div class='SRline' id='SRclassify'><headleft>Select:</headleft><select class='padleft80' id='SRclassifysel'><option value='0'>- select closest title -</option></select><button type='button' id='SRclassifybutton'>Select</button></div>");



                        for(let i=0;i<data.classify.works.work.length;i++)
                        {
       //                     console.log(data.classify.works.work[i]);
                            let title = data.classify.works.work[i].author + " (" +
                                        data.classify.works.work[i].year + ") " +
                                        data.classify.works.work[i].title;


                            $('#SRclassifysel').append($('<option>', {
                                value: data.classify.works.work[i].owi,
                                text: title
                            }));
                        }

                        $("#SRclassifybutton").click(function() {

                            let owi = $("#SRclassifysel").val();

                            if(owi!="0")
                            {
                                $.get("/ref_classify_gw.php",{type: 'owi', data: owi},
                                    function(data) {
        //                                console.log("returned");
        //                                console.log(data);
                                        $("#SRclassify").remove();
                                        data = parseXml(data);

                                        //      console.log(data);

                                        if (typeof data == "object") {
                                            if (data.classify.recommendations) {
                                                processclassify(data);
                                            }
                                        }
                                    });

                            } else
                            {
                                confirm("You need to select an option");
                            }




                        });


                    } else
                    {
                        if(doauthor)
                        {
                            ddcoclc(0);
                        }
                    }
                }

            } else
            {
                if(doauthor)
                {
                    ddcoclc(0);
                }
            }

        });
        }
}
function classifyoclc(txt,type)
{
 //   console.log(txt);

    $.get("/ref_classify_gw.php",{type: type, data: txt},
        function(data) {

    //    console.log("returned");
   //     console.log(data);

        data = parseXml(data);

  //      console.log(data);

        if(typeof data == "object")
        {
            let authors=null;

            let overwrite=1;
            let atxt;
            if($("#refauthorname_0").val().length)
            {
                overwrite = confirm("Do you want to replace the existing author list?");
            }

            if(overwrite) {

                if (data.classify.authors) {


                    authors = data.classify.authors.author;
                    if(typeof authors == "object") authors = [authors];
                }
                    else
                    authors = data.classify.work.author.split(' | ');

            //    console.log(authors);

                if (authors) {
              //      console.log(authors.length);
                    clearauthors();
                    for (let i = 0; i < authors.length; i++) {

                        if(authors[i]["#text"])
                            atxt = authors[i]["#text"];
                        else
                            atxt = authors[i];
                        atxt = atxt.split("[");
                        atxt = atxt[0].trim();

                        let ctxt = atxt.split(",");
                        if (ctxt.length > 2) {
                            atxt = ctxt[0];
                            if (ctxt.length > 1)
                                atxt += ", " + ctxt[1];
                        }


                        if ($("#refauthorname_" + i).length == 0) newauthorrow();
                        $("#refauthorname_" + i).val(atxt);

                    }
                }
            }
                let work;
                if(data.classify.work)
                    work = data.classify.work;
                else
                    work = data.classify.works.work[0];

          //      console.log("work");
                $("#SRjournal").val(work.title);

                if(work.hyr==work.lyr) $("#SCyear").val(work.hyr);

                if(data.classify.recommendations)
                {
                    if(data.classify.recommendations.ddc)
                    {

                   //     console.log(data.classify.recommendations.ddc);

                        let sfa=[];
                        if(data.classify.recommendations.ddc.mostPopular)
                        {
                            sfa.push(data.classify.recommendations.ddc.mostPopular.sfa);
                        }
                        if(data.classify.recommendations.ddc.latestEdition)
                        {
                            sfa.push(data.classify.recommendations.ddc.latestEdition.sfa);
                        }
                        if(data.classify.recommendations.ddc.mostRecent)
                        {
                            sfa.push(data.classify.recommendations.ddc.mostRecent.sfa);
                        }
                        sfa = [... new Set(sfa)];
                        $("#SRddc").val(sfa.join(","));

                 //        addotherfield("DDC",data.classify.recommendations.ddc.mostPopular.sfa);



                    }
                    if(data.classify.recommendations.lcc)
                    {
                        let sfa=[];
                        if(data.classify.recommendations.lcc.mostPopular)
                        {
                            sfa.push(data.classify.recommendations.lcc.mostPopular.sfa);
                        }
                        if(data.classify.recommendations.lcc.latestEdition)
                        {
                            sfa.push(data.classify.recommendations.lcc.latestEdition.sfa);
                        }
                        if(data.classify.recommendations.lcc.mostRecent)
                        {
                            sfa.push(data.classify.recommendations.lcc.mostRecent.sfa);
                        }
                        sfa = [... new Set(sfa)];
                        $("#SRlcc").val(sfa.join(","));

                    }
                }

                switch(work.format)
                {
                    case "Book":
                    case "eBook":
                        $("#referencetype").val(8);
                        break;
                    default:
                        console.log("unknown format");
                        console.log(work.format);
                        break;
                }


            }

    });
}

function clearauthors()
{
    $(".refauthorname").val('');
    $(".refauthortype").val(0);
}


function parseXml(xml, arrayTags)
{
    let dom = (new DOMParser()).parseFromString(xml, "text/xml");


    function isArray(o)
    {
        return Object.prototype.toString.apply(o) === '[object Array]';
    }

    function parseNode(xmlNode, result)
    {
        if (xmlNode.nodeName == "#text") {
            var v = xmlNode.nodeValue;
            if (v.trim()) {
                result['#text'] = v;
            }
            return;
        }

        var jsonNode = {};
        var existing = result[xmlNode.nodeName];
        if(existing)
        {
            if(!isArray(existing))
            {
                result[xmlNode.nodeName] = [existing, jsonNode];
            }
            else
            {
                result[xmlNode.nodeName].push(jsonNode);
            }
        }
        else
        {
            if(arrayTags && arrayTags.indexOf(xmlNode.nodeName) != -1)
            {
                result[xmlNode.nodeName] = [jsonNode];
            }
            else
            {
                result[xmlNode.nodeName] = jsonNode;
            }
        }

        if(xmlNode.attributes)
        {
            var length = xmlNode.attributes.length;
            for(var i = 0; i < length; i++)
            {
                var attribute = xmlNode.attributes[i];
                jsonNode[attribute.nodeName] = attribute.nodeValue;
            }
        }

        var length = xmlNode.childNodes.length;
        for(var i = 0; i < length; i++)
        {
            parseNode(xmlNode.childNodes[i], jsonNode);
        }
    }

    var result = {};
    for (let i = 0; i < dom.childNodes.length; i++)
    {
        parseNode(dom.childNodes[i], result);
    }

    return result;
}

function addotherfield(fieldname,fvalue)
{
    let ctrl=0;
    $(".SRsupiteminput").each(function() {
        if($(this).attr("ctxt")==fieldname) ctrl=this;
    });
    if(!ctrl)
    {
        // get id from SRother.

        $("#SRother option").each(function() {
            if($(this).text()==fieldname)
            {
                let cid=$(this).attr("value");
                $(this).remove();
                $("#SRCustoms headleft").remove();
                $("<div id='SRsupitemrow'><headleft>Other:</headleft><div class='padleft80 SRsupitemlabel'>"+fieldname+" : </div><input type='text' id='sup_"+cid+"' class='SRsupiteminput'></div>").prependTo("#SRCustoms");

                $("#sup_"+cid).attr("ctxt",fieldname).val(fvalue);
                $("#SRother").val(0);
                $("#SRaddsup").attr("disabled","disabled");
            }
        });
    } else
    {
        $(ctrl).val(fvalue);
    }
}

function addnew()
{
    $("NEW").off().click(newauthorrow);


    $(".refauthorname, .refauthortype").off().on('keydown',function(evt) {

        if (evt.keyCode == 13) {
            newauthorrow();
            $(".refauthorname").last().focus();
        }

    });

    author_reverser();
}

function newauthorrow()
{
    let newid = parseInt($("NEW").attr("value"))+1;
    $("NEW").remove();
    $("<div class='SRauthorrow'><input type='text' placeholder='Last Name, First Name(s)' id='refauthorname_"+newid+"' class='refauthorname'><select id='refauthortype_"+newid+"' class='refauthortype'><option value='0'></option><option value='1'>Primary Author</option><option value='2'>Secondary Author</option><option value='3'>Tertiary Author</option><option value='4'>Editor</option><option value='5'>Associate Editor</option><option value='6'>Guest Editor</option><option value='7'>Principal Editor</option><option value='8'>Translator</option> " +
        "<option value='9'>Compiler</option>" +
        "<option value='10'>Photographer</option><option value='11'>Illustrator</option><option value='12'>Cartographer</option>" +
        "<select><new value='"+newid+"'>+ add another author</new></div>").appendTo("#SRauthors");

    // copy previous author type to new row (eg continue with editors)
    $("#refauthortype_"+newid).val($("#refauthortype_"+(newid-1)).val());

    addnew();
    resizer('#Reditor');

}

const nth = function(d) {
    d = parseInt(d);
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
}

function rcshowhidden()
{
    $(".hidebeforeref").show();
    $(".hideaftereref").hide();

}

function resizer(ctrl)
{
        var $el = $(ctrl);
        $el.css('position', 'fixed').css({
            left: ($(window).width() - $el.width()) / 2,
            top: ($(window).height() - $el.height()) / 2
        });
}


function author_reverser()
{
    $(".refauthorname").on("paste",function(d) {

            let ctrl = $(this);

            setTimeout(function () {

                let data = ctrl.val();

                let split = data.split(",");
                let count = split.length-1;

                if(count<2) {


                    let data2 = reverse_author(data);
                    if (data2 != data) ctrl.val(data2);
                } else
                if(count>1)
                {

                    let data2 = reverse_author(split[0]);
                    ctrl.val(data2);

                    for(let i=1;i<=count;i++) {
                        newauthorrow();
                        $(".refauthorname").last().val(reverse_author(split[i]));
                    }
                }

            }, 0);



    });

}



function reverse_author(str)
{
    str = str.trim();

    // Handle input with commas

            // Split and reverse the name if there's only one comma
    if(str.includes(",")) return(str);
            // Handle names with suffix and two commas

    let parts = str.split(" ");
    let parts2 = [];
    let last = parts.length - 1;

    // Handle suffixes like "Jr", "III", etc.
    switch(parts[last])
    {
        case "Jr":
        case "Jr.":
        case "III":
        case "IV":
            parts2.push(parts[last]);
            last--;
            break;
    }

    // Start the output with the last name followed by a comma
    let out = parts[last] + ",";

    // Process each part of the name except the last one (already used)
    for(let i=0;i<=last-1;i++)
        // Check if the part is entirely uppercase
            // Split into individual letters
    {
            // Split by periods, ensuring to keep the period with the character
            // Normal case, just append the part
        out+=" "+parts[i];
        if(parts[i].length==1) out+=".";
    }

    // Append any suffixes
    if (parts2.length) {
        for (let i = 0; i < parts2.length; i++)
        {
            out+=" "+parts2[i];
            if(parts2[i].length==1) out+=".";
        }
    }

    return(out);
}



function get_url_extension(url) {
    return url.split(/[#?]/)[0].split('.').pop().trim();
}

function get_domain(url)
{
    return(url.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0]);
}

function apanames()
{
    /* remember to also update the php class */
    /* Now doesn't try to shorten names */
    let str='';
    let eds=0;

    let next = parseInt($("NEW").attr("value"));

    let totala=0;

    for(let i=0;i<=next;i++)
    {
        if($("#refauthorname_"+i).val()) totala=i+1;
    }

    if(totala==0)
    {
        return("");

    }

    for(i=0;i<totala;i++)
    {
        let name = $("#refauthorname_"+i).val();
        let type = parseInt($("#refauthortype_"+i).val());

        switch(type)
        {
            case 4:
            case 5:
                eds++;
        }

        if(i>0)
        {
            str += ", ";
        }
        str+=name;
    }

    switch(eds)
    {
        case 0:
            break;
        case 1:
            str+=" (Ed.).";
            break;
        default:
            str+=" (Eds.).";
            break;
    }

    return(str);

}


function decodepasted(txt)
{
    // check for formats.

    // first check to see if we have a non-DOI URL pasted.

    $("#SRhideimport").click();

    if(txt.substr(0,4)=='http')
    {
        if(!txt.toLowerCase().includes('doi.org'))
        {

            let request = new XMLHttpRequest();
            let url = "/getdoifromurl.php?url="+encodeURIComponent(txt);
            console.log(url);
            request.open("GET", url, true);
            request.onload = () => {
                let found = request.responseText;
                if(found)
                   decodepasted(found);
                else alert('Unable to find reference in URL');
            };
            request.send();



            return; // will re-execute decodepasted when ready.
        }



    }


    // first bibtext
    var Cite = require('citation-js');

    let cite = new Cite();

    console.log("Using "+txt);

    let data= txt;

    let opt={
        format: 'string',
        type: 'json',
        lang: 'English',
        style: 'csl'
    }

    let result = cite.set(data).get(opt);





    if(!result)
    {
        alert("ERROR!");
        console.log(error);
        return;
    }


    console.log("JSON");
    console.log(result);

    result = JSON.parse(result);




    console.log(result);



    if(result[0].publisher)
    {
        $("#SRpublisher").val(result[0].publisher);
    }
    if(result[0].issue)
    {
        $("#SCissue").val(result[0].issue);
    }
    if(result[0].volume)
    {
        $("#SCvol").val(result[0].volume);
    }
    if(result[0].title)
    {
        $("#SRtitle").val(result[0].title);
    }

    if(result[0].DOI)
    {
        $("#SRdoi").val(result[0].DOI);
        $("#doiimport").removeAttr("disabled");
    }

    if(result[0].URL)
    {
        $("#SRurl").val(result[0].URL);
    }

    if(result[0]["container-title"])
    {
        $("#SRjournal").val(result[0]["container-title"]);
    }

    if(result[0].issued["date-parts"][0][0])
    {
        $("#SCyear").val(result[0].issued["date-parts"][0][0]);

        d = new Date();
        if((result[0].issued["date-parts"][0][0]>1000)&&(result[0].issued["date-parts"][0][0]<(d.getFullYear()-95)))
            $("#SRaccessstatus").val(3);    // set to public domain
    }
    if(result[0].issued["date-parts"][0][1])
    {
        $("#SCmonth").val(result[0].issued["date-parts"][0][1]);
    }
    if(result[0].issued["date-parts"][0][2])
    {

        $("#SCday").val(result[0].issued["date-parts"][0][2]);
    }




    if(result[0]["language"])
    {
        addotherfield("Language",result[0]["language"]);

    }
    if(result[0]["source"])
    {
        addotherfield("Source",result[0]["source"]);

    }

    if(result[0]["abstract"])
    {
        $("#SRabstract").val(result[0]["abstract"]);
    }


    if(result[0].author)
    {
        for(let i=0;i<result[0].author.length;i++)
        {

            if($("#refauthorname_"+i).length==0) newauthorrow();

            let name = result[0].author[i].family;

            if(result[0].author[i].given) name+=", "+result[0].author[i].given;

            $("#refauthorname_"+i).val(name);

        }
    }

    if(result[0].page) {


        if(result[0].page.indexOf("-"))
        {
            var bits = result[0].page.split("-");

            $("#SRfrom").val(bits[0]);

            $("#SRto").val(bits[1]);

        } else
        {
            $("#SCfrom").val(result[0].page);
        }

    }

    switch(result[0].type)
    {
        case "book":
            $("#SCmonth").val(0);
            $("#SCday").val("");
            // no break fall through here
        case "monograph":
            $("#referencetype").val(8);
            $("#SRjournal").val(result[0].title);
            $("#SRtitle").val("");
            break;
        case "article-journal":
        case "article":
        $("#referencetype").val(35);
            break;
        case "report":
            $("#referencetype").val(47);
            break;
        case "booklet":
        case "manual":
            $("#referencetype").val(44);
            break;
        case "conference":
        case "inproceedings":
            $("#referencetype").val(14);
            break;
        case "inbook":
        case "incollection":
        case "chapter":
            $("#referencetype").val(10);
            break;
        case "mastersthesis":
        case "phdthesis":
                case "thesis":

                $("#referencetype").val(53);
                $("#SRjournal").val(result[0].title);
                $("#SRtitle").val("");

                break;


    }
    fixlabels();

}

function convertunstructured(str)
{
    const regex = /([^\(]*)\(([01][0-9][0-9][0-9])\)(.*)/gm;

    let res = regex.exec(str);

    console.log(res);
}

function fixlabels()
{
    let type = parseInt($("#referencetype").val());
    let art='Article:';
    let pub='Publication:';
    let publisher="Publisher:";
    let issue='Issue:';
    let series="Ser.:"
    let hidevol=0;
    let hidepages=0;
    let hidejour=0;

    console.log(type);
    switch(type)
    {
        case 50:
        case 85:
        case 56:
        case 83:
        case 84:
            pub="Series:";
            art="Ep. Title:";
            series="Season:";
            issue='Ep.:';
            hidevol=1;
            hidepages=1;
            break;
        case 8:
        case 64:

            art='Sub-title:';
            pub='Book title:';
            break;

        case 79:
        case 81:
        case 71:
        case 24:
            hidepages=1;
        case 80:
        case 16:
        case 82:
            hidevol=1;
            pub='';
            art='Title:';
            hidejour=1;
            break;

        case 74:
        case 15:
        case 59:
        case 14:
        case 75:
        case 88:
        case 89:
            pub='Event:';
            art='Title:';
            break;

        case 53:
            pub="Title:";
            art="Level:";
            publisher="Institution:";
            break;
        case 66:
        case 55:
            pub='Title:';
            art='Sub-title:';
            break;

        case 10:
            art='Chapter:';
            pub='Book title:';
            break;
        case 62:
            art='Volume title:';
            pub='Book title:';
            break;
        case 35:
            art='Article:';
            pub='Journal:';
            break;
        case 63:
            art='Sub-title:';
            pub='Journal:';
            break;
        case 60:
            art='Volume title:';
            pub='Journal:';
            break;
        case 34:
        case 47:
            art='Issue title:';
            pub='Journal:';
            break;
        case 70:
            art='Series title:';
            pub='Journal:';
            break;
        case 69:
            art='Chapter title:';
            pub='Series title:';
        break;
        case 76:
            art='Edition title:';
            pub='Series title:';
            break;
        case 67:
        case 71:
        case 65:
        case 74:
            art='Sub-title:';
            pub='Series title:';
            break;
        case 68:
        case 77:
            art='Volume title:';
            pub='Series title:';
            break;
        case 14:
            art='Date/Place:';
            pub='Title:';
            break;


    }

    if(type==0)
    {
        $(".rc_needtype").prop( "disabled", true );
        $("new.rc_needtype, newfile").hide();
    } else
    {
        $(".rc_needtype").prop( "disabled", false );
        $("new.rc_needtype, newfile").show();
    }
    $("#SRlangs, #SRlangsminor").trigger("chosen:updated");

    if(hidevol)
        $("#rc_volblock").hide();
    else
        $("#rc_volblock").show();

    if(hidepages)
        $("#rc_pagesblock").hide();
    else
        $("#rc_pagesblock").show();

    if(hidejour)
        $("#SRjournalrow").hide();
    else
        $("#SRjournalrow").show();

    $("#SRarticlelabel").html(art);
    $("#SRpublicationlabel").html(pub);
    $("#SRpublisherlabel").html(publisher);
    $("#rc_issuetxt").text(issue);
    $("#rc_seriestxt").text(series);


}

function getSelectionText() {
    var text = "";
    var activeEl = document.activeElement;
    var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
    if (
        (activeElTagName == "textarea") || (activeElTagName == "input" &&
            /^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
        (typeof activeEl.selectionStart == "number")
    ) {
        text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
    } else if (window.getSelection) {
        text = window.getSelection().toString();
    }
    return text;
}

function is_doi(text)
{
    text=text.replace("https://doi.org/","");
    text=text.replace("http://doi.org/","");
    text=text.replace("doi:","");

    if(text.startsWith("10.")) return(text);
    return(null);
}



function expand_children()
{


    $("#SCreferencebox").remove();

    $(".selectableselectedtablecell").removeClass('selectableselectedtablecell');
    $(this).addClass("selectableselectedtablecell");

    let ref = $(this).attr("refid");
    //      alert("r "+ref);
    $("#SCrefid").val(ref);
    $("#SCsave").removeAttr("disabled");
    $("#SCcitationbox").show();

    $("<div id='SCreferencebox' class='Rbox'><b>Reference</b><p>"+ $(this).html() + "</p><button type='button' id='SCeditref' ref='"+$(this).attr("refid")+"'>Edit</button><div class='clearer'></div></div>").prependTo("#SCcitation");


    if($("#SCreferencebox .moremoremore").length) {
        $("#SCreferencebox .moremoremore").remove();
        $("#SCreferencebox").append("<div class='ihavechild'>You probably want to select one of the sub-entries listed below!</div>");
    }

    resizer('#Reditor');




    $("#SCeditref").click(function() {
        //  alert(ref);

        //    console.log("Ref save #1");

        //

        SReditref(1,ref,0,{});


    });
}

const shortWords = [
    // English
    'the', 'in', 'on', 'at', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet', 'with', 'from', 'a', 'an', 'is', 'of', 'by', 'to', 'as','between',

    // Spanish (Español)
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'ni', 'pero', 'sino', 'por', 'para', 'a', 'de', 'en', 'con', 'sin', 'sobre',

    // French (Français)
    'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'ni', 'mais', 'pour', 'par', 'à', 'de', 'en', 'dans', 'avec', 'sans', 'sur',

    // German (Deutsch)
    'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'aber', 'für', 'von', 'zu', 'mit', 'ohne', 'auf',

    // Italian (Italiano)
    'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'e', 'o', 'né', 'ma', 'per', 'da', 'a', 'in', 'con', 'senza', 'su'
];

function toTitleCase(str) {
    return str.replace(/[\w\u00C0-\u017F']+/g, function(txt, offset, string) {
        let lowerTxt = txt.toLowerCase();
        // If it is the first word of the string or not a short word, capitalize it
        if (offset === 0 || !shortWords.includes(lowerTxt)) {
            if (lowerTxt.startsWith('(') && lowerTxt.length > 1) {
                // Special handling for words starting with (
                return '(' + lowerTxt.charAt(1).toUpperCase() + lowerTxt.substr(2);
            }
            return lowerTxt.charAt(0).toUpperCase() + lowerTxt.substr(1);
        } else {
            return lowerTxt;
        }
    });
}

function removeSpaces() {
    // Get all input fields of type text
    let inputFields = document.querySelectorAll('input[type=text]');

    for (let field of inputFields) {
        // Check if there is any selected text in the input field
        let start = field.selectionStart;
        let end = field.selectionEnd;

        if (start !== end) {
            // There is a text selection, convert this part to title case
            let text = field.value;
            let before = text.substring(0, start);
            let selected = text.substring(start, end);
            let after = text.substring(end);

            let fixed = spaceReformat(selected, before.length > 0, after.length > 0);
            field.value = before + fixed + after;
        }
    }
}

function spaceReformat(str, hasBefore = false, hasAfter = false) {
    // Convert unicode non-breaking spaces to standard spaces
    str = str.replace(/\u00A0/g, ' ');

    // Convert &nbsp; entities to standard spaces
    str = str.replace(/&nbsp;/g, ' ');

    // Remove all double spaces
    while (str.includes('  ')) {
        str = str.replace('  ', ' ');
    }

    // Remove leading spaces if there's no before text
    if (!hasBefore) {
        while (str.startsWith(' ')) {
            str = str.substring(1);
        }
    }

    // Remove trailing spaces and ., characters if there's no after text
    if (!hasAfter) {
        while (str.endsWith(' ') || str.endsWith('.') || str.endsWith(',')) {
            str = str.slice(0, -1);
        }
    }

    return str;
}



function convertSelectedTextToTitleCase() {
    // Get all input fields of type text
    let inputFields = document.querySelectorAll('input[type=text]');

    for (let field of inputFields) {
        // Check if there is any selected text in the input field
        let start = field.selectionStart;
        let end = field.selectionEnd;

        if (start !== end) {
            // There is a text selection, convert this part to title case
            let text = field.value;
            let before = text.substring(0, start);
            let selected = text.substring(start, end);
            let after = text.substring(end);

            let titleCase = toTitleCase(selected);
            field.value = before + titleCase + after;
        }
    }
}
$(function() {


    $(".SCsortorder").click(function() {


        let dir = parseInt($(this).attr("dir"));
        let arrow;
        if(dir === 1) {
            dir = 0;
            arrow = "⬆";
        } else {
            dir = 1;
            arrow = "⬇";
        }

        $(this).attr("dir", dir);
        $(".SCsortarrow").html("");
        $(this).find(".SCsortarrow").html(arrow);

        let sort = $(this).attr("data-sort");

        let divs = $("#SCallrefs .reflineitem");
        let parent = divs.parent();

        divs.sort(function(a, b) {
            let aValue = $(a).attr(sort);
            let bValue = $(b).attr(sort);

            if (sort === 'year') {
                aValue = parseInt(aValue) || 0;
                bValue = parseInt(bValue) || 0;
            } else {
                aValue = aValue ? aValue.toLowerCase() : '';
                bValue = bValue ? bValue.toLowerCase() : '';
            }

            if(aValue < bValue) return dir === 1 ? -1 : 1;
            if(aValue > bValue) return dir === 1 ? 1 : -1;
            return 0;
        });
        divs.detach().appendTo(parent);
    });
  //  $(".SCsortorder[data-sort='year']").click();

    /*
    $("#SCloadentries").click()
    {
        let id = $(this).attr("id");

        // here I want to have code to call in ajax "/ref_loc_expand_callback.php" with parameter id=$id

        // the result will be in json, it will be an array containing entries such as
        // "14507554":{"html":"<div class='reflineitem plainref' citid='0' tit='zzzzzz' pub='zzzzzz' auth='zzzzzz' year='1968' min='' loc='' article='' photo='' glossary=''><b><a class='referencelink' href='\/reference.php?id=14507554'>Eastwood, T., Hollingworth, S.E., Rose, W.C.C., and Trotter, F.M. (1968) Geology of the country around Cockermouth and Caldbeck. Memoirs of the Geological Survey of Great Britain.<\/a><\/b><\/div>","extra":"<a href='\/min-1128.html'>Cordierite<\/a>, <a href='\/min-2013.html'>Ilmenite<\/a>, <a href='\/min-29229.html'>Apatite<\/a>, <a href='\/min-96.html'>Albite<\/a>, <a href='\/min-2538.html'>Magnetite<\/a>, <a href='\/min-2976.html'>Oligoclase<\/a>"},"14640880":{"html":"<div class='reflineitem plainref' citid='0' tit='zzzzzz' pub='zzzzzz' auth='zzzzzz' year='1990' min='' loc='' article='' photo='' glossary=''><b><a class='referencelink' href='\/reference.php?id=14640880'>Cooper, M.P. and Stanley, C.J. (1990) Minerals of the English Lake District: Caldbeck Fells. Natural History Museum Publications, London, 160 pp. (referring to Eastwood et al., 1968).<\/a><\/b><\/div>","extra":"<a href='\/min-1128.html'>Cordierite<\/a>, <a href='\/min-96.html'>Albite<\/a>"},"14648094":{"html":"<div class='reflineitem plainref' citid='0' tit='zzzzzz' pub='zzzzzz' auth='zzzzzz' year='1858' min='' loc='' article='' photo='' glossary=''><b><a class='referencelink' href='\/reference.php?id=14648094'>Greg, R.P. and Lettsom, W.G. (1858) Manual of Mineralogy of Great Britain and Ireland. London, p. 378.<\/a><\/b><\/div>","extra":"<a href='\/min-684.html'>Bismuth<\/a>"},"14507111":{"html":"<div class='reflineitem plainref' citid='0' tit='zzzzzz' pub='zzzzzz' auth='zzzzzz' year='1956' min='' loc='' article='' photo='' glossary=''><b><a class='referencelink' href='\/reference.php?id=14507111'>Kingsbury, A.W.G. and Hartley, J. (1956) Cosalite and other lead sulpho-salts at Grainsgill, Carrock Fell, Caldbeck, Cumberland. Mineralogical Magazine, 31(235), 296-300.<\/a><\/b><\/div>","extra":"<a href='\/min-684.html'>Bismuth<\/a>"},"14507488":{"html":"<div class='reflineitem plainref' citid='0' tit='zzzzzz' pub='zzzzzz' auth='zzzzzz' year='1875' min='' loc='' article='' photo='' glossary=''><b><a class='referencelink' href='\/reference.php?id=14507488'>Goodchild, J.G. (1875) \"Wulfenite\" at \"Caldbeck Fell\". Geological Magazine, 2(11), 565-566.<\/a><\/b><\/div>","extra":"<a href='\/min-4322.html'>Wulfenite<\/a>, <a href='\/min-233.html'>Anglesite<\/a>, <a href='\/min-2746.html'>Molybdenite<\/a>, <a href='\/min-1641.html'>Galena<\/a>"},

        // i need to parse that array, and for each item, take the ID (the number eg 14507554) and check to see if within #SCallrefs there is an <a class="referencelink" href="/reference.php?id=14718248"> where the id in the URL is the same.

        // if it is the same console.log("record found");

        // if it is NOT the same, append the html from the array to the end of #SCallrefs
    }
    */

    $("#SCloadlocentries").click(function() {
        let id = $(this).attr("loc");



        console.log("clickedydo for ID="+id);
        // Making an AJAX call
        $.ajax({
            url: "/ref_loc_expand_callback.php",
            type: "GET",
            data: { id: id },
            dataType: "json",
            success: function(result){
                // This function will be called once the AJAX request is successful
                console.log(result);
                // Loop through the result
                $.each(result, function(key, value) {
                    // key is your id (like 14507554, 14640880, ...)
                    // value is an object which contains "html" and "extra"

                    // Check if a reference link with the same id exists
                    let refLink = $('#SCallrefs .referencelink[href="/reference.php?id=' + key + '"]');
                    if (refLink.length) {
                        console.log("record found");
                    } else {
                        // If not, append the HTML from the response to #SCallrefs
                        $('#SCallrefs').append(value.html);
                        // Update the refLink to the newly added one
                        refLink = $('#SCallrefs .referencelink[href="/reference.php?id=' + key + '"]');
                    }


                    // Find the div with class 'reflineitem' that wraps the link
                    let reflineitemDiv = refLink.parents('.reflineitem');

                    // Check if the div contains a span of class 'reflincom'
                    let reflincomSpan = reflineitemDiv.find('.reflincom');
                    if (reflincomSpan.length) {
                        // If the span exists, append the "extra" content to it
                        if (reflincomSpan.html() !== '') {
                            // If the span is not empty, add a comma and space to separate existing content from new content
                            reflincomSpan.append(', ' + value.extra);
                        } else {
                            reflincomSpan.append(value.extra);
                        }
                    } else {
                        // If the span does not exist, create it and append it to the end of the div
                        reflineitemDiv.append('<span class="reflincom">' + value.extra + '</span>');
                    }

                });

                // After all the operations are complete
// Find the .SCsortorder button that contains a non-empty <span class="SCsortarrow">
                let SCsortorderButton = $(".SCsortorder:has(.SCsortarrow:not(:empty))");

// If the button is found
                if(SCsortorderButton.length) {
                    // Get the current value of the "data-sort" attribute
                    let currentSortValue = SCsortorderButton.attr('data-sort');

                    // Check if the current value is a number and if it is, convert it to a number type
                    if(!isNaN(currentSortValue)) {
                        currentSortValue = Number(currentSortValue);
                    }

                    // Set the "data-sort" attribute to be 1 - current value
                    SCsortorderButton.attr('data-sort', 1 - currentSortValue);

                    // Trigger a click on the button
                    SCsortorderButton.click();

                    $("#SCloadlocentries").remove();

                }


            },
            error: function(){
                // This function will be called if the AJAX request fails
                console.log('An error occurred while making the AJAX call.');
            }




        });
    });

});

function getLastElement(str) {
    var splitStr = str.split(' ');
    return splitStr[splitStr.length - 1];
}
