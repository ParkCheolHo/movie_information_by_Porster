$(function () {
	var $container = $('.grid');

	$('.grid-item').imagesLoaded(function () {
		$container.isotope({ });
	});
	$('#myModal').on('hidden.bs.modal',function(){
		$(this).removeData('bs.modal')
	});	
});
   
  $is_login = false;
  function is_login() {
    $.ajax({
      type: "GET",
      url: "/api/login",
      dataType: "json",
      success: function(data) {
        $is_login = data[0].username;
      }
    });
  }

$(document).ready(function(){
  is_login()
  // like_count
  $(document).on("click", "a.like_count", function() {
    return false;
  });

  // movie
  $(document).on("click","a.like", function() {
         //$(this).addClass('like');
      if($is_login){
        $obj =  $(".like_count");
        $.getJSON('/api/count', function(data) {
          $.each(data, function(entryIndex, entry) {
            $obj.text(entry.like_count);  
          });
        });
      }
      else{
        alert('로그인 필요');
      }
    return false;
  });
});