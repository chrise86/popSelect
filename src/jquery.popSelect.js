/*
  jQuery popSelect v0.0.2
  Copyright (c) 2015 Jay Kanakiya
  GitHub: https://github.com/kanakiyajay/popSelect
  License: http://www.opensource.org/licenses/mit-license.php
*/
;(function($, window, document, undefined) {

  'use strict';

  // Create the defaults once
  var pluginName = 'popSelect';
  var defaults = {
    showTitle: true,
    title: 'Select Multiple Options',
    debug: false
  };

  var classNames = {
    tag: 'tag',
    arrow: 'arrow',
    selectWrapper: 'popover-select-wrapper',
    tagWrapper: 'popover-tag-wrapper',
    popoverSelect: 'popover-select',
    popoverBody: 'popover-select-body',
    selectTextarea: 'popover-select-textarea',
    selectTags: 'popover-select-tags',
    popoverClose: 'popSelect-close',
    selectList: 'popover-select-list',
    placeholder: 'placeholder',
    placeholderInput: 'placeholder input',
    selectTitle: 'popover-select-title',
    top: 'top'
  };

  var logs = {
    popoverGenerated: 'PopSelect Code Generated',
    closeClicked: 'Close button clicked',
    noElem: 'No element to be removed',
    unSupported: 'Not Supported',
    posChanged: 'Position changed'
  };

  var constants = {
    option: 'option',
    blur: 'blur',
    click: 'click',
    mousedown: 'mousedown',
    li: 'li',
    attrVal: 'data-value',
    attrText: 'data-text',
    body: 'BODY'
  };

  // The actual plugin constructor
  function Plugin(element, options) {
    this.element = element;
    // jQuery has an extend method which merges the contents of two or
    // more objects, storing the result in the first object. The first object
    // is generally empty as we don't want to alter the default options for
    // future instances of the plugin
    this.settings = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }

  // Avoid Plugin.prototype conflicts
  $.extend(Plugin.prototype, {
    init: function() {
     var $this = this;
     this.$elem = $(this.element);

     // Get all the options in an array
     this.$options = this.$elem.children(constants.option).map(function(i, option) {
       return {
         val: $(option).val(),
         text: $(option).text()
       };
     });

     // Wrap the whole input box in your own popover
     this.$elem.wrap(template(createEmptyDiv(), {
       wrapper: classNames.selectWrapper
     }));

     var elemPos = this.getPosition(this.$elem);
     this.elemPos = elemPos;

     // Also Add the required css Properties
     this.$elem
      .parent(addDot(classNames.selectWrapper))
      .css({width: elemPos.width, height: elemPos.height});

     // Append the popover to $elem
     var popUpCode = this.generatePopover(this.$options);
     $this.log(logs.popoverGenerated, popUpCode);
     this.$elem.after(popUpCode);

     // Assign the $popover to the new $elem
     this.$popover = this.$elem.next(addDot(classNames.popoverSelect));
     this.$popover.css({top: 0, left: 0});

     // Append Tagging System to it
     this.$elem.after(createTaggingStr());

     // Get the input
     this.$inputTagField = this.$elem
                 .next(addDot(classNames.tagWrapper))
                 .find(addDot(classNames.selectTextarea));

     // Hide the poover when blurring the inputTagField
     this.$inputTagField.on(constants.blur, function() {
       $this.$popover.hide();
     });

     // Get the tagging wrapper
     this.$tags = this.$elem
            .next(addDot(classNames.tagWrapper))
            .find(addDot(classNames.selectTags));

     // Show Popover on click of tags
     this.$tags.on(constants.click, function() {
       $this.popoverShow();
       $this.changePosition();
       $this.setPlaceholder();
       $this.focus();
     });

     // Attach Event Listener to ul list
     this.$tags.on(constants.click, addDot(classNames.popoverClose), function() {
       $this.inputToPopover($(this));
     });

     // Attach List Event Handlers to Li
     this.$popover.find(addDot(classNames.selectList)).on(constants.mousedown, function(e) {
       e.preventDefault();
     }).on(constants.click, constants.li, function() {
       $this.popoverToInput($(this));
     });

     // Finally Hide the Element
     this.$elem.hide();
   },
    inputToPopover: function($elem) {
      var $li = $elem.parent();
      this.log(logs.closeClicked, $li);
      var val = $li.attr(constants.attrVal);
      var text = $li.attr(constants.attrText);

      // Remove them from input and add it to popover
      this.appendToPopup(val, text);
      $li.remove();

      // Standard Reset Calls
      this.setPlaceholder();
      this.focus();
    },
    popoverToInput: function($elem) {
      var val = $elem.attr(constants.attrVal);
      var text = $elem.text();
      var li = createTagStr(val, text);

      // Remove them from popover and it to input
      this.$tags.append(li);
      $elem.remove();

      // Standard Reset Calls
      this.setPlaceholder();
      this.focus();
      this.popoverShow();
      this.changePosition();
    },
    popoverShow: function() {
      // Change Position as well show popover
      if (this.$popover.find(addDot(classNames.selectList) + ' li').length) {
        this.$popover.show();
      } else {
        this.$popover.hide();
      }
    },
    focus: function() {
      var $this = this;
      this.$tags.find(addDot(classNames.placeholderInput)).focus();
      this.$tags.find(addDot(classNames.placeholderInput)).on(constants.blur, function() {
        $this.$popover.hide();
      });
    },
    setPlaceholder: function() {
      if (this.$tags.children(addDot(classNames.placeholder)).length) {
        this.$tags.children(addDot(classNames.placeholder)).remove();
      }
      this.$tags.append(createPlaceholderInput());
      this.disableInput();
    },
    disableInput: function() {
      var $this = this;
      this.$tags.find(addDot(classNames.placeholderInput)).keyup(function(e) {
        // Empty the input always
        $(this).val('');

        // For delete key, backspace and Ctrl + x Key
        if (e.which === 8 || e.which === 46 || e.ctrlKey && e.which === 88) {
          $this.removeLastElem();
        }
      });
    },
    removeLastElem: function() {
      // Delete the last selected li if present
      var tags = this.$tags.find(addDot(classNames.tag));
      if (tags.length) {
        var $li = $(tags[tags.length - 1]);
        var val = $li.attr(constants.attrVal);
        var text = $li.attr(constants.attrText);

        // Remove them from input and add it to popover
        this.appendToPopup(val, text);
        $li.remove();

        // Standard Reset Calls
        this.changePosition();
        this.setPlaceholder();
        this.focus();
      } else {
        this.log(logs.noElem);
      }
    },
    setTitle: function(title) {
      if (this.settings.showTitle) {
        this.$popover.find(addDot(classNames.selectTitle)).text(title);
      }
    },
    getPosition: function($element) {
      $element = $element || this.$element;
      var el = $element[0];
      var isBody = el.tagName === constants.body;

      var elRect = el.getBoundingClientRect();
      if (elRect.width == null) {
        var w = elRect.right - elRect.left;
        var h = elRect.bottom - elRect.top;
        elRect = $.extend({}, elRect, {width: w, height: h});
      }
      var elOffset = isBody ? {top: 0, left: 0} : $element.offset();
      var scroll = {scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop()}
      var outerDims = isBody ? {width: $(window).width(), height: $(window).height()} : null;

      return $.extend({}, elRect, scroll, outerDims, elOffset);
    },
    appendToPopup: function(val, text) {
      var li = createLiTag(val, text);
      this.$popover.find(addDot(classNames.selectList)).append(li);
    },
    generatePopover: function(options) {
      var list = '';
      for (var i = 0; i < options.length; i++) {
        list += createLiTag(options[i].val, options[i].text);
      }
      var popoverStr = createPopoverStr(this.settings.title, list, this.settings.showTitle);
      return popoverStr;
    },
    changePosition: function() {
      // It first needs to be placed
      var popPos = this.getPosition(this.$popover);

      var leftOffset = (this.elemPos.width / 2) - (popPos.width / 2) ;
      var topOffset = -(popPos.height);

      this.log('popPos.width', popPos.width);
      this.log(logs.posChanged, topOffset, leftOffset);
      this.$popover.css({top: topOffset, left: leftOffset});
    },
    log: function() {
      if (this.settings.debug) {
        console.log.apply(console, arguments);
      }
    }
  });

  /**
   * A quick helper function for creating templates
   * @param  {string} s Template String
   * @param  {object} d Values to replace for
   * @return {string}   Populated template string
   */
  function template(s, d) {
    for (var p in d) {
      s = s.replace(new RegExp('{' + p + '}', 'g'), d[p]);
    }
    return s;
  }

  /**
   * Just adds a dot for easy class selection
   * @param {string} str DOM className
   * @return {string} jQuery selector
   */
  function addDot(str) {
    return '.' + str;
  }

  function createEmptyDiv(x) {
    if (x) {
      return '<div class="{' + x + '}"></div>';
    } else {
      return '<div class="{wrapper}"></div>';
    }
  }

  function createTaggingStr() {
    return template('<div class="{tagWrapper}">' +
                '<textarea class="{selectTextarea}"></textarea>' +
                '<ul class="{selectTags}">' +
                '</ul>' +
             '</div>', {
               tagWrapper: classNames.tagWrapper,
               selectTextarea: classNames.selectTextarea,
               selectTags: classNames.selectTags
             });
  }

  function createTagStr(val, text) {
    return template('<li class="{tag}" data-value="{val}" data-text="{text}">' +
               '<span class="{popoverClose}">&times;</span>{text}' +
               '</li>', {
                 text: text,
                 val: val,
                 tag: classNames.tag,
                 popoverClose: classNames.popoverClose
               });
  }

  function createLiTag(val, text) {
    return template('<li data-value="{val}" data-text="{text}">{text}</li>', {
      val: val,
      text: text
    });
  }

  function createPlaceholderInput() {
    return template('<li class="{placeholder}">' +
             '<div>' +
              '<input type="text">' +
             '</div>' +
              '</li>', {
                placeholder: classNames.placeholder
              });
  }

  function createPopoverStr(title, list, bool) {
    return template('<div class="{popoverSelect} {top}">' +
             (bool ? '<h3 class="{selectTitle}">{title}</h3>' : '') +
             '<div class="{popoverBody}">' +
              '<ul class="{selectList}">' +
               '{list}' +
              '</ul>' +
             '</div>' +
             '<div class="{arrow}"></div>' +
           '</div>', {
             title: title,
             list: list,
             arrow: classNames.arrow,
             popoverSelect: classNames.popoverSelect,
             popoverBody: classNames.popoverBody,
             selectList: classNames.selectList,
             top: classNames.top,
             selectTitle: classNames.selectTitle
           });
  }

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn.popSelect = function(options) {
    if (typeof(options) === 'string') {
      if (options === 'value') {
        return this.next(addDot(classNames.tagWrapper))
             .find(addDot(classNames.tag)).map(function(i, $elem) {
               return $($elem).attr(constants.attrVal);
             });
      } else {
        console.warn(logs.unSupported);
      }
    } else {
      return this.each(function() {
       if (!$.data(this, 'plugin_' + pluginName)) {
         $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
       }
     });
    }
  };

})(jQuery, window, document);
