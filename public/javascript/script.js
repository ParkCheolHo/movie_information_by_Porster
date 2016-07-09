function scroll() {
    $.ajax({
        type: "GET",
        url: "/api/scroll",
        dataType: "json",
        success: isotopeadd
    });
}
function test(data){
    alert(data);
}
function isotopeadd (data) {
            var $grid = $('.grid').isotope();
            $(data).each(function (index, item) {
                var div = document.createElement('div');
                var a = document.createElement('a');
                var img = document.createElement('img');
                div.className = "item";
                a.className = "thumbnail";
                a.setAttribute('data-toggle', 'modal');
                a.setAttribute('data-target', '#movieModal');
                a.href = "/movie/" + item.code;
                img.src = "/images/movie/Poster/" + item.code + ".jpg";
                div.appendChild(a);
                a.appendChild(img);
                $grid.append(div).isotope('appended', div);
                // add and lay out newly appended items
                $grid.imagesLoaded(function () {
                    $grid.isotope({});
                });
            });
         }

function search_success(data){
    var $grid = $('.grid').isotope();
    var elems = $grid.isotope('getItemElements')
    $grid.isotope( 'remove', elems ).isotope('layout');
    isotopeadd(data);
    alert("검색 완료");
}
function search_error(data){
    alert("검색 결과가 없습니다.");
    
}

    function changepassword(){
        alert("비밀번호 변경 성공")
        $('#change_password_modal').modal('hide')
    }
    function changepassword_error(){
        alert("현재 비밀번호가 맞지 않습니다.")
    }
    
