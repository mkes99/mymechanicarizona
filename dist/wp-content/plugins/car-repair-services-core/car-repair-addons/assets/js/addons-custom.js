(function($) {
    "use strict";

    var $document = $(document),
        $window = $(window),
        plugins = {
            mainSlider: $('#mainSlider'),
            slideNav: $('#slide-nav'),
            categoryCarousel: $('.category-carousel'),
            servicesCarousel: $('.services-carousel'),
            howWorksCarousel: $('.how-works-carousel'),
            servicesAltCarousel: $('.services-alt'),
            testimonialsCarousel: $('.testimonials-carousel'),
            testimonialsCarousel02: $('.js-testimonials'),
            jsNewsbox: $('.js-newsbox'),
            servicesBlockAlt: $('.services-block-alt'),
            textIconCarousel: $('.text-icon-carousel'),
            personCarousel: $('.person-carousel'),
            submenu: $('[data-submenu]'),
            googleMapFooter: $('#footer-map'),
            counterBlock: $('#counterBlock'),
            isotopeGallery: $('.gallery-isotope'),
            postGallery: $('.blog-isotope'),
            postCarousel: $('.post-carousel'),
            prdCarousel: $('.prd-carousel'),
            postMoreLink: $('.view-more-post'),
            testimonialMoreLink: $('.view-more-testimonial'),
            getQuoteLink: $('.form-popup-link'),
            jsSlickInit: $('#pageContent .js-slick-init'),

            animation: $('.animation'),
            rangeSlider: $('#rangeSlider1'),
            stickyHeader: $(".header-sticky"),
            productImage: $("#mainImage"),
            dropMenu: $('.dropdown-menu')
        },
        $shiftMenu = $('#slidemenu, #pageContent, #mainSliderWrapper, .page-footer, .page-header .header-row, .header-info-mobile, body, .darkout-menu'),
        $navbarToggle = $('.navbar-toggle'),
        $dropdown = $('.dropdown-submenu, .dropdown'),

        $marginTop = $('body.fixedSlider #pageContent'),
        $marginBottom = $('body.fixedFooter #pageContent');

    var slickSliderHandler = function($scope, $) {

        var mainSlider = $scope.find('#mainSlider').each(function() {
            if(!$(this).hasClass('slick-initialized')){
                var testiSlider = $('#mainSliderWrapper').data('slickslider');
                $('#mainSlider').slick({
                    arrows: testiSlider['arrows'],
                    dots: testiSlider['dots'],
                    autoplay: testiSlider['autoplay'],
                    autoplaySpeed: testiSlider['autoplay_speed'],
                    fade: testiSlider['fade'],
                    speed:  testiSlider['speed'],
                    rtl: plugins.rtltrue,
                    pauseOnHover: testiSlider['pauseOnHover'],
                    pauseOnDotsHover: testiSlider['pauseOnDotsHover'],
                    responsive: [{
                        breakpoint: 1199,
                        settings: {
                            arrows: false
                        }
                    }]
                });
            }
        });

        var $window = $(window);
        var $fullHeight = $('body:not(.layout-2) #mainSlider, body:not(.layout-2) #mainSlider .img--holder');
        var $maxFullHeight = $('body.layout-2 #mainSlider, body.layout-2 #mainSlider .img--holder');
        var windowWidth = $window.width();
        
		if (windowWidth < 992) {
			$fullHeight.height('');
		} else {
			var windowHeight = $window.height();
			var footerHeight = $('.page-footer').height();
			$fullHeight.height(windowHeight);
			$marginTop.css({
				'margin-top': windowHeight + 'px'
			});
			$marginBottom.css({
				'margin-bottom': footerHeight + 'px'
			})
        }
		$window.resize(function () {
			var windowWidth = window.innerWidth || $window.width();

		//	startCarousel();

			sliderMaxHeight($maxFullHeight);

			if (windowWidth < 992) {
				$fullHeight.height('');
			}
			if (windowWidth > 767 && $navbarToggle.is(':hidden')) {
				$shiftMenu.removeClass('slide-active');
			}
        });
        
        function sliderMaxHeight(maxFullHeight){
         
            var h = $window.height() - $('header').height();
            var mh =525;
            if(h>mh){
            maxFullHeight.css({ 'max-height': h });
            }else{
            maxFullHeight.css({ 'max-height': mh });
            }
         }
         sliderMaxHeight($maxFullHeight);



    }


    // Start JS Hooks
    //testimonials carousel
    var testimonilslHandler = function($scope, $) {
        var testwrap = $scope.find('.testimonials-carousel').each(function() {
            var testiSlider = $('.testimonials-carousel').data('testimonialslider');
            $('.testimonials-carousel').slick({
                mobileFirst: false,
                slidesToShow: testiSlider['slides_to_show'],
                slidesToScroll: testiSlider['slides_to_scroll'],
                infinite: testiSlider['infinite'],
                autoplay: testiSlider['autoplay'],
                autoplaySpeed: testiSlider['autoplay_speed'],
                arrows: testiSlider['arrows'],
                dots: testiSlider['dots'],
                fade: testiSlider['fade'],
                cssEase: 'linear'
            });
        });
    };


    /*
    var testimonialsTwoHandler = function($scope, $) {
        // testimonials carousel
        if (plugins.testimonialsCarousel02.length) {
            plugins.testimonialsCarousel02.slick({
                mobileFirst: false,
                slidesToShow: 1,
                slidesToScroll: 1,
                infinite: true,
                autoplay: true,
                autoplaySpeed: 2500,
                arrows: false,
                dots: false,
                fade: true,
                cssEase: 'linear',
                adaptiveHeight: true,
                responsive: [{
                    breakpoint: 767,
                    settings: {
                        dots: true
                    }
                }]
            });
            //total slides
            var ptSlickQuantity = $('.pt-slick-quantity');
            if (ptSlickQuantity.length) {
                ptSlickQuantity.find('.total').html(plugins.testimonialsCarousel02.slick("getSlick").slideCount);
                plugins.testimonialsCarousel02.on('afterChange', function(event, slick, currentSlide){
                    var currentIndex = $('.slick-current').attr('data-slick-index');
                    currentIndex = ++ currentSlide;
                    ptSlickQuantity.find('.account-number').html(currentIndex);
                });
            };
            //button
            var ptSlickButton = $('.pt-slick-button');
            if (ptSlickButton.length) {
                ptSlickButton.find('.pt-slick-next').on('click',function(e) {
                    plugins.testimonialsCarousel02.slick('slickNext');
                });
                ptSlickButton.find('.pt-slick-prev').on('click',function(e) {
                    plugins.testimonialsCarousel02.slick('slickPrev');
                });
            };
        };   
    };
    */
    var car_blogsHandler = function($scope, $) {
        var plugins = {
            jsNewsbox: $('.js-newsbox'),
        }    
        if(!$(plugins.jsNewsbox).hasClass('slick-initialized')){ 
            if (plugins.jsNewsbox.length) {
                plugins.jsNewsbox.slick({
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    infinite: true,
                    autoplay: true,
                    autoplaySpeed: 2500,
                    arrows: true,
                    dots: false,
                    cssEase: 'linear',
                    adaptiveHeight: true,
                    responsive: [{
                        breakpoint: 767,
                        settings: {
                            slidesToShow: 1,
                            dots: true,
                            arrows: false,
                        }
                    }]
                });
            }
        }
    };


    var coupons_carouselHandler = function($scope, $) {
        var couponwrap = $scope.find('.js-slick-init').each(function() {
            $('.js-slick-init').not('.slick-initialized').slick({
                infinite: true,
                dots: true,
                arrows: false,
                autoplay: true,
                autoplaySpeed: 4000,
                centerMode: true,
                centerPadding: '0px'
            });
        });
    };

    var crs_galleryHandler = function($scope, $) {
      
        $('.js-comparing-img').twentytwenty();
            
        
    };


    var crs_testimonials_twoHandler = function($scope, $) {
        var plugins = {
            testimonialsCarousel02: $('.js-testimonials'),
        }
        if (plugins.testimonialsCarousel02.length) {
            plugins.testimonialsCarousel02.slick({
                mobileFirst: false,
                slidesToShow: 1,
                slidesToScroll: 1,
                infinite: true,
                autoplay: true,
                autoplaySpeed: 3500,
                arrows: false,
                dots: false,
                fade: true,
                cssEase: 'linear',
                adaptiveHeight: true,
                responsive: [{
                    breakpoint: 767,
                    settings: {
                        dots: true
                    }
                }]
            });
            //total slides
            var ptSlickQuantity = $('.pt-slick-quantity');
            if (ptSlickQuantity.length) {
                ptSlickQuantity.find('.total').html(plugins.testimonialsCarousel02.slick("getSlick").slideCount);
                plugins.testimonialsCarousel02.on('afterChange', function(event, slick, currentSlide){
                    var currentIndex = $('.slick-current').attr('data-slick-index');
                    currentIndex = ++ currentSlide;
                    ptSlickQuantity.find('.account-number').html(currentIndex);
                });
            };
            //button
            var ptSlickButton = $('.pt-slick-button');
            if (ptSlickButton.length) {
                ptSlickButton.find('.pt-slick-next').on('click',function(e) {
                    plugins.testimonialsCarousel02.slick('slickNext');
                });
                ptSlickButton.find('.pt-slick-prev').on('click',function(e) {
                    plugins.testimonialsCarousel02.slick('slickPrev');
                });
            };
        };
    };


    var car_price_sliderHandler = function($scope, $) {
        var plugins = {
            jsPricingCarousel: $('.js-pricing-carousel'),
        }
        if(!$(plugins.jsPricingCarousel).hasClass('slick-initialized')){
            if (plugins.jsPricingCarousel.length) {
                plugins.jsPricingCarousel.slick({
                    slidesToShow: 3,
                    slidesToScroll: 1,
                    infinite: true,
                    autoplay: true,
                    autoplaySpeed: 4500,
                    dots: true,
                    arrows: false,
                    adaptiveHeight: true,
                    pauseOnFocus: false,
                    pauseOnHover: false,
                    responsive: [{
                        breakpoint: 991,
                        settings: {
                            slidesToShow: 2
                        }
                    }, {
                        breakpoint: 520,
                        settings: {
                            slidesToShow: 1
                        }
                    }]
                })
            }
        }
    }

    // Slider Animation
    function doAnimations(elements) {
        var animationEndEvents = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
        elements.each(function() {
            var $this = $(this);
            var $animationDelay = $this.data('delay');
            var $animationType = 'animated ' + $this.data('animation');
            $this.css({
                'animation-delay': $animationDelay,
                '-webkit-animation-delay': $animationDelay
            });
            $this.addClass($animationType).one(animationEndEvents, function() {
                $this.removeClass($animationType);
            });
            if ($this.hasClass('animate')) {
                $this.removeClass('animation');
            }
        });
    }

    //Elementor JS Hooks
    $(window).on('elementor/frontend/init', function() {
        elementorFrontend.hooks.addAction('frontend/element_ready/csr_slickslider.default', slickSliderHandler);
        elementorFrontend.hooks.addAction('frontend/element_ready/crs_testimonials.default', testimonilslHandler);
        elementorFrontend.hooks.addAction('frontend/element_ready/car_blogs.default', car_blogsHandler);
        elementorFrontend.hooks.addAction('frontend/element_ready/coupons_carousel.default', coupons_carouselHandler);
        elementorFrontend.hooks.addAction('frontend/element_ready/crs_gallery.default', crs_galleryHandler);
        elementorFrontend.hooks.addAction('frontend/element_ready/crs_testimonials_two.default', crs_testimonials_twoHandler);
        elementorFrontend.hooks.addAction('frontend/element_ready/car_price_slider.default', car_price_sliderHandler);
    });

})(jQuery);