(function ($) { 
    "use strict";

    var service_carouselHandler = function() {

        $('.service-gallery-carousel').slick({
            infinite: true,
            centerMode: true,
            centerPadding: '0px',
		    slidesToShow: 4, 
			slidesToScroll: 1,
			dots: true,
			arrows: false,
			autoplay: true,
			autoplaySpeed: 4000,
        });

    };

    $(window).on('elementor/frontend/init', function () {
        elementorFrontend.hooks.addAction('frontend/element_ready/service_gallery.default', service_carouselHandler);
    });
})(window.jQuery);