$(document).ready(function () {
    $('#movieModal').on('hidden.bs.modal', function () {
        $(this).removeData('bs.modal').find(".modal-content").empty();
    });
    var $grid = $('#grid').imagesLoaded(function () {
        // init Isotope after all images have loaded
        $grid.isotope({
            itemSelector: '.item'
        });
    });
    
     $('#myButton').on("click", function () {
         scroll();
     })
     $('#search').on("click", function () {
        var search_val = document.getElementById("search_input").value;
        var check = search_val.split(" ");
        if(check.length < 5){
         var formData = ({
            data: search_val
        });
        $.ajax({
            type: "GET",
            url: "/api/search",
            cache: false,
            dataType: "json",
            data: formData,
            success: search_success,
            error: search_error
        });
        }else{
            alert("검색어가 너무 길어요");
        }
    });
    $("#login-form").keydown(function (e) {
        if (e.keyCode == 13) {
            e.cancelBubble = true;
            $("#login_submit_btn").click();
            return false;
        }
    });
    
    $('#login-form').on('submit', function(e){
        e.preventDefault();
        var $lg_username = $('#login_username').val();
        var $lg_password = $('#login_password').val();
        var formData = ({
            id: $lg_username,
            password: $lg_password
        });
        $.ajax({
            type: "POST",
            url: "/api/login",
            cache: false,
            data: formData,
            success: onSuccess,
            error: onError
        });
    });
   
    var $formLogin = $('#login-form');
    var $formLost = $('#lost-form');
    var $formRegister = $('#register-form');
    var $divForms = $('#div-forms');
    var $modalAnimateTime = 300;
    var $msgAnimateTime = 150;
    var $msgShowTime = 2000;
    $('#login_register_btn').click(function () {
        modalAnimate($formLogin, $formRegister)
    });
    $('#register_login_btn').click(function () {
        modalAnimate($formRegister, $formLogin);
    });
    $('#login_lost_btn').click(function () {
        modalAnimate($formLogin, $formLost);
    });
    $('#lost_login_btn').click(function () {
        modalAnimate($formLost, $formLogin);
    });
    $('#lost_register_btn').click(function () {
        modalAnimate($formLost, $formRegister);
    });
    $('#register_lost_btn').click(function () {
        modalAnimate($formRegister, $formLost);
    });
    
    var checkAjaxSetTimeout;
    
    $('#register_username').keyup(function () {
        clearTimeout(checkAjaxSetTimeout);
        checkAjaxSetTimeout = setTimeout(function () {
            var alpha = $('#register_username').val().length;
            if(alpha > 5){
                var id = $('#register_username').val();
                $.ajax({
                    type : 'POST',
                    url : '/api/id_check',
                    data:
                    {
                        id: id
                    },
                    success : function(result) {
                        msgChange($('#div-register-msg'), $('#icon-register-msg'), $('#text-register-msg'), "success", "glyphicon-ok", "id 사용가능");
                        $("#register_submit_btn").removeClass("disabled");
                    },
                    error : function(){
                        msgChange($('#div-register-msg'), $('#icon-register-msg'), $('#text-register-msg'), "error", "glyphicon-remove", "id 사용불가.");
                        if(!($("#register_submit_btn").hasClass("disabled"))){
                            $("#register_submit_btn").addClass("disabled");
                        }
                    }
                })
            }
        },1000);
    })



    $('#register-form').on('submit', function (e) {
        e.preventDefault();
        var $re_username = $('#register_username').val();
        var $re_email = $('#register_email').val();
        var $re_password = $('#register_password').val();
        var $re_passwordcheck = $('#register_passwordcheck').val();

        var formData = {
            id: $re_username,
            email: $re_email,
            password: $re_password,
            passwordcheck: $re_passwordcheck

        };
        if($re_password === $re_passwordcheck){
            $.ajax({
                type: "POST",
                url: "/api/register",
                cache: false,
                data: formData,
                success: onSuccess,
                error: onRegesterError
            });
        }else{
            alert("비밀번호가 서로 맞지 않습니다.");
        }
    });
    
    
    $('#lost_password-form').on('submit', function (e) {
        e.preventDefault();
        var $current = $('#lost_password-form_input').val();
        var $change = $('#lost_password-form_input1').val(); 
        var $change_again = $('#lost_password-form_input2').val();
        var formData = {
            current: $current,
            change: $change,
            change_again: $change_again
        };
        if($change === $change_again){
            $.ajax({
                type: "POST",
                url: "/api/changePassword",
                cache: false,
                data: formData,
                success: changepassword,
                error: changepassword_error
            });
        }else{
            alert("새 비밀번호가 서로 맞지 않습니다.");
        }
    });
function modalAnimate($oldForm, $newForm) {
        var $oldH = $oldForm.height();
        var $newH = $newForm.height();
        $divForms.css("height", $oldH);
        $oldForm.fadeToggle($modalAnimateTime, function () {
            $divForms.animate({height: $newH}, $modalAnimateTime, function () {
                $newForm.fadeToggle($modalAnimateTime);
            });
        });
    }

    function msgFade($msgId, $msgText) {
        $msgId.fadeOut($msgAnimateTime, function () {
            $(this).text($msgText).fadeIn($msgAnimateTime);
        });
    }

    function msgChange($divTag, $iconTag, $textTag, $divClass, $iconClass, $msgText) {
        var $msgOld = $divTag.text();
        msgFade($textTag, $msgText);
        $divTag.addClass($divClass);
        $iconTag.removeClass("glyphicon-chevron-right");
        $iconTag.addClass($iconClass + " " + $divClass);
        setTimeout(function () {
            msgFade($textTag, $msgOld);
            $divTag.removeClass($divClass);
            $iconTag.addClass("glyphicon-chevron-right");
            $iconTag.removeClass($iconClass + " " + $divClass);
        }, $msgShowTime);
    }
    function onSuccess(data, textStatus, jqXHR) {
        window.location.replace(data);
    }
    function onRegesterError(data, status) {
        msgChange($('#div-register-msg'), $('#icon-register-msg'), $('#text-register-msg'), "error", "glyphicon-remove", "e메일주소가 이미 사용 중 입니다.");
    }
    function onError(data, status) {
        msgChange($('#div-login-msg'), $('#icon-login-msg'), $('#text-login-msg'), "error", "glyphicon-remove", " id or password wrong");
    }
     function toggleClass(element, className) {
        var classes = element.className.split(/\s+/),
            length = classes.length,
            i = 0;
        for (; i < length; i++) {
            if (classes[i] === className) {
                classes.splice(i, 1);
                break;
            }
        }
        // The className is not found
        if (length === classes.length) {
            classes.push(className);
        }
        element.className = classes.join(' ');
    }
});

