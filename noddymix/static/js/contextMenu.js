/* Description:
 *   jQuery context menu
 *   Based off of Youtify.com's ContextMenu.js
 *
 * Author:
 *   Nnoduka Eruchalu
 */

// on release of <ESC> key, close context menu and it's blocker/background
$(window).keyup(function(event) {
    if((event.keyCode === 27) && $('#contextmenu').length) {
        $('#contextmenu-blocker, #contextmenu').remove();
    }
});


/* show context menu
 */
function showContextMenu(buttons, x, y) {
    // context menu is an unordered list
    var contextmenu = $('<ul id="contextmenu" />');
    
    // go through each context menu button
    $.each(buttons, function(i, item) {
        /* each button is represented as a list item in context menu <ul>
         * save callback-args and callback associated with the button
         * and use these in the click handler
         * At end of click handler, close context menu
         */
        var $li = $('<li class="option" />')
            .text(item.title)
            .data('args', item.args)
            .data('callback', item.callback)
            .click(function() {
                // run callback and remove context menu
                $(this).data('callback')($(this).data('args'));
                $("#contextmenu-blocker, #contextmenu").remove();
            });
        $li.append($("<span class='icon'/>"));
        
        // if item has a cssClass associated with it, then tack that on.
        if (item.cssClass) {
            $li.addClass(item.cssClass);
        }
        
        // if item has a sublist associated with it, create it's callback
        if (item.sublist) {
            $li.addClass("has-sublist");            
            $li.hover(
                // on hover in, create sublist
                function() {
                    // get a hold of original context menu
                    var contextmenu = $("#contextmenu");
                    // call sublist generation function
                    var contextsublist = item.sublist();
                    contextsublist.appendTo($li);
                    
                    // ideally show sublist on right of context menu, but if
                    // there isnt space it has to be on left
                    var x = 0 + contextmenu.width();
                    if((contextmenu.offset().left + x + 
                        contextsublist.outerWidth()) > $(window).width()) {
                        x = 0 - contextsublist.outerWidth();
                    }
                    // ideally the top of the sublist should align with the top
                    // of the list that generated it. However if there isn't
                    // space, shift it up till the bottom of the sublist fits 
                    // within the screen
                    var y = 0;
                    if(($(this).offset().top + y + 
                        contextsublist.outerHeight()) > $(window).height()) {
                        y = $(window).height() -
                            ($(this).offset().top+contextsublist.outerHeight());
                    }
                    
                    // finally reposition contextmenusublist
                    contextsublist.css({'top':y, 'left':x});
                },
                
                // on hover out, remove sublist
                function() {
                    $("#contextmenu-sublist").remove();
                }
            );
        }
        
        // when done add this to the bottom of the context menu
        $li.appendTo(contextmenu);
    });
    
    /* setup a blocker div that closes the menu when clicked
     * the idea behind this is whenever you click anywhere outside of context
     * menu, the menu should be closed
     */
    var blocker = $('<div id="contextmenu-blocker" class="blocker"></div>')
        .mousedown(function(event) {
            $('#contextmenu-blocker, #contextmenu').remove();
            
            // this click has to end at the contextmenu-blocker
            event.stopPropagation();
        });
    
    /* now save both blocker and context menu
     */
    blocker.appendTo('body');
    contextmenu.appendTo('body');
    
    /* place the context menu at the passed in (x,y) coordinates. 
     * However make sure context menu does not reqch outside of the window
     */
    if((y+contextmenu.outerHeight()) > $(window).height()) {
        y -= contextmenu.outerHeight();
    }
    if((x+contextmenu.outerWidth()) > $(window).width()) {
        x -= contextmenu.outerWidth();
    }
    contextmenu.css({'top':y, 'left':x});
    
    /* finally, prevent the default contextmenu from popping up on the custom
     * contextmenu 
     */
    $('#contextmenu-blocker, #contextmenu, #contextmenu li.option').bind(
        'contextmenu', function(event) {
            event.preventDefault();
        });
    
} /* end show context menu */

