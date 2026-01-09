(function ($) {
	
	"use strict";

	var $document = $(document),
		$window = $(window);

	$document.ready(function () {
		
			if ($('.datetimepicker').length) {
				$('.datetimepicker').datetimepicker({
					format: form_option.date_format,
					icons: {
						time: 'icon icon-clock',
						date: 'icon icon-calendar',
						up: 'icon icon-arrow_up',
						down: 'icon icon-arrow_down',
						previous: 'icon icon-arrow-left',
						next: 'icon icon-arrow-right',
						today: 'icon icon-today',
						clear: 'icon icon-trash',
						close: 'icon icon-cancel-music'
					},
					locale: moment().local(),
				});
            }

			if ($('.timepicker').length) {
				if($('.timepicker').hasClass('format24')){
					var format='HH:mm';
				}else{
					var format='hh:mm A';
				}
				$('.timepicker').datetimepicker({
					format: format,
					icons: {
						time: 'icon icon-clock',
						up: 'icon icon-arrow_up',
						down: 'icon icon-arrow_down',
						previous: 'icon icon-arrow-left',
						next: 'icon icon-arrow-right'
					}
				});
			}            

	});
	
})(jQuery);