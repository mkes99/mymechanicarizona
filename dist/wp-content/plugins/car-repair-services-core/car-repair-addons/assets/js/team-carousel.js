(function ($) { 
    "use strict";

    var team_carouselHandler = function() {

             $('.team-carousel').slick({
                 infinite: true,
                 centerMode: true,
                 centerPadding: '0px',
                 slidesToShow: 3, 
                 slidesToScroll: 1, 
                 dots: true,
                 arrows: false,
                 autoplay: true,
                 autoplaySpeed: 4000,
             });

    };

    $(window).on('elementor/frontend/init', function () {
        elementorFrontend.hooks.addAction('frontend/element_ready/team_carousel.default', team_carouselHandler);
    });
})(window.jQuery);