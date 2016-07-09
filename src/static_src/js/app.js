import $ from 'jquery'
// import 'foundation'
// import 'foundation-mediaquery'


// initialize foundation
 $(document).ready(function(){
 // myRevealingModule.start();
 $('.mobileHandle').click(function(){
    $('.nav').toggleClass('navOpen');
    //$(this).toggleClass('handleOpen');
  });

var matchOpen == false;
 $('.match').click(function(){
    $(this).toggleClass('match-open');
    //console.log('sdfd');
    if(matchOpen == false) {
        $(this).siblings().addClass('match-hidden');
        matchOpen == true;
    } else {
    }

    //$(this).toggleClass('handleOpen');
  });
});
