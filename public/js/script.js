$is_login = false;
function is_login() {
    $.ajax({
        type: "GET",
        url: "/api/login",
        dataType: "json",
        success: function (data) {
            $is_login = data[0].username;
        }
    });
}
function scroll() {
    $.ajax({
        type: "GET",
        url: "/api/scroll",
        dataType: "json",
        success: function (data) {
            var $grid = $('#grid-content').isotope({
                itemSelector: '.grid-item',
                layoutMode: 'fitRows'
            });
            $(data).each(function (index, item) {

                var $test = $("<div class=" + '"grid-item col-xs-6 col-md-3 ' + item.genre1 + ' ' + item.year + '"> ' + '<a href=/movie/' + item.url + ' data-toggle="modal" data-target="#myModal" class="thumbnail"> '
                    + ' <img src=" ' + item.imgpath + '">' + "</a></div>");
                //$container.isotope( 'appended', test );
                $grid.imagesLoaded(function () {
                    $grid.isotope({});
                });
                $grid.append($test)
                    // add and lay out newly appended items
                    .isotope('appended', $test);

            });

        }
    });
}

$(document).ready(function () {
    var $grid = $('#grid-content').isotope({
        itemSelector: '.grid-item',
        layoutMode: 'fitRows'
    });
    $grid.imagesLoaded(function () {
        $grid.isotope({});
    });
    is_login();

    $('#myModal').on('hidden.bs.modal', function () {
        $(this).removeData('bs.modal')
    });


    $('.filters-button-group').on('click', 'a', function () {
        var filterValue = $(this).attr('data-filter');
        $grid.isotope({filter: filterValue});
    });
    // change is-checked class on buttons

    // like_count
    $(document).on("click", "a.like_count", function () {
        return false;
    });

    // movie
    $(document).on("click", "a.like", function () {
        //$(this).addClass('like');
        if ($is_login) {
            $obj = $(".like_count");
            $.getJSON('/api/count', function (data) {
                $.each(data, function (entryIndex, entry) {
                    $obj.text(entry.like_count);
                });
            });
        }
        else {
            alert('로그인 필요');
        }
        return false;
    });
    $(window).scroll(Infinite);
    $('#test').on("click", function () {
        $.ajax({
            type: "post",
            url: "/idcheck",
            datatype: 'text',
            data: {
                username: $('#username').val()
            },
            success: function (data, text) {
                alert(text);
            },
            error: function (error) {
                if (error.responseText == 'false')
                    alert("Please enter correct user name and password.")
            }
        });
    });
});


function Infinite(e) {
    if ((e.type == 'scroll') || e.type == 'click') {
        var doc = document.documentElement;
        var top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
        var bottom = top + $(window).height();
        var docBottom = $(document).height();

        if (bottom + 50 >= docBottom) {
            scroll();
        }
    }
}