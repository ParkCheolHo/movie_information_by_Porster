function scroll() {
    $.ajax({
        type: "GET",
        url: "/api/scroll",
        dataType: "json",
        success: function (data) {
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
                img.src = "/images/Poster/" + item.code + ".jpg";
                div.appendChild(a);
                a.appendChild(img);
                $grid.append(div).isotope('appended', div);
                // add and lay out newly appended items
                $grid.imagesLoaded(function () {
                    $grid.isotope({});
                });
            });

        }
    });
}

$(document).ready(function () {
    $('#movieModal').on('hidden.bs.modal', function () {
        $(this).removeData('bs.modal')
    });

    var $grid = $('#grid').imagesLoaded(function () {
        // init Isotope after all images have loaded
        $grid.isotope({
            itemSelector: '.item'
        });
    });
    var layout = document.getElementById('layout'),
        menu = document.getElementById('menu'),
        menuLink = document.getElementById('menuLink');

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

    menuLink.onclick = function (e) {
        var active = 'active';
        e.preventDefault();
        toggleClass(layout, active);
        toggleClass(menu, active);
        toggleClass(menuLink, active);
    };
    $('#myButton').on("click", function () {
        scroll();
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
    function onSuccess(data, textStatus, jqXHR) {
        window.location.replace(data);
    }

    function onError(data, status) {
        msgChange($('#div-login-msg'), $('#icon-login-msg'), $('#text-login-msg'), "error", "glyphicon-remove", " id or password wrong");
    }

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
                error: onError
            });
        }else{
            alert("비밀번호가 서로 맞지 않습니다.");
        }
    });
    $('#write-form').on('submit', function(e){
        e.preventDefault();
        var $btn = $('#writesubmitbtn').button('loading')
        var writedata ={
            title : $('#title').val(),
            content : $('#comment').val()
        }
        $.ajax({
            type: "POST",
            url: "/api/write",
            cache: false,
            data: writedata,
            success: function(data){
                alert(data)
                alert("글쓰기 완료 되었습니다.")
                window.location.replace(data);
            },
            error: onError
        });
    })
});

