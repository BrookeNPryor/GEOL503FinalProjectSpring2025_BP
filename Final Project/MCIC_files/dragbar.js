'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var dragbars = function () {
  function dragbars(offset) {
    var _this = this;

    _classCallCheck(this, dragbars);

    this.dragbarSize = jQuery(".dragbar_L").outerWidth();

    this.dragger2 = new BarDragger([document.querySelector('.dragbar_L')]);
    this.dragger3 = new BarDragger([document.querySelector('.dragbar_R')]);

    if (offset) {
      this.dragX = offset;
    } else {
      this.dragX = 0;
    }
    this.dragResizePanels(this.dragX);

    this.dragger2.on('dragMove', function (event, pointer, moveVector) {
      _this.dragX = 0 + _this.dragger2.dragStartPoint.x + moveVector.x;
      _this.dragResizePanels(_this.dragX);
    });

    this.dragger3.on('dragMove', function (event, pointer, moveVector) {
      var parentWidth = jQuery(".sbsparent").width();
      _this.dragX = parentWidth - _this.dragger3.dragStartPoint.x - moveVector.x;
      _this.dragResizePanels(_this.dragX);
    });

    this.dragger2.on('dragEnd', function (event, pointer, moveVector) {
      _this.writeCookie(_this.dragX);
    });

    this.dragger3.on('dragEnd', function (event, pointer, moveVector) {
      _this.writeCookie(_this.dragX);
    });

    jQuery(".divider").on("dblclick", function () {
      _this.reset();
    });

    this.dragger2.on('doubleClick', function () {
      _this.reset();
    });

    this.dragger3.on('doubleClick', function () {
      _this.reset();
    });
  }

  _createClass(dragbars, [{
    key: 'reset',
    value: function reset() {
      this.dragX = 0;
      this.dragResizePanels(0);
      this.writeCookie(0);
    }
  }, {
    key: 'dragResizePanels',
    value: function dragResizePanels(dragX) {
      var maxWidth = Math.floor((jQuery(".sbsparent").width() - this.dragbarSize * 3) / 2);
      var paneWidth = Math.floor(maxWidth - dragX);
      if (dragX >= 0 && paneWidth <= maxWidth && paneWidth > 0) {
        this.dragger2.handles[0].style.left = dragX + 'px';
        this.dragger3.handles[0].style.right = dragX + 'px';
        jQuery(".leftpane").css("width", Math.floor(paneWidth) + "px");
        jQuery(".rightpane").css("width", Math.floor(paneWidth) + "px");
      }
    }
  }, {
    key: 'writeCookie',
    value: function writeCookie(dragX) {
      if (dragX < 0) dragX = 0;
      jQuery.cookie('offsetDragbars', dragX, { expires: 365 });
    }
  }, {
    key: 'getOffset',
    value: function getOffset() {
      return this.dragX;
    }
  }]);

  return dragbars;
}();

function BarDragger(handles) {
  this.handles = handles;
  this.bindHandles();
}

BarDragger.prototype = Object.create(Unidragger.prototype);

BarDragger.prototype.doubleClickTime = 350;

BarDragger.prototype.staticClick = function (event, pointer) {
  this.emitEvent('staticClick', [event, pointer]);

  if (this.didFirstClick) {
    this.emitEvent('doubleClick', [event, pointer]);
    delete this.didFirstClick;
    clearTimeout(this.doubleClickTimeout);
  } else {
    this.didFirstClick = true;
    this.doubleClickTimeout = setTimeout(function () {
      delete this.didFirstClick;
    }.bind(this), this.doubleClickTime);
  }
};