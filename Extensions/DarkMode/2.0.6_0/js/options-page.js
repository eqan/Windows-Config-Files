/**
 * Main File for Options page
 * @version 1.0
 * @package Dark Night Mode
 */
jQuery(document).ready(function($) {
    /**
    * This function runs a notifcation for success, error ,warning
    * @param {string} text The message to show in notification
    * @param {string} id Unique notification id
    * @param {string} type Whether a success|error|warning notification
    * @param {string} posn Position of the notification box on screen
    *
    * @return void.
    */
    function dc_rn(text,options) {
        var options = $.extend({},{
            id  : 'yamc-notification',
            type: 'error',
            posn: 'bottomRight'
        },options);
        if (! text) {
            text    = 'We had an error processing your request. Please try again';
        }
        new Noty({
            type: options.type,
            layout: options.posn,
            theme: 'mint',
            text: text,
            timeout: 5000,
            progressBar: true,
            closeWith: ['click', 'button'],
            id: options.id
        }).show();
    }
    //Variables and function
    var $main       = $('#dnmo-ocp-toggler'),
        $list       = $main.find('#dnmo-listed-whitelist-websites-list'),
        dnmo_main   = {
        /**
         * Get whitelist li content
         * @param {object} name . The name of site
         *
         * @return {string} html string of li content
         */
        get_whitelist_li_content: function (name) {
            var content = '';
            content += '<li data-key="'+name+'" class="dnmo-lw-li">';
            content +=  '<span>'+name+'</span>';
            content +=  '<span class="wl-delete">Delete</span>';
            content += '</li>';
            return content;
        },
        /**
        * Append whitelist urls on page load
        *
        * @return void
        */
        set_option_values_on_load: function () {
            var $this   = this,
                content = '',
                count   = 0;
            chrome.storage.local.get({'whitelist':{},'automode_timing':{'start_time':'20:00','end_time':'06:00'}},(data) => {
                for (var site_name in data.whitelist) {
                    content += this.get_whitelist_li_content(site_name);
                    count++;
                }
                $list.append(content);
                $main.find('#dnmo-wl-count').text(count);
                $main.find('#dnmo-auto-mode-timings').find('#start_time').val(data.automode_timing.start_time).closest('.dnmo-cb-content-wrapper').find('#end_time').val(data.automode_timing.end_time);
            });
        },
        /**
         * Save chrome options data
         * @param {object} data The data object to save
         *
         * @return void
         */
        save_to_storage: function (data) {
            return chrome.storage.local.set(data);
        },
        /**
         * Process all options data and save it
         *
         * @return void
         */
        save_options_data: function () {
            var whitelist_data  = {};
            $list.find('li').each(function(index, el) {
                whitelist_data[$(this).attr('data-key')] = true;
            });
            var $curr_el        = $('#dnmo-auto-mode-timings'),
                automode_data   = {
                    'start_time':$curr_el.find('#start_time').val(),
                    'end_time'  :$curr_el.find('#end_time').val(),
                }
            var resp = this.save_to_storage({
                'whitelist'         : whitelist_data,
                'automode_timing'   : automode_data
            });
            dc_rn('Options saved successfully',{
                type: 'success'
            });
        },
        /**
         * Switch to different settings tab
         * @param {string} id. The id selector of that tab
         *
         * @return void
         */
        switch_to_tab: function(id) {
            var $curr_el = $main.find('#dnmo-right-part');
            $curr_el.find('.dnm-content-box-active').removeClass('dnm-content-box-active');
            $curr_el.find(id).addClass('dnm-content-box-active');
            return;
        }
    }
    dnmo_main.set_option_values_on_load();
    $('body').on('click', '#dnmo-save-option-data', function() {
        dnmo_main.save_options_data()
    });
    $('body').on('click', '.dlon-a', function() {
        dnmo_main.switch_to_tab(this.getAttribute("href"));
        $(this).closest('#dnmo-options-name-list').find('.dnmo-lilp-active').removeClass('dnmo-lilp-active');
        $(this).parent().addClass('dnmo-lilp-active');
    });
    $('body').on('click', '.wl-delete', function() {
        $(this).closest('li').slideUp(400,function() {
            $(this).remove();
        });
        var $ccount = $main.find('#dnmo-wl-count'),
            count = parseInt($ccount.text()) - 1;
        $ccount.text(count);
    });
});
