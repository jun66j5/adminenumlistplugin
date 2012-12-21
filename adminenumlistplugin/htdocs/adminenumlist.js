/*

Based on drag-and-drop sample code by Luke Dingle

http://www.lukedingle.com/javascript/sortable-table-rows-with-jquery-draggable-rows/

(C) Stepan Riha, 2009
*/


jQuery(document).ready(function ($) {

    // Workaround for issue when using jQuery UI < 1.8.22 with jQuery 1.8
    // Trac 1.1.1dev @r11479 provides jQuery UI 1.8.21 and jQuery 1.8.2
    // http://bugs.jquery.com/ticket/11921
    if(!$.isFunction($.curCSS))
        $.curCSS = $.css;

    var mouseY = 0;
    var unsaved_changes = false;

    //IE Doesn't stop selecting text when mousedown returns false we need to check
    // That onselectstart exists and return false if it does
    var hasOnSelectStart = document.onselectstart !== undefined;

    // Disable the Apply changes button until there is a change
    $('#enumtable div input[name="apply"]').attr('disabled', true)
    $('#enumtable tbody tr input[name="default"]').click(function(){
        $('#enumtable div input[name="apply"]').attr('disabled', false)
    });

    // Insert Revert changes button after the Apply changes button
    $('<input type="submit" name="revert" value="Revert changes" disabled="disabled"/>')
        .insertAfter('#enumtable div input[name="apply"]');

    // Prompt with a dialog if leaving the page with unsaved changes to the list
    var support_beforeunload = jQuery.event.special.beforeunload !== undefined;
    var beforeunload = function() {
        if(unsaved_changes)
            return "You have unsaved changes to the order of the list. Your " +
                "changes will be lost if you Leave this Page before " +
                "selecting  Apply changes."
    };
    if (support_beforeunload) {
        $(window).bind('beforeunload', beforeunload);
    } else {
        // Workaround unsupported "beforeunload" event when jQuery < 1.4,
        // e.g. Trac 0.11.x provides jQuery 1.2.x
        window.onbeforeunload = beforeunload;
        // Avoid memory leak on IE (#10656)
        $(window).bind('unload', function() { window.onbeforeunload = null; });
    }

    // Don't prompt with a dialog if the Apply or Revert changes button is pressed
    var button_pressed
    $('#enumtable div.buttons input').click(function(){
        button_pressed = $(this).attr('name');
    })

    $('#enumtable').submit(function(){
        if(button_pressed === 'apply' || button_pressed === 'revert') {
            if (support_beforeunload)
                $(window).unbind('beforeunload');
            else
                window.onbeforeunload = null;
        }
        if(button_pressed === 'revert'){
            // Send GET request instead of POST
            location = location;
            return false;
        }
    });

    // This keep track of current vertical coordinates
    $('#enumlist tbody').mousemove(function(e) {
        mouseY = e.pageY;
    });

    // Begin drag
    $('#enumlist tbody tr').mousedown(function (e) {
        // Suppress behavior on elements that should be cells
        if (/^(?:a|input|select)$/i.test(e.target.tagName))
            return;

        // Remember starting mouseY
        var lastY = mouseY;

        var tr = $(this);

        // This is just for flashiness. It fades the TR element out to an opacity of 0.2 while it is being moved.
        tr.find('td').fadeTo('fast', 0.2);

        // jQuery has a fantastic function called mouseenter() which fires when the mouse enters
        // This code fires a function each time the mouse enters over any TR inside the tbody -- except $(this) one
        $('tr', tr.parent() ).not(tr).bind('mouseenter', function(e){
            // Move row based on direction
            if (mouseY > lastY) {
                $(this).after(tr);
                // Store the current location of the mouse for next time a mouseenter event triggers
                lastY = e.pageY + 1;
            } else {
                $(this).before(tr);
                // Store the current location of the mouse for next time a mouseenter event triggers
                lastY = e.pageY - 1;
            }
        });

        // When mouse is released, unhook events and update values
        $('body').mouseup(function () {
            //Fade the TR element back to full opacity
            tr.find('td').fadeTo('fast', 1);
            // Remove the mouseenter events from the tbody so that the TR element stops being moved
            $('tr', tr.parent()).unbind('mouseenter');
            // Remove this mouseup function until next time
            $('body').unbind('mouseup');

            // Make text selectable for IE again with
            // The workaround for IE based browers
            if (hasOnSelectStart)
                $(document).unbind('selectstart');

            updateValues(tr);
        });

    // Preventing the default action and returning false will Stop any text in the table from being
    // highlighted (this can cause problems when dragging elements)
    e.preventDefault();

    // The workaround for IE browsers
    if (hasOnSelectStart)
            $(document).bind('selectstart', function () { return false; });
        return false;

    }).css('cursor', 'move');

    // When user changes a select value, reorder rows
    $('#enumlist select').change(function (e) {
        // Move ($this) in the right position
        var tr = $(this).parents('tr')[0];
        // select.val() does not work on IE8 with Trac 0.11.7 (#10693)
        var val = $(':selected', this).val();
        if(val == 1) {
            $('#enumlist tbody').prepend(tr);
        } else {
            var rowIndex = 0;
            var sib = tr.previousSibling;
            while(sib != null) { rowIndex++; sib = sib.previousSibling; }
            var newIndex = val > rowIndex ? val - 1 : val - 2;
            var trBefore = $($('#enumlist tbody tr')[newIndex]);
            trBefore.after(tr);
        }
        updateValues(tr);
    });

    // Set select values based on the row they're in and highlight those that have changed
    function updateValues (tr) {
        var position = 1;
        var trSelect = $('select', $(tr))[0];
        $('#enumlist tbody tr select').each(function () {
            var select = $(this);
            // select.val() does not work on IE8 with Trac 0.11.7 (#10693)
            if($(':selected', select).val() != position) {
                select.val(position);
                select.not(trSelect).parent().effect('highlight', {}, 1000);
                unsaved_changes = true;
            }
            position += 1;
        });

        $(tr).effect('highlight', { }, 2000);
        if(unsaved_changes)
        {
            $('#enumtable div input[name="revert"]').attr('disabled', false);
            $('#enumtable div input[name="apply"]').attr('disabled', false);
        }
    }

});
